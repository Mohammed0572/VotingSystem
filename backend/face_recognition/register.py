from __future__ import annotations

"""Register a face from webcam."""
import argparse
from pathlib import Path

import cv2

from face_utils import (
    DEFAULT_FRAME_SCALE,
    ENCODINGS_PATH,
    average_encodings,
    clean_name,
    detect_faces,
    draw_face_box,
    open_camera,
    save_user_encoding,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Register a face from webcam.")
    parser.add_argument("-n", "--name", help="User name to save.")
    parser.add_argument(
        "-s",
        "--samples",
        type=int,
        default=5,
        help="Number of face samples to capture before saving.",
    )
    parser.add_argument(
        "-c",
        "--camera",
        type=int,
        default=0,
        help="Webcam index to use.",
    )
    parser.add_argument(
        "-m",
        "--model",
        choices=("hog", "cnn"),
        default="hog",
        help="Face detector model. Use cnn only if dlib was built with GPU support.",
    )
    parser.add_argument(
        "--frame-scale",
        type=float,
        default=DEFAULT_FRAME_SCALE,
        help="Resize factor for faster detection. Must be > 0 and <= 1.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=ENCODINGS_PATH,
        help="Pickle file used to store face encodings.",
    )
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append this encoding even when the name already exists.",
    )
    return parser.parse_args()


def draw_status(frame, text: str, y: int = 30) -> None:
    cv2.putText(
        frame,
        text,
        (10, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 255),
        2,
    )


def main() -> None:
    args = parse_args()
    if args.samples <= 0:
        raise SystemExit("--samples must be greater than 0.")

    name = clean_name(args.name or input("Enter user name: "))
    captured_encodings = []

    print("Opening webcam. Press 'c' to capture a sample, or 'q' to quit.")
    camera = open_camera(args.camera)

    try:
        while len(captured_encodings) < args.samples:
            ok, frame = camera.read()
            if not ok:
                raise RuntimeError("Could not read from webcam.")

            locations, encodings = detect_faces(frame, args.model, args.frame_scale)

            if len(locations) == 1:
                draw_face_box(frame, locations[0], "Ready", args.frame_scale)
            elif len(locations) > 1:
                for location in locations:
                    draw_face_box(frame, location, "One face only", args.frame_scale, (0, 165, 255))
            else:
                draw_status(frame, "No face detected", 65)

            draw_status(frame, f"{name}: {len(captured_encodings)}/{args.samples} samples")
            draw_status(frame, "Press c to capture | q to quit", frame.shape[0] - 20)
            cv2.imshow("Register Face", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("c"):
                if len(encodings) != 1:
                    print("Capture skipped: keep exactly one face in frame.")
                    continue
                captured_encodings.append(encodings[0])
                print(f"Captured sample {len(captured_encodings)}/{args.samples}.")
    finally:
        camera.release()
        cv2.destroyAllWindows()

    if not captured_encodings:
        print("No face encoding saved.")
        return

    user_encoding = average_encodings(captured_encodings)
    total_users = save_user_encoding(
        name,
        user_encoding,
        args.output,
        replace_existing=not args.append,
    )
    print(f"Saved encoding for {name} to {args.output}. Total saved entries: {total_users}.")


if __name__ == "__main__":
    main()
