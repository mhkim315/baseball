import { DEFAULT_TEAM_ID, SITE_TITLE, TEAMS, getTeamById } from "./team-config.js";

export const PAGES = [
  { id: "lineup", label: "라인업", href: "index.html" },
  { id: "stadium", label: "구장안내", href: "stadium-guide.html", extraParams: { tab: "seats" } },
  { id: "cheering", label: "응원", href: "cheering.html" },
  { id: "schedule", label: "일정·순위", href: "schedule-standings.html" },
];

const SELECTED_TEAM_STORAGE_KEY = "baseball-refac-selected-team";

function isValidTeamId(teamId) {
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

export function pageUrl(href, teamId = selectedTeamId(), extraParams = {}) {
  const url = new URL(href, window.location.href);
  url.searchParams.set("team", teamId);
  for (const [key, value] of Object.entries(extraParams)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, value);
  }
  return `${url.pathname.split("/").pop()}${url.search}`;
}

function currentPageName() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function currentPageExtraParams() {
  const params = new URLSearchParams(window.location.search);
  const page = currentPageName();
  const extra = {};
  if (page === "stadium-guide.html" && params.get("tab")) {
    extra.tab = params.get("tab");
  }
  if (page === "schedule-standings.html" && params.get("view")) {
    extra.view = params.get("view");
  }
  return extra;
}

function renderTeamSelector(team) {
  const root = document.getElementById("team-selector");
  if (!root) return;
  root.innerHTML = "";
  for (const item of TEAMS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.buttonLabel;
    button.dataset.teamId = item.id;
    button.setAttribute("aria-pressed", item.id === team.id ? "true" : "false");
    button.addEventListener("click", () => {
      rememberTeamId(item.id);
      window.location.assign(pageUrl(currentPageName(), item.id, currentPageExtraParams()));
    });
    root.appendChild(button);
  }
}

function renderPageNav(activePage, team) {
  const nav = document.getElementById("section-nav");
  if (!nav) return;
  nav.innerHTML = "";
  for (const page of PAGES) {
    const a = document.createElement("a");
    a.href = pageUrl(page.href, team.id, page.extraParams);
    a.textContent = page.label;
    a.addEventListener("click", (event) => {
      event.preventDefault();
      const activeTeamId = selectedTeamId();
      rememberTeamId(activeTeamId);
      window.location.assign(pageUrl(page.href, activeTeamId, page.extraParams));
    });
    if (page.id === activePage) a.setAttribute("aria-current", "page");
    nav.appendChild(a);
  }
}

export function initShell(activePage, titleSuffix = "") {
  const team = selectedTeam();
  rememberTeamId(team.id);
  const title = document.getElementById("site-title");
  const subtitle = document.getElementById("site-subtitle");
  if (title) title.textContent = SITE_TITLE;
  if (subtitle) {
    subtitle.textContent = "";
    subtitle.hidden = true;
  }
  document.title = titleSuffix ? `${SITE_TITLE} · ${team.teamShort} · ${titleSuffix}` : `${SITE_TITLE} · ${team.teamShort}`;
  renderTeamSelector(team);
  renderPageNav(activePage, team);
  return team;
}

export function showError(message) {
  const el = document.getElementById("load-error");
  if (!el) return;
  el.textContent = message;
}
