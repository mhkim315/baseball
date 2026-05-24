"""
Fullcount.kr Community Backend

Run: uvicorn main:app --host 0.0.0.0 --port 8000
Production: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
"""

import os
import logging
from datetime import date
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger(__name__)

from database import engine
from models import Base
from limiter import limiter
from auth import router as auth_router
from community import router as community_router
from account import router as account_router

_DAILY_SCORES_CACHE: dict[str, object] = {"data": None, "cached_date": None}

# Historical scoring averages (2020-2025) — fully finalized, no fetch needed
_HISTORICAL_SCORING: dict[int, dict[str, dict[str, float | int]]] = {
  2020: {
    "KIA": {"avgRuns": 4.9, "totalRuns": 430, "totalGames": 87},
    "KT": {"avgRuns": 5.7, "totalRuns": 492, "totalGames": 87},
    "LG": {"avgRuns": 5.9, "totalRuns": 534, "totalGames": 91},
    "NC": {"avgRuns": 6.2, "totalRuns": 531, "totalGames": 86},
    "SK": {"avgRuns": 4.3, "totalRuns": 384, "totalGames": 90},
    "두산": {"avgRuns": 5.9, "totalRuns": 528, "totalGames": 90},
    "롯데": {"avgRuns": 5.0, "totalRuns": 428, "totalGames": 85},
    "삼성": {"avgRuns": 4.9, "totalRuns": 443, "totalGames": 90},
    "키움": {"avgRuns": 5.5, "totalRuns": 511, "totalGames": 93},
    "한화": {"avgRuns": 3.5, "totalRuns": 312, "totalGames": 89},
  },
  2021: {
    "KIA": {"avgRuns": 4.0, "totalRuns": 302, "totalGames": 76},
    "KT": {"avgRuns": 5.3, "totalRuns": 412, "totalGames": 78},
    "LG": {"avgRuns": 4.7, "totalRuns": 364, "totalGames": 77},
    "NC": {"avgRuns": 5.5, "totalRuns": 423, "totalGames": 77},
    "SSG": {"avgRuns": 5.2, "totalRuns": 424, "totalGames": 82},
    "두산": {"avgRuns": 5.2, "totalRuns": 396, "totalGames": 76},
    "롯데": {"avgRuns": 5.3, "totalRuns": 424, "totalGames": 80},
    "삼성": {"avgRuns": 5.2, "totalRuns": 425, "totalGames": 82},
    "키움": {"avgRuns": 5.3, "totalRuns": 439, "totalGames": 83},
    "한화": {"avgRuns": 3.9, "totalRuns": 317, "totalGames": 81},
  },
  2022: {
    "KIA": {"avgRuns": 5.2, "totalRuns": 485, "totalGames": 94},
    "KT": {"avgRuns": 4.5, "totalRuns": 417, "totalGames": 93},
    "LG": {"avgRuns": 5.1, "totalRuns": 479, "totalGames": 94},
    "NC": {"avgRuns": 4.1, "totalRuns": 381, "totalGames": 92},
    "SSG": {"avgRuns": 4.9, "totalRuns": 471, "totalGames": 96},
    "두산": {"avgRuns": 4.7, "totalRuns": 430, "totalGames": 91},
    "롯데": {"avgRuns": 4.1, "totalRuns": 398, "totalGames": 96},
    "삼성": {"avgRuns": 4.3, "totalRuns": 407, "totalGames": 94},
    "키움": {"avgRuns": 4.2, "totalRuns": 411, "totalGames": 97},
    "한화": {"avgRuns": 4.1, "totalRuns": 388, "totalGames": 95},
  },
  2023: {
    "KIA": {"avgRuns": 4.6, "totalRuns": 392, "totalGames": 85},
    "KT": {"avgRuns": 4.7, "totalRuns": 427, "totalGames": 91},
    "LG": {"avgRuns": 5.0, "totalRuns": 302, "totalGames": 60},
    "NC": {"avgRuns": 4.7, "totalRuns": 410, "totalGames": 88},
    "SSG": {"avgRuns": 4.7, "totalRuns": 276, "totalGames": 59},
    "두산": {"avgRuns": 4.1, "totalRuns": 243, "totalGames": 59},
    "롯데": {"avgRuns": 4.3, "totalRuns": 379, "totalGames": 88},
    "삼성": {"avgRuns": 4.3, "totalRuns": 394, "totalGames": 91},
    "키움": {"avgRuns": 4.2, "totalRuns": 265, "totalGames": 63},
    "한화": {"avgRuns": 4.2, "totalRuns": 366, "totalGames": 88},
  },
  2024: {
    "KIA": {"avgRuns": 6.1, "totalRuns": 546, "totalGames": 90},
    "KT": {"avgRuns": 5.3, "totalRuns": 481, "totalGames": 91},
    "LG": {"avgRuns": 5.4, "totalRuns": 501, "totalGames": 93},
    "NC": {"avgRuns": 5.4, "totalRuns": 477, "totalGames": 89},
    "SSG": {"avgRuns": 5.2, "totalRuns": 477, "totalGames": 91},
    "두산": {"avgRuns": 5.4, "totalRuns": 506, "totalGames": 94},
    "롯데": {"avgRuns": 5.4, "totalRuns": 474, "totalGames": 87},
    "삼성": {"avgRuns": 5.0, "totalRuns": 457, "totalGames": 91},
    "키움": {"avgRuns": 4.8, "totalRuns": 420, "totalGames": 88},
    "한화": {"avgRuns": 5.1, "totalRuns": 462, "totalGames": 90},
  },
  2025: {
    "KIA": {"avgRuns": 4.9, "totalRuns": 430, "totalGames": 88},
    "KT": {"avgRuns": 4.4, "totalRuns": 402, "totalGames": 91},
    "LG": {"avgRuns": 5.1, "totalRuns": 458, "totalGames": 90},
    "NC": {"avgRuns": 4.7, "totalRuns": 401, "totalGames": 85},
    "SSG": {"avgRuns": 4.1, "totalRuns": 354, "totalGames": 87},
    "두산": {"avgRuns": 4.4, "totalRuns": 384, "totalGames": 88},
    "롯데": {"avgRuns": 4.8, "totalRuns": 440, "totalGames": 91},
    "삼성": {"avgRuns": 5.1, "totalRuns": 451, "totalGames": 88},
    "키움": {"avgRuns": 3.7, "totalRuns": 334, "totalGames": 91},
    "한화": {"avgRuns": 4.7, "totalRuns": 414, "totalGames": 89},
  },
}
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://fullcount.kr,https://www.fullcount.kr")
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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception in %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )

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


