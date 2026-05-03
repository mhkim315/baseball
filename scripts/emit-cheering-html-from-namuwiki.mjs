import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_TEAM_ID, TEAMS } from "../js/team-config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs");

const pages = [
  ["lineup", "라인업", "index.html"],
  ["stadium", "구장안내", "stadium-guide.html?tab=seats"],
  ["cheering", "응원", "cheering.html"],
  ["rules", "기본규칙", "rules.html"],
  ["schedule", "일정·순위", "schedule-standings.html"],
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function navHref(href, teamId) {
  return `${href}${href.includes("?") ? "&" : "?"}team=${encodeURIComponent(teamId)}`;
}

/** 곡당 단일 URL: 전체가 URL이면 그대로, 아니면 기존 링크 우선 후 첫 https */
function pickYoutubeHref(rest) {
  const s = String(rest).trim();
  const one = s.match(/^https?:\/\/[^\s]+$/);
  if (one) return one[0].replace(/[），,)\]]+$/u, "");
  const oldU = s.match(/기존:\s*(https?:\/\/[^\s·]+)/);
  if (oldU) return oldU[1].replace(/[），,)\]]+$/u, "");
  const any = s.match(/https?:\/\/[^\s·]+/);
  return any ? any[0].replace(/[），,)\]]+$/u, "") : "";
}

/** watch / youtu.be → /shorts/ID (짧게 보기용). 구간 t= 는 그대로 넘김 */
function toYoutubeShortsUrl(href) {
  if (!href) return href;
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    let id = null;
    if (host === "youtu.be") {
      id = url.pathname.replace(/^\//, "").split("/")[0];
    } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const p = url.pathname;
      if (p.startsWith("/shorts/")) id = p.slice(8).split("/")[0];
      else if (p === "/watch" || p.startsWith("/watch/")) id = url.searchParams.get("v");
    }
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return href;
    const out = new URL(`https://www.youtube.com/shorts/${id}`);
    const t = url.searchParams.get("t");
    if (t) out.searchParams.set("t", t);
    return out.toString();
  } catch {
    return href;
  }
}

function parseSongRow(line) {
  const m = line.match(/^  - `([^`]+)`:\s*(.+)$/);
  if (!m) return null;
  const title = m[1].trim();
  const raw = pickYoutubeHref(m[2]);
  if (!raw) return null;
  const href = toYoutubeShortsUrl(raw);
  return { title, href };
}

function parseNamuwikiMd(md) {
  const lines = md.split(/\r?\n/);

  const chapters = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## 참고")) {
      i += 1;
      while (i < lines.length && lines[i].startsWith("- ")) {
        i += 1;
      }
      continue;
    }
    if (line.startsWith("## ") && !line.startsWith("###")) {
      const chTitle = line.replace(/^##\s+/, "").trim();
      i += 1;
      const blocks = [];
      while (i < lines.length && !lines[i].startsWith("## ")) {
        if (lines[i].startsWith("### ")) {
          const h3 = lines[i].replace(/^###\s+/, "").trim();
          i += 1;
          let desc = "";
          const songs = [];
          while (i < lines.length && !lines[i].startsWith("### ") && !lines[i].startsWith("## ")) {
            const L = lines[i];
            if (L.startsWith("- 설명:")) desc = L.replace(/^- 설명:\s*/, "").trim();
            else if (L.startsWith("  - ")) {
              const row = parseSongRow(L);
              if (row) songs.push(row);
            }
            i += 1;
          }
          blocks.push({ h3, desc, songs });
          continue;
        }
        i += 1;
      }
      chapters.push({ title: chTitle, blocks });
      continue;
    }
    i += 1;
  }
  return { chapters };
}

const YT_ICON = `<svg class="cheering-yt-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 48" aria-hidden="true"><path fill="#FF0000" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-5.4 2.49-6.18 5.42C.13 12.21 0 24 0 24s.13 11.79.72 16.21c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 5.4-2.49 5.42-6.19.6-4.42.72-11.21.72-16.21s-.12-11.79-.72-16.21"/><path fill="#fff" d="M45 24 27 14v20"/></svg>`;

