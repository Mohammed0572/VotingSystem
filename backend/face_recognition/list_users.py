"""List all registered users in the face encoding database."""

from __future__ import annotations

import argparse
from pathlib import Path

from face_utils import ENCODINGS_PATH, load_encodings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="List registered face encodings.")
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
    data = load_encodings(args.encodings)
    names = data["names"]

    if not names:
        print(f"No users registered in {args.encodings}.")
        return

    print(f"Registered users ({len(names)}):")
    for i, name in enumerate(names, 1):
        print(f"  {i}. {name}")


if __name__ == "__main__":
    main()
