"""Debug: check Naver API fields for past postseason games."""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
from naver_api import schedule_games, get_json

games = schedule_games("2024-10-02", "2024-10-02")
g = games[0]
gid = g["gameId"]
print("Raw schedule keys:", list(g.keys()))
print("awayScore from schedule:", g.get("awayScore"))
print("homeScore from schedule:", g.get("homeScore"))
print("status from schedule:", g.get("status"))

# Try the game detail endpoint (without /preview)
print("\n--- Game detail endpoint ---")
data = get_json("/schedule/games/" + gid, {"fields": "all"})
result = data.get("result", {})
print("result keys:", list(result.keys()))
if "homeTeam" in result:
    ht = result["homeTeam"]
    print("homeTeam:", json.dumps(ht, ensure_ascii=False)[:300])
if "awayTeam" in result:
    at = result["awayTeam"]
    print("awayTeam:", json.dumps(at, ensure_ascii=False)[:300])

# Also check if the game is in live-results
print("\n--- live-results check ---")
lr_path = f"data/teams/KIA/live-results.json"
if os.path.exists(lr_path):
    lr = json.load(open(lr_path))
    print(f"KIA live-results has {len(lr)} entries")
    for dt, entries in lr.items():
        if dt.startswith("2024-10"):
            print(f"  {dt}: {json.dumps(entries, ensure_ascii=False)[:200]}")