@app.get("/api/score-summary/{year}")
async def get_score_summary(year: int):
    # Past seasons are fully finalized — return hardcoded data
    if year in _HISTORICAL_SCORING:
        teams = []
        for team_name, info in sorted(_HISTORICAL_SCORING[year].items()):
            teams.append({
                "teamName": team_name,
                "avgRuns": info["avgRuns"],
                "totalRuns": info["totalRuns"],
                "totalGames": info["totalGames"],
            })
        return {"year": year, "teams": teams}

    # Current season (2026+) — fetch from external API once per day
    today = date.today()
    if _DAILY_SCORES_CACHE["data"] is None or _DAILY_SCORES_CACHE["cached_date"] != today:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.fullcount.kr/daily-scores", timeout=30)
            if resp.status_code != 200:
                return JSONResponse(status_code=502, content={"error": "Data source unavailable"})
            _DAILY_SCORES_CACHE["data"] = resp.json()
            _DAILY_SCORES_CACHE["cached_date"] = today
    dates = _DAILY_SCORES_CACHE["data"].get("dates", {})
    team_runs: dict[str, int] = {}
    team_games: dict[str, int] = {}
    for date_str, games in dates.items():
        if not date_str.startswith(str(year)):
            continue
        for game in games:
            if game.get("cancelled") or game.get("outcome") is None:
                continue
            team_runs[game["away"]] = team_runs.get(game["away"], 0) + game["awayScore"]
            team_games[game["away"]] = team_games.get(game["away"], 0) + 1
            team_runs[game["home"]] = team_runs.get(game["home"], 0) + game["homeScore"]
            team_games[game["home"]] = team_games.get(game["home"], 0) + 1
    teams = []
    for team in sorted(team_runs):
        games = team_games.get(team, 0)
        teams.append({
            "teamName": team,
            "avgRuns": round(team_runs[team] / games, 1) if games > 0 else 0,
            "totalRuns": team_runs[team],
            "totalGames": games,
        })
    return {"year": year, "teams": teams}
