"""Isolated, non-billable tests for private connections and official HTTP contracts."""

import json
import re

import httpx
import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from studypilot.ai_profiles import ProfileInput, ProfileProvider, canonical_endpoint
from studypilot.db import get_db
from studypilot.errors import AppError
from studypilot.models import (
    AIProfile,
    ChatMessage,
    ChatSession,
    Chunk,
    Citation,
    Document,
    Page,
    User,
)
from studypilot.profile_retrieval import profile_retrieve, rank_chunks
from studypilot.routes_profiles import router
from studypilot.security import current_user

KEY = "fixture-only-never-a-real-api-key"
BODY = {
    "name": "论文助手",
    "provider": "deepseek",
    "base_url": "https://api.deepseek.com/v1",
    "model": "deepseek-v4-flash",
    "api_key": KEY,
}


@pytest.fixture
def client_fixture():
    engine = create_engine(
        "sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False}
    )
    for model in (User, AIProfile, Document, Page, Chunk, ChatSession, ChatMessage, Citation):
        model.__table__.create(engine)
    with Session(engine) as db:
        db.add_all([User(id="owner"), User(id="other")])
        db.commit()
    app = FastAPI()
    app.include_router(router)
    from studypilot.routes_chat import router as chat_router
    from studypilot.routes_translation import router as translation_router

    app.include_router(chat_router)
    app.include_router(translation_router)
    identity = {"id": "owner"}

    def database():
        with Session(engine) as db:
            yield db

    from fastapi import Depends

    def live_user(db: Session = Depends(get_db)):
        return db.get(User, identity["id"])

    @app.exception_handler(AppError)
    async def handler(request, error):
        return JSONResponse({"code": error.code}, status_code=error.status)

    app.dependency_overrides[get_db] = database
    app.dependency_overrides[current_user] = live_user
    with TestClient(app) as client:
        yield client, engine, identity
    engine.dispose()


def test_create_persists_default_and_never_returns_key(client_fixture):
    client, engine, _ = client_fixture
    response = client.post("/ai/profiles", json=BODY)
    assert response.status_code == 200
    profile = response.json()
    assert "api_key" not in profile and KEY not in response.text
    listed = client.get("/ai/profiles")
    assert KEY not in listed.text
    assert listed.json()["default_id"] == profile["id"]
    with Session(engine) as db:
        assert db.get(AIProfile, profile["id"]).api_key == KEY
        assert db.get(User, "owner").ai_profile_id == profile["id"]


def test_edit_keeps_blank_key_and_increments_revision(client_fixture):
    client, engine, _ = client_fixture
    profile = client.post("/ai/profiles", json=BODY).json()
    response = client.patch(
        f"/ai/profiles/{profile['id']}", json={**BODY, "api_key": "", "name": "新备注"}
    )
    assert response.status_code == 200 and response.json()["revision"] == 2
    with Session(engine) as db:
        assert db.get(AIProfile, profile["id"]).api_key == KEY
    response = client.patch(
        f"/ai/profiles/{profile['id']}",
        json={
            **BODY,
            "provider": "zhipu",
            "base_url": "https://open.bigmodel.cn/api/paas/v4",
            "api_key": "",
        },
    )
    assert response.status_code == 422


def test_ownership_default_delete_and_missing_profile(client_fixture):
    client, _, identity = client_fixture
    first = client.post("/ai/profiles", json=BODY).json()["id"]
    second = client.post("/ai/profiles", json={**BODY, "model": "deepseek-v4-pro"}).json()["id"]
    identity["id"] = "other"
    assert client.get("/ai/profiles").json()["profiles"] == []
    for method, path, payload in [
        ("patch", f"/{first}", BODY),
        ("delete", f"/{first}", None),
        ("post", f"/{first}/default", None),
        ("post", "/test", {**BODY, "profile_id": first}),
        ("post", "/models", {**BODY, "profile_id": first}),
    ]:
        assert client.request(method, "/ai/profiles" + path, json=payload).status_code == 404
    identity["id"] = "owner"
    assert client.post(f"/ai/profiles/{second}/default").status_code == 200
    assert client.get("/ai/profiles").json()["default_id"] == second
    assert client.delete(f"/ai/profiles/{second}").status_code == 204
    assert client.get("/ai/profiles").json()["default_id"] is None
    assert client.post(f"/ai/profiles/{second}/default").status_code == 404


