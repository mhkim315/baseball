import { loadSchedule, loadTodayGames, loadDailyScores } from "./data-loader.js";
import { initPage, showError, pageUrl } from "./router.js";
import { TEAMS } from "./team-config.js";
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

function shiftWeek(iso, delta) {
  const d = new Date(`${iso}T00:00:00+09:00`);
  d.setDate(d.getDate() + delta * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateShort(iso) {
  const d = new Date(`${iso}T00:00:00+09:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
  const weekLabel = document.getElementById("week-label");
  if (weekLabel) {
    weekLabel.textContent = `${formatDateShort(weekDates[0])} ~ ${formatDateShort(weekDates[6])}`;
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

function renderTodayGames() {
  const root = document.getElementById("daily-games");
  if (!root) return;
  root.innerHTML = "";

  const games = state.todayData?.games || [];
  if (!games.length) {
    root.innerHTML = '<p class="muted" style="text-align:center;padding:20px">오늘은 경기가 없습니다.</p>';
    return;
  }

  for (const g of games) {
    const card = document.createElement("article");
    card.className = "game-card panel";
    card.addEventListener("click", () => {
      window.location.assign(pageUrl("game-detail", g.home.id));
    });

    // matchup
    const matchup = document.createElement("div");
    matchup.className = "game-card-matchup";
    matchup.innerHTML = `
      <div class="game-card-team">
        <span class="game-card-role">원정</span>
        <span class="game-card-team-name">${escapeHtml(g.away.name)}</span>
      </div>
      <div class="game-card-vs">VS</div>
      <div class="game-card-team game-card-team--home">
        <span class="game-card-role">홈</span>
        <span class="game-card-team-name">${escapeHtml(g.home.name)}</span>
      </div>
    `;
    card.appendChild(matchup);

    const hasScore = g.score && (g.score.away != null || g.score.home != null);

    if (hasScore) {
      // 경기 종료: 점수만 (승패투수는 dailyScores에서)
      const scoreEl = document.createElement("div");
      scoreEl.className = "game-card-score";
      scoreEl.textContent = `${g.score.away ?? 0} : ${g.score.home ?? 0}`;
      card.appendChild(scoreEl);

      // dailyScores에서 승패투수 찾기
      const scoreData = findScoreData({ away: g.away.name, home: g.home.name, date: state.selectedDate });
      if (scoreData?.winPitcher || scoreData?.losePitcher) {
        const pitchers = document.createElement("div");
        pitchers.className = "game-card-pitchers";
        pitchers.innerHTML = `
          <span class="game-card-pitcher game-card-pitcher--small">승: ${escapeHtml(scoreData.winPitcher || "")}</span>
          <span class="game-card-pitcher-label"></span>
          <span class="game-card-pitcher game-card-pitcher--small">패: ${escapeHtml(scoreData.losePitcher || "")}</span>
        `;
        card.appendChild(pitchers);
      }

      const meta = document.createElement("div");
      meta.className = "game-card-meta";
      meta.textContent = g.venue || "경기장 미정";
      card.appendChild(meta);
    } else {
      // 경기 전: 선발투수 + 시간
      const pitchers = document.createElement("div");
      pitchers.className = "game-card-pitchers";
      pitchers.innerHTML = `
        <span class="game-card-pitcher">${escapeHtml(g.away.starter.name)}</span>
        <span class="game-card-pitcher-label">선발투수</span>
        <span class="game-card-pitcher">${escapeHtml(g.home.starter.name)}</span>
      `;
      card.appendChild(pitchers);

      const meta = document.createElement("div");
      meta.className = "game-card-meta";
      meta.textContent = [g.venue || "경기장 미정", g.time].filter(Boolean).join(" · ");
      card.appendChild(meta);
    }

    root.appendChild(card);
  }
}

function renderScheduleGames() {
  const root = document.getElementById("daily-games");
  if (!root) return;

  const games = gamesForDate(state.selectedDate);
  if (!games.length) {
    root.innerHTML = '<p class="muted" style="text-align:center;padding:20px">이 날은 경기가 없습니다.</p>';
    return;
  }

  root.innerHTML = "";

  for (const game of games) {
    const card = document.createElement("article");
    card.className = "game-card panel";

    const homeTeam = TEAMS.find((t) => t.scheduleName === game.home || t.teamShort === game.home);
    if (homeTeam) {
      card.addEventListener("click", () => {
        window.location.assign(pageUrl("game-detail", homeTeam.id));
      });
    }

    // matchup
    const matchup = document.createElement("div");
    matchup.className = "game-card-matchup";
    matchup.innerHTML = `
      <div class="game-card-team">
        <span class="game-card-role">원정</span>
        <span class="game-card-team-name">${escapeHtml(game.away)}</span>
      </div>
      <div class="game-card-vs">VS</div>
      <div class="game-card-team game-card-team--home">
        <span class="game-card-role">홈</span>
        <span class="game-card-team-name">${escapeHtml(game.home)}</span>
      </div>
    `;
    card.appendChild(matchup);

    const scoreData = findScoreData(game);
    const hasResult = scoreData && scoreData.awayScore != null && scoreData.homeScore != null && !scoreData.cancelled;

    if (hasResult) {
      // 지난 경기: 점수 + 승/패 투수
      const score = document.createElement("div");
      score.className = "game-card-score";
      score.textContent = `${scoreData.awayScore} : ${scoreData.homeScore}`;
      card.appendChild(score);

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

      const meta = document.createElement("div");
      meta.className = "game-card-meta";
      meta.textContent = game.venue || "경기장 미정";
      card.appendChild(meta);
    } else {
      // 미래 경기: 구장만 표시
      const meta = document.createElement("div");
      meta.className = "game-card-meta";
      meta.textContent = game.venue || "경기장 미정";
      card.appendChild(meta);
    }

    root.appendChild(card);
  }
}

function renderDailyGames() {
  if (isToday(state.selectedDate) && state.todayData?.games?.length) {
    renderTodayGames();
  } else {
    renderScheduleGames();
  }
}

// ── init ──────────────────────────────────────────────────

function bindDateNav() {
  document.getElementById("date-prev")?.addEventListener("click", () => {
    selectDate(shiftWeek(state.selectedDate, -1));
  });
  document.getElementById("date-next")?.addEventListener("click", () => {
    selectDate(shiftWeek(state.selectedDate, 1));
  });
}

async function main() {
  initPage("");
  renderBottomTab();

  try {
    const schedule = await loadSchedule();
    state.schedule = schedule;
    state.allDates = buildDates(schedule);

    try { state.todayData = await loadTodayGames(); } catch { /* noop */ }
    try { state.dailyScores = await loadDailyScores(); } catch { /* noop */ }

    const params = new URLSearchParams(window.location.search);
    const urlDate = params.get("date");
    const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const todayIso = `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(kst.getDate()).padStart(2, "0")}`;
    state.selectedDate = (urlDate && state.allDates.includes(urlDate)) ? urlDate : todayIso;

    renderDateSlider();
    renderDailyGames();
    bindDateNav();
  } catch (error) {
    console.error(error);
    showError("경기 데이터를 불러오지 못했습니다.");
  }
}

main();
