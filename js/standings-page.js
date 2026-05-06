import { loadStandings } from "./data-loader.js";
import { initPage, showError } from "./router.js";
import { escapeHtml } from "./escape.js";
import { renderBottomTab } from "./bottom-tab.js";

function compactWlt(value) {
  const text = String(value || "");
  const match = text.match(/(\d+)승\s*(\d+)무\s*(\d+)패/);
  if (!match) return text;
  return `${match[1]}·${match[2]}·${match[3]}`;
}

function renderStandings(standings) {
  const tbody = document.querySelector("#standings-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (const row of standings?.rows || []) {
    const tr = document.createElement("tr");
    const gb = row.gamesBehind != null ? Number(row.gamesBehind).toFixed(1) : "0.0";
    const wr = row.winRate != null ? Number(row.winRate).toFixed(3) : ".000";
    tr.innerHTML = `<td>${escapeHtml(String(row.rank || ""))}</td><td>${escapeHtml(row.teamName || "")}</td><td class="standings-wlt">${escapeHtml(compactWlt(row.wlt))}</td><td>${escapeHtml(wr)}</td><td>${escapeHtml(gb)}</td><td>${escapeHtml(row.streak || "")}</td>`;
    tbody.appendChild(tr);
  }
}

async function main() {
  initPage("순위");
  renderBottomTab();
  try {
    const standings = await loadStandings();
    renderStandings(standings);
  } catch (error) {
    console.error(error);
    showError("순위 데이터를 불러오지 못했습니다.");
  }
}

main();