def test_limit_and_reference_catalog_do_not_call_remote(client_fixture, monkeypatch):
    client, _, _ = client_fixture
    monkeypatch.setattr(ProfileProvider, "request", lambda *a, **kw: pytest.fail("No network"))
    for _ in range(12):
        assert client.post("/ai/profiles", json=BODY).status_code == 200
    assert client.post("/ai/profiles", json=BODY).status_code == 409
    result = client.post("/ai/profiles/models", json={**BODY, "provider": "zhipu"}).json()
    assert result["source"] == "reference" and "glm-5.3" in result["models"]


def test_unsaved_test_checks_actual_draft_not_old_server_config(client_fixture, monkeypatch):
    client, _, _ = client_fixture
    seen = []

    def complete(self, instructions, messages, max_tokens):
        token = re.search(r"SP-[A-F0-9]{8}", messages[0]["content"]).group(0)
        seen.append(
            (
                self.profile.model,
                self.profile.api_key,
                max_tokens,
                [message["role"] for message in messages],
            )
        )
        return {
            "probe": "studypilot-capability",
            "memory": token,
            "learned": "ORBIT",
        }

    monkeypatch.setattr(ProfileProvider, "complete_messages_json", complete)
    response = client.post("/ai/profiles/test", json=BODY)
    assert response.status_code == 200 and KEY not in response.text
    assert seen == [(BODY["model"], KEY, 160, ["user", "assistant", "user"])]
    assert response.json()["capabilities"] == {
        "connection": True,
        "structured_output": True,
        "context_memory": True,
        "in_context_learning": True,
    }
    assert client.get("/ai/profiles").json()["profiles"] == []


def test_capability_probe_reports_limits_instead_of_claiming_learning(
    client_fixture, monkeypatch
):
    client, _, _ = client_fixture
    monkeypatch.setattr(
        ProfileProvider,
        "complete_messages_json",
        lambda *args, **kwargs: {
            "probe": "studypilot-capability",
            "memory": "wrong",
            "learned": "wrong",
        },
    )
    response = client.post("/ai/profiles/test", json=BODY)
    assert response.status_code == 200
    assert response.json()["capabilities"] == {
        "connection": True,
        "structured_output": True,
        "context_memory": False,
        "in_context_learning": False,
    }


@pytest.mark.parametrize(
    "url",
    [
        "http://api.deepseek.com/v1",
        "https://api.deepseek.com.evil.test/v1",
        "https://api.deepseek.com/v1?redirect=x",
        "https://user:pass@api.deepseek.com/v1",
        "http://127.0.0.1:8000",
        "https://api.deepseek.com/v1/../",
        "https://open.bigmodel.cn/api/paas/v4",
    ],
)
def test_endpoint_allowlist_rejects_redirection_and_secret_exfiltration(url):
    with pytest.raises(AppError):
        canonical_endpoint("deepseek", url)


def test_api_key_repr_is_redacted():
    assert KEY not in repr(ProfileInput(**BODY))


def mock_transport(monkeypatch, handler):
    import studypilot.ai_profiles as module

    client_class = httpx.Client

    def client(**kwargs):
        assert kwargs["trust_env"] is False and kwargs["follow_redirects"] is False
        return client_class(**kwargs, transport=httpx.MockTransport(handler))

    monkeypatch.setattr(module.httpx, "Client", client)


