// Add month/day fields to LOCAL_SCHEDULE entries, derived from date
// Usage: node scripts/fix_schedule_fields.cjs

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "mobile", "lib", "scheduleData.ts");
let content = fs.readFileSync(filePath, "utf8");

// Fix LOCAL_SCHEDULE entries: add month/day to each game object
// Current: {"date":"2020-03-14","venue":"고척","away":"KT","home":"키움","time":"13:00"}
// Target:  {"date":"2020-03-14","month":3,"day":14,"venue":"고척","away":"KT","home":"키움","time":"13:00"}

const lines = content.split("\n");
let inSched = true; // LOCAL_SCHEDULE is first, LOCAL_SCORES is second

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect switch from LOCAL_SCHEDULE to LOCAL_SCORES
  if (line.includes("export const LOCAL_SCORES")) {
    inSched = false;
    continue;
  }

  // Skip non-data lines
  if (!line.trim().startsWith('"') || inSched === false) continue;

  // In schedule data: replace each game object to add month/day
  // Match the pattern: {"date":"YYYY-MM-DD",...
  const replaced = line.replace(
    /\{"date":"(\d{4})-(\d{2})-(\d{2})",/g,
    (_, year, month, day) => {
      return `{"date":"${year}-${month}-${day}","month":${parseInt(month)},"day":${parseInt(day)},`;
    }
  );

  if (replaced !== line) {
    lines[i] = replaced;
  }
}

const result = lines.join("\n");
fs.writeFileSync(filePath, result);

const oldSize = (content.length / 1024 / 1024).toFixed(2);
const newSize = (result.length / 1024 / 1024).toFixed(2);
console.log(`Fixed: ${oldSize}MB → ${newSize}MB`);
