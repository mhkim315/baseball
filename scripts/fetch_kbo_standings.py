"""Naver API에서 현재 KBO 순위 데이터를 가져와 data/kbo_standings.json 갱신."""
from __future__ import annotations

import json
import ssl
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "data" / "kbo_standings.json"
NAVER_URL = "https://api-gw.sports.naver.com/statistics/categories/kbo/seasons/2026/teams"
KST = timezone(timedelta(hours=9))


def main():
    req = urllib.request.Request(NAVER_URL, headers={"Accept": "application/json", "User-Agent": "baseball-refac/1.0"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    if data.get("code") != 200 or not data.get("success"):
        print("API returned error")
        return

    teams = data.get("result", {}).get("seasonTeamStats", [])
    rows = []
    for t in sorted(teams, key=lambda x: x["ranking"]):
        w = t["winGameCount"]
        d = t["drawnGameCount"]
        l = t["loseGameCount"]
        rows.append({
            "rank": t["ranking"],
            "teamName": t["teamName"],
            "winRate": round(t["wra"], 3),
            "wlt": f"{w}승{d}무{l}패",
            "gamesBehind": round(float(t.get("gameBehind", 0)), 1),
            "streak": t.get("continuousGameResult", ""),
        })

    out = {
        "source": "Naver API / statistics/categories/kbo/seasons/2026/teams",
        "fetchedAt": datetime.now(KST).isoformat(timespec="seconds"),
        "rows": rows,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated standings ({len(rows)} teams) -> {OUT_PATH}")


if __name__ == "__main__":
    main()
