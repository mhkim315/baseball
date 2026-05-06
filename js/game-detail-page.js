import { loadGamePreview, loadLineup } from "./data-loader.js";
import { selectedTeam, showError } from "./router.js";
import { renderPreview } from "./lineup-shared.js";
import { renderBottomTab } from "./bottom-tab.js";
import { escapeHtml } from "./escape.js";

function pitcherName(raw) {
  if (!raw || typeof raw !== "object") return "미정";
  return raw.name || raw.playerName || (raw.playerInfo && raw.playerInfo.name) || "미정";
}

function renderLineupSide(tbody, titleEl, batters, teamLabel, confirmed, pitcher) {
  if (!tbody) return;
  tbody.innerHTML = "";

  const statusTag = confirmed ? " [확정]" : " [예상]";
  if (titleEl) titleEl.textContent = `${teamLabel}${statusTag}`;

  const battingRows = (batters || []).filter((row) => row.position !== "선발투수");

  if (!battingRows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="3">라인업 발표 전</td>';
    tbody.appendChild(tr);
  } else {
    for (const row of battingRows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(String(row.order ?? ""))}</td><td>${escapeHtml(row.name || "")}</td><td>${escapeHtml(row.position || "-")}</td>`;
      tbody.appendChild(tr);
    }
  }

  // 선발투수 행
  const pitcherRow = document.createElement("tr");
  pitcherRow.className = "lineup-pitcher-row";
  pitcherRow.innerHTML = `<td>선발</td><td>${escapeHtml(pitcher)}</td><td>투수</td>`;
  tbody.appendChild(pitcherRow);
}

async function main() {
  renderBottomTab();
  const team = selectedTeam();

  try {
    const [lineup, preview] = await Promise.all([
      loadLineup(team.id),
      loadGamePreview(team.id),
    ]);

    // 프리뷰
    renderPreview(document.getElementById("game-preview"), preview);

    // 매치업 제목
    const subtitle = document.getElementById("site-subtitle");
    const opp = lineup?.meta?.opponent || lineup?.opponentMeta?.teamShort || "상대";
    const venue = preview?.gameInfo?.sName || preview?.gameInfo?.stadium || "";
    if (subtitle) {
      subtitle.textContent = `${team.teamShort} vs ${opp}${venue ? ` · ${venue}` : ""}`;
    }
    document.title = `fullcount.kr · ${team.teamShort} vs ${opp}`;

    const confirmed = lineup?.meta?.lineupVerification?.ours?.confirmed;

    // 홈/원정 결정
    const gi = preview?.gameInfo;
    const isHomeTeam = gi && (team.scheduleName === gi.hName || team.kboCode === gi.homeTeamCode);

    // lineup.json은 선택팀 기준 ours/theirs
    const ourBatters = lineup?.batters || [];
    const oppBatters = lineup?.opponentBatters || [];
    const ourPitcher = pitcherName(lineup?.startingPitcher);
    const oppPitcher = pitcherName(lineup?.opponentStartingPitcher);

    const awayBatters = isHomeTeam ? oppBatters : ourBatters;
    const homeBatters = isHomeTeam ? ourBatters : oppBatters;
    const awayPitcher = isHomeTeam ? oppPitcher : ourPitcher;
    const homePitcher = isHomeTeam ? ourPitcher : oppPitcher;

    const awayName = isHomeTeam ? opp : team.teamShort;
    const homeNameStr = isHomeTeam ? team.teamShort : opp;

    // 양팀 라인업 렌더링
    renderLineupSide(
      document.getElementById("away-lineup-tbody"),
      document.getElementById("away-lineup-title"),
      awayBatters,
      `원정: ${awayName}`,
      confirmed,
      awayPitcher
    );

    renderLineupSide(
      document.getElementById("home-lineup-tbody"),
      document.getElementById("home-lineup-title"),
      homeBatters,
      `홈: ${homeNameStr}`,
      confirmed,
      homePitcher
    );

  } catch (error) {
    console.error(error);
    showError("경기 데이터를 불러오지 못했습니다.");
  }
}

main();
