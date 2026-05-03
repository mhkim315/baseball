import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const videos = [
  { team: "두산", id: "M4ZjtWK3UqI", note: "두산 베어스TV 플레이리스트(야구장 가면서)" },
  { team: "롯데", id: "HfqKC-G3dDA", note: "나무위키 링크된 2024 팀 모음" },
  { team: "삼성", id: "AmQC5K6_HUs", note: "라인업송 MR" },
  { team: "KIA", id: "ZEPS5Bm3iqc", note: "KIA 응원가 문서 상단" },
  { team: "키움", id: "OjoYnwcZMOI", note: "키움 응원가 개요" },
  { team: "NC", id: "8GE3PEiMdIo", note: "팬 직캠 모음" },
  { team: "한화", id: "45IrJtdGtDk", note: "불타는 태양 예시" },
  { team: "SSG", id: "Ygn_Ua41K_c", note: "불꽃투혼 2026 M/V" },
  { team: "KT_라인업", id: "b93bdB1SjXs", note: "라인업 MR" },
  { team: "LG", id: "QDOl5kmOPXA", note: "LGTWINSTV 2024 팀 모음" },
];

const out = [];
for (const v of videos) {
  try {
    const buf = execFileSync("yt-dlp", ["-J", "--skip-download", `https://www.youtube.com/watch?v=${v.id}`], {
      maxBuffer: 50 * 1024 * 1024,
    });
    const text = buf.toString("utf8").replace(/^\uFEFF/, "");
    const j = JSON.parse(text);
    out.push({
      team: v.team,
      id: v.id,
      note: v.note,
      title: j.title,
      uploader: j.uploader,
      url: j.webpage_url,
      description: j.description || "",
    });
  } catch (e) {
    out.push({ team: v.team, id: v.id, error: String(e) });
  }
}

writeFileSync(new URL("../docs/_yt_batch_descriptions.json", import.meta.url), JSON.stringify(out, null, 2), "utf8");
console.log("wrote docs/_yt_batch_descriptions.json", out.length);
