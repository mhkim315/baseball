import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "docs", "kbo-cheering-guide.md");
const outDir = path.join(root, "docs", "cheering-by-team");

const slugByTeam = {
  "두산 베어스": "doosan",
  "LG 트윈스": "lg",
  "KT wiz": "kt",
  "SSG 랜더스": "ssg",
  "NC 다이노스": "nc",
  "KIA 타이거즈": "kia",
  "삼성 라이온즈": "samsung",
  "롯데 자이언츠": "lotte",
  "한화 이글스": "hanwha",
  "키움 히어로즈": "kiwoom",
};

function splitTeamSections(doc) {
  const lines = doc.split(/\r?\n/);
  const sections = {};
  let team = "";
  let bucket = [];
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      if (team && bucket.length) sections[team] = bucket.join("\n");
      team = slugByTeam[m[1]] ? m[1] : "";
      bucket = [];
      continue;
    }
    if (team) bucket.push(line);
  }
  if (team && bucket.length) sections[team] = bucket.join("\n");
  return sections;
}

function extractFirstMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function extractAllYoutubeLinks(text) {
  const urls = [];
  const re = /\[[^\]]*]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^)]+)\)/g;
  let m;
  while ((m = re.exec(text)) !== null) urls.push(m[1]);
  return [...new Set(urls)];
}

function extractSongs(text) {
  const songs = [];
  const seen = new Set();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\|\s*([0-9]{1,2}:[0-9]{2})\s*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    const song = m[2].trim();
    if (!song || song === "곡·항목" || song === "곡" || song === "선수") continue;
    if (/등장곡/.test(song)) continue;
    if (seen.has(song)) continue;
    seen.add(song);
    songs.push(song);
  }
  return songs;
}

function inferSituation(song) {
  if (/풀카운트/.test(song)) return "풀카운트";
  if (/볼넷/.test(song)) return "볼넷";
  if (/안타/.test(song)) return "안타";
  if (/홈런/.test(song)) return "홈런";
  if (/라인업|선발/.test(song)) return "라인업";
  if (/경기 시작|개시|인트로|PLAY BALL/i.test(song)) return "경기 시작";
  if (/견제|투수 교체|삼진|호수비|아웃/.test(song)) return "수비/전환";
  if (/승리|챔피언|Rock|허슬|결투|아리아|파이널/i.test(song)) return "후반/결속";
  return "일반 팀응원";
}

function buildSituationSummary(songs) {
  const bySituation = new Map();
  for (const song of songs) {
    const key = inferSituation(song);
    const arr = bySituation.get(key) || [];
    arr.push(song);
    bySituation.set(key, arr);
  }
  const order = ["경기 시작", "라인업", "안타", "홈런", "풀카운트", "볼넷", "수비/전환", "후반/결속", "일반 팀응원"];
  const lines = [];
  for (const key of order) {
    const list = bySituation.get(key);
    if (!list?.length) continue;
    lines.push(`- ${key}: ${list.slice(0, 6).join(", ")}${list.length > 6 ? " ..." : ""}`);
  }
  return lines.join("\n");
}

function buildMatchTable(songs, wikiUrl, mainYoutubeUrl) {
  const rows = ["| 곡명 | 상황 | 매칭 링크 |", "|---|---|---|"];
  for (const song of songs) {
    const situation = inferSituation(song);
    const links = [];
    if (mainYoutubeUrl) links.push(`[유튜브](${mainYoutubeUrl})`);
    if (wikiUrl) links.push(`[나무위키](${wikiUrl})`);
    rows.push(`| ${song} | ${situation} | ${links.join(" / ")} |`);
  }
  return rows.join("\n");
}

async function main() {
  const doc = await readFile(sourcePath, "utf8");
  const sections = splitTeamSections(doc);
  await mkdir(outDir, { recursive: true });

  for (const [teamName, section] of Object.entries(sections)) {
    const slug = slugByTeam[teamName];
    if (!slug) continue;
    const wikiUrl = extractFirstMatch(section, /\*\*참고 위키:\*\* \[[^\]]+]\((https?:\/\/[^)]+)\)/);
    const officialUrl = extractFirstMatch(section, /\*\*공식:\*\*\s*(https?:\/\/\S+)/);
    const ytLinks = extractAllYoutubeLinks(section);
    const songs = extractSongs(section);
    const mainYt = ytLinks[0] || "";
    const scopeNote =
      slug === "ssg"
        ? "\n- 범위: 구단 공통 응원곡만 (곡명에「등장곡」이 붙은 타임라인 항목은 추출에서 제외. 개인곡은 별도 문서 예정)"
        : "";

    const md = `# ${teamName} 응원가 정리 (상황별)

- 참고 위키: ${wikiUrl || "-"}
- 대표 영상: ${mainYt || "-"}
- 공식 페이지: ${officialUrl || "-"}${scopeNote}

## 상황별 빠른 보기

${buildSituationSummary(songs) || "- 수집된 곡 정보가 없습니다."}

## 곡명-링크 매칭표

${buildMatchTable(songs, wikiUrl, mainYt)}
`;

    await writeFile(path.join(outDir, `${slug}-cheering.md`), md, "utf8");
  }

  console.log("generate-team-cheering-docs: ok");
}

await main();
