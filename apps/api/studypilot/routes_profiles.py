from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .ai_profiles import (
    ENDPOINTS,
    REFERENCE_MODELS,
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
from .security import current_user

router = APIRouter(prefix="/ai/profiles", tags=["model connections"])


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
        "providers": [
            {
                "id": key,
                "base_url": url,
                "models": REFERENCE_MODELS[key],
                "model_source": "reference",
                "checked_on": "2026-09-02",
            }
            for key, url in ENDPOINTS.items()
        ],
    }


def lock_workspace(db: Session, user: User):
    db.scalar(select(User).where(User.id == user.id).with_for_update())


@router.post("")
def create(body: ProfileInput, db: Session = Depends(get_db), user: User = Depends(current_user)):
    values = resolve_input(body)
    lock_workspace(db, user)
    if (
        db.scalar(select(func.count()).select_from(AIProfile).where(AIProfile.user_id == user.id))
        >= 12
    ):
        raise AppError("A workspace supports up to 12 model connections.", "profile_limit", 409)
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
    # Zhipu: no guessed list endpoint or web scraping; references do not imply key validation.
    if body.provider == "zhipu":
        return {"models": REFERENCE_MODELS["zhipu"], "source": "reference"}
    provider = ProfileProvider(AIProfile(**resolve_input(body, existing)))
    return {"models": provider.models(), "source": "provider"}


@router.post("/test")
def test(body: ProfileProbe, db: Session = Depends(get_db), user: User = Depends(current_user)):
    existing = owned_profile(db, user, body.profile_id) if body.profile_id else None
    provider = ProfileProvider(AIProfile(**resolve_input(body, existing)))
    result = provider.complete_json('Connection test only. Return JSON {"ok":true}.', "{}", 64)
    if result.get("ok") is not True:
        raise AppError("The model did not return the test JSON.", "invalid_ai_output", 502)
    return {"ok": True, "model": body.model}


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
