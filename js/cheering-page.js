import { loadJson, loadLineup } from "./data-loader.js";
import { selectedTeamId, selectedTeam, showError } from "./router.js";
import { TEAMS } from "./team-config.js";
import { renderBottomTab } from "./bottom-tab.js";

const SVG_ICON =
  '<svg class="cheering-yt-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 48" aria-hidden="true">' +
  '<path fill="#FF0000" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-5.4 2.49-6.18 5.42C.13 12.21 0 24 0 24s.13 11.79.72 16.21c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 5.4-2.49 5.42-6.19.6-4.42.72-11.21.72-16.21s-.12-11.79-.72-16.21"/>' +
  '<path fill="#fff" d="M45 24 27 14v20"/></svg>';

let activeSubTab = "songs";
let currentTeamId = null;

function renderTeamSelector() {
  const nav = document.getElementById("cheering-team-selector");
  if (!nav) return;
  nav.innerHTML = "";
  for (const team of TEAMS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = team.buttonLabel;
    btn.setAttribute("aria-pressed", team.id === currentTeamId ? "true" : "false");
    btn.addEventListener("click", () => switchTeam(team.id));
    nav.appendChild(btn);
  }
}

async function switchTeam(teamId) {
  currentTeamId = teamId;
  const team = TEAMS.find((t) => t.id === teamId) || TEAMS[0];
  const url = new URL(window.location.href);
  url.searchParams.set("team", teamId);
  history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
  document.title = `fullcount.kr · ${team.teamShort} · 응원`;
  renderTeamSelector();

  try {
    const [songsData, lineupData] = await Promise.all([
      loadJson("data/cheering-songs.json").catch(() => null),
      loadLineup(team.id).catch(() => null),
    ]);
    renderTeamSongs(team.id, songsData?.teams?.[team.id]);
    renderLineupPlayers(team.teamShort, lineupData);
  } catch (error) {
    console.error(error);
  }
}

function setActiveSubTab(tab, { updateUrl } = { updateUrl: true }) {
  activeSubTab = tab;
  for (const button of document.querySelectorAll("[data-cheering-tab]")) {
    button.setAttribute("aria-selected", button.dataset.cheeringTab === tab ? "true" : "false");
  }
  document.getElementById("cheering-songs-panel").hidden = tab !== "songs";
  document.getElementById("cheering-players-panel").hidden = tab !== "players";
  document.getElementById("cheering-rules-panel").hidden = tab !== "rules";
  if (updateUrl) {
    const url = new URL(window.location.href);
    if (tab === "songs") url.searchParams.delete("sub");
    else url.searchParams.set("sub", tab);
    history.replaceState(null, "", `${url.pathname.split("/").pop()}${url.search}`);
  }
}

function bindSubTabs() {
  for (const button of document.querySelectorAll("[data-cheering-tab]")) {
    button.addEventListener("click", () => setActiveSubTab(button.dataset.cheeringTab));
  }
}

// ── 구단응원가 ──────────────────────────────────────────────

function renderTeamSongs(teamId, teamData) {
  const root = document.getElementById("cheering-songs-panel");
  if (!root) return;
  root.innerHTML = "";

  if (!teamData || !teamData.sections || !teamData.sections.length) {
    root.innerHTML = '<p class="lead cheering-page-lead">이 구단의 응원 데이터가 아직 준비되지 않았습니다.</p>';
    return;
  }

  const lead = document.createElement("p");
  lead.className = "lead cheering-page-lead";
  lead.textContent = "상황별 팀 응원곡 참고용이에요. 경기마다 순서·편성은 달라질 수 있어요.";
  root.appendChild(lead);

  for (const section of teamData.sections) {
    const article = document.createElement("article");
    article.className = "cheering-flow";

    const title = document.createElement("h4");
    title.className = "cheering-flow-title";
    title.textContent = section.title;
    article.appendChild(title);

    if (section.songs && section.songs.length) {
      const ul = document.createElement("ul");
      ul.className = "cheering-song-list";

      for (const song of section.songs) {
        const li = document.createElement("li");
        li.className = "cheering-song-item";

        const name = document.createElement("span");
        name.className = "cheering-song-name";
        name.textContent = song.name === "응원 영상" ? section.title : song.name;
        li.appendChild(name);

        if (song.youtubeUrl) {
          const a = document.createElement("a");
          a.className = "cheering-yt-btn";
          a.href = song.youtubeUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          const displayName = song.name === "응원 영상" ? section.title : song.name;
          a.setAttribute("aria-label", `${displayName} 참고 영상`);
          a.innerHTML = SVG_ICON;
          li.appendChild(a);
        }

        ul.appendChild(li);
      }
      article.appendChild(ul);
    }

    root.appendChild(article);
  }
}

// ── 선수응원가 ──────────────────────────────────────────────

