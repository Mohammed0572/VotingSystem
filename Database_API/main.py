"""
Facial Recognition Authentication API for Decentralized Voting DApp
===================================================================
Uses dlib's ResNet-based 128D face encodings via the `face_recognition` library.
Loads existing registered faces from Face Recognition/encodings.pkl on startup.

Run with Python 3.10:
    py -3.10 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
"""

# ── Imports ──────────────────────────────────────────────────────────────────
import os
import json
import base64
import pickle
import sqlite3
import logging
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import cv2
import jwt
import numpy as np
import dotenv
import face_recognition
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("face-auth")

# ── Environment ──────────────────────────────────────────────────────────────
from config import settings

SECRET_KEY: str = settings.SECRET_KEY
JWT_EXPIRY_HOURS: int = settings.JWT_EXPIRY_HOURS
MATCH_TOLERANCE: float = settings.MATCH_TOLERANCE

# Path to the face-recognition encodings pickle file
ENCODINGS_PKL_PATH = (
    Path(__file__).resolve().parent.parent / "face-recognition" / "encodings.pkl"
)


# ═══════════════════════════════════════════════════════════════════════════
# 1.  DATABASE SETUP
# ═══════════════════════════════════════════════════════════════════════════

DB_PATH = os.path.join(os.path.dirname(__file__), "face_voter_db.sqlite")


@contextmanager
def get_db():
    """Context manager that guarantees the connection is always closed."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db() -> None:
    """Create the voters table if it doesn't exist."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS voters (
                voter_id       TEXT PRIMARY KEY NOT NULL,
                role           TEXT NOT NULL DEFAULT 'user',
                face_encoding  TEXT NOT NULL
            )
        """)
        conn.commit()
    log.info("Database initialised at %s", DB_PATH)


def _average_encodings(encodings: list[np.ndarray]) -> np.ndarray:
    """
    Average multiple face encodings into a single stable 128D vector.
    This matches the approach used in Face Recognition/face_utils.py
    (average_encodings) for consistency.
    """
    return np.mean(encodings, axis=0)


def sync_encodings_pkl() -> None:
    """
    Load Face Recognition/encodings.pkl and insert each registered face
    into the SQLite voters table.

    When a person has multiple encoding entries (e.g., 5 webcam samples),
    they are averaged into a single 128D vector before storage — matching
    the approach used by register.py → face_utils.average_encodings().

    Existing DB entries are NOT overwritten (preserves manual role changes).
    """
    if not ENCODINGS_PKL_PATH.exists():
        log.warning("encodings.pkl not found at %s", ENCODINGS_PKL_PATH)
        return

    with open(ENCODINGS_PKL_PATH, "rb") as f:
        data = pickle.load(f)

    names: list[str] = data.get("names", [])
    encodings: list = data.get("encodings", [])

    if len(names) != len(encodings):
        log.warning("encodings.pkl has mismatched names/encodings — skipping sync")
        return

    # ── Group encodings by normalized name ────────────────────────────────
    # encodings.pkl can store multiple entries per person (N webcam samples).
    # We collect them all and average per person for a single stable vector.
    from collections import defaultdict

    grouped: dict[str, list[np.ndarray]] = defaultdict(list)
    for name, encoding in zip(names, encodings):
        voter_id = name.strip().lower()
        grouped[voter_id].append(np.asarray(encoding))

    with get_db() as conn:
        cursor = conn.cursor()
        synced = 0

        for voter_id, enc_list in grouped.items():
            # Only insert if not already present in DB
            cursor.execute("SELECT 1 FROM voters WHERE voter_id = ?", (voter_id,))
            if cursor.fetchone() is not None:
                continue

            # Average all samples into one encoding
            averaged = _average_encodings(enc_list)
            encoding_json = json.dumps(averaged.tolist())

            cursor.execute(
                "INSERT INTO voters (voter_id, role, face_encoding) VALUES (?, ?, ?)",
                (voter_id, "user", encoding_json),
            )
            synced += 1
            log.info(
                "   [SYNC] Imported '%s' (averaged %d sample(s))",
                voter_id,
                len(enc_list),
            )

        conn.commit()

    unique_names = len(grouped)
    log.info(
        "Synced %d new face(s) from encodings.pkl (%d unique people, %d total samples)",
        synced,
        unique_names,
        len(names),
    )


def _seed_admin() -> None:
    """Ensure an admin account exists for the admin panel."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM voters WHERE voter_id = 'admin'")
        if cursor.fetchone() is None:
            dummy = json.dumps(np.zeros(128).tolist())
            cursor.execute(
                "INSERT INTO voters (voter_id, role, face_encoding) VALUES (?, ?, ?)",
                ("admin", "admin", dummy),
            )
            conn.commit()
            log.info("   [SEED] Created admin account")


