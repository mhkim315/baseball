from __future__ import annotations

import argparse
import json
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from team_config import ROOT, selected_teams, team_by_code

SCHEDULE_JSON = ROOT / "data" / "kbo_schedule_2026.json"
KBO_LIST_URL = "https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList"
KST = timezone(timedelta(hours=9))


def kst_today() -> str:
    return datetime.now(KST).date().isoformat()


def fetch_day(iso_date: str) -> list[dict[str, Any]]:
    body = urllib.parse.urlencode({"leId": 1, "srId": 0, "date": iso_date.replace("-", "")}).encode()
    req = urllib.request.Request(
        KBO_LIST_URL,
        data=body,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "Mozilla/5.0 (baseball-refac-local/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=30, context=ssl.create_default_context()) as resp:
        data = json.loads(resp.read().decode("utf-8", errors="replace"))
    if data.get("code") != "100":
        return []
    return list(data.get("game") or [])


def score_int(row: dict[str, Any], key: str) -> int:
    try:
        return int(str(row.get(key) or "0").strip() or "0")
    except ValueError:
        return 0


def cancelled(row: dict[str, Any]) -> bool:
    return str(row.get("CANCEL_SC_ID") or "0").strip() != "0"


def finished(row: dict[str, Any]) -> bool:
    # 종료 판정: 최종 스코어(SCORE_CK) + 상태 3(경기 종료). GAME_RESULT_CK는 API가 0으로 두는 경우가 있어 미사용.
    return str(row.get("SCORE_CK") or "") == "1" and str(row.get("GAME_STATE_SC") or "") == "3"


def entry_for_team(row: dict[str, Any], team: dict[str, Any]) -> dict[str, Any] | None:
    away_team = team_by_code(str(row.get("AWAY_ID") or ""))
    home_team = team_by_code(str(row.get("HOME_ID") or ""))
    if not away_team or not home_team:
        return None
    if team["id"] not in (away_team["id"], home_team["id"]):
        return None
    away_score = score_int(row, "T_SCORE_CN")
    home_score = score_int(row, "B_SCORE_CN")
    is_away = team["id"] == away_team["id"]
    our_score = away_score if is_away else home_score
    opp_score = home_score if is_away else away_score
    outcome = None
    if not cancelled(row) and finished(row):
        if our_score > opp_score:
            outcome = "W"
        elif our_score < opp_score:
            outcome = "L"
        else:
            outcome = "T"
    return {
        "away": away_team["scheduleName"],
        "home": home_team["scheduleName"],
        "venue": str(row.get("S_NM") or "").strip(),
        "awayScore": away_score,
        "homeScore": home_score,
        "scoreLine": f"{away_score}-{home_score}",
        "ourScore": our_score,
        "oppScore": opp_score,
        "ourScoreLine": f"{our_score}-{opp_score}",
        "outcome": outcome,
        "cancelled": cancelled(row),
        "gameId": row.get("G_ID"),
    }


def target_dates(args: argparse.Namespace) -> list[str]:
    if args.date:
        return sorted(set(args.date))
    if args.recent:
        today = datetime.now(KST).date()
        return [(today - timedelta(days=i)).isoformat() for i in range(args.recent - 1, -1, -1)]
    schedule = json.loads(SCHEDULE_JSON.read_text(encoding="utf-8"))
    return sorted({g["date"] for g in schedule.get("games", []) if g.get("date")})


def load_existing(team_id: str, team_name: str) -> dict[str, Any]:
    path = ROOT / "data" / "teams" / team_id / "live-results.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"team": team_name, "source": KBO_LIST_URL, "byDate": {}}


def main() -> None:
    ap = argparse.ArgumentParser(description="Fetch KBO results for one or all teams")
    ap.add_argument("--team", help="team id, e.g. doosan")
    ap.add_argument("--date", action="append", help="YYYY-MM-DD; can repeat")
    ap.add_argument("--recent", type=int, help='today 포함 최근 N일')
    ap.add_argument("--sleep", type=float, default=0.25)
    args = ap.parse_args()

    wanted = selected_teams(args.team)
    payloads = {team["id"]: load_existing(team["id"], team["scheduleName"]) for team in wanted}
    for ds in target_dates(args):
        try:
          rows = fetch_day(ds)
        except Exception as exc:
          print(f"{ds}: fetch failed: {exc}")
          continue
        for team in wanted:
            games = []
            for row in rows:
                item = entry_for_team(row, team)
                if item:
                    games.append(item)
            if games:
                payloads[team["id"]].setdefault("byDate", {})[ds] = {"games": games}
        time.sleep(args.sleep)

    fetched_at = datetime.now(KST).isoformat(timespec="seconds")
    for team in wanted:
        out = payloads[team["id"]]
        out.update({"team": team["scheduleName"], "source": KBO_LIST_URL, "fetchedAt": fetched_at})
        path = ROOT / "data" / "teams" / team["id"] / "live-results.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
