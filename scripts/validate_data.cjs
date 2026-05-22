// Validate scheduleData.ts data structure
const fs = require("fs");

const src = fs.readFileSync("lib/scheduleData.ts", "utf8");

// Extract LOCAL_SCHEDULE entries
const schedMatch = src.match(/LOCAL_SCHEDULE[^=]+=\s*\{([\s\S]*?)\};/);
const scoresMatch = src.match(/LOCAL_SCORES[^=]+=\s*\{([\s\S]*?)\};/);

if (!schedMatch) console.error("ERROR: Cannot parse LOCAL_SCHEDULE");
else {
  const schedEntries = schedMatch[1].match(/"\d+:\d+":\[/g);
  console.log("LOCAL_SCHEDULE entries:", schedEntries?.length);

  // Simulate lookup
  const testCases = [
    [5, 2025],
    [4, 2025],
    [3, 2024],
    [10, 2020],
  ];
  for (const [month, year] of testCases) {
    const key = `"${year}:${month}":[`;
    const found = schedMatch[1].includes(key);
    console.log(`  LOCAL_SCHEDULE["${year}:${month}"]: ${found ? "OK" : "MISSING"}`);
  }
}

if (!scoresMatch) console.error("ERROR: Cannot parse LOCAL_SCORES");
else {
  const scoreKeys = scoresMatch[1].match(/"\d{4}-\d{2}-\d{2}":\[/g);
  console.log("\nLOCAL_SCORES entries:", scoreKeys?.length);

  // Simulate year filtering
  for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
    const count = scoresMatch[1].match(new RegExp(`"${year}-\\d{2}-\\d{2}"\\s*:\\[`, "g"))?.length || 0;
    console.log(`  ${year} dates: ${count}`);
  }

  // Test cachedAllDailyScores year filter would work
  const year2025 = scoresMatch[1].split("\n").filter((l) => l.trim().startsWith('"2025-'));
  console.log(`\ncachedAllDailyScores(2025) would return: ${year2025.length} dates`);
}

// Verify month/day fields exist in schedule data
const hasMonthFields = src.includes('"month":');
const hasDayFields = src.includes('"day":');
console.log("\nSchedule data has month field:", hasMonthFields);
console.log("Schedule data has day field:", hasDayFields);

// No extra fields in score data (awayStarter etc.)
const hasExtraFields = src.includes('"awayStarter"') || src.includes('"homeStarter"') || src.includes('"gameId"');
console.log("Score data has extra fields:", hasExtraFields);

console.log("\nFile size:", (src.length / 1024 / 1024).toFixed(2), "MB");