function renderBlock(b) {
  const songRows = b.songs
    .map(
      (s) => `<li class="cheering-song-item">
              <span class="cheering-song-name">${esc(s.title)}</span>
              <a class="cheering-yt-btn" href="${esc(s.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.title)} 참고 영상">${YT_ICON}</a>
            </li>`
    )
    .join("");
  const listHtml = songRows
    ? `<ul class="cheering-song-list">${songRows}</ul>`
    : `<p class="muted cheering-no-links">지금은 이 항목에 맞는 참고 링크가 없어요. 현장 스피커나 구단 채널을 보면 돼요.</p>`;
  return `<article class="cheering-flow">
          <h4 class="cheering-flow-title">${esc(b.h3)}</h4>
          ${listHtml}
        </article>`;
}

function renderChapter(ch) {
  return ch.blocks.map((b) => renderBlock(b)).join("\n          ");
}

function renderTeamSection(team, parsed) {
  const { chapters } = parsed;
  const chaptersHtml = chapters.map((ch) => renderChapter(ch)).join("\n        ");
  return `<section class="panel cheering-section" data-team-section="${esc(team.id)}" aria-label="${esc(team.teamShort)} 응원">
          ${chaptersHtml}
        </section>`;
}

const cheeringIntro = "상황별 팀 응원곡 참고용이에요. 경기마다 순서·편성은 달라질 수 있어요.";

const selectorHtml = TEAMS.map(
  (t) => `          <button type="button" data-team-button="${esc(t.id)}">${esc(t.buttonLabel)}</button>`
).join("\n");

const navHtml = pages
  .map(([id, label, href]) => {
    const cur = id === "cheering" ? ' aria-current="page"' : "";
    return `          <a href="${esc(navHref(href, DEFAULT_TEAM_ID))}" data-page-href="${esc(href)}"${cur}>${esc(label)}</a>`;
  })
  .join("\n");

const sectionsHtml = [];
for (const team of TEAMS) {
  const mdPath = path.join(docsDir, `${team.id}-namuwiki-cheering.md`);
  const md = await readFile(mdPath, "utf8");
  sectionsHtml.push(renderTeamSection(team, parseNamuwikiMd(md)));
}

const teamScriptData = TEAMS.map((t) => ({ id: t.id, teamShort: t.teamShort }));

const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>직관가이드 · 응원</title>
    <link rel="stylesheet" href="css/base.css" />
    <style>
      .cheering-section[hidden] { display: none; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header class="site-header">
        <h1 id="site-title" class="brand-title">직관가이드</h1>
        <p id="site-subtitle" class="lead" hidden></p>
        <nav id="team-selector" class="team-selector" aria-label="구단 선택">
${selectorHtml}
        </nav>
        <nav id="section-nav" class="nav" aria-label="가이드 섹션">
${navHtml}
        </nav>
      </header>
      <p id="load-error" class="error-banner" role="alert"></p>
      <main id="cheering-main" class="cheering-main">
        <p class="lead cheering-page-lead">${esc(cheeringIntro)}</p>
        ${sectionsHtml.join("\n        ")}
      </main>
      <footer class="site-footer muted">baseball_refac · 기능형 UI 보강 버전</footer>
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
        document.title = "직관가이드 · " + activeTeam.teamShort + " · 응원";

        function activateTeam(teamId, replaceUrl) {
          if (teamIds.indexOf(teamId) < 0) teamId = defaultTeamId;
          activeTeamId = teamId;
          try { window.localStorage.setItem(storageKey, activeTeamId); } catch (e) {}

          var activeTeam = teams.filter(function (team) { return team.id === activeTeamId; })[0] || teams[0];
          document.title = "직관가이드 · " + activeTeam.teamShort + " · 응원";

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
console.log("emit-cheering-html-from-namuwiki: ok");
