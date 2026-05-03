import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");

function parseSongsFrom곡Line(line) {
  if (!line.startsWith("- 곡:")) return [];
  const songs = [];
  const re = /`([^`]+)`/g;
  let m;
  while ((m = re.exec(line)) !== null) songs.push(m[1].trim());
  return songs;
}

function isYoutubeBullet(line) {
  const t = line.trim();
  if (!t.startsWith("- ")) return false;
  const rest = t.slice(2).trim();
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\S+$/i.test(rest);
}

function extractUrlFromBullet(line) {
  return line.trim().slice(2).trim();
}

function buildLinkLines(songs, urls) {
  const header = "- 링크 (곡명 ↔ 유튜브):";
  const lines = [header];
  if (!urls.length) {
    lines.push("  - *(유튜브 링크 없음)*");
    return lines;
  }
  if (!songs.length) {
    urls.forEach((u, idx) => {
      lines.push(`  - 참고 영상 ${idx + 1}: ${u}`);
    });
    return lines;
  }
  const paired = Math.min(songs.length, urls.length);
  for (let i = 0; i < paired; i += 1) {
    lines.push(`  - \`${songs[i]}\`: ${urls[i]}`);
  }
  if (songs.length > paired) {
    for (let i = paired; i < songs.length; i += 1) {
      lines.push(`  - \`${songs[i]}\`: *(문서에 링크 개수 부족 — 미매칭)*`);
    }
  }
  if (urls.length > paired) {
    for (let i = paired; i < urls.length; i += 1) {
      lines.push(`  - *(추가 영상, 위 곡 목록과 1:1 매칭 아님)*: ${urls[i]}`);
    }
  }
  return lines;
}

function findSongsAbove(out) {
  for (let k = out.length - 1; k >= 0; k -= 1) {
    if (out[k].startsWith("### ")) break;
    if (out[k].startsWith("- 곡:")) return parseSongsFrom곡Line(out[k]);
  }
  return [];
}

async function transformFile(filePath) {
  const lines = (await readFile(filePath, "utf8")).split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("- URL:")) {
      const songs = findSongsAbove(out);
      const urls = [];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (next.trim() === "") break;
        if (
          next.startsWith("## ") ||
          next.startsWith("### ") ||
          next.startsWith("- 곡:") ||
          next.startsWith("- 설명:")
        ) {
          break;
        }
        if (isYoutubeBullet(next)) urls.push(extractUrlFromBullet(next));
        j += 1;
      }
      out.push(...buildLinkLines(songs, urls));
      i = j - 1;
      continue;
    }
    out.push(line);
  }
  await writeFile(filePath, `${out.join("\n")}\n`, "utf8");
}

const names = (await readdir(docsDir)).filter((n) => n.endsWith("-namuwiki-cheering.md"));
for (const name of names) {
  await transformFile(path.join(docsDir, name));
}
console.log("normalize-namuwiki-cheering-url-mapping:", names.length, "files");
