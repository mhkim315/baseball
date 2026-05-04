import { loadGamePreview, loadLineup } from "./data-loader.js";
import { initShell, showError } from "./router.js";
import { escapeHtml } from "./escape.js";

function fmtDate(iso) {
  if (!iso) return "일정 미정";
  const date = new Date(`${iso}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
}

function fmtGameDate(raw) {
  const value = String(raw || "");
  if (/^\d{8}$/.test(value)) return fmtDate(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`);
  return value || "날짜 미정";
}

function fmtSeasonWDL(row) {
  if (!row) return "—승 —무 —패";
  return `${row.w ?? "—"}승 ${row.d ?? 0}무 ${row.l ?? "—"}패`;
}

function fmtRecentPills(games) {
  if (!Array.isArray(games) || !games.length) return '<span class="preview-pill preview-pill--empty">—</span>';
  return games.slice(0, 5).map((game) => {
    const raw = game.result || "—";
    const result = escapeHtml(raw);
    const cls = raw === "승" ? "preview-pill preview-pill--win" : raw === "패" ? "preview-pill preview-pill--loss" : "preview-pill preview-pill--draw";
    return `<span class="${cls}" title="${result}">${result}</span>`;
  }).join("");
}

function alignStandingsToGame(gameInfo, homeStandings, awayStandings) {
  if (!gameInfo) return { homeStandings, awayStandings };
  const matches = (row, name) => Boolean(row && name && row.name === name);
  if (matches(homeStandings, gameInfo.hName) && matches(awayStandings, gameInfo.aName)) return { homeStandings, awayStandings };
  if (matches(awayStandings, gameInfo.hName) || matches(homeStandings, gameInfo.aName)) {
    return { homeStandings: awayStandings, awayStandings: homeStandings };
  }
  return { homeStandings, awayStandings };
}

function renderPreview(preview) {
  const root = document.getElementById("game-preview");
  if (!root) return;
  const gameInfo = preview?.gameInfo;
  if (!gameInfo) {
    root.textContent = "경기 프리뷰 데이터가 준비 중입니다.";
    return;
  }
  const { homeStandings, awayStandings } = alignStandingsToGame(gameInfo, preview.homeStandings, preview.awayStandings);
  const awayName = awayStandings?.name || gameInfo.aName || "원정";
  const homeName = homeStandings?.name || gameInfo.hName || "홈";
  const awayRank = awayStandings?.rank != null ? `${awayStandings.rank}위` : "—위";
  const homeRank = homeStandings?.rank != null ? `${homeStandings.rank}위` : "—위";
  const awayHra = awayStandings?.hra != null ? String(awayStandings.hra) : "—";
  const homeHra = homeStandings?.hra != null ? String(homeStandings.hra) : "—";
  const awayEra = awayStandings?.era != null ? String(awayStandings.era) : "—";
  const homeEra = homeStandings?.era != null ? String(homeStandings.era) : "—";

  const gameDate = escapeHtml(fmtGameDate(gameInfo.gdate || gameInfo.gameDateTime));
  const gameTime = escapeHtml(gameInfo.gtime || "");
  const stadiumName = escapeHtml(gameInfo.sName || gameInfo.stadium || "구장 미정");
  root.classList.add("lineup-preview-board");
  root.innerHTML = `
    <p class="preview-meta">${gameDate} · ${gameTime} · ${stadiumName}</p>
    <div class="preview-vs-panel">
      <div class="preview-vs-side">
        <div class="preview-rank">${escapeHtml(awayRank)}</div>
        <div class="preview-team-name">${escapeHtml(awayName)}</div>
      </div>
      <div class="preview-vs-center">VS</div>
      <div class="preview-vs-side preview-vs-side--right">
        <div class="preview-rank">${escapeHtml(homeRank)}</div>
        <div class="preview-team-name">${escapeHtml(homeName)}</div>
      </div>
    </div>
    <div class="preview-season-bar">
      <span>${escapeHtml(fmtSeasonWDL(awayStandings))}</span>
      <span>시즌 성적</span>
      <span>${escapeHtml(fmtSeasonWDL(homeStandings))}</span>
    </div>
    <div class="preview-stat-table">
      <div class="preview-stat-row"><span>${escapeHtml(awayHra)}</span><span>팀 타율</span><span>${escapeHtml(homeHra)}</span></div>
      <div class="preview-stat-row"><span>${escapeHtml(awayEra)}</span><span>팀 평균자책</span><span>${escapeHtml(homeEra)}</span></div>
    </div>
    <div class="preview-form-row">
      <div class="preview-pill-row">${fmtRecentPills(preview.awayTeamPreviousGames)}</div>
      <div class="preview-form-title">최근 경기 성적</div>
      <div class="preview-pill-row preview-pill-row--right">${fmtRecentPills(preview.homeTeamPreviousGames)}</div>
    </div>
  `;
}

function pitcherName(raw) {
  if (!raw || typeof raw !== "object") return "미정";
  return raw.name || raw.playerName || raw.playerInfo?.name || "미정";
}

function opponentCell(row) {
  if (!row) return "—";
  const position = escapeHtml(row.position || "—");
  return `${escapeHtml(row.name || "미정")} (${position})`;
}

function renderLineup(lineup) {
  const tbody = document.querySelector("#lineup-table tbody");
  const opponentHead = document.getElementById("lineup-opponent-head");
  const meta = lineup?.meta || {};
  const opponentName = lineup?.opponentMeta?.teamShort || lineup?.opponentMeta?.teamName || meta.opponent || "상대";
  const confirmed = lineup?.meta?.lineupVerification?.ours?.confirmed;
  const statusTag = confirmed ? " [확정]" : " [예상]";
  if (opponentHead) opponentHead.textContent = `${opponentName} 라인업${statusTag}`;
  if (!tbody) return;
  tbody.innerHTML = "";
  const rows = Array.isArray(lineup?.batters) ? lineup.batters : [];
  const opponentRows = Array.isArray(lineup?.opponentBatters) ? lineup.opponentBatters : [];
  const opponentByOrder = new Map(opponentRows.map((row) => [row.order, row]));
  const battingRows = rows.filter((row) => row.position !== "선발투수");
  if (!battingRows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4">라인업 발표 전이거나 데이터 준비 중입니다.</td>';
    tbody.appendChild(tr);
  } else for (const row of battingRows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(String(row.order ?? ""))}</td><td class="lineup-our-cell">${escapeHtml(row.name || "")}</td><td class="lineup-our-cell">${escapeHtml(row.position || "-")}</td><td class="opp-cell">${opponentCell(opponentByOrder.get(row.order))}</td>`;
    tbody.appendChild(tr);
  }
  const pitcherRow = document.createElement("tr");
  pitcherRow.className = "lineup-pitcher-row";
  pitcherRow.innerHTML = `<td>선발</td><td class="lineup-our-cell">${escapeHtml(pitcherName(lineup?.startingPitcher))}</td><td class="lineup-our-cell">투수</td><td class="opp-cell">${escapeHtml(pitcherName(lineup?.opponentStartingPitcher))}</td>`;
  tbody.appendChild(pitcherRow);
}

async function main() {
  const team = initShell("lineup", "라인업");
  try {
    const [lineup, preview] = await Promise.all([loadLineup(team.id), loadGamePreview(team.id)]);
    renderLineup(lineup);
    renderPreview(preview);
  } catch (error) {
    console.error(error);
    showError("라인업 데이터를 불러오지 못했습니다. 로컬 서버에서 열었는지 확인해 주세요.");
  }
}

main();