@pytest.mark.parametrize(
    "provider,base,model",
    [
        ("deepseek", "https://api.deepseek.com/v1", "deepseek-v4-flash"),
        ("zhipu", "https://open.bigmodel.cn/api/paas/v4", "glm-5.3"),
    ],
)
def test_exact_official_chat_contract(monkeypatch, provider, base, model):
    seen = []

    def handler(request):
        seen.append(request)
        assert str(request.url) == base + "/chat/completions"
        assert request.headers["authorization"] == "Bearer " + KEY
        payload = json.loads(request.content)
        assert payload["model"] == model
        assert payload["thinking"] == {"type": "disabled"}
        assert payload["max_tokens"] == 64 and payload["response_format"] == {"type": "json_object"}
        return httpx.Response(
            200,
            json={"choices": [{"finish_reason": "stop", "message": {"content": '{"ok":true}'}}]},
        )

    mock_transport(monkeypatch, handler)
    adapter = ProfileProvider(
        AIProfile(**{**BODY, "provider": provider, "base_url": base, "model": model})
    )
    assert adapter.complete_json("JSON test", "{}", 64) == {"ok": True}
    assert len(seen) == 1


@pytest.mark.parametrize(
    "status,code",
    [
        (302, "profile_request"),
        (401, "profile_auth"),
        (403, "profile_auth"),
        (429, "profile_quota"),
        (500, "profile_request"),
    ],
)
def test_provider_failures_are_sanitized_and_not_retried(monkeypatch, status, code):
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(
            status, json={"error": KEY}, headers={"location": "https://evil.test"}
        )

    mock_transport(monkeypatch, handler)
    with pytest.raises(AppError) as error:
        ProfileProvider(AIProfile(**BODY)).complete_json("test", "{}")
    assert error.value.code == code and KEY not in str(error.value)
    assert len(seen) == 1


def test_truncated_json_and_invalid_model_lists_are_rejected(monkeypatch):
    monkeypatch.setattr(
        ProfileProvider,
        "request",
        lambda *a, **k: {
            "choices": [{"finish_reason": "length", "message": {"content": '{"ok":true}'}}]
        },
    )
    with pytest.raises(AppError):
        ProfileProvider(AIProfile(**BODY)).complete_json("test", "{}")
    monkeypatch.setattr(
        ProfileProvider,
        "request",
        lambda *a, **k: {
            "data": [{"id": "glm-valid"}, {"id": "javascript:alert(1)"}, {"id": "glm-valid"}]
        },
    )
    assert ProfileProvider(AIProfile(**BODY)).models() == ["glm-valid"]


def test_local_ranking_and_no_relevant_evidence():
    chunks = [
        Chunk(id="a", text="Convolution uses weight sharing for local features."),
        Chunk(id="b", text="Validation evaluates model generalization."),
    ]
    assert [c.id for c in rank_chunks(chunks, "卷积 convolution weight sharing", 1)] == ["a"]
    assert rank_chunks(chunks, "unrelatedastronomy", 6) == []


def test_long_paper_uses_question_only_for_cross_language_retrieval(client_fixture, monkeypatch):
    _, engine, _ = client_fixture
    with Session(engine) as db:
        doc = Document(
            id="long", user_id="owner", title="Paper", filename="paper.pdf", status="ready"
        )
        db.add(doc)
        db.add_all(
            [
                Chunk(
                    id=f"section{i}",
                    document_id="long",
                    page_number=i + 1,
                    chunk_index=i,
                    text="Convolution weight sharing." if i == 7 else "Other unrelated text.",
                    embedding=[1.0, 0.0],
                )
                for i in range(8)
            ]
        )
        db.commit()

        def complete(self, instructions, data, max_tokens):
            assert json.loads(data) == {"question": "什么是卷积？"}
            assert max_tokens == 512
            return {"keywords": "convolution weight sharing"}

        monkeypatch.setattr(ProfileProvider, "complete_json", complete)
        hits = profile_retrieve(db, doc, "什么是卷积？", ProfileProvider(AIProfile(**BODY)), 6)
        assert [chunk.id for chunk in hits] == ["section7"]


