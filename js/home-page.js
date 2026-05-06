import { loadSchedule, loadTodayGames, loadDailyScores } from "./data-loader.js";
import { initPage, showError, pageUrl } from "./router.js";
import { TEAMS, getTeamByScheduleName } from "./team-config.js";
import { escapeHtml } from "./escape.js";
import { renderBottomTab } from "./bottom-tab.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

let state = {
  selectedDate: null,
  allDates: [],
  schedule: null,
  todayData: null,
  dailyScores: null,
};

// ── date helpers ──────────────────────────────────────────

function getWeekRange(iso) {
  const d = new Date(`${iso}T00:00:00+09:00`);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(`${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`);
  }
  return dates;
}

function weekOfMonth(iso) {
  const d = new Date(`${iso}T00:00:00+09:00`);
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  const adjusted = d.getDate() + monthStart.getDay();
  return Math.ceil(adjusted / 7);
}

function isToday(iso) {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const todayStr = `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(kst.getDate()).padStart(2, "0")}`;
  return iso === todayStr;
}

function buildDates(schedule) {
  const dates = new Set();
  for (const g of schedule?.games || []) {
    if (g.date) dates.add(g.date);
  }
  return [...dates].sort();
}

// ── date slider ───────────────────────────────────────────

function renderDateSlider() {
  const root = document.getElementById("date-slider");
  if (!root) return;

  const weekDates = getWeekRange(state.selectedDate);
  const midDate = weekDates[3];
  const wom = weekOfMonth(midDate);
  const d = new Date(`${midDate}T00:00:00+09:00`);
  const weekLabel = document.getElementById("week-label");
  if (weekLabel) {
    weekLabel.textContent = `${d.getMonth() + 1}월 ${wom}주차`;
  }

  root.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const date = weekDates[i];
    const d = new Date(`${date}T00:00:00+09:00`);
    const hasGames = state.allDates.includes(date);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "date-slider-item";
    if (!hasGames) btn.classList.add("date-slider-item--empty");
    if (date === state.selectedDate) btn.classList.add("date-slider-item--active");
    if (isToday(date)) btn.classList.add("date-slider-item--today");
    if (d.getDay() === 6) btn.classList.add("date-slider-item--sat");
    if (d.getDay() === 0) btn.classList.add("date-slider-item--sun");

    const dayLabel = document.createElement("span");
    dayLabel.className = "date-slider-day";
    dayLabel.textContent = WEEKDAYS[d.getDay()];

    const dateLabel = document.createElement("span");
    dateLabel.className = "date-slider-date";
    dateLabel.textContent = d.getDate();

    btn.appendChild(dayLabel);
    btn.appendChild(dateLabel);
    if (hasGames) {
      btn.addEventListener("click", () => selectDate(date));
    }
    root.appendChild(btn);
  }
}

function selectDate(date) {
  state.selectedDate = date;
  renderDateSlider();
  renderDailyGames();
  const url = new URL(window.location.href);
  url.searchParams.set("date", date);
  history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
}

// ── daily games ───────────────────────────────────────────

function gamesForDate(date) {
  return (state.schedule?.games || []).filter((g) => g.date === date);
}

function findScoreData(game) {
  if (!state.dailyScores) return null;
  const date = game.date || state.selectedDate;
  const dateScores = state.dailyScores.dates?.[date];
  if (!dateScores) return null;
  const awayName = typeof game.away === "string" ? game.away : game.away?.name || "";
  const homeName = typeof game.home === "string" ? game.home : game.home?.name || "";
  return dateScores.find((s) => s.away === awayName && s.home === homeName) || null;
}

