import { loadLiveResults, loadSchedule, loadStandings } from "./data-loader.js";
import { initShell, showError } from "./router.js";
import { escapeHtml } from "./escape.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function gamesForTeam(schedule, teamName) {
  const byTeam = schedule?.byTeam?.[teamName];
  if (Array.isArray(byTeam)) return byTeam;
  return (schedule?.games || [])
    .filter((game) => game.away === teamName || game.home === teamName)
    .map((game) => ({ ...game, opp: game.away === teamName ? game.home : game.away }));
}

function matchupKey(game) {
  return `${game.away}|${game.home}`;
}

function matchupOrdinalForGame(games, index) {
  const game = games[index];
  if (!game) return 0;
  const key = matchupKey(game);
  let ordinal = 0;
  for (let i = 0; i < index; i += 1) {
    if (matchupKey(games[i]) === key) ordinal += 1;
  }
  return ordinal;
}

function isDoubleHeaderGame(games, index) {
  const game = games[index];
  if (!game) return false;
  const key = matchupKey(game);
  return games.filter((item) => matchupKey(item) === key).length > 1;
}

function resultFor(live, date, game, matchupOrdinal = 0) {
  const rows = live?.byDate?.[date]?.games || [];
  const matches = rows.filter((row) => row.away === game.away && row.home === game.home);
  if (!matches.length) return null;
  return matches[Math.min(Math.max(matchupOrdinal, 0), matches.length - 1)] || matches[0] || null;
}

function resultScoreLabel(result) {
  if (!result) return "";
  if (result.cancelled) return "취소";
  return result.ourScoreLine || "결과";
}

function hasDisplayResult(result) {
  return Boolean(result?.cancelled || result?.outcome);
}

function dayResultBadge(results) {
  const completed = results.filter((result) => result && !result.cancelled && result.outcome);
  if (results.length && results.every((result) => result?.cancelled)) {
    return { text: "취", className: "calendar-result-badge--cancel" };
  }
  if (!completed.length) return null;
  if (completed.every((result) => result.outcome === "W")) return { text: "승", className: "calendar-result-badge--win" };
  if (completed.every((result) => result.outcome === "L")) return { text: "패", className: "calendar-result-badge--loss" };
  if (completed.every((result) => result.outcome === "T")) return { text: "무", className: "calendar-result-badge--tie" };
  return { text: "분", className: "calendar-result-badge--split" };
}

function dayResultClass(results) {
  const completed = results.filter((result) => result && !result.cancelled && result.outcome);
  if (results.length && results.every((result) => result?.cancelled)) return "calendar-cell--cancel-day";
  if (!completed.length) return "";
  if (completed.every((result) => result.outcome === "W")) return "calendar-cell--win-day";
  if (completed.every((result) => result.outcome === "L")) return "calendar-cell--loss-day";
  if (completed.every((result) => result.outcome === "T")) return "calendar-cell--tie-day";
  return "calendar-cell--split-day";
}

function resultClass(result) {
  if (!result) return "";
  if (result.cancelled) return "calendar-game--result-cancel";
  if (result.outcome === "W") return "calendar-game--result-win";
  if (result.outcome === "L") return "calendar-game--result-loss";
  if (result.outcome === "T") return "calendar-game--result-tie";
  return "";
}

