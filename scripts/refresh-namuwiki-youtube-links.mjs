import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const teams = [
  {
    slug: "doosan",
    name: "두산 베어스",
    wiki: "https://namu.wiki/w/%EB%91%90%EC%82%B0%20%EB%B2%A0%EC%96%B4%EC%8A%A4/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\49f00208-7032-451c-b7a7-cf45b135173f.txt",
  },
  {
    slug: "lg",
    name: "LG 트윈스",
    wiki: "https://namu.wiki/w/LG%20%ED%8A%B8%EC%9C%88%EC%8A%A4/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\39bbf798-32df-4a8c-9adf-2c993c4f4c39.txt",
  },
  {
    slug: "kiwoom",
    name: "키움 히어로즈",
    wiki: "https://namu.wiki/w/%ED%82%A4%EC%9B%80%20%ED%9E%88%EC%96%B4%EB%A1%9C%EC%A6%88/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\0e7c6934-47a9-4862-87a2-949bc479f890.txt",
  },
  {
    slug: "ssg",
    name: "SSG 랜더스",
    wiki: "https://namu.wiki/w/SSG%20%EB%9E%9C%EB%8D%94%EC%8A%A4/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\87586072-9aba-4663-807f-2cbed35d9b86.txt",
  },
  {
    slug: "kt",
    name: "KT wiz",
    wiki: "https://namu.wiki/w/kt%20wiz/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\8fe25167-f52c-40e7-a493-076fd522bdb5.txt",
  },
  {
    slug: "hanwha",
    name: "한화 이글스",
    wiki: "https://namu.wiki/w/%ED%95%9C%ED%99%94%20%EC%9D%B4%EA%B8%80%EC%8A%A4/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\89b3fe76-7d18-492c-b26b-b0edee75184c.txt",
  },
  {
    slug: "samsung",
    name: "삼성 라이온즈",
    wiki: "https://namu.wiki/w/%EC%82%BC%EC%84%B1%20%EB%9D%BC%EC%9D%B4%EC%98%A8%EC%A6%88/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\f1b44aa6-1429-46aa-8d4f-4482f96dfa90.txt",
  },
  {
    slug: "kia",
    name: "KIA 타이거즈",
    wiki: "https://namu.wiki/w/KIA%20%ED%83%80%EC%9D%B4%EA%B1%B0%EC%A6%88/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\b94014c6-5f4d-4a95-acb9-2df2f949d999.txt",
  },
  {
    slug: "lotte",
    name: "롯데 자이언츠",
    wiki: "https://namu.wiki/w/%EB%A1%AF%EB%8D%B0%20%EC%9E%90%EC%9D%B4%EC%96%B8%EC%B8%A0/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\4a6f009b-825c-4d70-82aa-c797a9b17737.txt",
  },
  {
    slug: "nc",
    name: "NC 다이노스",
    wiki: "https://namu.wiki/w/NC%20%EB%8B%A4%EC%9D%B4%EB%85%B8%EC%8A%A4/%EC%9D%91%EC%9B%90%EA%B0%80",
    rawPath: "C:\\Users\\홍이\\.cursor\\projects\\d-baseball\\agent-tools\\5d2c0269-04eb-45a9-96d7-a4f9e5ff7880.txt",
  },
];

function parseSituationSongs(md) {
  const rows = md.split(/\r?\n/).filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("곡명"));
  const map = new Map();
  for (const row of rows) {
    const cols = row.split("|").map((v) => v.trim()).filter(Boolean);
    if (cols.length < 3) continue;
    const [song, situation] = cols;
    if (!map.has(situation)) map.set(situation, []);
    map.get(situation).push(song);
  }
  return map;
}

function extractYoutubeWithContext(raw) {
  const lines = raw.split(/\r?\n/);
  const list = [];
  const re = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s)\]]+)/i;
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(re);
    if (!m) continue;
    const url = m[1];
    const context = [lines[i - 1] || "", lines[i], lines[i + 1] || ""].join(" ").toLowerCase();
    list.push({ url, context });
  }
  const uniq = [];
  const seen = new Set();
  for (const item of list) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    uniq.push(item);
  }
  return uniq;
}

function pickByKeywords(items, keywords) {
  const found = items.filter((it) => keywords.some((k) => it.context.includes(k)));
  return found.slice(0, 3).map((it) => it.url);
}

function linksLine(urls) {
  if (!urls.length) return "유튜브 링크: 페이지 내 명시 링크를 찾지 못함";
  return urls.map((u) => `- ${u}`).join("\n");
}