function renderGameCard(root, game, scoreData, starters) {
  const card = document.createElement("article");
  card.className = "game-card panel";

  const awayName = typeof game.away === "string" ? game.away : game.away?.name || "";
  const homeName = typeof game.home === "string" ? game.home : game.home?.name || "";

  const homeTeam = TEAMS.find((t) => t.scheduleName === homeName || t.teamShort === homeName);
  const awayTeam = TEAMS.find((t) => t.scheduleName === awayName || t.teamShort === awayName);
  const homeId = homeTeam?.id || (typeof game.home === "object" && game.home?.id);

  // 팀 색상 그라데이션 배경 + 왼쪽 악센트
  const homeColor = homeTeam?.primaryColor;
  const awayColor = awayTeam?.primaryColor;
  if (homeColor && awayColor && homeColor !== awayColor) {
    card.style.background = `linear-gradient(135deg, ${awayColor}08 0%, transparent 40%, transparent 60%, ${homeColor}08 100%)`;
    card.style.borderLeft = `3px solid ${homeColor}`;
  } else if (homeColor) {
    card.style.background = `linear-gradient(135deg, transparent 0%, ${homeColor}06 50%, transparent 100%)`;
    card.style.borderLeft = `3px solid ${homeColor}`;
  }

  const hasResult = scoreData && scoreData.awayScore != null && scoreData.homeScore != null && !scoreData.cancelled && scoreData.outcome;

  if (homeId) {
    card.addEventListener("click", () => {
      const opts = {};
      if (hasResult) opts.date = game.date || state.selectedDate;
      window.location.assign(pageUrl("game-detail", homeId, opts));
    });
  }

  // matchup
  const matchup = document.createElement("div");
  matchup.className = "game-card-matchup";
  matchup.innerHTML = `
    <div class="game-card-team">
      <span class="game-card-role">원정</span>
      <span class="game-card-team-name" style="color:${awayColor || 'inherit'}">${escapeHtml(awayName)}</span>
    </div>
    <div class="game-card-vs">VS</div>
    <div class="game-card-team game-card-team--home">
      <span class="game-card-role">홈</span>
      <span class="game-card-team-name" style="color:${homeColor || 'inherit'}">${escapeHtml(homeName)}</span>
    </div>
  `;
  card.appendChild(matchup);

  if (hasResult) {
    // 경기 종료: 점수 + 승패투수
    const scoreEl = document.createElement("div");
    scoreEl.className = "game-card-score";
    scoreEl.textContent = `${scoreData.awayScore} : ${scoreData.homeScore}`;
    // 승리팀 색상 강조
    if (scoreData.outcome === "W" && homeColor) scoreEl.style.color = homeColor;
    else if (scoreData.outcome === "L" && awayColor) scoreEl.style.color = awayColor;
    card.appendChild(scoreEl);

    if (scoreData.winPitcher || scoreData.losePitcher) {
      const pitchers = document.createElement("div");
      pitchers.className = "game-card-pitchers";
      pitchers.innerHTML = `
        <span class="game-card-pitcher game-card-pitcher--small">승: ${escapeHtml(scoreData.winPitcher || "")}</span>
        <span class="game-card-pitcher-label"></span>
        <span class="game-card-pitcher game-card-pitcher--small">패: ${escapeHtml(scoreData.losePitcher || "")}</span>
      `;
      card.appendChild(pitchers);
    }
  } else if (starters) {
    // 경기 전: 선발투수
    const pitchers = document.createElement("div");
    pitchers.className = "game-card-pitchers";
    pitchers.innerHTML = `
      <span class="game-card-pitcher">${escapeHtml(starters.away || "미정")}</span>
      <span class="game-card-pitcher-label">선발투수</span>
      <span class="game-card-pitcher">${escapeHtml(starters.home || "미정")}</span>
    `;
    card.appendChild(pitchers);
  }

  const meta = document.createElement("div");
  meta.className = "game-card-meta";
  const metaParts = [];
  if (scoreData?.cancelled) {
    metaParts.push("취소");
  } else {
    metaParts.push(game.venue || "경기장 미정");
    if (!hasResult && game.time) metaParts.push(game.time);
  }
  meta.textContent = metaParts.join(" · ");
  card.appendChild(meta);

  root.appendChild(card);
}

function renderDailyGames() {
  const root = document.getElementById("daily-games");
  if (!root) return;

  const isTodayView = isToday(state.selectedDate);
  const todayGames = state.todayData?.games || [];

  let games;
  if (isTodayView && todayGames.length) {
    games = todayGames;
  } else {
    games = gamesForDate(state.selectedDate);
  }

  if (!games.length) {
    root.innerHTML = '<p class="muted" style="text-align:center;padding:20px">이 날은 경기가 없습니다.</p>';
    return;
  }

  root.innerHTML = "";
  for (const game of games) {
    const awayName = typeof game.away === "string" ? game.away : game.away?.name || "";
    const homeName = typeof game.home === "string" ? game.home : game.home?.name || "";
    const scoreData = findScoreData({ away: awayName, home: homeName, date: state.selectedDate });
    const hasResult = scoreData && scoreData.awayScore != null && scoreData.homeScore != null && !scoreData.cancelled && scoreData.outcome;

    // 경기 미완료시에만 선발투수 정보 표시
    let starters = null;
    if (!hasResult && isTodayView && todayGames.length) {
      const todayGame = todayGames.find(
        (tg) => (tg.away?.name === awayName || tg.away === awayName) &&
                (tg.home?.name === homeName || tg.home === homeName)
      );
      if (todayGame && todayGame.away?.starter) {
        starters = {
          away: todayGame.away.starter.name,
          home: todayGame.home.starter.name,
        };
      }
    }

    renderGameCard(root, game, scoreData, starters);
  }
}

// ── init ──────────────────────────────────────────────────

async function main() {
  initPage("");
  renderBottomTab();

  try {
    const schedule = await loadSchedule();
    state.schedule = schedule;
    state.allDates = buildDates(schedule);

    try { state.todayData = await loadTodayGames(); } catch { /* noop */ }
    try { state.dailyScores = await loadDailyScores(); } catch { /* noop */ }

    const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const todayIso = `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(kst.getDate()).padStart(2, "0")}`;
    state.selectedDate = todayIso;

    renderDateSlider();
    renderDailyGames();
  } catch (error) {
    console.error(error);
    showError("경기 데이터를 불러오지 못했습니다.");
  }
}

main();
