import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DEFAULT_TEAM_ID, TEAMS } from "../js/team-config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cheering = JSON.parse(await readFile(path.join(root, "data/cheering-patterns.json"), "utf8"));

const text = {
  title: "\uc9c1\uad00\uac00\uc774\ub4dc",
  cheering: "\uc751\uc6d0",
  teamSelect: "\uad6c\ub2e8 \uc120\ud0dd",
  guideNav: "\uac00\uc774\ub4dc \uc139\uc158",
  lineup: "\ub77c\uc778\uc5c5\uc1a1",
  teamSongs: "\ud300 \uc751\uc6d0\uac00",
  situationSongs: "\ud480\uce74\uc6b4\ud2b8\u00b7\uc544\uc6c3\u00b7\ubcfc\ub137 \ub4f1 \uc0c1\ud669 \uc751\uc6d0",
  footer: "baseball_refac \u00b7 \uae30\ub2a5\ud615 UI \ubcf4\uac15 \ubc84\uc804",
};

const pages = [
  ["lineup", "\ub77c\uc778\uc5c5", "index.html"],
  ["stadium", "\uad6c\uc7a5\uc548\ub0b4", "stadium-guide.html?tab=seats"],
  ["cheering", text.cheering, "cheering.html"],
  ["rules", "\uae30\ubcf8\uaddc\uce59", "rules.html"],
  ["schedule", "\uc77c\uc815\u00b7\uc21c\uc704", "schedule-standings.html"],
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[char]);
}

function renderCategory(title, block) {
  const lines = block?.bullets || block?.lines || [];
  if (!lines.length) return "";
  return `<article class="cheering-flow"><h3 class="cheering-flow-title">${esc(title)}</h3><ul class="cheering-bullets">${lines
    .map((line) => `<li>${esc(line)}</li>`)
    .join("")}</ul></article>`;
}

function navHref(href, teamId) {
  return `${href}${href.includes("?") ? "&" : "?"}team=${encodeURIComponent(teamId)}`;
}

const selectorHtml = TEAMS.map((team) => (
  `<button type="button" data-team-button="${esc(team.id)}">${esc(team.buttonLabel)}</button>`
)).join("\n          ");

const navHtml = pages.map(([id, label, href]) => (
  `<a href="${esc(navHref(href, DEFAULT_TEAM_ID))}" data-page-href="${esc(href)}"${id === "cheering" ? ' aria-current="page"' : ""}>${esc(label)}</a>`
)).join("\n          ");

const sectionHtml = TEAMS.map((team) => {
  const block = cheering.teams?.[team.id] || {};
  return `<section class="panel cheering-section" data-team-section="${esc(team.id)}" aria-label="${esc(team.teamShort)} ${text.cheering}">
          <p class="muted cheering-ballpark">${esc(team.ballparkName)}</p>
          <h2 class="cheering-section-title">${esc(team.teamShort)}</h2>
          ${block.tagline ? `<p class="lead cheering-tagline">${esc(block.tagline)}</p>` : ""}
          ${renderCategory(text.lineup, block.lineupSong)}
          ${renderCategory(text.teamSongs, block.teamSongs)}
          ${renderCategory(text.situationSongs, block.situationSongs)}
        </section>`;
}).join("\n        ");

const teamScriptData = TEAMS.map((team) => ({ id: team.id, teamShort: team.teamShort }));

const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${text.title} · ${text.cheering}</title>
    <link rel="stylesheet" href="css/base.css" />
    <style>
      .cheering-section[hidden] { display: none; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header class="site-header">
        <h1 id="site-title" class="brand-title">${text.title}</h1>
        <p id="site-subtitle" class="lead" hidden></p>
        <nav id="team-selector" class="team-selector" aria-label="${text.teamSelect}">
          ${selectorHtml}
        </nav>
        <nav id="section-nav" class="nav" aria-label="${text.guideNav}">
          ${navHtml}
        </nav>
      </header>
      <p id="load-error" class="error-banner" role="alert"></p>
      <main id="cheering-main" class="cheering-main">
        <p class="muted cheering-disclaimer">${esc(cheering.disclaimer)}</p>
        ${sectionHtml}
      </main>
      <footer class="site-footer muted">${text.footer}</footer>
    </div>
    <script>
      (function () {
        var teams = ${JSON.stringify(teamScriptData)};
        var defaultTeamId = ${JSON.stringify(DEFAULT_TEAM_ID)};
        var storageKey = "baseball-refac-selected-team";
        var params = new URLSearchParams(window.location.search);
        var requested = (params.get("team") || "").toLowerCase();
        var teamIds = teams.map(function (team) { return team.id; });
        var saved = "";
        try { saved = window.localStorage.getItem(storageKey) || ""; } catch (e) {}
        var activeTeamId = teamIds.indexOf(requested) >= 0 ? requested : (teamIds.indexOf(saved) >= 0 ? saved : defaultTeamId);
        try { window.localStorage.setItem(storageKey, activeTeamId); } catch (e) {}

        var activeTeam = teams.filter(function (team) { return team.id === activeTeamId; })[0] || teams[0];
        document.title = "${text.title} · " + activeTeam.teamShort + " · ${text.cheering}";

        function activateTeam(teamId, replaceUrl) {
          if (teamIds.indexOf(teamId) < 0) teamId = defaultTeamId;
          activeTeamId = teamId;
          try { window.localStorage.setItem(storageKey, activeTeamId); } catch (e) {}

          var activeTeam = teams.filter(function (team) { return team.id === activeTeamId; })[0] || teams[0];
          document.title = "${text.title} · " + activeTeam.teamShort + " · ${text.cheering}";

          document.querySelectorAll("[data-team-section]").forEach(function (section) {
            section.hidden = section.getAttribute("data-team-section") !== activeTeamId;
          });
          document.querySelectorAll("#team-selector [data-team-button]").forEach(function (button) {
            var isActive = button.getAttribute("data-team-button") === activeTeamId;
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
          });
          document.querySelectorAll("#section-nav a[data-page-href]").forEach(function (link) {
            var href = link.getAttribute("data-page-href");
            link.href = href + (href.indexOf("?") >= 0 ? "&" : "?") + "team=" + encodeURIComponent(activeTeamId);
          });

          if (replaceUrl && window.history && window.history.replaceState) {
            var nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set("team", activeTeamId);
            window.history.replaceState(null, "", nextUrl);
          }
        }

        document.querySelectorAll("#team-selector [data-team-button]").forEach(function (button) {
          button.addEventListener("click", function () {
            activateTeam(button.getAttribute("data-team-button"), true);
          });
        });
        activateTeam(activeTeamId, false);
      })();
    </script>
  </body>
</html>
`;

await writeFile(path.join(root, "cheering.html"), html);
console.log("emit-static-cheering-page: ok");
