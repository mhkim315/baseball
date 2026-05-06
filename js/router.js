import { DEFAULT_TEAM_ID, SITE_TITLE, TEAMS, getTeamById } from "./team-config.js";
import { renderBottomTab } from "./bottom-tab.js";

const SELECTED_TEAM_STORAGE_KEY = "baseball-refac-selected-team";

export function isValidTeamId(teamId) {
  return TEAMS.some((team) => team.id === teamId);
}

function storedTeamId() {
  try {
    const saved = window.localStorage?.getItem(SELECTED_TEAM_STORAGE_KEY);
    return saved && isValidTeamId(saved) ? saved : "";
  } catch {
    return "";
  }
}

function rememberTeamId(teamId) {
  if (!isValidTeamId(teamId)) return;
  try {
    window.localStorage?.setItem(SELECTED_TEAM_STORAGE_KEY, teamId);
  } catch {
    // localStorage may be unavailable in some privacy modes.
  }
}

export function selectedTeamId() {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get("team") || "").trim().toLowerCase();
  if (raw && isValidTeamId(raw)) return raw;
  return storedTeamId() || DEFAULT_TEAM_ID;
}

export function selectedTeam() {
  return getTeamById(selectedTeamId());
}

export function pageUrl(href, teamId, extraParams) {
  const url = new URL(href, window.location.href);
  if (teamId) url.searchParams.set("team", teamId);
  for (const [key, value] of Object.entries(extraParams || {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, value);
  }
  return `${url.pathname.split("/").pop()}${url.search}`;
}

export function showError(message) {
  const el = document.getElementById("load-error");
  if (!el) return;
  el.textContent = message;
}

export function updatePageTitle(suffix) {
  const team = selectedTeam();
  rememberTeamId(team.id);
  const titleEl = document.getElementById("site-title");
  if (titleEl) titleEl.textContent = SITE_TITLE;
  document.title = suffix ? `${SITE_TITLE} · ${team.teamShort} · ${suffix}` : `${SITE_TITLE} · ${team.teamShort}`;
}

export function initPage(suffix) {
  updatePageTitle(suffix);
  renderBottomTab();
  return selectedTeam();
}
