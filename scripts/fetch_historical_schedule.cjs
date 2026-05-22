// Fetches 2020-2025 schedule + score data from api.fullcount.kr
// Generates mobile/lib/scheduleData.ts with embedded local data
//
// Usage: node scripts/fetch_historical_schedule.js

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.fullcount.kr";

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "Accept": "application/json" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}: ${data.slice(0, 200)}`));
          } else {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`JSON parse error for ${url}: ${e.message}`));
            }
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // 1. Fetch schedule data for each year/month
  console.log("Fetching schedule data...");
  const scheduleData = {};

  for (const year of years) {
    for (const month of months) {
      const key = `${year}:${month}`;
      try {
        const data = await fetch(`${API_BASE}/schedule/${month}?year=${year}`);
        const games = data.games || [];
        if (games.length > 0) {
          // Strip out month/day since they're derivable from date
          scheduleData[key] = games.map((g) => ({
            date: g.date,
            venue: g.venue,
            away: g.away,
            home: g.home,
            ...(g.time ? { time: g.time } : {}),
          }));
        }
      } catch (e) {
        console.warn(`  Failed to fetch schedule ${key}: ${e.message}`);
      }
    }
    console.log(`  ${year}: ${Object.keys(scheduleData).filter((k) => k.startsWith(String(year))).length} months with games`);
  }

  // 2. Fetch bulk daily scores (returns ALL years data)
  console.log("\nFetching daily scores...");
  const allScores = await fetch(`${API_BASE}/daily-scores`);
  console.log(`  Total dates with scores: ${Object.keys(allScores).length}`);

  // 3. Filter scores for 2020-2025
  const scoresData = {};
  for (const [date, entries] of Object.entries(allScores)) {
    const year = date.slice(0, 4);
    if (years.includes(parseInt(year))) {
      scoresData[date] = entries;
    }
  }
  console.log(`  2020-2025 dates: ${Object.keys(scoresData).length}`);

  // 4. Count total entries
  const totalScheduleGames = Object.values(scheduleData).reduce((a, g) => a + g.length, 0);
  const totalScoreEntries = Object.values(scoresData).reduce((a, g) => a + g.length, 0);
  console.log(`\nTotal schedule games: ${totalScheduleGames}`);
  console.log(`Total score entries: ${totalScoreEntries}`);

  // 5. Generate TypeScript file (compact JSON to minimize bundle size)
  const outputPath = path.join(__dirname, "..", "mobile", "lib", "scheduleData.ts");
  const lines = [];

  lines.push('import type { ScheduleGame, ScoreEntry } from "./api";\n');
  lines.push("// Key: \"{year}:{month}\"\n");
  lines.push("export const LOCAL_SCHEDULE: Record<string, ScheduleGame[]> = {\n");
  for (const year of years) {
    for (const month of months) {
      const key = `${year}:${month}`;
      const games = scheduleData[key];
      if (games && games.length > 0) {
        lines.push(`  "${key}": ${JSON.stringify(games)},\n`);
      }
    }
  }
  lines.push("};\n\n");
  lines.push("// Key: \"YYYY-MM-DD\"\n");
  lines.push("export const LOCAL_SCORES: Record<string, ScoreEntry[]> = {\n");
  const sortedDates = Object.keys(scoresData).sort();
  for (const date of sortedDates) {
    const entries = scoresData[date];
    lines.push(`  "${date}": ${JSON.stringify(entries)},\n`);
  }
  lines.push("};\n");

  fs.writeFileSync(outputPath, lines.join(""));
  console.log(`\nGenerated: ${outputPath}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
