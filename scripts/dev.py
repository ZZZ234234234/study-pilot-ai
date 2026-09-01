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
    parser.add_argument("--api-port", type=int, default=8000)
    parser.add_argument("--db-port", type=int, default=54329)
    args = parser.parse_args()
    if any(not 1024 <= port <= 65535 for port in (args.api_port, args.db_port)):
        parser.error("Ports must be between 1024 and 65535.")
    load_dotenv(ROOT / ".env")
    os.chdir(ROOT)
    data = Path(os.environ.get("DATA_DIR", ROOT / "data")).resolve()
    data.mkdir(parents=True, exist_ok=True)
    os.environ["DATA_DIR"] = str(data)
    os.environ["DEV_DB_PORT"] = str(args.db_port)
    children = []

    def stop(*_):
        raise SystemExit(0)

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    try:
        if not os.environ.get("DATABASE_URL"):
            # Refuse a busy port before migrations can reach an unrelated database.
            with socket.socket() as port_check:
                try:
                    port_check.bind(("127.0.0.1", args.db_port))
                except OSError:
                    raise SystemExit(
                        f"Development database port {args.db_port} is already in use."
                    ) from None
            children.append(subprocess.Popen(["node", "scripts/dev-db.mjs"], cwd=ROOT))
            for _ in range(60):
                if children[0].poll() is not None:
                    raise SystemExit("Development database failed to start.")
                try:
                    with socket.create_connection(("127.0.0.1", args.db_port), timeout=1):
                        break
                except OSError:
                    time.sleep(0.5)
            else:
                raise SystemExit("Development database did not become ready.")
            os.environ["DATABASE_URL"] = (
                f"postgresql+psycopg://postgres@127.0.0.1:{args.db_port}/postgres?sslmode=disable"
            )
            os.environ["DEV_DB"] = "true"
        if not (ROOT / "docs/sample/introduction-to-neural-networks.pdf").exists():
            subprocess.run([sys.executable, "scripts/create_sample.py"], check=True)
        migration = subprocess.Popen(
            [sys.executable, "-m", "alembic", "-c", "apps/api/alembic.ini", "upgrade", "head"],
            cwd=ROOT,
        )
        children.append(migration)
        if migration.wait() != 0:
            raise SystemExit("Database migration failed.")
        children.remove(migration)
        commands = [
            [
                sys.executable,
                "-m",
                "uvicorn",
                "studypilot.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(args.api_port),
            ],
            [sys.executable, "-m", "studypilot.worker"],
        ]
        if not args.api_only:
            npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
            if not npm:
                raise SystemExit("npm was not found. Install Node.js 22.13+ first.")
            os.environ["API_INTERNAL_URL"] = f"http://127.0.0.1:{args.api_port}"
            commands.append([npm, "run", "dev"])
        for command in commands:
            children.append(subprocess.Popen(command, cwd=ROOT))
        print(f"API docs: http://127.0.0.1:{args.api_port}/docs", flush=True)
        if not args.api_only:
            print("StudyPilot: http://localhost:3000", flush=True)
        while True:
            for child in children:
                if child.poll() is not None:
                    # A long-running service exiting (even with 0) is a failure.
                    raise SystemExit(
                        f"Service {child.pid} stopped unexpectedly ({child.returncode})."
                    )
            time.sleep(0.5)
    finally:
        # Also covers migration/startup failures; never leave the temporary DB running.
        for child in reversed(children):
            if child.poll() is None:
                child.terminate()
        for child in reversed(children):
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == "__main__":
    main()
