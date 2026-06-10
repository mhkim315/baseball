import { loadGamePreview, loadLineup, loadGameRecord } from "./data-loader.js";
import { selectedTeam, showError } from "./router.js";
import { renderPreview } from "./lineup-shared.js";
import { renderBottomTab } from "./bottom-tab.js";
import { escapeHtml } from "./escape.js";

function pitcherName(raw) {
  if (!raw || typeof raw !== "object") return "미정";
  return raw.name || raw.playerName || (raw.playerInfo && raw.playerInfo.name) || "미정";
}

function isPastGame(dateStr) {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const todayIso = `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(kst.getDate()).padStart(2, "0")}`;
  return dateStr < todayIso;
}

function recordToLineupData(record, team) {
  const gi = record.gameInfo || {};
  const isHome =
    team.teamShort === gi.hName ||
    team.scheduleName === gi.hName ||
    team.kboCode === gi.hCode;
  return {
    meta: {
      team: isHome ? gi.hName : gi.aName,
      opponent: isHome ? gi.aName : gi.hName,
      lineupVerification: { ours: { confirmed: true } },
    },
    opponentMeta: {
      teamShort: isHome ? gi.aName : gi.hName,
    },
    batters: (isHome ? record.homeLineup : record.awayLineup) || [],
    opponentBatters: (isHome ? record.awayLineup : record.homeLineup) || [],
    startingPitcher: isHome ? record.homeStarter : record.awayStarter,
    opponentStartingPitcher: isHome ? record.awayStarter : record.homeStarter,
  };
}

function renderGameRecord(root, record) {
  if (!root) return;
  const gi = record.gameInfo || {};
  const sb = record.scoreBoard || {};
  const rheb = sb.rheb || {};

  if (!gi.gdate && !rheb.away) {
    root.innerHTML = '<p class="muted">경기 기록 데이터가 없습니다.</p>';
    return;
  }

  const gameDate = gi.gdate
    ? `${String(gi.gdate).slice(0, 4)}-${String(gi.gdate).slice(4, 6)}-${String(gi.gdate).slice(6, 8)}`
    : "";
  const gameTime = gi.gtime || "";
  const stadium = gi.sName || gi.stadium || "";
  const awayName = gi.aName || "원정";
  const homeName = gi.hName || "홈";
  const awayScore = rheb.away?.r ?? "—";
  const homeScore = rheb.home?.r ?? "—";

  const winPitcher = (record.pitchingResult || []).find((p) => p.wls === "W");
  const losePitcher = (record.pitchingResult || []).find((p) => p.wls === "L");
  const savePitcher = (record.pitchingResult || []).find((p) => p.wls === "S");

  root.classList.add("game-record-board");

  let html = "";
  if (gameDate || gameTime || stadium) {
    html += `<p class="preview-meta">${escapeHtml(gameDate)} · ${escapeHtml(gameTime)} · ${escapeHtml(stadium)}</p>`;
  }

  html += `
    <div class="preview-vs-panel">
      <div class="preview-vs-side">
        <div class="preview-team-name">${escapeHtml(awayName)}</div>
      </div>
      <div class="preview-vs-center">VS</div>
      <div class="preview-vs-side preview-vs-side--right">
        <div class="preview-team-name">${escapeHtml(homeName)}</div>
      </div>
    </div>
    <div class="record-score">
      <span class="record-score-number record-score-number--away">${escapeHtml(String(awayScore))}</span>
      <span class="record-score-colon">:</span>
      <span class="record-score-number record-score-number--home">${escapeHtml(String(homeScore))}</span>
    </div>
  `;

  // Inning-by-inning scoreboard
  const awayInnings = sb.inn?.away || [];
  const homeInnings = sb.inn?.home || [];
  const maxInnings = Math.max(awayInnings.length, homeInnings.length);

  if (maxInnings > 0) {
    const totalCols = 1 + maxInnings + 3; // team + innings + RHE
    const colPct = Math.floor(94 / totalCols);
    const teamColPct = 100 - colPct * (totalCols - 1);
    html += `<div class="record-scoreboard"><table class="record-scoreboard-table" style="table-layout:fixed;width:100%"><colgroup><col style="width:${teamColPct}%">`;
    for (let i = 0; i < maxInnings + 3; i++) {
      html += `<col style="width:${colPct}%">`;
    }
    html += `</colgroup><thead><tr><th></th>`;
    for (let i = 0; i < maxInnings; i++) {
      html += `<th>${i + 1}</th>`;
    }
    html += `<th>R</th><th>H</th><th>E</th></tr></thead><tbody>`;
    html += `<tr><td>${escapeHtml(awayName)}</td>`;
    for (let i = 0; i < maxInnings; i++) {
      html += `<td>${awayInnings[i] ?? ""}</td>`;
    }
    html += `<td>${rheb.away?.r ?? 0}</td><td>${rheb.away?.h ?? 0}</td><td>${rheb.away?.e ?? 0}</td></tr>`;
    html += `<tr><td>${escapeHtml(homeName)}</td>`;
    for (let i = 0; i < maxInnings; i++) {
      html += `<td>${homeInnings[i] ?? ""}</td>`;
    }
    html += `<td>${rheb.home?.r ?? 0}</td><td>${rheb.home?.h ?? 0}</td><td>${rheb.home?.e ?? 0}</td></tr>`;
    html += `</tbody></table></div>`;
  }

  // Winning/losing/save pitchers
  const pitchers = [];
  if (winPitcher) pitchers.push(`승: ${escapeHtml(winPitcher.name || "")}`);
  if (losePitcher) pitchers.push(`패: ${escapeHtml(losePitcher.name || "")}`);
  if (savePitcher) pitchers.push(`S: ${escapeHtml(savePitcher.name || "")}`);
  if (pitchers.length) {
    html += `<div class="record-pitchers">${pitchers.join("<br>")}</div>`;
  }

  // Highlights (home runs, etc.)
  const highlights = record.etcRecords || [];
  if (highlights.length) {
    html += `<div class="record-highlights"><ul>`;
    for (const h of highlights) {
      if (h.result && h.how) {
        html += `<li><strong>${escapeHtml(h.how)}</strong> ${escapeHtml(h.result)}</li>`;
      }
    }
    html += `</ul></div>`;
  }

  root.innerHTML = html;
}