def test_saved_models_power_uploaded_pdf_chat_and_translation_without_embeddings(
    client_fixture, monkeypatch
):
    client, engine, _ = client_fixture
    source = "Convolution uses shared weights to find local patterns."
    with Session(engine) as db:
        db.add(
            Document(
                id="paper",
                user_id="owner",
                title="Paper",
                filename="paper.pdf",
                status="ready",
                ai_status="not_configured",
                progress=100,
                embedding_signature="demo:feature-hash-v1:256",
            )
        )
        db.add(
            Page(id="p1", document_id="paper", page_number=1, heading="Convolution", text=source)
        )
        db.add(
            Chunk(
                id="c1",
                document_id="paper",
                page_number=1,
                chunk_index=0,
                text=source,
                embedding=[1.0, 0.0],
            )
        )
        db.commit()
    calls = []

    def complete(self, instructions, data, max_tokens=8192):
        calls.append(self.profile.model)
        payload = json.loads(data)
        if "sources" in payload:
            assert payload["sources"][0]["text"] == source
            return {"answer": "通过共享权重寻找局部特征。", "chunk_ids": ["c1"]}
        return {
            "segments": [
                {"id": segment["id"], "translation": "固定测试译文"}
                for segment in payload["segments"]
            ]
        }

    monkeypatch.setattr(ProfileProvider, "complete_json", complete)
    monkeypatch.setattr(ProfileProvider, "embeddings", lambda *a: pytest.fail("No embedding call"))
    first = client.post("/ai/profiles", json=BODY).json()["id"]
    second_body = {
        **BODY,
        "name": "智谱阅读",
        "provider": "zhipu",
        "model": "glm-5.3",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
    }
    second = client.post("/ai/profiles", json=second_body).json()["id"]
    response = client.post(
        "/documents/paper/chat", json={"question": "卷积是什么？", "profile_id": first}
    )
    assert response.status_code == 200
    assert response.json()["model_label"] == "论文助手 · deepseek-v4-flash"
    assert response.json()["citations"][0]["quote"] == source
    assert response.json()["retrieval"] == "ai-terms-lexical"
    response = client.post(
        "/documents/paper/chat", json={"question": "解释权重共享", "profile_id": second}
    )
    assert response.status_code == 200 and response.json()["model_label"] == "智谱阅读 · glm-5.3"
    response = client.post("/documents/paper/translate", json={"page": 1, "profile_id": second})
    assert response.status_code == 200 and response.json()["model"] == "智谱阅读 · glm-5.3"
    assert response.json()["segments"][0]["source"] == source
    assert calls == ["deepseek-v4-flash", "glm-5.3", "glm-5.3"]
    client.patch(f"/ai/profiles/{first}", json={**BODY, "name": "改名"})
    stale = {"profile_id": first, "profile_revision": 1}
    assert (
        client.post("/documents/paper/chat", json={**stale, "question": "继续解释"}).status_code
        == 409
    )
    assert client.post("/documents/paper/translate", json={**stale, "page": 1}).status_code == 409
    client.delete(f"/ai/profiles/{second}")
    history = client.get("/documents/paper/chat").json()
    assert len(history) == 4
    assert history[1]["model_label"] == "论文助手 · deepseek-v4-flash"
    assert history[3]["model_label"] == "智谱阅读 · glm-5.3"
    assert KEY not in json.dumps(history)
    with Session(engine) as db:
        assert db.get(Document, "paper").embedding_signature == "demo:feature-hash-v1:256"
        assert db.get(Page, "p1").text == source
    assert (
        client.post(
            "/documents/paper/chat", json={"question": "再解释一下", "profile_id": second}
        ).status_code
        == 404
    )
