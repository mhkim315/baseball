/**
 * docs/*-namuwiki-cheering.md 응원가 줄을 곡당 단일 유튜브 URL로 정리합니다.
 * 기존/최신 두 링크가 있으면 yt-dlp로 재생 시간을 조회해,
 * 3분(180초) 이하 클립을 우선하고, 없으면 더 짧은 쪽을 고릅니다.
 */
import { execFileSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs");
const MAX_SINGLE_SONG_SEC = 180;

const durationCache = new Map();

function ytDurationSeconds(url) {
  if (!url) return null;
  const key = url.split("&")[0];
  if (durationCache.has(key)) return durationCache.get(key);
  try {
    const out = execFileSync(
      "yt-dlp",
      ["--no-download", "--ignore-no-formats-error", "--print", "%(duration)s", url],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1024 * 1024 }
    ).trim();
    const n = Number(out);
    const v = Number.isFinite(n) ? n : null;
    durationCache.set(key, v);
    return v;
  } catch {
    durationCache.set(key, null);
    return null;
  }
}

function extractUrls(rest) {
  const s = String(rest).trim();
  const out = [];
  const oldM = s.match(/기존:\s*(https?:\/\/[^\s·]+)/);
  if (oldM) out.push({ role: "기존", url: cleanUrl(oldM[1]) });
  const latestM = s.match(/최신\([^)]*\):\s*(https?:\/\/[^\s·]+)/);
  if (latestM) out.push({ role: "최신", url: cleanUrl(latestM[1]) });
  const any = s.match(/https?:\/\/[^\s·]+/g) || [];
  for (const u of any) {
    const url = cleanUrl(u);
    if (!out.some((x) => x.url === url)) out.push({ role: "기타", url });
  }
  return out;
}

function cleanUrl(u) {
  return String(u).replace(/[），,)\]]+$/u, "").trim();
}

function pickBestUrl(entries) {
  const urls = [...new Set(entries.map((e) => e.url).filter(Boolean))];
  if (urls.length === 0) return "";
  if (urls.length === 1) return urls[0];

  const scored = urls.map((url) => {
    const d = ytDurationSeconds(url);
    const under = d != null && d <= MAX_SINGLE_SONG_SEC;
    const preferOld = entries.find((e) => e.url === url && e.role === "기존");
    return { url, d, under, preferOld: !!preferOld };
  });

  const unders = scored.filter((x) => x.under);
  const pool = unders.length ? unders : scored;

  pool.sort((a, b) => {
    const da = a.d ?? 1e9;
    const db = b.d ?? 1e9;
    if (da !== db) return da - db;
    if (a.preferOld !== b.preferOld) return a.preferOld ? -1 : 1;
    return 0;
  });
  return pool[0].url;
}

function normalizeLine(line) {
  const m = line.match(/^(\s*-\s*`[^`]+`:\s*)(.+)$/);
  if (!m) return line;
  const prefix = m[1];
  const rest = m[2].trim();
  if (rest.includes("*(유튜브 검색 결과 없음)*") || rest === "*(유튜브 검색 결과 없음)*") {
    return line;
  }
  if (!/https?:\/\//.test(rest)) return line;
  if (!/기존:|최신\(/.test(rest) && /^https?:\/\//.test(rest)) {
    return `${prefix}${cleanUrl(rest)}`;
  }
  const entries = extractUrls(rest);
  const chosen = pickBestUrl(entries);
  if (!chosen) return line;
  return `${prefix}${chosen}`;
}

async function main() {
  const names = await readdir(docsDir);
  const files = names.filter((n) => n.endsWith("-namuwiki-cheering.md"));
  if (files.length === 0) {
    console.error("no *-namuwiki-cheering.md under docs/");
    process.exit(1);
  }
  for (const name of files.sort()) {
    const fp = path.join(docsDir, name);
    let md = await readFile(fp, "utf8");
    const lines = md.split(/\r?\n/);
    const next = lines.map(normalizeLine);
    const out = next.join("\n");
    if (out !== md) {
      await writeFile(fp, out, "utf8");
      console.log("updated", name);
    } else {
      console.log("unchanged", name);
    }
  }
  console.log("normalize-cheering-youtube: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
