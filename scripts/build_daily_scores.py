"""모든 팀의 live-results.json을 읽어 날짜별 경기 점수 + 승패 정보를 data/daily-scores.json 으로 집계"""
from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KST = timezone(timedelta(hours=9))


def load_json(path: str):
    with open(ROOT / path, encoding="utf-8") as f:
        return json.load(f)


def main():
    index = load_json("data/teams/index.json")
    team_ids = [t["id"] for t in index["teams"]]

    scores_by_date = {}  # date -> { matchup_key -> result }

    for team_id in team_ids:
        try:
            data = load_json(f"data/teams/{team_id}/live-results.json")
        except (FileNotFoundError, json.JSONDecodeError):
            continue

        for date, day_data in (data.get("byDate") or {}).items():
            for game in day_data.get("games") or []:
                key = f"{game['away']}|{game['home']}"
                if date not in scores_by_date:
                    scores_by_date[date] = {}
                if key not in scores_by_date[date]:
                    scores_by_date[date][key] = {
                        "away": game["away"],
                        "home": game["home"],
                        "awayScore": game.get("awayScore"),
                        "homeScore": game.get("homeScore"),
                        "outcome": game.get("outcome"),
                        "cancelled": game.get("cancelled", False),
                        "awayStarter": game.get("awayStarter"),
                        "homeStarter": game.get("homeStarter"),
                        "winPitcher": game.get("winPitcher"),
                        "losePitcher": game.get("losePitcher"),
                    }

    # Convert to sorted list
    out = {
        "generatedAt": datetime.now(KST).isoformat(),
        "dates": {date: list(games.values()) for date, games in sorted(scores_by_date.items())},
    }

    out_path = ROOT / "data" / "daily-scores.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} ({len(out['dates'])} dates with scores)")


if __name__ == "__main__":
    main()
