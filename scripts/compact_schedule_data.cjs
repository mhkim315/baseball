// Compact the generated scheduleData.ts by rewriting JSON values in compact form
// Usage: node scripts/compact_schedule_data.cjs

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "mobile", "lib", "scheduleData.ts");
let content = fs.readFileSync(filePath, "utf8");

// Extract each key-value line and compact the JSON value
// Pattern:   "key": [{...}, {...}],
// Replace each indented JSON array/object with its compact version
const lines = content.split("\n");
let inSched = false;
let inScores = false;
let result = [];
let currentKey = null;
let jsonBuffer = [];
let braceDepth = 0;
let bracketDepth = 0;

function isValueStart(line) {
  return /^\s*"\d+:\d+"|^\s*"\d{4}-\d{2}-\d{2}"/.test(line);
}

// Simpler approach: process the file line by line
let output = [];
let i = 0;

// Copy header (import + comments + const declarations)
while (i < lines.length) {
  const line = lines[i];
  output.push(line);
  i++;

  // After "export const LOCAL_SCHEDULE: ... = {" line, start collecting
  if (line.includes("export const LOCAL_SCHEDULE")) {
    break;
  }
}

// Process LOCAL_SCHEDULE entries (each line like `"2020:3": [...],`)
while (i < lines.length) {
  const line = lines[i];
  // End of LOCAL_SCHEDULE
  if (line.startsWith("}")) {
    output.push(line);
    i++;
    break;
  }

  // Line with key + JSON value: `  "2020:3": [{...},{...}],`
  // In indented format, it spans multiple lines
  // Collect all lines until we hit the closing `],`
  if (isValueStart(line)) {
    let keyEnd = line.indexOf(": [");
    if (keyEnd === -1) keyEnd = line.indexOf(': [');

    // Multi-line collection
    let jsonLines = [line];
    let depth = (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
    let j = i + 1;
    while (depth > 0 && j < lines.length) {
      jsonLines.push(lines[j]);
      depth += (lines[j].match(/\[/g) || []).length;
      depth -= (lines[j].match(/\]/g) || []).length;
      j++;
    }

    // Parse the combined JSON
    const jsonStr = jsonLines.join("").replace(/^\s*"[^"]+":\s*/, "").replace(/,$/, "");
    const parsed = JSON.parse(jsonStr);
    // Extract key
    const keyMatch = jsonLines[0].match(/^\s*"([^"]+)":\s*/);
    const key = keyMatch ? keyMatch[1] : "???";
    output.push(`  "${key}": ${JSON.stringify(parsed)},`);

    i = j;
  } else {
    i++;
  }
}

// Copy until LOCAL_SCORES
while (i < lines.length) {
  const line = lines[i];
  if (line.includes("export const LOCAL_SCORES")) {
    output.push(line);
    i++;
    break;
  }
  i++;
}

// Process LOCAL_SCORES entries (each line like `"2020-05-05": [...],`)
while (i < lines.length) {
  const line = lines[i];
  if (line.startsWith("}")) {
    output.push(line);
    i++;
    break;
  }

  if (isValueStart(line)) {
    let jsonLines = [line];
    let depth = (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
    let j = i + 1;
    while (depth > 0 && j < lines.length) {
      jsonLines.push(lines[j]);
      depth += (lines[j].match(/\[/g) || []).length;
      depth -= (lines[j].match(/\]/g) || []).length;
      j++;
    }

    const jsonStr = jsonLines.join("").replace(/^\s*"[^"]+":\s*/, "").replace(/,$/, "");
    const parsed = JSON.parse(jsonStr);
    const keyMatch = jsonLines[0].match(/^\s*"([^"]+)":\s*/);
    const key = keyMatch ? keyMatch[1] : "???";
    output.push(`  "${key}": ${JSON.stringify(parsed)},`);

    i = j;
  } else {
    i++;
  }
}

// Copy any remaining lines
while (i < lines.length) {
  output.push(lines[i]);
  i++;
}

const result2 = output.join("\n");
fs.writeFileSync(filePath, result2);

const oldSize = (content.length / 1024 / 1024).toFixed(2);
const newSize = (result2.length / 1024 / 1024).toFixed(2);
console.log(`Compacted: ${oldSize}MB → ${newSize}MB (${result2.split('\n').length} lines)`);
