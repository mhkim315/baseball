// Strip awayStarter, homeStarter, gameId from LOCAL_SCORES entries
// Usage: node scripts/strip_extra_score_fields.cjs

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "mobile", "lib", "scheduleData.ts");
let content = fs.readFileSync(filePath, "utf8");

// Parse and rebuild the file, keeping only allowed ScoreEntry fields
const allowed = new Set(["away", "home", "awayScore", "homeScore", "outcome", "cancelled", "winPitcher", "losePitcher", "gameIdx"]);

// We need to find LOCAL_SCORES and strip extra fields from each entry
const lines = content.split("\n");
let inScores = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes("export const LOCAL_SCORES")) {
    inScores = true;
    continue;
  }

  if (!inScores || line.trim() === "};" || !line.trim().startsWith('"')) continue;

  // Parse the JSON value (everything after "key": )
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) continue;

  const key = line.substring(0, colonIdx + 1);
  let jsonStr = line.substring(colonIdx + 1).trim();

  // Remove trailing comma
  if (jsonStr.endsWith(",")) jsonStr = jsonStr.slice(0, -1);

  try {
    const entries = JSON.parse(jsonStr);
    const cleaned = entries.map((e) => {
      const obj = {};
      for (const [k, v] of Object.entries(e)) {
        if (allowed.has(k)) obj[k] = v;
      }
      return obj;
    });
    lines[i] = `  ${key} ${JSON.stringify(cleaned)},`;
  } catch {
    // If parsing fails (shouldn't happen), leave the line unchanged
    console.warn(`Failed to parse line ${i + 1}`);
  }
}

const result = lines.join("\n");
fs.writeFileSync(filePath, result);

const oldSize = (content.length / 1024 / 1024).toFixed(2);
const newSize = (result.length / 1024 / 1024).toFixed(2);
console.log(`Stripped: ${oldSize}MB → ${newSize}MB`);