function renderLineup(tbody, titleEl, lineupData, preview) {
  if (!tbody) return;

  const gi = preview?.gameInfo;
  const isHomeTeam = gi && (lineupData?.meta?.team === gi.hName || lineupData?.meta?.team === gi.homeTeamCode);
  const confirmed = lineupData?.meta?.lineupVerification?.ours?.confirmed;
  const statusTag = confirmed ? " [확정]" : " [예상]";

  const ourBatters = lineupData?.batters || [];
  const oppBatters = lineupData?.opponentBatters || [];
  const ourPitcher = pitcherName(lineupData?.startingPitcher);
  const oppPitcher = pitcherName(lineupData?.opponentStartingPitcher);
  const opp = lineupData?.meta?.opponent || lineupData?.opponentMeta?.teamShort || "상대";
  const ourName = lineupData?.meta?.team || "홈";

  const awayName = isHomeTeam ? opp : ourName;
  const homeName = isHomeTeam ? ourName : opp;
  const awayBatters = isHomeTeam ? oppBatters : ourBatters;
  const homeBatters = isHomeTeam ? ourBatters : oppBatters;
  const awayPitcher = isHomeTeam ? oppPitcher : ourPitcher;
  const homePitcher = isHomeTeam ? ourPitcher : oppPitcher;

  if (titleEl) titleEl.textContent = `${awayName} vs ${homeName}${statusTag}`;

  tbody.innerHTML = "";

  const homeByOrder = new Map(homeBatters.map((r) => [r.order, r]));
  const awayBattingRows = awayBatters.filter((r) => r.position !== "선발투수");

  if (!awayBattingRows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="3">라인업 발표 전</td>';
    tbody.appendChild(tr);
  } else {
    for (const awayRow of awayBattingRows) {
      const tr = document.createElement("tr");
      const homeRow = homeByOrder.get(awayRow.order);
      tr.innerHTML = `
        <td>${escapeHtml(String(awayRow.order ?? ""))}</td>
        <td>${escapeHtml(awayRow.name || "")}(${escapeHtml(awayRow.position || "-")})</td>
        <td>${escapeHtml(homeRow?.name || "")}(${escapeHtml(homeRow?.position || "-")})</td>`;
      tbody.appendChild(tr);
    }
  }

  const pitcherRow = document.createElement("tr");
  pitcherRow.className = "lineup-pitcher-row";
  pitcherRow.innerHTML = `<td>선발</td><td>${escapeHtml(awayPitcher)}</td><td>${escapeHtml(homePitcher)}</td>`;
  tbody.appendChild(pitcherRow);
}

