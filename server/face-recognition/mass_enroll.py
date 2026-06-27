import os
import sqlite3
import json
import face_recognition

DB_PATH = "face_voter_db.sqlite"
IMAGES_DIR = "enrollment_images"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS voters (
            voter_id       TEXT PRIMARY KEY NOT NULL,
            role           TEXT NOT NULL DEFAULT 'user',
            face_encoding  TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn

def mass_enroll():
    if not os.path.exists(IMAGES_DIR):
        print(f"Directory '{IMAGES_DIR}' not found. Creating it.")
        os.makedirs(IMAGES_DIR)
        print("Please place voter images in this directory. The filename (without extension) will be used as the voter_id.")
        return

    conn = init_db()
    cursor = conn.cursor()

    enrolled = 0
    failed = 0

    for filename in os.listdir(IMAGES_DIR):
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            continue

        voter_id = os.path.splitext(filename)[0]
        filepath = os.path.join(IMAGES_DIR, filename)

        try:
            image = face_recognition.load_image_file(filepath)
            face_locations = face_recognition.face_locations(image)

            if len(face_locations) == 0:
                print(f"[{voter_id}] Failed: No face detected in {filename}")
                failed += 1
                continue
            if len(face_locations) > 1:
                print(f"[{voter_id}] Failed: Multiple faces detected in {filename}. Please use an image with only one face.")
                failed += 1
                continue

            # Generate encoding
            encoding = face_recognition.face_encodings(image, known_face_locations=face_locations)[0]
            encoding_json = json.dumps(encoding.tolist())

            cursor.execute(
                """
                INSERT INTO voters (voter_id, role, face_encoding)
                VALUES (?, ?, ?)
                ON CONFLICT(voter_id) DO UPDATE SET
                    face_encoding = excluded.face_encoding
                """,
                (voter_id, 'user', encoding_json),
            )
            conn.commit()
            print(f"[{voter_id}] Successfully enrolled.")
            enrolled += 1

        except Exception as e:
            print(f"[{voter_id}] Error processing {filename}: {e}")
            failed += 1

    conn.commit()
    conn.close()

    print("\n--- Mass Enrollment Summary ---")
    print(f"Successfully enrolled: {enrolled}")
    print(f"Failed to enroll: {failed}")

if __name__ == "__main__":
    mass_enroll()
