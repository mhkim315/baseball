/** yt 검색으로 링크 블록을 통째로 다시 씀. 기존 URL을 유지한 채 최신만 덧붙이려면 append-latest-youtube-to-namuwiki-cheering.mjs 사용. */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");

function searchYoutube(query) {
  try {
    const out = execFileSync(
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
    return out || "";
  } catch {
    return "";
  }
}

/** 곡 줄에서 백틱 제목 전부 (플레이스홀더 포함) */
function parseAllSongTitles(songLine) {
  if (!songLine.startsWith("- 곡:")) return [];
  const songs = [];
  const regex = /`([^`]+)`/g;
  let m;
  while ((m = regex.exec(songLine)) !== null) {
    const song = m[1].trim();
    if (song) songs.push(song);
  }
  return songs;
}

/** yt-dlp 검색용: '별도 고정…' 은 검색어에서 제외 */
function searchTargetsFromSongs(songs) {
  return songs.filter((s) => !s.includes("별도 고정 곡 명시 없음"));
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function buildLinkBlock(displaySongs, urlBySong, fallbackUrl) {
  const header = "- 링크 (곡명 ↔ 유튜브):";
  const lines = [header];
  const display = displaySongs.length ? displaySongs : ["(검색·참고용)"];
  const urls = display.map((song) => {
    if (song === "(검색·참고용)") return fallbackUrl;
    return urlBySong.get(song) || fallbackUrl || "";
  });
  if (!urls.some(Boolean)) {
    lines.push("  - *(유튜브 검색 결과 없음)*");
    return lines;
  }
  for (let i = 0; i < display.length; i += 1) {
    const u = urls[i];
    if (u) lines.push(`  - \`${display[i]}\`: ${u}`);
    else lines.push(`  - \`${display[i]}\`: *(검색 실패)*`);
  }
  return lines;
}

const LINK_HEADER_RE = /^- 링크 \(곡명 ↔ 유튜브\):$/;
const LEGACY_URL_HEADER = "- URL:";

const files = (await readdir(docsDir))
  .filter((name) => name.endsWith("-namuwiki-cheering.md"))
  .map((name) => path.join(docsDir, name));

const cache = new Map();

for (const filePath of files) {
  const text = await readFile(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# ")) || "";
  const teamName = title.replace(/^#\s*/, "").replace(/\s*응원가.+$/, "").trim();

  const out = [];
  let currentHeading = "";

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      currentHeading = line.replace(/^###\s+/, "").trim();
      out.push(line);
      continue;
    }

    if (line.startsWith("- 곡:")) {
      out.push(line);
      continue;
    }

    const isLinkBlock =
      LINK_HEADER_RE.test(line.trim()) || line.startsWith(LEGACY_URL_HEADER);

    if (isLinkBlock) {
      let songsLine = "";
      for (let k = out.length - 1; k >= 0; k -= 1) {
        if (out[k].startsWith("### ")) break;
        if (out[k].startsWith("- 곡:")) {
          songsLine = out[k];
          break;
        }
      }
      const displaySongs = parseAllSongTitles(songsLine);
      const searchSongs = searchTargetsFromSongs(displaySongs);
      const targets =
        searchSongs.length > 0
          ? searchSongs
          : [`${currentHeading.replace(/\s*\/\s*/g, " ")} ${teamName} 응원가`];

      const urlBySong = new Map();
      for (const song of targets) {
        const key = `${teamName}::${song}`;
        if (!cache.has(key)) {
          const query = `${teamName} ${song} 응원가`;
          cache.set(key, searchYoutube(query));
        }
        const url = cache.get(key);
        if (url) urlBySong.set(song, url);
      }
      const pooled = unique([...urlBySong.values()]).slice(0, 8);
      const fallbackUrl = pooled[0] || "";

      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (next.trim() === "") break;
        if (next.startsWith("## ") || next.startsWith("### ") || next.startsWith("- 곡:") || next.startsWith("- 설명:")) break;
        j += 1;
      }

      out.push(...buildLinkBlock(displaySongs, urlBySong, fallbackUrl));
      i = j - 1;
      continue;
    }

    out.push(line);
  }

  await writeFile(filePath, `${out.join("\n")}\n`, "utf8");
}

console.log("fill-youtube-links-from-search: ok");