async function main() {
  renderBottomTab();
  const team = selectedTeam();

  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get("date") || "";

  // If a past date is specified, load the game record
  if (dateParam && isPastGame(dateParam)) {
    try {
      const record = await loadGameRecord(team.id, dateParam);
      renderGameRecord(document.getElementById("game-preview"), record);

      const gi = record.gameInfo || {};
      const isHome =
        team.teamShort === gi.hName ||
        team.scheduleName === gi.hName ||
        team.kboCode === gi.hCode;
      const opp = isHome ? gi.aName : gi.hName;
      const venue = gi.sName || gi.stadium || "";

      const subtitle = document.getElementById("site-subtitle");
      if (subtitle) {
        subtitle.textContent = `${team.teamShort} vs ${opp || "상대"}${venue ? ` · ${venue}` : ""}`;
      }
      document.title = `fullcount.kr · ${team.teamShort} vs ${opp || "상대"}`;

      // Render lineup from game record data
      const lineupData = recordToLineupData(record, team);
      renderLineup(
        document.getElementById("lineup-tbody"),
        document.getElementById("lineup-title"),
        lineupData,
        { gameInfo: record.gameInfo },
      );

      return;
    } catch (error) {
      console.error(error);
      showError("경기 기록 데이터를 불러오지 못했습니다.");
      return;
    }
  }

  // Default: today / future game (including live games today)
  try {
    // For today's games (including live), try to load game record for scoreboard
    const isToday = !dateParam || dateParam === new Date().toISOString().slice(0, 10);
    let record = null;

    if (dateParam) {
      try {
        record = await loadGameRecord(team.id, dateParam);
      } catch { /* record not available yet */ }
    }

    if (record) {
      renderGameRecord(document.getElementById("game-preview"), record);
      const gi = record.gameInfo || {};
      const isHome =
        team.teamShort === gi.hName ||
        team.scheduleName === gi.hName ||
        team.kboCode === gi.hCode;
      const opp = isHome ? gi.aName : gi.hName;
      const venue = gi.sName || gi.stadium || "";

      const subtitle = document.getElementById("site-subtitle");
      if (subtitle) {
        subtitle.textContent = `${team.teamShort} vs ${opp || "상대"}${venue ? ` · ${venue}` : ""}`;
      }
      document.title = `fullcount.kr · ${team.teamShort} vs ${opp || "상대"}`;

      const lineupData = recordToLineupData(record, team);
      renderLineup(
        document.getElementById("lineup-tbody"),
        document.getElementById("lineup-title"),
        lineupData,
        { gameInfo: record.gameInfo },
      );
      return;
    }

    const [lineup, preview] = await Promise.all([
      loadLineup(team.id),
      loadGamePreview(team.id),
    ]);

    renderPreview(document.getElementById("game-preview"), preview);

    const subtitle = document.getElementById("site-subtitle");
    const opp = lineup?.meta?.opponent || lineup?.opponentMeta?.teamShort || "상대";
    const venue = preview?.gameInfo?.sName || preview?.gameInfo?.stadium || "";
    if (subtitle) {
      subtitle.textContent = `${team.teamShort} vs ${opp}${venue ? ` · ${venue}` : ""}`;
    }
    document.title = `fullcount.kr · ${team.teamShort} vs ${opp}`;

    renderLineup(
      document.getElementById("lineup-tbody"),
      document.getElementById("lineup-title"),
      lineup,
      preview,
    );
  } catch (error) {
    console.error(error);
    showError("경기 데이터를 불러오지 못했습니다.");
  }
}

main();
