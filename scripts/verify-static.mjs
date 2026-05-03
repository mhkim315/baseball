import { access, readdir, readFile } from "node:fs/promises";

const teams = ["doosan", "lg", "kiwoom", "ssg", "kt", "hanwha", "samsung", "kia", "lotte", "nc"];
const publicPages = [
  "index.html",
  "stadium-guide.html",
  "rules.html",
  "schedule-standings.html",
  "cheering.html",
];

for (const page of publicPages) {
  const html = await readFile(page, "utf8");
  if (!html.includes('id="team-selector"')) throw new Error(`${page}: team selector missing`);
}
const cheeringHtml = await readFile("cheering.html", "utf8");
if (!cheeringHtml.includes("cheering-page.js")) throw new Error("cheering.html: cheering-page.js module missing");
if (!cheeringHtml.includes('id="cheering-main"')) throw new Error("cheering.html: cheering main missing");

const adminHtml = await readFile("food-admin.html", "utf8");
if (!adminHtml.includes('id="admin-marker-layer"')) throw new Error("food-admin.html: admin marker layer missing");

const stadiumMapAdminHtml = await readFile("stadium-map-admin.html", "utf8");
for (const id of [
  'id="stadium-admin-map"',
  'id="stadium-admin-spot-list"',
  'id="load-error"',
  "stadium-map-admin-page.js",
]) {
  if (!stadiumMapAdminHtml.includes(id)) throw new Error(`stadium-map-admin.html: ${id} missing`);
}

const stadiumGuideHtml = await readFile("stadium-guide.html", "utf8");
for (const id of [
  'id="seat-panel"',
  'id="seat-image"',
  'id="map-panel"',
  'id="stadium-map-root"',
  'id="food-panel"',
  'id="food-floor-tabs"',
  'id="food-marker-layer"',
]) {
  if (!stadiumGuideHtml.includes(id)) throw new Error(`stadium-guide.html: ${id} missing`);
}

for (const team of teams) {
  for (const file of ["lineup.json", "game-preview.json", "live-results.json"]) {
    await access(`data/teams/${team}/${file}`);
  }
}

await access("data/kbo_schedule_2026.json");
await access("data/kbo_standings.json");
await access("data/food-places.json");
await access("data/stadium-surroundings.json");
await access("data/cheering-patterns.json");
await readdir("picture/stadium-seats");
await readdir("picture/food-admin-maps");
console.log("verify-static: ok");
