const API_BASE = "https://api.fullcount.kr";
const LOCAL_BASE = ""; // same-origin relative path (data/...)

function timeoutSignal(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    signal: timeoutSignal(20000),
  });
  if (!res.ok) throw new Error(`API ${path} 로드 실패 (${res.status})`);
  return res.json();
}

export async function loadJson(path) {
  const clean = String(path || "").replace(/^\/+/, "");
  if (!clean || clean.includes("..")) throw new Error(`loadJson: 허용되지 않는 경로 (${path})`);
  const url = new URL(`../${clean}`, import.meta.url).href;
  const res = await fetch(url, { cache: "no-store", signal: timeoutSignal(20000) });
  if (!res.ok) throw new Error(`${path} 로드 실패 (${res.status})`);
  return res.json();
}

export function loadTeamFile(teamId, fileName) {
  return loadJson(`data/teams/${teamId}/${fileName}`);
}

// ── API-based loaders (실시간 데이터) ────────────────────────

export const loadTodayGames = () => apiFetch("/today-games");
export const loadDailyScores = () => apiFetch("/daily-scores");
export const loadStandings = () => apiFetch("/standings/json");
export const loadSchedule = () => apiFetch("/schedule");

// ── Local file loaders (자주 안 바뀌는 데이터) ────────────────

export const loadLineup = (teamId) => loadTeamFile(teamId, "lineup.json");
export const loadGameRecord = (teamId, date) => loadTeamFile(teamId, `game-records/${date}.json`);
export const loadGamePreview = (teamId) => loadTeamFile(teamId, "game-preview.json");
export const loadLiveResults = (teamId) => loadTeamFile(teamId, "live-results.json");
export const loadFoodPlaces = () => loadJson("data/food-places.json");
export const loadFoodLayouts = () => loadJson("data/food-layouts.json");
export const loadStadiumSurroundings = () => loadJson("data/stadium-surroundings.json");
export const loadStadiumEats = () => loadJson("data/stadium-eats.json");
export const loadStadiumBrief = () => loadJson("data/stadium-brief.json");
