@AGENTS.md

# Build rule
- EAS build (`eas build`)은 사용자가 명시적으로 요청할 때만 실행할 것. 절대 자동으로 빌드하지 않음.
- AAB 빌드 시에는 `mobile/app.json`의 `version`과 `versionCode`를 자동으로 1씩 증가시킨 후 빌드할 것.