function ymd(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function renderWeekdays() {
  const root = document.getElementById("calendar-weekdays");
  if (!root || root.childElementCount) return;
  for (const day of WEEKDAYS) {
    const el = document.createElement("div");
    el.textContent = day;
    root.appendChild(el);
  }
}

function renderCalendar(state) {
  const { year, monthIndex, gamesByDate, live, team } = state;
  const title = document.getElementById("calendar-current-month");
  const grid = document.getElementById("calendar-grid");
  if (!grid || !title) return;
  title.textContent = `${year}년 ${monthIndex + 1}월`;
  grid.innerHTML = "";

  const firstDow = new Date(year, monthIndex, 1).getDay();
  const totalDays = daysInMonth(year, monthIndex);
  for (let i = 0; i < firstDow; i += 1) {
    const pad = document.createElement("div");
    pad.className = "calendar-cell calendar-cell--pad";
    grid.appendChild(pad);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = ymd(year, monthIndex, day);
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    const dateEl = document.createElement("div");
    dateEl.className = "calendar-date";
    const dayNumber = document.createElement("span");
    dayNumber.textContent = String(day);
    dateEl.appendChild(dayNumber);
    cell.appendChild(dateEl);

    const games = gamesByDate.get(date) || [];
    const results = games.map((game, index) => resultFor(live, date, game, matchupOrdinalForGame(games, index))).filter(Boolean);
    if (games.length) {
      cell.classList.add("calendar-cell--game");
      if (games.some((game) => game.home === team.scheduleName)) cell.classList.add("calendar-cell--home-day");
      if (games.some((game) => game.away === team.scheduleName)) cell.classList.add("calendar-cell--away-day");
      const dayClass = dayResultClass(results);
      if (dayClass) cell.classList.add(dayClass);
      const resultBadge = dayResultBadge(results);
      if (resultBadge) {
        const badge = document.createElement("span");
        badge.className = `calendar-result-badge ${resultBadge.className}`;
        badge.textContent = resultBadge.text;
        dateEl.appendChild(badge);
      }
      if (games.some((_, index) => isDoubleHeaderGame(games, index))) {
        cell.classList.add("calendar-cell--dh");
        const badge = document.createElement("span");
        badge.className = "calendar-dh-badge";
        badge.textContent = "DH";
        badge.title = "더블헤더";
        dateEl.appendChild(badge);
      }
    }
    for (let index = 0; index < games.length; index += 1) {
      const game = games[index];
      const matchupOrdinal = matchupOrdinalForGame(games, index);
      const result = resultFor(live, date, game, matchupOrdinal);
      const hasResult = hasDisplayResult(result);
      const item = document.createElement("div");
      const isHome = game.home === team.scheduleName;
      const isDh = isDoubleHeaderGame(games, index);
      item.className = [
        "calendar-game",
        isHome ? "calendar-game--home" : "calendar-game--away",
        isDh ? "calendar-game--dh" : "",
        resultClass(result),
      ].filter(Boolean).join(" ");
      const opponent = game.opp || (isHome ? game.away : game.home);
      const prefix = isDh ? `${matchupOrdinal + 1}차 ` : "";
      const main = document.createElement("span");
      main.className = "calendar-game-main";
      main.textContent = `${prefix}${opponent}`;
      const meta = document.createElement("span");
      meta.className = "calendar-game-meta";
      meta.textContent = hasResult ? resultScoreLabel(result) : game.venue || "경기장 미정";
      item.append(main, meta);
      cell.appendChild(item);
    }
    grid.appendChild(cell);
  }
}

function initialMonth(games) {
  const today = new Date();
  const dates = games.map((game) => game.date).filter(Boolean).sort();
  const todayKey = today.toISOString().slice(0, 10);
  const upcoming = dates.find((date) => date >= todayKey) || dates[0] || todayKey;
  const d = new Date(`${upcoming}T00:00:00+09:00`);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

function renderSchedule(schedule, live, team) {
  renderWeekdays();
  const games = gamesForTeam(schedule, team.scheduleName);
  const gamesByDate = new Map();
  for (const game of games) {
    const bucket = gamesByDate.get(game.date) || [];
    bucket.push(game);
    gamesByDate.set(game.date, bucket);
  }

  const state = { ...initialMonth(games), gamesByDate, live, team };
  document.getElementById("prev-month")?.addEventListener("click", () => {
    state.monthIndex -= 1;
    if (state.monthIndex < 0) {
      state.monthIndex = 11;
      state.year -= 1;
    }
    renderCalendar(state);
  });
  document.getElementById("next-month")?.addEventListener("click", () => {
    state.monthIndex += 1;
    if (state.monthIndex > 11) {
      state.monthIndex = 0;
      state.year += 1;
    }
    renderCalendar(state);
  });
  renderCalendar(state);
}

function compactWlt(value) {
  const text = String(value || "");
  const match = text.match(/(\d+)승\s*(\d+)무\s*(\d+)패/);
  if (!match) return text;
  return `${match[1]}·${match[2]}·${match[3]}`;
}

function renderStandings(standings, team) {
  const tbody = document.querySelector("#standings-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (const row of standings?.rows || []) {
    const tr = document.createElement("tr");
    if (row.teamName === team.scheduleName) tr.setAttribute("aria-current", "true");
    tr.innerHTML = `<td>${escapeHtml(String(row.rank || ""))}</td><td>${escapeHtml(row.teamName || "")}</td><td>${escapeHtml(String(row.winRate || ""))}</td><td class="standings-wlt">${escapeHtml(compactWlt(row.wlt))}</td><td>${escapeHtml(String(row.gamesBehind || ""))}</td><td>${escapeHtml(row.streak || "")}</td>`;
    tbody.appendChild(tr);
  }
}

function setActiveScheduleTab(tab, { updateUrl = true } = {}) {
  const activeTab = tab === "standings" ? "standings" : "schedule";
  for (const button of document.querySelectorAll("[data-schedule-tab]")) {
    button.setAttribute("aria-selected", button.dataset.scheduleTab === activeTab ? "true" : "false");
  }
  document.getElementById("schedule-panel").hidden = activeTab !== "schedule";
  document.getElementById("standings-panel").hidden = activeTab !== "standings";
  if (updateUrl) {
    const url = new URL(window.location.href);
    if (activeTab !== "schedule") url.searchParams.set("view", activeTab);
    else url.searchParams.delete("view");
    history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
  }
}

function bindScheduleTabs() {
  for (const button of document.querySelectorAll("[data-schedule-tab]")) {
    button.addEventListener("click", () => setActiveScheduleTab(button.dataset.scheduleTab));
  }
  const initialView = new URLSearchParams(window.location.search).get("view");
  setActiveScheduleTab(initialView === "standings" ? "standings" : "schedule", { updateUrl: false });
}

async function main() {
  const team = initShell("schedule", "일정·순위");
  try {
    const [schedule, live, standings] = await Promise.all([loadSchedule(), loadLiveResults(team.id), loadStandings()]);
    document.getElementById("schedule-title").textContent = `${team.teamShort} 일정`;
    renderSchedule(schedule, live, team);
    renderStandings(standings, team);
    bindScheduleTabs();
  } catch (error) {
    console.error(error);
    showError("일정 또는 순위 데이터를 불러오지 못했습니다.");
  }
}

main();