# ═══════════════════════════════════════════════════════════════════════════
# 2.  IMAGE DECODING UTILITY
# ═══════════════════════════════════════════════════════════════════════════

def decode_base64_image(image_base64: str) -> np.ndarray:
    """
    Decode a Base64-encoded image string into an OpenCV BGR numpy array.
    Accepts raw Base64 or data-URI prefix (data:image/png;base64,...).
    """
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(image_base64)
    except Exception as exc:
        raise ValueError(f"Base64 decoding failed: {exc}") from exc

    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("cv2.imdecode returned None — not a valid image.")

    return img


# ═══════════════════════════════════════════════════════════════════════════
# 3.  FACE EMBEDDING — REAL dlib ResNet model via face_recognition
# ═══════════════════════════════════════════════════════════════════════════

def get_face_embedding(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract a 128-dimensional face embedding from a BGR image using
    dlib's ResNet model (via face_recognition library).

    Returns:
        np.ndarray of shape (128,) on success, None if no face detected.
    """
    # face_recognition expects RGB
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Detect face locations (HOG model for speed)
    face_locations = face_recognition.face_locations(rgb, model="hog")

    if not face_locations:
        return None

    # Use the largest face if multiple detected
    if len(face_locations) > 1:
        face_locations = [
            max(
                face_locations,
                key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]),
            )
        ]

    # Compute the 128D encoding
    encodings = face_recognition.face_encodings(rgb, face_locations)

    if not encodings:
        return None

    return encodings[0]


# ═══════════════════════════════════════════════════════════════════════════
# 4.  FACE COMPARISON — Euclidean distance (matching your system)
# ═══════════════════════════════════════════════════════════════════════════

def compare_faces(
    known_encoding: np.ndarray,
    test_encoding: np.ndarray,
    tolerance: float = MATCH_TOLERANCE,
) -> tuple[bool, float]:
    """
    Compare two face encodings using Euclidean distance.

    Returns:
        (is_match, distance) — is_match is True if distance <= tolerance.
    """
    distance = float(
        face_recognition.face_distance([known_encoding], test_encoding)[0]
    )
    return distance <= tolerance, distance


# ═══════════════════════════════════════════════════════════════════════════
# 5.  JWT HELPERS
# ═══════════════════════════════════════════════════════════════════════════

security = HTTPBearer(auto_error=False)


def create_jwt(voter_id: str, role: str) -> str:
    """
    Create a JWT with an expiration claim.
    The token contains voter_id, role, and exp.
    """
    payload = {
        "voter_id": voter_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_jwt(token: str) -> dict:
    """Verify and decode a JWT. Raises on invalid/expired tokens."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency that verifies the caller is an authenticated admin.
    Use on admin-only endpoints.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Provide a Bearer token.",
        )
    payload = decode_jwt(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return payload


# ═══════════════════════════════════════════════════════════════════════════
# 6.  FASTAPI APPLICATION
# ═══════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic for the application."""
    # ── Startup ───────────────────────────────────────────────────────────
    log.info("Starting Face Authentication API...")
    init_db()
    sync_encodings_pkl()
    _seed_admin()
    log.info("Face Authentication API ready.")
    yield
    # ── Shutdown ──────────────────────────────────────────────────────────
    log.info("Face Authentication API shutting down.")


app = FastAPI(
    title="Voting DApp — Face Auth API",
    version="3.0.0",
    description="Facial-recognition authentication for the Decentralized Voting System.",
    lifespan=lifespan,
)

# CORS — allow the frontend running on the Express static server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security Headers Middleware ─────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' http://127.0.0.1:8000 http://localhost:5000 http://localhost:7545 ws://localhost:* wss://localhost:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


# ── Request / Response Schemas ───────────────────────────────────────────

class FaceVerifyRequest(BaseModel):
    voter_id: str
    image_base64: str

    @field_validator("voter_id")
    @classmethod
    def voter_id_must_not_be_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("voter_id must not be empty.")
        if len(cleaned) > 100:
            raise ValueError("voter_id must be 100 characters or fewer.")
        return cleaned


class AuthResponse(BaseModel):
    token: str
    role: str
    voter_id: str
    distance: float


class EnrollRequest(BaseModel):
    voter_id: str
    role: str = "user"
    image_base64: str

    @field_validator("voter_id")
    @classmethod
    def voter_id_must_not_be_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("voter_id must not be empty.")
        if len(cleaned) > 100:
            raise ValueError("voter_id must be 100 characters or fewer.")
        return cleaned


# ── Health Check ─────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Quick health check for monitoring."""
    return {"status": "ok", "service": "face-auth", "version": "3.0.0"}


# ══════════════════════════════════════════════════════════════════════════
# 7.  POST /verify-face — THE CORE ENDPOINT
# ══════════════════════════════════════════════════════════════════════════

@app.post("/verify-face", response_model=AuthResponse)
async def verify_face(payload: FaceVerifyRequest):
    """
    Authenticate a voter by comparing a webcam capture against
    the stored 128D face encoding.

    Flow:
        1. Decode the Base64 image
        2. Extract face embedding via dlib ResNet
        3. Fetch stored encoding from SQLite
        4. Compare using Euclidean distance (tolerance configured via env)
        5. If match → issue JWT with expiration
        6. Otherwise → 401
    """
    voter_id = payload.voter_id.strip().lower()

    # Step 1: Decode image
    try:
        image = decode_base64_image(payload.image_base64)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image: {exc}",
        )

    # Step 2: Extract face embedding
    embedding = get_face_embedding(image)
    if embedding is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected in the image. Please ensure your face "
            "is clearly visible and well-lit.",
        )

    # Step 3: Fetch stored encoding
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT role, face_encoding FROM voters WHERE voter_id = ?",
            (voter_id,),
        )
        row = cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Voter ID not found. Please register first.",
        )

    role: str = row["role"]

    try:
        stored_encoding = np.array(
            json.loads(row["face_encoding"]), dtype=np.float64
        )
    except (json.JSONDecodeError, TypeError) as exc:
        log.error("Corrupt face encoding for voter '%s': %s", voter_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored face encoding is corrupted. Please re-enroll.",
        )

    # Validate encoding shape
    if stored_encoding.shape != (128,):
        log.error(
            "Invalid encoding shape for voter '%s': %s",
            voter_id,
            stored_encoding.shape,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored face encoding has invalid dimensions. Please re-enroll.",
        )

    # Step 4: Compare
    is_match, distance = compare_faces(stored_encoding, embedding)

    log.info(
        "[VERIFY] voter=%s  distance=%.4f  tolerance=%s  match=%s",
        voter_id,
        distance,
        MATCH_TOLERANCE,
        "YES" if is_match else "NO",
    )

    # Step 5/6: Decide
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Face verification failed (distance={distance:.4f}, "
            f"threshold={MATCH_TOLERANCE}). "
            "The face does not match the registered voter.",
        )

    # Issue JWT with expiration
    token = create_jwt(voter_id, role)

    return AuthResponse(
        token=token,
        role=role,
        voter_id=voter_id,
        distance=round(distance, 4),
    )


