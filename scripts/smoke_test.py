"""Exercise only a local demo API in newly created, isolated browser workspaces."""

import argparse
import os
import subprocess
import sys
import tempfile
import time
from datetime import date, timedelta
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
API = "http://127.0.0.1:8000/api/v1"


def checked(response, expected=200):
    assert response.status_code == expected, (
        f"{response.request.method} {response.request.url.path}: "
        f"expected {expected}, received {response.status_code}: {response.text[:250]}"
    )
    return response.json() if response.content else None


def ready(client, identifier):
    for _ in range(60):
        document = checked(client.get(f"/documents/{identifier}"))
        if document["status"] == "ready":
            return document
        assert document["status"] != "failed", document.get("error")
        time.sleep(0.5)
    raise AssertionError("Document processing did not finish within 30 seconds.")


def main():
    headers = {"X-StudyPilot": "1"}
    with (
        httpx.Client(base_url=API, headers=headers, timeout=15, trust_env=False) as owner,
        httpx.Client(base_url=API, headers=headers, timeout=15, trust_env=False) as stranger,
    ):
        health = checked(owner.get("/health"))
        assert health["pgvector"]
        checked(owner.post("/session"))
        assert checked(owner.get("/settings"))["provider"] == "demo", (
            "Smoke test only runs against demo mode; no paid model calls will be made."
        )
        checked(stranger.post("/session"))
        created = []
        try:
            demo = checked(owner.post("/documents/demo"), 202)
            created.append(demo["id"])
            identifier = demo["id"]
            document = ready(owner, identifier)
            assert document["page_count"] == 8
            assert document["knowledge_count"] >= 16
            print("PASS: PDF processing, 8 pages, grounded knowledge points", flush=True)

            checked(stranger.get(f"/documents/{identifier}"), 404)
            checked(stranger.get(f"/documents/{identifier}/file"), 404)
            checked(stranger.delete(f"/documents/{identifier}"), 404)
            assert owner.get(f"/documents/{identifier}/file").content.startswith(b"%PDF-")
            print("PASS: document ownership and original PDF access", flush=True)

            answer = checked(
                owner.post(
                    f"/documents/{identifier}/chat", json={"question": "Why is convolution useful?"}
                )
            )
            assert answer["mode"] == "demo" and answer["citations"]
            for citation in answer["citations"]:
                pages = checked(
                    owner.get(
                        f"/documents/{identifier}/pages", params={"page": citation["page_number"]}
                    )
                )
                assert citation["quote"] in " ".join(pages[0]["text"].split())
            print("PASS: source-grounded demo answer and verifiable page excerpts", flush=True)

            plan = checked(
                owner.post(
                    f"/documents/{identifier}/plans",
                    json={
                        "exam_date": (date.today() + timedelta(days=30)).isoformat(),
                        "daily_minutes": 45,
                        "days_per_week": 5,
                        "priority": "important",
                    },
                ),
                201,
            )
            assert plan["tasks"]
            checked(owner.patch(f"/tasks/{plan['tasks'][0]['id']}", json={"completed": True}))
            cards = checked(owner.post(f"/documents/{identifier}/flashcards"), 201)
            assert len(cards) >= 16
            checked(owner.post(f"/flashcards/{cards[0]['id']}/review", json={"grade": "good"}))
            checked(owner.post(f"/flashcards/{cards[0]['id']}/review", json={"grade": "good"}), 409)
            dashboard = checked(owner.get("/dashboard"))
            assert dashboard["completed_tasks"] == 1 and dashboard["reviews_today"] == 1
            print("PASS: plan, task completion, spaced review and duplicate protection", flush=True)

            quiz = checked(owner.post(f"/documents/{identifier}/quiz", json={"count": 5}), 201)
            assert len(quiz["questions"]) == 5
            assert all("correct_answer" not in question for question in quiz["questions"])
            answers = [
                q["options"][0] if q["options"] else "learning features and weights"
                for q in quiz["questions"]
            ]
            scored = checked(owner.post(f"/quizzes/{quiz['id']}/submit", json={"answers": answers}))
            assert 0 <= scored["score"] <= 100 and len(scored["results"]) == 5
            checked(owner.post(f"/quizzes/{quiz['id']}/submit", json={"answers": answers}), 409)
            print(
                "PASS: quiz answers hidden until submission; repeat submission rejected", flush=True
            )

            with (ROOT / "docs/sample/introduction-to-neural-networks.pdf").open("rb") as source:
                uploaded = checked(
                    owner.post(
                        "/documents",
                        files={"file": ("smoke-user-upload.pdf", source, "application/pdf")},
                    ),
                    202,
                )
            created.append(uploaded["id"])
            ordinary = ready(owner, uploaded["id"])
            assert ordinary["ai_status"] == "not_configured" and ordinary["knowledge_count"] == 0
            result = checked(
                owner.post(
                    f"/documents/{ordinary['id']}/chat",
                    json={"question": "Explain neural networks"},
                ),
                409,
            )
            assert result["code"] == "provider_required"
            checked(owner.patch(f"/documents/{identifier}", json={"title": "Smoke sample"}))
            print(
                "PASS: ordinary upload is readable but never fakes AI results in demo mode",
                flush=True,
            )
        finally:
            for identifier in created:
                checked(owner.delete(f"/documents/{identifier}"), 204)
                checked(owner.get(f"/documents/{identifier}"), 404)
                checked(owner.get(f"/documents/{identifier}/file"), 404)
            print("CLEANUP: removed only documents created by this test", flush=True)
    print("PASS: local API smoke test complete; no external AI services contacted.")


def run_with_local_services():
    # Both services and checks share one process/network environment in CI sandboxes.
    with tempfile.TemporaryDirectory(prefix="studypilot-smoke-") as temporary:
        env = {
            **os.environ,
            "DATA_DIR": temporary,
            "AI_PROVIDER": "demo",
            "DATABASE_URL": "",
            "APP_ENV": "development",
        }
        server = subprocess.Popen(
            [sys.executable, "scripts/dev.py", "--api-only"], cwd=ROOT, env=env
        )
        try:
            with httpx.Client(base_url=API, timeout=2, trust_env=False) as probe:
                for _ in range(60):
                    if server.poll() is not None:
                        raise RuntimeError("Local services failed to start.")
                    try:
                        if probe.get("/health").status_code == 200:
                            break
                    except httpx.HTTPError:
                        pass
                    time.sleep(0.5)
                else:
                    raise RuntimeError("Local API did not become healthy.")
            main()
        finally:
            server.terminate()
            try:
                server.wait(timeout=20)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--start-services",
        action="store_true",
        help="Start an isolated temporary demo database, API and worker for this check.",
    )
    arguments = parser.parse_args()
    if arguments.start_services:
        run_with_local_services()
    else:
        main()
