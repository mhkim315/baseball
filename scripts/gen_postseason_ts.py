"""Convert postseason JSON data to TypeScript for postseasonData.ts"""
import json, sys

TEAM_SHORT = {
    "KT": "KT", "두산": "두산", "LG": "LG", "삼성": "삼성",
    "KIA": "KIA", "SSG": "SSG", "NC": "NC", "롯데": "롯데",
    "한화": "한화", "키움": "키움", "SK": "SSG",
}

# Special: Naver uses "OB" for 두산 in game IDs but "두산" in names
# "HT" = KIA, "SS" = 삼성, "WO" = 키움, "SK" = SSG, "LT" = 롯데, "HH" = 한화

def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def is_postseason_game(g):
    """Determine if a game is postseason (not regular season, not unplayed)."""
    dt = g["date"]
    month = int(dt[5:7])
    day = int(dt[8:10])
    status = g.get("statusCode", "")
    away = g["away"]
    home = g["home"]

    # Skip unplayed games
    if status == "BEFORE":
        return False

    # 2024: Postseason starts Oct 2 (WC)
    if "2024" in dt:
        if month == 10 and day >= 2 and status == "RESULT":
            # Oct 2+ with RESULT = postseason
            return True

    # 2025: Postseason starts Oct 1 is regular season
    # Games from Oct 2+ are postseason
    if "2025" in dt:
        if month == 10 and day >= 2 and status == "RESULT":
            return True
        # Also include Oct 1 games if they have RESULT... wait, Oct 1 2025 has 3 games
        # Let me check - the 2025 season ended Sep 30, so Oct 1 is postseason start
        # Actually need to check the game ID prefix for 2025

    return False

def is_oct1_regular(g):
    """Oct 1 games are regular season (last regular season day)."""
    return g["date"].endswith("-10-01")

def transform_to_score_entry(g):
    """Convert JSON game to ScoreEntry format."""
    return {
        "away": g["away"],
        "home": g["home"],
        "awayScore": g["awayScore"],
        "homeScore": g["homeScore"],
        "outcome": "W",
        "cancelled": False,
        "winPitcher": g["winPitcher"],
        "losePitcher": g["losePitcher"],
        "gameIdx": 0,
    }

def transform_to_schedule_entry(year, g):
    """Convert JSON game to ScheduleGame format."""
    dt = g["date"]
    return {
        "date": dt,
        "month": int(dt[5:7]),
        "day": int(dt[8:10]),
        "venue": g["venue"],
        "away": g["away"],
        "home": g["home"],
        "time": g["time"] or "18:30",
        "isPostseason": True,
    }

def generate_ts(data_by_year):
    """Generate TypeScript content. data_by_year: list of (year, games_list) tuples."""
    lines = []
    lines.append('import type { ScoreEntry, ScheduleGame } from "./api";')
    lines.append('')
    lines.append('// ============================================================')
    lines.append('// KBO 포스트시즌 (가을야구) 경기 데이터')
    lines.append('// ============================================================')
    lines.append('// 포함: 와일드카드 결정전, 준플레이오프, 플레이오프, 한국시리즈')
    lines.append('// ============================================================')
    lines.append('')
    lines.append('// Schedule entries for postseason games (merged by gameCache into schedule data)')
    lines.append('export const POSTSEASON_SCHEDULE: Record<string, ScheduleGame[]> = {')

    # Group by year:month
    for year, games in data_by_year:
        by_month = {}
        for g in games:
            m = g["date"][5:7]
            key = f"{year}:{int(m)}"
            if key not in by_month:
                by_month[key] = []
            by_month[key].append(transform_to_schedule_entry(year, g))

        for key in sorted(by_month.keys()):
            entries = by_month[key]
            lines.append(f'  "{key}": [')
            for e in entries:
                lines.append(f'    {{ date: "{e["date"]}", month: {e["month"]}, day: {e["day"]}, venue: "{e["venue"]}", away: "{e["away"]}", home: "{e["home"]}", time: "{e["time"]}", isPostseason: true }},')
            lines.append('  ],')

    lines.append('};')
    lines.append('')
    lines.append('// Score entries for postseason games')
    lines.append('export const POSTSEASON_SCORES: Record<string, ScoreEntry[]> = {')

    for year, games in data_by_year:
        by_date = {}
        for g in games:
            d = g["date"]
            if d not in by_date:
                by_date[d] = []
            by_date[d].append(transform_to_score_entry(g))

        for d in sorted(by_date.keys()):
            entries = by_date[d]
            lines.append(f'  "{d}": [')
            for e in entries:
                wp = e["winPitcher"] or "null"
                lp = e["losePitcher"] or "null"
                if e["winPitcher"]:
                    lines.append(f'    {{ away: "{e["away"]}", home: "{e["home"]}", awayScore: {e["awayScore"]}, homeScore: {e["homeScore"]}, outcome: "W", cancelled: false, winPitcher: "{wp}", losePitcher: "{lp}", gameIdx: 0 }},')
                else:
                    lines.append(f'    {{ away: "{e["away"]}", home: "{e["home"]}", awayScore: {e["awayScore"]}, homeScore: {e["homeScore"]}, outcome: "W", cancelled: false, winPitcher: null, losePitcher: null, gameIdx: 0 }},')
            lines.append('  ],')

    lines.append('};')
    lines.append('')
    return '\n'.join(lines)

if __name__ == "__main__":
    # Usage: python gen_postseason_ts.py <year.json>... [output.ts]
    import re
    json_paths = [a for a in sys.argv[1:] if a.endswith(".json")]
    non_json = [a for a in sys.argv[1:] if not a.endswith(".json")]
    out = non_json[0] if non_json else "postseason_output.ts"

    if not json_paths:
        print("Usage: python gen_postseason_ts.py <year.json>... [output.ts]", file=sys.stderr)
        sys.exit(1)

    data_by_year = []
    for path in json_paths:
        year_match = re.search(r'(\d{4})', os.path.basename(path))
        if not year_match:
            print(f"Cannot determine year from {path}, skipping", file=sys.stderr)
            continue
        year = int(year_match.group(1))
        raw = read_json(path)

        # Filter: exclude Oct 1 regular season games and BEFORE status games
        postseason = [g for g in raw if is_postseason_game(g) and not is_oct1_regular(g)]

        print(f"{year}: {len(postseason)} postseason games (filtered from {len(raw)})")
        for g in postseason:
            print(f"  {g['date']} {g['away']} {g['awayScore']}-{g['homeScore']} {g['home']} WP:{g['winPitcher']}")
        data_by_year.append((year, postseason))

    ts = generate_ts(data_by_year)
    with open(out, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"\nTypeScript written to {out}")
