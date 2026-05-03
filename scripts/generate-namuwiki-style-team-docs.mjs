import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "docs", "cheering-by-team");

const teams = [
  "doosan",
  "lg",
  "kiwoom",
  "ssg",
  "kt",
  "hanwha",
  "samsung",
  "kia",
  "lotte",
  "nc",
];

function parseTeamDoc(md) {
  const teamName = (md.match(/^#\s+(.+?)\s+응원가 정리/m) || [])[1] || "구단";
  const wikiUrl = (md.match(/- 참고 위키:\s*(https?:\/\/\S+)/) || [])[1] || "";
  const rowRe = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm;
  const rows = [];
  let m;
  while ((m = rowRe.exec(md)) !== null) {
    const song = m[1].trim();
    if (song === "곡명" || song.startsWith("---")) continue;
    if (/등장곡/.test(song)) continue;
    rows.push({ song, situation: m[2].trim(), links: m[3].trim() });
  }
  return { teamName, wikiUrl, rows };
}

function songsBySituation(rows, key) {
  return rows.filter((r) => r.situation === key).map((r) => r.song);
}

function take(list, n = 4) {
  return list.slice(0, n);
}

function fmtSongs(list) {
  if (!list.length) return "`별도 고정 곡 명시 없음`";
  return list.map((s) => `\`${s}\``).join(", ");
}

function formatUrlLines(rows, key, wikiUrl) {
  const urls = [...new Set(rows.filter((r) => r.situation === key).map((r) => {
    const m = r.links.match(/\((https?:\/\/[^)]+)\)/);
    return m ? m[1] : "";
  }).filter(Boolean))];
  if (!urls.length && wikiUrl) return `[나무위키](${wikiUrl})`;
  return urls.map((u) => `[링크](${u})`).join(", ");
}

function buildDoc({ teamName, wikiUrl, rows }) {
  const start = take(songsBySituation(rows, "경기 시작"), 3);
  const lineup = take(songsBySituation(rows, "라인업"), 3);
  const hit = take(songsBySituation(rows, "안타"), 5);
  const hr = rows.filter((r) => /홈런/.test(r.song)).map((r) => r.song);
  const full = take(songsBySituation(rows, "풀카운트"), 3);
  const walk = take(songsBySituation(rows, "볼넷"), 3);
  const transition = take(songsBySituation(rows, "수비/전환"), 5);
  const clutch = take(songsBySituation(rows, "후반/결속"), 5);
  const general = take(songsBySituation(rows, "일반 팀응원"), 5);

  return `# ${teamName} 응원가 가이드 (상황별)

- 원문: [${teamName}/응원가](${wikiUrl || "#"})
- 목적: 직관에서 자주 체감하는 상황별 음악을 빠르게 확인하기 위한 정리

## 경기 시작/초반

### 경기 시작 직전
- 곡: ${fmtSongs(start)}
- 설명: 경기 시작 직전(또는 인트로) 분위기를 여는 오프닝 구간에서 주로 쓰이는 곡.
- URL: ${formatUrlLines(rows, "경기 시작", wikiUrl)}

### 선발 소개/응원단 첫 집결
- 곡: ${fmtSongs(lineup)}
- 설명: 라인업 소개 및 첫 단체 응원 시작 타이밍에서 자주 나오는 곡.
- URL: ${formatUrlLines(rows, "라인업", wikiUrl)}

### 초반 분위기 올릴 때
- 곡: ${fmtSongs(general)}
- 설명: 1회~초반 이닝에 응원 강도를 올리고 떼창을 붙일 때 많이 쓰이는 축.
- URL: [나무위키](${wikiUrl || "#"})

## 타석 상황

### 안타가 나왔을 때 (공통)
- 곡: ${fmtSongs(hit)}
- 설명: 안타 직후 타자 이름 콜과 함께 반응하는 핵심 상황 음악.
- URL: ${formatUrlLines(rows, "안타", wikiUrl)}

### 홈런 타석/거포 타석
- 곡: ${fmtSongs(hr)}
- 설명: 장타 기대 타석에서 홈런 콜 또는 홈런형 구호가 붙는 구간.
- URL: [나무위키](${wikiUrl || "#"})

### 볼넷으로 출루했을 때
- 곡: ${fmtSongs(walk)}
- 설명: 볼넷 출루 상황에서 전환 리듬으로 사용되는 곡.
- URL: ${formatUrlLines(rows, "볼넷", wikiUrl)}

### 풀카운트 상황
- 곡: ${fmtSongs(full)}
- 설명: 풀카운트 전용 리듬/콜이 있을 때 쓰이는 상황 응원 곡.
- URL: ${formatUrlLines(rows, "풀카운트", wikiUrl)}

## 중후반/승부처

### 후반 리드 상황, 승부처
- 곡: ${fmtSongs(clutch)}
- 설명: 7회 이후 승부처에서 응원 에너지를 크게 끌어올리는 곡.
- URL: ${formatUrlLines(rows, "후반/결속", wikiUrl)}

### 수비 전환/특정 플레이 반응
- 곡: ${fmtSongs(transition)}
- 설명: 투수교체·삼진·호수비·견제 등 수비 이벤트에서 나오는 전환 음악.
- URL: ${formatUrlLines(rows, "수비/전환", wikiUrl)}

## 참고

- 선수별 타석 응원가/상세 운영은 팀 시즌 운영에 따라 달라질 수 있으므로, 경기 당일 구단 공지와 현장 응원단 안내를 함께 확인.
`;
}

for (const slug of teams) {
  const source = path.join(sourceDir, `${slug}-cheering.md`);
  const text = await readFile(source, "utf8");
  const parsed = parseTeamDoc(text);
  const out = buildDoc(parsed);
  await writeFile(path.join(root, "docs", `${slug}-namuwiki-cheering.md`), out, "utf8");
}

console.log("generate-namuwiki-style-team-docs: ok");
