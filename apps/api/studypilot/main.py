import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from .config import get_settings
from .errors import AppError
from .routes_chat import router as chat_router
from .routes_documents import router as documents_router
from .routes_quiz import router as quiz_router
from .routes_study import router as study_router
from .routes_system import router as system_router
from .security import signer

logger = logging.getLogger("studypilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_settings().data_dir.mkdir(parents=True, exist_ok=True)
    signer()
    yield


app = FastAPI(
    title="StudyPilot AI",
    version="0.1.0",
    lifespan=lifespan,
    description="Personal PDF workspaces, page-grounded RAG, and structured review.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-StudyPilot", "Range"],
)
requests_by_client: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def safeguards(request: Request, call_next):
    settings = get_settings()
    if request.method in {"POST", "PATCH", "DELETE"}:
        if request.headers.get("X-StudyPilot") != "1":
            return JSONResponse(
                {"detail": "Missing request protection header.", "code": "csrf"}, status_code=403
            )
        origin = request.headers.get("origin")
        if origin and origin not in settings.allowed_origins.split(","):
            return JSONResponse(
                {"detail": "This origin is not allowed.", "code": "origin_denied"}, status_code=403
            )
        try:
            length = int(request.headers.get("content-length", "0"))
        except ValueError:
            length = 0
        if length > (settings.max_upload_mb + 1) * 1024 * 1024:
            return JSONResponse(
                {"detail": "Upload is larger than the file limit.", "code": "file_too_large"},
                status_code=413,
            )
        key = request.cookies.get("studypilot_session") or (
            request.client.host if request.client else "local"
        )
        if len(requests_by_client) > 5000:
            requests_by_client.clear()
        window = requests_by_client[key]
        timestamp = time.monotonic()
        while window and timestamp - window[0] > 60:
            window.popleft()
        if len(window) >= 40:
            return JSONResponse(
                {
                    "detail": "Too many requests. Wait a minute and try again.",
                    "code": "rate_limited",
                },
                status_code=429,
            )
        window.append(timestamp)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError):
    return JSONResponse({"detail": exc.message, "code": exc.code}, status_code=exc.status)


@app.exception_handler(RequestValidationError)
async def handle_validation(request: Request, exc: RequestValidationError):
    # Do not echo input values: validation errors may contain user text.
    fields = ", ".join(str(error["loc"][-1]) for error in exc.errors()[:4])
    return JSONResponse(
        {"detail": f"Please check these fields: {fields}.", "code": "validation_error"},
        status_code=422,
    )


@app.exception_handler(SQLAlchemyError)
async def handle_database_error(request: Request, exc: SQLAlchemyError):
    logger.error("Database request failed (%s)", type(exc).__name__)
    return JSONResponse(
        {
            "detail": "The database is unavailable. Please retry in a moment.",
            "code": "database_unavailable",
        },
        status_code=503,
    )


@app.exception_handler(Exception)
async def handle_unexpected(request: Request, exc: Exception):
    logger.error("Unexpected request failure (%s)", type(exc).__name__)
    return JSONResponse(
        {
            "detail": "This operation could not be completed. Please retry or check the server status.",
            "code": "internal_error",
        },
        status_code=500,
    )


for router in (system_router, documents_router, chat_router, study_router, quiz_router):
    app.include_router(router, prefix="/api/v1")
