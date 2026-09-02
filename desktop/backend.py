"""Frozen desktop backend dispatcher; never invokes a system Python installation."""

import argparse
import multiprocessing
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["migrate", "api", "worker"])
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    if args.mode == "migrate":
        from alembic import command
        from alembic.config import Config

        config = Config()
        config.set_main_option(
            "script_location", str(Path(os.environ["STUDYPILOT_RESOURCE_ROOT"]) / "migrations")
        )
        command.upgrade(config, "head")
    elif args.mode == "api":
        import uvicorn
        from studypilot.main import app

        uvicorn.run(app, host="127.0.0.1", port=args.port, access_log=False)
    else:
        from studypilot.worker import main as worker_main

        worker_main()


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
