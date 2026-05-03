@echo off
REM 데이터 업데이트 후 deploy 폴더에 반영하는 스크립트 (cmd 전용)

echo === 1. Data update ===
python scripts\update_hub_data.py || echo Warning: Hub data update had issues
python scripts\fetch_kbo_standings.py || echo Warning: Standings update had issues
python scripts\generate_team_config.py || echo Warning: Config generation had issues

echo === 2. Fix png to jpg references ===
REM js/team-config.py
powershell -Command "(gc js/team-config.js -Raw -Encoding UTF8) -replace '\.png', '.jpg' | sc js/team-config.js -Encoding UTF8 -NoNewline"
REM data files
powershell -Command "(gc data/teams/index.json -Raw -Encoding UTF8) -replace '\.png', '.jpg' | sc data/teams/index.json -Encoding UTF8 -NoNewline"
powershell -Command "(gc data/food-places.json -Raw -Encoding UTF8) -replace '\.png', '.jpg' | sc data/food-places.json -Encoding UTF8 -NoNewline"

echo === 3. Git commit and push ===
git add data/ js/
git diff --staged --quiet || (git commit -m "Auto-update data" && git push)
echo === Done ===
