/**
 * `data/...` 경로는 항상 이 파일(js/) 기준 상위 폴더의 JSON을 가리킵니다.
 * (HTML을 서브경로에 두거나 file로 열 때 `fetch(path)`만 쓰면 경로가 어긋나는 경우를 줄입니다.)
 */
function timeoutSignal(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
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

export const loadLineup = (teamId) => loadTeamFile(teamId, "lineup.json");
export const loadGamePreview = (teamId) => loadTeamFile(teamId, "game-preview.json");
export const loadLiveResults = (teamId) => loadTeamFile(teamId, "live-results.json");
export const loadSchedule = () => loadJson("data/kbo_schedule_2026.json");
export const loadStandings = () => loadJson("data/kbo_standings.json");
export const loadFoodPlaces = () => loadJson("data/food-places.json");
export const loadFoodLayouts = () => loadJson("data/food-layouts.json");
export const loadStadiumSurroundings = () => loadJson("data/stadium-surroundings.json");