# ══════════════════════════════════════════════════════════════════════════
# 8.  POST /enroll-face — Register a new voter (ADMIN-ONLY)
# ══════════════════════════════════════════════════════════════════════════

@app.post("/enroll-face", status_code=status.HTTP_201_CREATED)
async def enroll_face(
    payload: EnrollRequest,
    _admin: dict = Depends(require_admin),
):
    """
    Register or update a voter's face encoding.
    Requires admin authentication via Bearer token.
    """
    voter_id = payload.voter_id.strip().lower()
    role = payload.role.strip()

    if role not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role must be 'user' or 'admin'.",
        )

    try:
        image = decode_base64_image(payload.image_base64)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image: {exc}",
        )

    embedding = get_face_embedding(image)
    if embedding is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected in the image.",
        )

    encoding_json = json.dumps(embedding.tolist())

    # Upsert into SQLite
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO voters (voter_id, role, face_encoding)
            VALUES (?, ?, ?)
            ON CONFLICT(voter_id) DO UPDATE SET
                role = excluded.role,
                face_encoding = excluded.face_encoding
            """,
            (voter_id, role, encoding_json),
        )
        conn.commit()

    # Also update encodings.pkl so CLI tools stay in sync
    _sync_to_pkl(voter_id, embedding)

    log.info("Enrolled voter: %s (role=%s)", voter_id, role)
    return {
        "message": f"Voter '{voter_id}' enrolled successfully.",
        "voter_id": voter_id,
    }


def _sync_to_pkl(voter_id: str, encoding: np.ndarray) -> None:
    """Write back to encodings.pkl to keep CLI tools synchronized."""
    try:
        if ENCODINGS_PKL_PATH.exists():
            with open(ENCODINGS_PKL_PATH, "rb") as f:
                data = pickle.load(f)
        else:
            data = {"encodings": [], "names": []}

        # Replace existing or append
        display_name = voter_id.title()
        indices = [
            i for i, n in enumerate(data["names"]) if n.lower() == voter_id
        ]
        if indices:
            data["encodings"][indices[0]] = encoding
            data["names"][indices[0]] = display_name
        else:
            data["encodings"].append(encoding)
            data["names"].append(display_name)

        with open(ENCODINGS_PKL_PATH, "wb") as f:
            pickle.dump(data, f)
    except Exception as e:
        log.warning("Could not sync to encodings.pkl: %s", e)


# ══════════════════════════════════════════════════════════════════════════
# 9.  GET /voters — List registered voters (ADMIN-ONLY)
# ══════════════════════════════════════════════════════════════════════════

@app.get("/voters")
async def list_voters(_admin: dict = Depends(require_admin)):
    """List all registered voter IDs and their roles. Admin-only."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT voter_id, role FROM voters ORDER BY voter_id")
        rows = cursor.fetchall()
    return {
        "voters": [
            {"voter_id": r["voter_id"], "role": r["role"]} for r in rows
        ]
    }


# ══════════════════════════════════════════════════════════════════════════
# 10.  DELETE /voters/{voter_id} — Remove a voter (ADMIN-ONLY)
# ══════════════════════════════════════════════════════════════════════════

@app.delete("/voters/{voter_id}")
async def delete_voter(voter_id: str, _admin: dict = Depends(require_admin)):
    """Delete a voter from the database. Admin-only."""
    voter_id = voter_id.strip().lower()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM voters WHERE voter_id = ?", (voter_id,))
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Voter '{voter_id}' not found.",
            )
        conn.commit()

    log.info("Deleted voter: %s", voter_id)
    return {"message": f"Voter '{voter_id}' deleted successfully."}


# ══════════════════════════════════════════════════════════════════════════
# 11.  GET /verify-token — Validate an existing JWT
# ══════════════════════════════════════════════════════════════════════════

@app.get("/verify-token")
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Verify that a JWT is still valid and return the decoded payload."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing.",
        )
    payload = decode_jwt(credentials.credentials)
    return {
        "valid": True,
        "voter_id": payload.get("voter_id"),
        "role": payload.get("role"),
    }


# ══════════════════════════════════════════════════════════════════════════
# 12.  MAIN — Direct execution support
# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info",
    )
