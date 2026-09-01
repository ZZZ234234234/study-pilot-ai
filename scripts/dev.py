"""Local supervisor. Uses PGlite only when no PostgreSQL URL is configured."""

import argparse
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-only", action="store_true")
    args = parser.parse_args()
    load_dotenv(ROOT / ".env")
    os.chdir(ROOT)
    data = Path(os.environ.get("DATA_DIR", ROOT / "data")).resolve()
    data.mkdir(parents=True, exist_ok=True)
    os.environ["DATA_DIR"] = str(data)
    children = []
    if not os.environ.get("DATABASE_URL"):
        children.append(subprocess.Popen(["node", "scripts/dev-db.mjs"], cwd=ROOT))
        for _ in range(60):
            try:
                with socket.create_connection(("127.0.0.1", 54329), timeout=1):
                    break
            except OSError:
                if children[0].poll() is not None:
                    raise SystemExit("Development database failed to start.") from None
                time.sleep(0.5)
        else:
            children[0].terminate()
            raise SystemExit("Development database did not become ready.")
        os.environ["DATABASE_URL"] = (
            "postgresql+psycopg://postgres@127.0.0.1:54329/postgres?sslmode=disable"
        )
        os.environ["DEV_DB"] = "true"
    if not (ROOT / "docs/sample/introduction-to-neural-networks.pdf").exists():
        subprocess.run([sys.executable, "scripts/create_sample.py"], check=True)
    subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "-c",
            "apps/api/alembic.ini",
            "upgrade",
            "head",
        ],
        check=True,
    )
    commands = [
        [
            sys.executable,
            "-m",
            "uvicorn",
            "studypilot.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
        ],
        [sys.executable, "-m", "studypilot.worker"],
    ]
    if not args.api_only:
        npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
        if not npm:
            raise SystemExit("npm was not found. Install Node.js 22+ first.")
        commands.append([npm, "run", "dev"])
    children.extend(subprocess.Popen(command, cwd=ROOT) for command in commands)

    def shutdown(*_):
        for child in children:
            child.terminate()
        for child in children:
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()
        raise SystemExit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    print(
        "StudyPilot: http://localhost:3000 | API docs: http://127.0.0.1:8000/docs",
        flush=True,
    )
    while True:
        if any(child.poll() is not None for child in children):
            shutdown()
        time.sleep(1)


if __name__ == "__main__":
    main()
