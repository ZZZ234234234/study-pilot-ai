"""Playwright-owned demo stack. Never connects to the user's database or model."""

import argparse
import os
import secrets
import signal
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3310)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("Port must be between 1024 and 65535.")
    server = ROOT / "apps/web/.next/standalone/apps/web/server.js"
    if not server.exists():
        raise SystemExit("Run npm run build before running end-to-end tests.")

    def stop(*_):
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    with tempfile.TemporaryDirectory(prefix="studypilot-e2e-") as directory:
        # Reserve distinct free loopback ports; no reuse of normal development services.
        with socket.socket() as api_socket, socket.socket() as db_socket:
            api_socket.bind(("127.0.0.1", 0))
            db_socket.bind(("127.0.0.1", 0))
            api_port = api_socket.getsockname()[1]
            db_port = db_socket.getsockname()[1]
        env = {
            **os.environ,
            "DATA_DIR": directory,
            "DATABASE_URL": "",
            "DEV_DB": "true",
            "APP_ENV": "development",
            "AI_PROVIDER": "demo",
            "AI_API_KEY": "",
            "SESSION_SECRET": secrets.token_urlsafe(32),
            "COOKIE_SECURE": "false",
            "ALLOWED_ORIGINS": f"http://127.0.0.1:{args.port}",
            "API_INTERNAL_URL": f"http://127.0.0.1:{api_port}",
            "PORT": str(args.port),
            "HOSTNAME": "127.0.0.1",
            "NODE_ENV": "production",
        }
        children = []
        try:
            children.append(
                subprocess.Popen(
                    [
                        sys.executable,
                        "scripts/dev.py",
                        "--api-only",
                        "--api-port",
                        str(api_port),
                        "--db-port",
                        str(db_port),
                    ],
                    cwd=ROOT,
                    env=env,
                )
            )
            children.append(subprocess.Popen(["node", str(server)], cwd=ROOT, env=env))
            while True:
                for child in children:
                    if child.poll() is not None:
                        raise SystemExit(f"E2E service {child.pid} stopped ({child.returncode}).")
                time.sleep(0.5)
        finally:
            for child in reversed(children):
                if child.poll() is None:
                    child.terminate()
            for child in reversed(children):
                try:
                    child.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    child.kill()
                    child.wait()


if __name__ == "__main__":
    main()
