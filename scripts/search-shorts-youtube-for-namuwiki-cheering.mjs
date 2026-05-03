/**
 * docs/*-namuwiki-cheering.md 의 "  - `곡`: URL" 줄을 yt-dlp 검색으로 갱신합니다.
 * 짧은 영상(약 8~120초)을 우선 골라 youtube.com/shorts/ID 형태로 씁니다.
 *
 * 사용: node scripts/search-shorts-youtube-for-namuwiki-cheering.mjs [팀slug ...]
 * 예: node scripts/search-shorts-youtube-for-namuwiki-cheering.mjs nc doosan
 */
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const backupsDir = path.join(root, "backups");
const cachePath = path.join(root, "scripts", ".cheering-shorts-search-cache.json");

const LINK_HEADER_RE = /^- 링크 \(곡명 ↔ 유튜브\):$/;
const LINK_ITEM_RE = /^(\s{2}- `[^`]+`:\s*)(.+)$/;

function songTitleFromLinkLine(line) {
  const m = line.match(/^\s{2}- `([^`]+)`:/);
  return m ? m[1].trim() : "";
}

/** 검색어용: 괄호·이모지 등 제거(캐시 키는 원본 곡명 유지) */
function normalizeForQuery(song) {
  return song
    .replace(/\([^)]*\)/g, " ")
    .replace(/[👏🏻#]/gu, " ")
    .replace(/\s+/g, " ")
    .trim() || song;
}

function ytSearchRows(query) {
  try {
    const out = execFileSync(
      "yt-dlp",
      [
        `ytsearch6:${query}`,
        "--no-warnings",
        "--skip-download",
        "-O",
        "%(id)s\t%(duration)s\t%(webpage_url)s",
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 35000,
        maxBuffer: 8 * 1024 * 1024,
      }
    );
    return out
      .trim()
      .split(/\n/)
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("\t");
        const id = parts[0] || "";
        const duration = Number(parts[1]);
        const url = parts.slice(2).join("\t") || "";
        return {
          id,
          duration: Number.isFinite(duration) ? duration : 9999,
          url,
        };
      })
      .filter((r) => /^[a-zA-Z0-9_-]{11}$/.test(r.id));
  } catch {
    return [];
  }
}

function pickShortClip(rows) {
  if (!rows.length) return "";
  const band = rows.filter((r) => r.duration >= 8 && r.duration <= 120);
  const pool = band.length ? band : rows.filter((r) => r.duration > 0 && r.duration <= 240);
  const sorted = (pool.length ? pool : rows).slice().sort((a, b) => a.duration - b.duration);
  const id = sorted[0].id;
  return `https://www.youtube.com/shorts/${id}`;
}

function searchShortsForSong(cache, teamName, song) {
  if (!song || song.includes("별도 고정 곡 명시 없음")) return "";
  const key = `${teamName}::${song}`;
  if (cache[key]) return cache[key];

  const qSong = normalizeForQuery(song);
  const queries = [
    `${teamName} ${qSong} 응원`,
    `${qSong} ${teamName} 쇼츠`,
    `${teamName} ${qSong}`,
  ];
  let lastRows = [];
  for (const q of queries) {
    const rows = ytSearchRows(q);
    lastRows = rows;
    const url = pickShortClip(rows);
    if (url) {
      cache[key] = url;
      return url;
    }
  }
  if (lastRows.length) {
    const url = `https://www.youtube.com/shorts/${lastRows[0].id}`;
    cache[key] = url;
    return url;
  }
  return "";
}

async function loadCache() {
  try {
    const raw = await readFile(cachePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

async function backupCheeringHtml() {
  await mkdir(backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:]/g, "-").split(".")[0];
  const dest = path.join(backupsDir, `cheering-${stamp}.html`);
  await copyFile(path.join(root, "cheering.html"), dest);
  return dest;
}

async function processFile(filePath, cache) {
  const text = await readFile(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const titleLine = lines.find((l) => l.startsWith("# "));
  const teamName = titleLine
    ? titleLine.replace(/^#\s*/, "").replace(/\s*응원가.+$/, "").trim()
    : "";

  const out = [];
  let inLinkBlock = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (LINK_HEADER_RE.test(line.trim())) {
      inLinkBlock = true;
      out.push(line);
      continue;
    }
    if (inLinkBlock) {
      if (line.trim() === "" || line.startsWith("## ") || line.startsWith("### ") || line.startsWith("- 곡:") || line.startsWith("- 설명:")) {
        inLinkBlock = false;
        out.push(line);
        continue;
      }
      const m = line.match(LINK_ITEM_RE);
      if (m) {
        const prefix = m[1];
        const rest = m[2].trim();
        if (rest.includes("유튜브 검색 결과 없음") || rest.includes("검색 실패") || rest.includes("URL 없음")) {
          out.push(line);
          continue;
        }
        const song = songTitleFromLinkLine(line);
        const found = searchShortsForSong(cache, teamName, song);
        if (found) {
          out.push(`${prefix}${found}`);
          process.stdout.write(".");
        } else {
          out.push(line);
          process.stdout.write("x");
        }
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
    }
    out.push(line);
  }

  await writeFile(filePath, `${out.join("\n")}\n`, "utf8");
}

let files = (await readdir(docsDir))
  .filter((n) => n.endsWith("-namuwiki-cheering.md"))
  .map((n) => path.join(docsDir, n));

const only = process.argv.slice(2).filter(Boolean);
if (only.length) {
  const want = new Set(only.map((s) => s.replace(/-namuwiki-cheering\.md$/i, "").replace(/\.md$/i, "")));
  files = files.filter((fp) => want.has(path.basename(fp, "-namuwiki-cheering.md")));
}

const cache = await loadCache();
const bak = await backupCheeringHtml();
console.log("backup:", bak);

for (const fp of files) {
  process.stdout.write(`\n${path.basename(fp)}`);
  await processFile(fp, cache);
}

await saveCache(cache);
console.log("\nsearch-shorts-youtube-for-namuwiki-cheering: ok");
