import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .ai_profiles import (
    ProfileInput,
    ProfileProbe,
    ProfileProvider,
    owned_profile,
    public_profile,
    resolve_input,
)
from .db import get_db
from .errors import AppError
from .models import AIProfile, User
from .provider_catalog import provider_spec, public_catalog
from .security import current_user

router = APIRouter(prefix="/ai/profiles", tags=["model connections"])
PROFILE_LIMIT = 30


@router.get("")
def profiles(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = db.scalars(
        select(AIProfile)
        .where(AIProfile.user_id == user.id)
        .order_by(AIProfile.created_at, AIProfile.id)
    ).all()
    return {
        "profiles": [public_profile(p) for p in rows],
        "default_id": user.ai_profile_id,
        "providers": public_catalog(),
    }


def lock_workspace(db: Session, user: User):
    db.scalar(select(User).where(User.id == user.id).with_for_update())


@router.post("")
def create(body: ProfileInput, db: Session = Depends(get_db), user: User = Depends(current_user)):
    values = resolve_input(body)
    lock_workspace(db, user)
    if (
        db.scalar(select(func.count()).select_from(AIProfile).where(AIProfile.user_id == user.id))
        >= PROFILE_LIMIT
    ):
        raise AppError(
            f"A workspace supports up to {PROFILE_LIMIT} model connections.",
            "profile_limit",
            409,
        )
    profile = AIProfile(user_id=user.id, **values)
    db.add(profile)
    db.flush()
    if not user.ai_profile_id:
        user.ai_profile_id = profile.id
    db.commit()
    return public_profile(profile)


@router.post("/models")
def models(body: ProfileProbe, db: Session = Depends(get_db), user: User = Depends(current_user)):
    existing = owned_profile(db, user, body.profile_id) if body.profile_id else None
    spec = provider_spec(body.provider)
    # No guessed endpoint or web scraping. References do not imply key validation.
    if not spec.model_list:
        return {
            "models": list(spec.models),
            "source": "reference" if spec.models else "manual",
        }
    provider = ProfileProvider(AIProfile(**resolve_input(body, existing)))
    return {"models": provider.models(), "source": "provider"}


@router.post("/test")
def test(body: ProfileProbe, db: Session = Depends(get_db), user: User = Depends(current_user)):
    existing = owned_profile(db, user, body.profile_id) if body.profile_id else None
    provider = ProfileProvider(AIProfile(**resolve_input(body, existing)))
    token = f"SP-{secrets.token_hex(4).upper()}"
    result = provider.complete_messages_json(
        """Capability check only. Follow the user's latest request using earlier turns.
Return exactly one JSON object and do not add commentary.""",
        [
            {
                "role": "user",
                "content": (
                    f"For this temporary conversation only, remember the token {token}. "
                    "Learn this temporary example rule: KITE maps to ORBIT. "
                    "Acknowledge without repeating either answer."
                ),
            },
            {"role": "assistant", "content": "Acknowledged."},
            {
                "role": "user",
                "content": (
                    'Return {"probe":"studypilot-capability","memory":"TOKEN",'
                    '"learned":"RESULT"}. Replace TOKEN with the remembered token and '
                    "RESULT with the output learned for KITE."
                ),
            },
        ],
        160,
    )
    structured = result.get("probe") == "studypilot-capability"
    memory = str(result.get("memory", "")).strip() == token
    learning = str(result.get("learned", "")).strip().upper() == "ORBIT"
    return {
        "ok": True,
        "model": body.model,
        "capabilities": {
            "connection": True,
            "structured_output": structured,
            "context_memory": memory,
            "in_context_learning": learning,
        },
    }


@router.patch("/{profile_id}")
def update(
    profile_id: str,
    body: ProfileInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    lock_workspace(db, user)
    profile = owned_profile(db, user, profile_id)
    for key, value in resolve_input(body, profile).items():
        setattr(profile, key, value)
    profile.revision += 1
    db.commit()
    return public_profile(profile)


@router.post("/{profile_id}/default")
def default(profile_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    lock_workspace(db, user)
    user.ai_profile_id = owned_profile(db, user, profile_id).id
    db.commit()
    return {"ok": True}


@router.delete("/{profile_id}", status_code=204)
def delete(profile_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    lock_workspace(db, user)
    profile = owned_profile(db, user, profile_id)
    if user.ai_profile_id == profile_id:
        user.ai_profile_id = None
    db.delete(profile)
    db.commit()
