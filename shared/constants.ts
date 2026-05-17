export const TEAM_NAME_TO_ID: Record<string, string> = {
  "KT": "kt", "LG": "lg", "삼성": "samsung", "SSG": "ssg",
  "KIA": "kia", "두산": "doosan", "한화": "hanwha", "NC": "nc",
  "롯데": "lotte", "키움": "kiwoom",
};

export const TEAM_ID_TO_CODE: Record<string, string> = {
  "doosan": "OB", "lg": "LG", "kiwoom": "WO", "ssg": "SK",
  "kt": "KT", "hanwha": "HH", "samsung": "SS", "kia": "HT",
  "lotte": "LT", "nc": "NC",
};

const CODE_TO_ID: Record<string, string> = {};
for (const [id, code] of Object.entries(TEAM_ID_TO_CODE)) {
  CODE_TO_ID[code] = id;
}

/**
 * Parse game_id "YYYYMMDD-ABCD-N" → { awayId, homeId }
 * where first 2 chars of ABCD = away team code, last 2 = home team code.
 */
export function parseGameTeamIds(gameId: string): { awayId: string; homeId: string } {
  const m = gameId.match(/^\d+-(\w{4})-\d+$/);
  if (m) {
    return {
      awayId: CODE_TO_ID[m[1].slice(0, 2)] || "",
      homeId: CODE_TO_ID[m[1].slice(2, 4)] || "",
    };
  }
  return { awayId: "", homeId: "" };
}

/** Unified 승/무/패 badge colors used across all diary components */
export function getWinBadge(isWin: number | null): { label: string; color: string } | null {
  if (isWin === 1) return { label: "승", color: "#22c55e" };
  if (isWin === 0) return { label: "무", color: "#d97706" };
  if (isWin === -1) return { label: "패", color: "#ef4444" };
  return null;
}
