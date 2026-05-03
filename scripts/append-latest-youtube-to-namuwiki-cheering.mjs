import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");

/** `  - `곡`: …` 한 줄 */
const LINK_ITEM_RE = /^\s{2}- `([^`]+)`:\s*(.+)$/;

function searchYoutube(query) {
  try {
    return execFileSync(
      "yt-dlp",
      [
        "--no-warnings",
        "--no-playlist",
        "--skip-download",
        "--print",
        "webpage_url",
        `ytsearch1:${query}`,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 20000,
      }
    ).trim();
  } catch {
    return "";
  }
}

function videoIdFromUrl(u) {
  if (!u) return "";
  const m = String(u).match(/(?:[?&]v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}

function canonicalWatchUrl(u) {
  const id = videoIdFromUrl(u);
  return id ? `https://www.youtube.com/watch?v=${id}` : String(u).trim();
}

/** rest: 단일 URL 또는 `기존: … · 최신…` */
function extractPrimaryUrl(rest) {
  const labeled = rest.match(/기존:\s*(https?:\/\/[^\s·]+)/);
  if (labeled) return labeled[1];
  const plain = rest.match(/https?:\/\/[^\s·]+/);
  return plain ? plain[0] : "";
}

function buildLinkRest(primaryRaw, latestRaw) {
  const p = primaryRaw ? canonicalWatchUrl(primaryRaw) : "";
  const l = latestRaw ? canonicalWatchUrl(latestRaw) : "";
  if (!p && !l) return "*(URL 없음)*";
  if (!p && l) return `*(기존 링크 없음)* · 최신(검색): ${l}`;
  if (!l) return `기존: ${p} · 최신(검색): *(없음)*`;
  if (videoIdFromUrl(p) === videoIdFromUrl(l)) {
    return `기존: ${p} · 최신(검색·동일): ${l}`;
  }
  return `기존: ${p} · 최신(검색): ${l}`;
}

let files = (await readdir(docsDir))
  .filter((n) => n.endsWith("-namuwiki-cheering.md"))
  .map((n) => path.join(docsDir, n));

const onlySlugs = process.argv.slice(2).filter(Boolean);
if (onlySlugs.length) {
  const want = new Set(onlySlugs.map((s) => s.replace(/\.md$/i, "")));
  files = files.filter((fp) => {
    const base = path.basename(fp, "-namuwiki-cheering.md");
    return want.has(base);
  });
}

const cache = new Map();

for (const filePath of files) {
  const lines = (await readFile(filePath, "utf8")).split(/\r?\n/);
  const titleLine = lines.find((l) => l.startsWith("# ")) || "";
  const teamName = titleLine.replace(/^#\s*/, "").replace(/\s*응원가.+$/, "").trim();
  let currentHeading = "";

  const out = [];
  for (const line of lines) {
    if (line.startsWith("### ")) {
      currentHeading = line.replace(/^###\s+/, "").trim();
      out.push(line);
      continue;
    }

    const m = line.match(LINK_ITEM_RE);
    if (!m) {
      out.push(line);
      continue;
    }

    const title = m[1].trim();
    const rest = m[2].trim();
    const primary = extractPrimaryUrl(rest);

    const isPlaceholder = /별도 고정 곡 명시 없음/.test(title);
    const querySong = isPlaceholder
      ? `${currentHeading.replace(/\s*\/\s*/g, " ")} ${teamName} 응원가`
      : `${teamName} ${title} 응원가`;

    const cacheKey = `${teamName}::${querySong}`;
    if (!cache.has(cacheKey)) {
      cache.set(cacheKey, searchYoutube(querySong));
    }
    const latest = cache.get(cacheKey) || "";

    out.push(`  - \`${title}\`: ${buildLinkRest(primary, latest)}`);
  }

  await writeFile(filePath, `${out.join("\n")}\n`, "utf8");
}

console.log(
  "append-latest-youtube-to-namuwiki-cheering:",
  files.length,
  "files,",
  cache.size,
  "unique searches"
);
