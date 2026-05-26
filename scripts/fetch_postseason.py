"""Fetch postseason game data from Naver API (run on OCI server).
Scores and pitchers are in the schedule_games response directly."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from naver_api import schedule_games
import json

def is_postseason_game(g):
    """Filter: postseason games are in Oct-Nov and have RESULT or are after regular season."""
    cat = g.get("categoryId", "")
    dt = g.get("gameDateTime", "")
    month = dt[5:7] if len(dt) >= 7 else ""
    is_post = cat == "kbo" and month in ("10", "11")
    if not is_post:
        return False
    # Korean Series (KS) has higher roundCode; exclude regular season games in Oct
    # Postseason games typically have different roundCode structure
    # Let's check if this looks like a postseason game based on teams
    return True

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "seasons"))

def process_year(year):
    games = schedule_games(f"{year}-10-01", f"{year}-11-15")
    results = []
    for g in games:
        if g.get("categoryId") != "kbo":
            continue
        dt = g["gameDateTime"][:10]
        results.append({
            "date": dt,
            "gameId": g["gameId"],
            "away": g["awayTeamName"],
            "home": g["homeTeamName"],
            "awayScore": g.get("awayTeamScore"),
            "homeScore": g.get("homeTeamScore"),
            "winPitcher": g.get("winPitcherName"),
            "losePitcher": g.get("losePitcherName"),
            "statusCode": g.get("statusCode"),
            "venue": g.get("stadium", ""),
            "time": g.get("gameTime", ""),
        })
    out_dir = os.path.join(DATA_DIR, str(year))
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "postseason-games.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"{year}: {len(results)} games -> {path}")
    for r in results:
        if r["awayScore"] is not None:
            print(f"  {r['date']} {r['away']} {r['awayScore']}-{r['homeScore']} {r['home']} WP:{r['winPitcher']}")

for y in [2021, 2022, 2023, 2024, 2025]:
    process_year(y)