function youtubeSearchUrl(teamShort, playerName) {
  const query = encodeURIComponent(`${teamShort} ${playerName} 응원가`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

function renderPlayerItem(teamShort, player, prefix = "") {
  const li = document.createElement("li");
  li.className = "cheering-song-item";

  const name = document.createElement("span");
  name.className = "cheering-song-name";
  name.textContent = prefix ? `${prefix} ${player.name}` : player.name;
  li.appendChild(name);

  const a = document.createElement("a");
  a.className = "cheering-yt-btn";
  a.href = youtubeSearchUrl(teamShort, player.name);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("aria-label", `${player.name} 응원가 YouTube 검색`);
  a.innerHTML = SVG_ICON;
  li.appendChild(a);

  return li;
}

function renderLineupPlayers(teamShort, lineupData) {
  const root = document.getElementById("cheering-players-panel");
  if (!root) return;
  root.innerHTML = "";

  if (!lineupData) {
    root.innerHTML = '<p class="lead cheering-page-lead">오늘 라인업 데이터가 아직 없습니다. 경기 당일 업데이트됩니다.</p>';
    return;
  }

  const batters = Array.isArray(lineupData.batters) ? lineupData.batters : [];
  const pitcher = lineupData.startingPitcher;

  if (!batters.length) {
    root.innerHTML = '<p class="lead cheering-page-lead">라인업 발표 전입니다. 경기 1-2시간 전에 업데이트됩니다.</p>';
    return;
  }

  const lead = document.createElement("p");
  lead.className = "lead cheering-page-lead";
  lead.textContent = "오늘 선발 라인업 기준으로, 이름을 누르면 YouTube에서 응원가를 검색해요.";
  root.appendChild(lead);

  // 타자
  const battersArticle = document.createElement("article");
  battersArticle.className = "cheering-flow";

  const battersTitle = document.createElement("h4");
  battersTitle.className = "cheering-flow-title";
  battersTitle.textContent = "타자";
  battersArticle.appendChild(battersTitle);

  const battersUl = document.createElement("ul");
  battersUl.className = "cheering-song-list";

  for (const batter of batters) {
    battersUl.appendChild(renderPlayerItem(teamShort, batter, `${batter.order}번`));
  }
  battersArticle.appendChild(battersUl);
  root.appendChild(battersArticle);

  // 선발투수
  if (pitcher && pitcher.name) {
    const pitcherArticle = document.createElement("article");
    pitcherArticle.className = "cheering-flow";

    const pitcherTitle = document.createElement("h4");
    pitcherTitle.className = "cheering-flow-title";
    pitcherTitle.textContent = "선발투수";
    pitcherArticle.appendChild(pitcherTitle);

    const pitcherUl = document.createElement("ul");
    pitcherUl.className = "cheering-song-list";
    pitcherUl.appendChild(renderPlayerItem(teamShort, pitcher));
    pitcherArticle.appendChild(pitcherUl);
    root.appendChild(pitcherArticle);
  }
}

// ── 기본규칙 ────────────────────────────────────────────────

function renderRules() {
  const root = document.getElementById("cheering-rules-panel");
  if (!root) return;
  root.innerHTML = `
    <section class="panel" aria-label="기본규칙">
      <p class="lead">처음 직관할 때 꼭 알면 좋은 것만 골라 적었어요.</p>
      <ul class="rules-list">
        <li><strong>이닝(회)</strong>: 공격(초)·수비(말)가 한 바퀴 도는 단위예요. 공격측에서 아웃 세 개가 나오면 그 이닝은 끝나요.</li>
        <li><strong>아웃</strong>: 삼진(스트라이크 세 번), 뜬공·땅볼로 잡히거나, 주자가 태그·포스로 잡히는 식으로 세 명이 나가면 공격 턴이 끝나요.</li>
        <li><strong>타순</strong>: 정해진 순서대로 타석에 서고, 경기 내내 그 순서가 계속 돌아가요.</li>
        <li><strong>득점</strong>: 주자가 1·2·3루를 거쳐 홈 플레이트를 밟으면 팀에 1점이 올라가요. 안타만이 아니라 볼넷·사구 등으로 출루한 뒤 진루해도 같아요.</li>
        <li><strong>사사구(사구·볼넷)</strong>: 안타 없이 타자가 1루에 나가는 경우가 있어요. 공이 몸에 맞으면 사구(몸맞는 공), 볼이 네 번 쌓이면 볼넷으로 출루해요.</li>
      </ul>
      <hr class="section-divider" />
    </section>
    <section class="panel" aria-label="그림으로 보는 입문">
      <p class="lead">아래는 그림 순서대로, 경기장 전체 → 득점(홈에서 1점) → 스트라이크·볼 → 체크스윙 → 사사구(몸맞는 공·볼넷) → 타구 → 포스·태그 → 심판 수신호 흐름이에요.</p>
      <div class="rules-gallery">
        <figure class="figure-block">
          <img src="picture/rules/field.jpg" alt="야구장 전경 — 수비 포지션과 전광판 등이 표시된 안내 그림" width="1968" height="1125" loading="lazy" />
          <figcaption class="caption">누가 어디 서 있는지, 전광판은 어디인지 한번 잡아 두면 경기가 훨씬 따라가기 쉬워요.</figcaption>
        </figure>
        <figure class="figure-block">
          <img src="picture/rules/scoring.jpg" alt="야구장 탑다운 뷰 — 주자가 베이스를 돌아 홈을 밟을 때 득점이 1점 올라가는 모습" width="1680" height="1125" loading="lazy" />
          <figcaption class="caption">화살표 방향대로 1·2·3루를 거쳐 홈 플레이트를 밟으면 그때 팀 점수가 1점 올라가요. 주자 여러 명이 있으면 홈을 밟은 만큼 점수가 쌓여요.</figcaption>
        </figure>
        <figure class="figure-block">
          <img src="picture/rules/strike.jpg" alt="스트라이크와 볼 — 노스윙과 스윙 시 비교" width="2000" height="1089" loading="lazy" />
          <figcaption class="caption">스윙을 안 했을 때: 공이 스트라이크 존을 지나가면 스트라이크, 아니면 볼이에요. 스윙을 했으면(헛스윙) 존 안·밖이랑 상관없이 스트라이크.</figcaption>
        </figure>
        <figure class="figure-block">
          <img src="picture/rules/check-swing.jpg" alt="볼·스트라이크 판정과 체크스윙 여부를 설명하는 그림" width="2000" height="1117" loading="lazy" />
          <figcaption class="caption">"진짜 스윙이었나?" 스윙도중 멈추게 되면 심판이 배트가 얼마나 나갔는지 봐요. 애매하면 비디오 판독이 나올 수 있어요.</figcaption>
        </figure>
        <figure class="figure-block">
          <img src="picture/rules/walk-hit-by-pitch.jpg" alt="사구와 볼넷 — 안타 없이 타자가 출루하는 두 가지 예" width="2000" height="1117" loading="lazy" />
          <figcaption class="caption"><strong>사구(몸맞는 공)</strong>는 던진 공이 타자 몸에 맞으면 출루해요. <strong>볼넷</strong>은 스트라이크 세 번 전에 볼이 네 번 쌓이면 걸어서 1루로 가요. 둘 다 안타 없이 1루에 나가는 대표적인 경우예요.</figcaption>
        </figure>
        <figure class="figure-block">
          <img src="picture/rules/batted-ball.jpg" alt="파울볼, 홈런, 플라이볼, 안타 네 가지 타구 예시" width="1962" height="1107" loading="lazy" />
          <figcaption class="caption"><strong>파울</strong>은 파울 라인 밖으로 나간 타구예요. <strong>홈런</strong>은 타구가 담장을 넘겨 모든 주자가 홈으로 들어와요. <strong>뜬공</strong>은 공이 높게 떠서 수비가 잡으면 아웃인 타구예요. <strong>안타</strong>는 수비가 잡지 못하고 공이 페어 안에 떨어져 주자가 진루하는 경우를 말해요.</figcaption>
        </figure>
        <figure class="figure-block">
          <img src="picture/rules/force-tag.jpg" alt="포스아웃과 태그아웃의 차이를 보여주는 그림" width="1500" height="1133" loading="lazy" />
          <figcaption class="caption"><strong>포스 아웃</strong>은 "지금 꼭 가야 하는 베이스"가 정해져 있을 때, 수비가 그 베이스만 밟아도 아웃이 나는 거예요(뒤에 주자가 생겨 밀려나는 상황 등). 그게 아닐 때에는 <strong>태그 아웃</strong>으로 주자 몸을 직접 건드려야 아웃이에요.</figcaption>
        </figure>
        <figure class="figure-block">
          <img src="picture/rules/umpire.jpg" alt="세이프, 아웃, 스트라이크, 볼 — 심판 수신호 안내" width="1688" height="1125" loading="lazy" />
          <figcaption class="caption">멀리 앉아도 심판 손동작만 알아 두면 <strong>세이프·아웃·스트라이크·볼</strong>을 빠르게 구분할 수 있어요.</figcaption>
        </figure>
      </div>
    </section>
  `;
}

// ── 메인 ────────────────────────────────────────────────────

async function main() {
  renderBottomTab("cheering");
  currentTeamId = selectedTeamId();

  // 팀 선택기 렌더링
  const selRoot = document.getElementById("cheering-team-selector");
  if (selRoot) {
    renderTeamSelector();
  }

  try {
    const team = selectedTeam();
    document.title = `fullcount.kr · ${team.teamShort} · 응원`;
    const [songsData, lineupData] = await Promise.all([
      loadJson("data/cheering-songs.json").catch(() => null),
      loadLineup(team.id).catch(() => null),
    ]);

    renderTeamSongs(team.id, songsData?.teams?.[team.id]);
    renderLineupPlayers(team.teamShort, lineupData);
    renderRules();

    bindSubTabs();
    const initialSub = new URLSearchParams(window.location.search).get("sub");
    const tab = initialSub === "players" ? "players" : initialSub === "rules" ? "rules" : "songs";
    setActiveSubTab(tab, { updateUrl: false });
  } catch (error) {
    console.error(error);
    showError("응원 데이터를 불러오지 못했습니다.");
  }
}

main();
