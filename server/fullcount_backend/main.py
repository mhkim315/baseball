"""
Fullcount.kr Community Backend

Run: uvicorn main:app --host 0.0.0.0 --port 8000
Production: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import engine
from models import Base
from limiter import limiter
from auth import router as auth_router
from community import router as community_router
from account import router as account_router

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in ALLOWED_ORIGINS.split(",")] if ALLOWED_ORIGINS != "*" else ["*"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="fullcount.kr Community API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(community_router)
app.include_router(account_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
