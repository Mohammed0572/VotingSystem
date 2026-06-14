from __future__ import annotations

"""Recognize faces from webcam in real time."""
import argparse
from pathlib import Path

import cv2

from face_utils import (
    DEFAULT_DETECTION_MODEL,
    DEFAULT_FRAME_SCALE,
    DEFAULT_PROCESS_EVERY_N_FRAMES,
    ENCODINGS_PATH,
    encode_face_locations,
    draw_face_box,
    find_face_landmarks,
    find_face_locations,
    limit_to_primary_face,
    load_encodings,
    match_face,
    open_camera,
    resize_for_recognition,
)
from liveness import (
    DEFAULT_CHALLENGE_SECONDS,
    DEFAULT_EAR_THRESHOLD,
    DEFAULT_HEAD_MOVEMENT_RATIO,
    DEFAULT_MAX_CLOSED_FRAMES,
    DEFAULT_MIN_CLOSED_FRAMES,
    DEFAULT_REQUIRED_BLINKS,
    BlinkLivenessDetector,
    Landmarks,
    scale_points,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Recognize faces from webcam in real time.")
    parser.add_argument(
        "-e",
        "--encodings",
        type=Path,
        default=ENCODINGS_PATH,
        help="Pickle file containing saved face encodings.",
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
        choices=(DEFAULT_DETECTION_MODEL,),
        default=DEFAULT_DETECTION_MODEL,
        help="Face detector model. HOG is used for low-latency real-time CPU detection.",
    )
    parser.add_argument(
        "-t",
        "--tolerance",
        type=float,
        default=0.5,
        help="Lower values are stricter. Typical range: 0.4 to 0.6.",
    )
    parser.add_argument(
        "--frame-scale",
        type=float,
        default=DEFAULT_FRAME_SCALE,
        help="Resize factor for faster detection. Default 0.25 processes 25%% frame size.",
    )
    parser.add_argument(
        "--show-distance",
        action="store_true",
        help="Show match distance beside recognized names.",
    )
    parser.add_argument(
        "--blink-threshold",
        type=float,
        default=DEFAULT_EAR_THRESHOLD,
        help="EAR value below which eyes are considered closed.",
    )
    parser.add_argument(
        "--required-blinks",
        type=int,
        default=DEFAULT_REQUIRED_BLINKS,
        help="Number of blinks required before face recognition runs.",
    )
    parser.add_argument(
        "--min-blink-frames",
        type=int,
        default=DEFAULT_MIN_CLOSED_FRAMES,
        help="Minimum consecutive closed-eye frames for one valid blink.",
    )
    parser.add_argument(
        "--max-blink-frames",
        type=int,
        default=DEFAULT_MAX_CLOSED_FRAMES,
        help="Maximum consecutive closed-eye frames for one valid blink.",
    )
    parser.add_argument(
        "--liveness-timeout",
        type=float,
        default=DEFAULT_CHALLENGE_SECONDS,
        help="Seconds allowed to complete blink and head-movement checks.",
    )
    parser.add_argument(
        "--head-movement-threshold",
        type=float,
        default=DEFAULT_HEAD_MOVEMENT_RATIO,
        help="Required normalized face-center movement for liveness.",
    )
    return parser.parse_args()


def draw_status(
    frame,
    text: str,
    y_offset: int = 20,
    color: tuple[int, int, int] = (0, 255, 255),
) -> None:
    cv2.putText(
        frame,
        text,
        (10, frame.shape[0] - y_offset),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        color,
        2,
    )


def draw_eye_landmarks(frame, landmarks: Landmarks, frame_scale: float) -> None:
    """Draw eye landmarks on the full-size OpenCV frame."""
    for eye_name in ("left_eye", "right_eye"):
        for point in scale_points(landmarks[eye_name], frame_scale):
            cv2.circle(frame, point, 2, (0, 255, 0), -1)


def main() -> None:
    args = parse_args()
    if args.blink_threshold <= 0:
        raise SystemExit("--blink-threshold must be greater than 0.")
    if args.required_blinks < 1:
        raise SystemExit("--required-blinks must be at least 1.")
    if args.min_blink_frames < 1:
        raise SystemExit("--min-blink-frames must be at least 1.")
    if args.max_blink_frames < args.min_blink_frames:
        raise SystemExit("--max-blink-frames must be greater than or equal to --min-blink-frames.")
    if args.liveness_timeout <= 0:
        raise SystemExit("--liveness-timeout must be greater than 0.")
    if args.head_movement_threshold <= 0:
        raise SystemExit("--head-movement-threshold must be greater than 0.")

    data = load_encodings(args.encodings)

    if not data["encodings"]:
        raise SystemExit(
            f"No encodings found in {args.encodings}. Register a face first with register.py."
        )

    print("Opening webcam. Press 'q' to quit.")
    camera = open_camera(args.camera)
    liveness_detector = BlinkLivenessDetector(
        ear_threshold=args.blink_threshold,
        required_blinks=args.required_blinks,
        min_closed_frames=args.min_blink_frames,
        max_closed_frames=args.max_blink_frames,
        challenge_seconds=args.liveness_timeout,
        head_movement_ratio=args.head_movement_threshold,
    )

    frame_index = 0
    last_locations: list[tuple[int, int, int, int]] = []
    last_faces_landmarks: list[Landmarks] = []
    last_liveness = None
    last_recognition_results: list[
        tuple[tuple[int, int, int, int], str, tuple[int, int, int]]
    ] = []

    try:
        while True:
            ok, frame = camera.read()
            if not ok:
                raise RuntimeError("Could not read from webcam.")

            # Optimization: only every alternate frame does expensive face work;
            # skipped frames still display immediately using the cached result.
            process_current_frame = frame_index % DEFAULT_PROCESS_EVERY_N_FRAMES == 0
            frame_index += 1

            if process_current_frame:
                # Optimization: shrink to 25% before RGB conversion/detection.
                rgb_frame = resize_for_recognition(frame, args.frame_scale)

                # Optimization: HOG detection is much faster than CNN for webcam CPU use.
                detected_locations = find_face_locations(rgb_frame, args.model)

                # Optimization: process only the largest/closest face and ignore extras.
                locations = limit_to_primary_face(detected_locations)

                faces_landmarks = find_face_landmarks(rgb_frame, locations) if locations else []
                liveness = liveness_detector.update(
                    faces_landmarks,
                    locations,
                    rgb_frame.shape,
                    frame_weight=DEFAULT_PROCESS_EVERY_N_FRAMES,
                )

                recognition_results: list[
                    tuple[tuple[int, int, int, int], str, tuple[int, int, int]]
                ] = []
                if liveness.is_live and locations:
                    # Step 3: only after liveness is confirmed, compute one face encoding.
                    encodings = encode_face_locations(rgb_frame, locations)

                    for location, face_encoding in zip(locations, encodings):
                        name, distance = match_face(
                            face_encoding,
                            data["encodings"],
                            data["names"],
                            args.tolerance,
                        )
                        label = name
                        if args.show_distance and distance is not None:
                            label = f"{name} ({distance:.2f})"

                        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                        recognition_results.append((location, label, color))

                    if not recognition_results:
                        recognition_results.append((locations[0], "Unknown", (0, 0, 255)))

                last_locations = locations
                last_faces_landmarks = faces_landmarks
                last_liveness = liveness
                last_recognition_results = recognition_results
            else:
                locations = last_locations
                faces_landmarks = last_faces_landmarks
                liveness = last_liveness
                recognition_results = last_recognition_results

            # Optimization: all drawing and window updates still happen every
            # frame so the webcam preview stays responsive even while processing.
            for landmarks in faces_landmarks:
                draw_eye_landmarks(frame, landmarks, args.frame_scale)

            if liveness is None:
                draw_status(frame, "Initializing camera", 80, (255, 255, 255))
            elif not locations:
                draw_status(frame, "No face detected", 80, (0, 0, 255))
            elif not liveness.is_live:
                # No face recognition is performed until the blink challenge passes.
                for location in locations:
                    draw_face_box(
                        frame,
                        location,
                        "Fake / No Liveness",
                        args.frame_scale,
                        (0, 0, 255),
                    )
                if liveness.timed_out:
                    draw_status(frame, "Liveness timeout - try again", 80, (0, 0, 255))
                else:
                    draw_status(frame, "Fake / No Liveness", 80, (0, 0, 255))
            else:
                for location, label, color in recognition_results:
                    draw_face_box(frame, location, label, args.frame_scale, color)

                draw_status(frame, "Real User", 80, (0, 255, 0))

            if liveness is not None:
                if liveness.ear is not None:
                    draw_status(frame, f"EAR: {liveness.ear:.2f}", 140, (255, 255, 0))
                if liveness.blink_detected:
                    draw_status(frame, "Blink Detected", 110, (0, 0, 255))

                draw_status(
                    frame,
                    f"Blinks: {liveness.blink_count}/{args.required_blinks}",
                    50,
                    (255, 255, 255),
                )
                draw_status(
                    frame,
                    "Head movement: OK" if liveness.head_moved else "Head movement: needed",
                    170,
                    (0, 255, 0) if liveness.head_moved else (255, 255, 255),
                )
                draw_status(
                    frame,
                    f"Time left: {liveness.time_remaining:.1f}s",
                    200,
                    (255, 255, 255),
                )
            draw_status(frame, "Press q to quit")
            cv2.imshow("Face Recognition", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