function formatSongs(map, key, fallback = "별도 고정 곡 명시 없음", limit = 5) {
  const songs = map.get(key) || [];
  if (!songs.length) return `\`${fallback}\``;
  return songs.slice(0, limit).map((s) => `\`${s}\``).join(", ");
}

function buildDoc(teamName, wikiUrl, songMap, ytItems) {
  const urlsStart = pickByKeywords(ytItems, ["경기 시작", "개시", "intro", "play ball"]);
  const urlsLineup = pickByKeywords(ytItems, ["라인업"]);
  const urlsHit = pickByKeywords(ytItems, ["안타"]);
  const urlsHr = pickByKeywords(ytItems, ["홈런"]);
  const urlsWalk = pickByKeywords(ytItems, ["볼넷"]);
  const urlsFull = pickByKeywords(ytItems, ["풀카운트"]);
  const urlsClutch = pickByKeywords(ytItems, ["8회", "9회", "승리", "역전", "결투", "rock"]);
  const urlsDefense = pickByKeywords(ytItems, ["견제", "삼진", "투수 교체", "수비"]);

  return `# ${teamName} 응원가 가이드 (상황별)

- 원문: [${teamName}/응원가](${wikiUrl})
- 기준: 나무위키 본문에 포함된 유튜브 링크 우선

## 경기 시작/초반

### 경기 시작 직전
- 곡: ${formatSongs(songMap, "경기 시작")}
- 설명: 경기 개시 직전 또는 오프닝 연출에 맞춰 가장 먼저 나오는 시작 음악 구간.
- URL:
${linksLine(urlsStart)}

### 선발 소개/응원단 첫 집결
- 곡: ${formatSongs(songMap, "라인업")}
- 설명: 선발 라인업 소개와 함께 응원단/관중 콜을 맞추는 구간.
- URL:
${linksLine(urlsLineup)}

### 초반 분위기 올릴 때
- 곡: ${formatSongs(songMap, "일반 팀응원")}
- 설명: 1회~초반 이닝에서 떼창 템포를 올릴 때 반복해서 쓰이는 팀 응원곡 묶음.
- URL:
${linksLine(pickByKeywords(ytItems, ["응원가", "team", "플레이리스트"]))}

## 타석 상황

### 안타가 나왔을 때 (공통)
- 곡: ${formatSongs(songMap, "안타")}
- 설명: 안타 직후 타자 이름 콜과 함께 바로 붙는 상황 응원.
- URL:
${linksLine(urlsHit)}

### 홈런 타석/거포 타석
- 곡: ${formatSongs(songMap, "일반 팀응원", "홈런 콜은 팀/선수 응원 내에서 운용")}
- 설명: 장타 기대 타석에서 홈런 콜 또는 홈런형 구호로 응원 강도를 높이는 구간.
- URL:
${linksLine(urlsHr)}

### 볼넷으로 출루했을 때
- 곡: ${formatSongs(songMap, "볼넷")}
- 설명: 볼넷 출루 시 전환 리듬으로 쓰이는 상황 음악.
- URL:
${linksLine(urlsWalk)}

### 풀카운트 상황
- 곡: ${formatSongs(songMap, "풀카운트")}
- 설명: 풀카운트에서 박자/콜을 맞추기 위한 전용 리듬 구간.
- URL:
${linksLine(urlsFull)}

## 중후반/승부처

### 후반 리드 상황, 승부처
- 곡: ${formatSongs(songMap, "후반/결속")}
- 설명: 7회 이후 승부처에서 떼창 강도를 올리고 분위기를 고정하는 핵심 구간.
- URL:
${linksLine(urlsClutch)}

### 수비 전환/특정 플레이 반응
- 곡: ${formatSongs(songMap, "수비/전환")}
- 설명: 견제·삼진·투수교체 등 수비 이벤트에서 반응하는 전환 음악.
- URL:
${linksLine(urlsDefense)}

## 참고

- 선수 응원가는 팀 문서와 별도로 시즌마다 자주 갱신되므로 경기 당일 구단 채널/현장 안내와 함께 확인.
`;
}

for (const team of teams) {
  const byTeamPath = path.join(root, "docs", "cheering-by-team", `${team.slug}-cheering.md`);
  const outPath = path.join(root, "docs", `${team.slug}-namuwiki-cheering.md`);
  const [byTeamDoc, rawWiki] = await Promise.all([
    readFile(byTeamPath, "utf8"),
    readFile(team.rawPath, "utf8"),
  ]);
  const songMap = parseSituationSongs(byTeamDoc);
  const ytItems = extractYoutubeWithContext(rawWiki);
  const md = buildDoc(team.name, team.wiki, songMap, ytItems);
  await writeFile(outPath, md, "utf8");
}

console.log("refresh-namuwiki-youtube-links: ok");
