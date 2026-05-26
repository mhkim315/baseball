"""Fetch postseason game data from Naver API (run on OCI server).
Scores and pitchers are in the schedule_games response directly.
Uses pagination to get all games and filters by roundCode for postseason.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from naver_api import get_json
import json

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "seasons"))

# Postseason round codes in Naver API
POSTSEASON_ROUNDS = {"kbo_ps_wd", "kbo_ps_sp", "kbo_ps_po", "kbo_ps_ks"}
# Known postseason game ID prefixes (2021-2024 format: 4444=WC, 3333=준PO, 5555=PO, 7777=KS)
POSTSEASON_GAME_PREFIXES = ("4444", "3333", "5555", "7777")

def is_postseason(game):
    """Check if a game is a postseason game by roundCode or gameId prefix."""
    rc = game.get("roundCode", "")
    if rc in POSTSEASON_ROUNDS:
        return True
    gid = game.get("gameId", "")
    if gid.startswith(POSTSEASON_GAME_PREFIXES):
        return True
    return False

def fetch_all_kbo_games(year):
    """Fetch ALL KBO games in Oct 1 - Nov 15 range, handling pagination."""
    all_games = []
    page = 1
    while True:
        data = get_json("/schedule/games", {
            "fields": "all",
            "fromDate": f"{year}-10-01",
            "toDate": f"{year}-11-30",
            "size": "500",
            "page": str(page),
        })
        if data.get("code") != 200 or not data.get("success"):
            break
        games = list(data.get("result", {}).get("games") or [])
        if not games:
            break
        # Filter to KBO games only
        kbo_games = [g for g in games if g.get("categoryId") == "kbo"]
        all_games.extend(kbo_games)
        # Stop if this page had fewer than 500 = last page
        if len(games) < 500:
            break
        page += 1
    return all_games

def process_year(year):
    all_kbo = fetch_all_kbo_games(year)
    # Filter to postseason games only
    postseason = [g for g in all_kbo if is_postseason(g)]

    # Count played postseason games
    played = sum(1 for g in postseason if g.get("statusCode") == "RESULT")

    results = []
    for g in postseason:
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
    print(f"{year}: {played} played / {len(postseason)} postseason games (from {len(all_kbo)} KBO games)")
    for r in results:
        print(f"  {r['date']} {r['away']} {r['awayScore']}-{r['homeScore']} {r['home']} WP:{r['winPitcher']}")

for y in [2021, 2022, 2023, 2024, 2025]:
    process_year(y)
