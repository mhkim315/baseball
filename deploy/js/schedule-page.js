import { loadSchedule, loadDailyScores } from "./data-loader.js";
import { initPage, selectedTeamId, showError } from "./router.js";
import { TEAMS } from "./team-config.js";
import { escapeHtml } from "./escape.js";
import { renderBottomTab } from "./bottom-tab.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// ── calendar ──────────────────────────────────────────────

function gamesForTeam(schedule, teamName) {
  const byTeam = schedule?.byTeam?.[teamName];
  if (Array.isArray(byTeam)) return byTeam;
  return (schedule?.games || [])
    .filter((g) => g.away === teamName || g.home === teamName)
    .map((g) => ({ ...g, opp: g.away === teamName ? g.home : g.away }));
}

function matchupKey(game) {
  return `${game.away}|${game.home}`;
}

function isDoubleHeaderGame(games, index) {
  const game = games[index];
  if (!game) return false;
  const key = matchupKey(game);
  return games.filter((item) => matchupKey(item) === key).length > 1;
}

function matchupOrdinalForGame(games, index) {
  const game = games[index];
  if (!game) return 0;
  const key = matchupKey(game);
  let ordinal = 0;
  for (let i = 0; i < index; i++) {
    if (matchupKey(games[i]) === key) ordinal += 1;
  }
  return ordinal;
}

function ymd(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function initialMonth(games) {
  const today = new Date();
  const dates = games.map((g) => g.date).filter(Boolean).sort();
  const todayKey = today.toISOString().slice(0, 10);
  const upcoming = dates.find((d) => d >= todayKey) || dates[0] || todayKey;
  const d = new Date(`${upcoming}T00:00:00+09:00`);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
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
  const { year, monthIndex, gamesByDate, teamName, dailyScores } = state;
  const title = document.getElementById("calendar-current-month");
  const grid = document.getElementById("calendar-grid");
  if (!grid || !title) return;
  title.textContent = `${year}년 ${monthIndex + 1}월`;
  grid.innerHTML = "";

  const firstDow = new Date(year, monthIndex, 1).getDay();
  const totalDays = daysInMonth(year, monthIndex);
  for (let i = 0; i < firstDow; i++) {
    const pad = document.createElement("div");
    pad.className = "calendar-cell calendar-cell--pad";
    grid.appendChild(pad);
  }

  for (let day = 1; day <= totalDays; day++) {
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
    if (games.length) {
      cell.classList.add("calendar-cell--game");
      if (games.some((g) => g.home === teamName)) cell.classList.add("calendar-cell--home-day");
      if (games.some((g) => g.away === teamName)) cell.classList.add("calendar-cell--away-day");
      if (games.some((_, i) => isDoubleHeaderGame(games, i))) {
        cell.classList.add("calendar-cell--dh");
        const badge = document.createElement("span");
        badge.className = "calendar-dh-badge";
        badge.textContent = "DH";
        badge.title = "더블헤더";
        dateEl.appendChild(badge);
      }
    }
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const isDh = isDoubleHeaderGame(games, i);
      const isHome = game.home === teamName;
      const item = document.createElement("div");

      // 승패 결과 조회 — 실제 점수로 판정 (daily-scores의 outcome은 팀 순서에 따라 달라짐)
      const scoreData = dailyScores?.dates?.[date]?.find(
        (s) => s.away === game.away && s.home === game.home
      );
      let resultClass = "";
      if (scoreData) {
        if (scoreData.cancelled) {
          resultClass = "calendar-game--result-cancel";
        } else if (scoreData.awayScore != null && scoreData.homeScore != null) {
          const homeWon = scoreData.homeScore > scoreData.awayScore;
          const tied = scoreData.homeScore === scoreData.awayScore;
          if (tied) {
            resultClass = "calendar-game--result-tie";
          } else if (isHome) {
            resultClass = homeWon ? "calendar-game--result-win" : "calendar-game--result-loss";
          } else {
            resultClass = homeWon ? "calendar-game--result-loss" : "calendar-game--result-win";
          }
        }
      }

      item.className = ["calendar-game", isHome ? "calendar-game--home" : "calendar-game--away", isDh ? "calendar-game--dh" : "", resultClass].filter(Boolean).join(" ");
      const awayShort = game.away || "";
      const homeShort = game.home || "";
      const line = isHome ? awayShort : homeShort;
      const prefix = isDh ? `${matchupOrdinalForGame(games, i) + 1}차 ` : "";
      const main = document.createElement("span");
      main.className = "calendar-game-main";
      main.textContent = `${prefix}${line}`;
      const meta = document.createElement("span");
      meta.className = "calendar-game-meta";

      if (scoreData?.outcome) {
        const scoreText = `${scoreData.awayScore}:${scoreData.homeScore}`;
        const badgeClass = resultClass.includes("win") ? "calendar-result-badge--win" :
                           resultClass.includes("loss") ? "calendar-result-badge--loss" :
                           "calendar-result-badge--tie";
        meta.innerHTML = `<span class="calendar-result-badge ${badgeClass}">${escapeHtml(scoreText)}</span> ${escapeHtml(game.venue || "")}`;
      } else if (scoreData?.cancelled) {
        meta.textContent = "취소";
      } else {
        meta.textContent = game.venue || "경기장 미정";
      }

      item.append(main, meta);
      cell.appendChild(item);
    }
    grid.appendChild(cell);
  }
}

function renderScheduleView(schedule, currentTeamId, dailyScores) {
  renderWeekdays();
  const team = TEAMS.find((t) => t.id === currentTeamId);
  const games = team ? gamesForTeam(schedule, team.scheduleName) : [];
  const gamesByDate = new Map();
  for (const game of games) {
    const bucket = gamesByDate.get(game.date) || [];
    bucket.push(game);
    gamesByDate.set(game.date, bucket);
  }
  const state = { ...initialMonth(games), gamesByDate, teamName: team?.scheduleName || null, dailyScores };
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");
  const go = () => renderCalendar(state);
  if (prevBtn) { prevBtn.replaceWith(prevBtn.cloneNode(true)); document.getElementById("prev-month")?.addEventListener("click", () => { state.monthIndex -= 1; if (state.monthIndex < 0) { state.monthIndex = 11; state.year -= 1; } go(); }); }
  if (nextBtn) { nextBtn.replaceWith(nextBtn.cloneNode(true)); document.getElementById("next-month")?.addEventListener("click", () => { state.monthIndex += 1; if (state.monthIndex > 11) { state.monthIndex = 0; state.year += 1; } go(); }); }
  go();
}

// ── team filter ───────────────────────────────────────────

function renderTeamFilter(currentTeamId) {
  const root = document.getElementById("team-filter");
  if (!root) return;
  root.innerHTML = "";
  for (const team of TEAMS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = team.buttonLabel;
    btn.dataset.teamId = team.id;
    btn.setAttribute("aria-pressed", team.id === currentTeamId ? "true" : "false");
    btn.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("team", team.id);
      history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
      window.location.reload();
    });
    root.appendChild(btn);
  }
}

// ── main ──────────────────────────────────────────────────

async function main() {
  const currentTeamId = selectedTeamId();
  initPage("경기일정");
  renderTeamFilter(currentTeamId);
  renderBottomTab();

  try {
    const schedule = await loadSchedule();
    let dailyScores;
    try { dailyScores = await loadDailyScores(); } catch { /* ignore */ }
    renderScheduleView(schedule, currentTeamId, dailyScores);
  } catch (error) {
    console.error(error);
    showError("일정 데이터를 불러오지 못했습니다.");
  }
}

main();
