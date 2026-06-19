"""Delete a registered user from the face encoding database."""

from __future__ import annotations

import argparse
from pathlib import Path

from face_utils import ENCODINGS_PATH, clean_name, load_encodings, save_encodings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Delete a user from face encodings.")
    parser.add_argument("name", help="Name of the user to delete.")
    parser.add_argument(
        "-e",
        "--encodings",
        type=Path,
        default=ENCODINGS_PATH,
        help="Pickle file containing saved face encodings.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    user_name = clean_name(args.name)
    data = load_encodings(args.encodings)

    kept = [
        (name, encoding)
        for name, encoding in zip(data["names"], data["encodings"])
        if name.lower() != user_name.lower()
    ]

    removed_count = len(data["names"]) - len(kept)
    if removed_count == 0:
        print(f"User '{user_name}' not found in {args.encodings}.")
        return

    data["names"] = [name for name, _ in kept]
    data["encodings"] = [encoding for _, encoding in kept]
    save_encodings(data, args.encodings)
    print(f"Deleted {removed_count} encoding(s) for '{user_name}'. Remaining users: {len(data['names'])}.")


if __name__ == "__main__":
    main()
