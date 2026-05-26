import type { ScoreEntry, ScheduleGame } from "./api";

// ============================================================
// KBO 포스트시즌 (가을야구) 경기 데이터
// ============================================================
// 포함: 와일드카드 결정전, 준플레이오프, 플레이오프, 한국시리즈
// 연도별 데이터: 2024 (완료), 2025 (완료), 2023~2021 (TODO)
// ============================================================

// Schedule entries for postseason games (merged by gameCache into schedule data)
export const POSTSEASON_SCHEDULE: Record<string, ScheduleGame[]> = {
  // ==================== 2024 포스트시즌 ====================

  // --- 와일드카드 결정전: KT vs 두산 (KT 2-0) ---
  "2024:10": [
    { date: "2024-10-02", month: 10, day: 2, venue: "잠실", away: "KT", home: "두산", time: "18:30", isPostseason: true },
    { date: "2024-10-03", month: 10, day: 3, venue: "잠실", away: "KT", home: "두산", time: "18:30", isPostseason: true },
    // --- 준플레이오프: LG vs KT (LG 3-2) ---
    { date: "2024-10-05", month: 10, day: 5, venue: "잠실", away: "KT", home: "LG", time: "18:30", isPostseason: true },
    { date: "2024-10-06", month: 10, day: 6, venue: "잠실", away: "KT", home: "LG", time: "18:30", isPostseason: true },
    { date: "2024-10-08", month: 10, day: 8, venue: "수원", away: "LG", home: "KT", time: "18:30", isPostseason: true },
    { date: "2024-10-09", month: 10, day: 9, venue: "수원", away: "LG", home: "KT", time: "18:30", isPostseason: true },
    { date: "2024-10-11", month: 10, day: 11, venue: "잠실", away: "KT", home: "LG", time: "18:30", isPostseason: true },
    // --- 플레이오프: 삼성 vs LG (삼성 3-1) ---
    { date: "2024-10-13", month: 10, day: 13, venue: "대구", away: "LG", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2024-10-15", month: 10, day: 15, venue: "대구", away: "LG", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2024-10-17", month: 10, day: 17, venue: "잠실", away: "삼성", home: "LG", time: "18:30", isPostseason: true },
    { date: "2024-10-19", month: 10, day: 19, venue: "잠실", away: "삼성", home: "LG", time: "18:30", isPostseason: true },
    // --- 한국시리즈: KIA vs 삼성 (KIA 4-1) ---
    // Game 1 was rained out from 10-21→10-22→10-23 (doubleheader with Game 2)
    { date: "2024-10-23", month: 10, day: 23, venue: "광주", away: "삼성", home: "KIA", time: "18:30", isPostseason: true },
    { date: "2024-10-23", month: 10, day: 23, venue: "광주", away: "삼성", home: "KIA", time: "18:30", isPostseason: true },
    { date: "2024-10-25", month: 10, day: 25, venue: "대구", away: "KIA", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2024-10-26", month: 10, day: 26, venue: "대구", away: "KIA", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2024-10-28", month: 10, day: 28, venue: "광주", away: "삼성", home: "KIA", time: "18:30", isPostseason: true },
  ],

  // ==================== 2025 포스트시즌 ====================

  // --- 와일드카드 결정전: SSG vs KIA (KIA 1-0) ---
  // SSG @ KIA 단판: KIA가 1차전 승리로 다음 라운드 진출 (SSG는 2차전 불필요하게 취소)
  "2025:10": [
    { date: "2025-10-02", month: 10, day: 2, venue: "광주", away: "SSG", home: "KIA", time: "18:30", isPostseason: true },
    // --- 준플레이오프: NC vs 삼성 (삼성 3-1) ---
    // 10-03: SSG vs NC (우천 취소), 삼성 vs KIA (우천 취소)
    { date: "2025-10-03", month: 10, day: 3, venue: "수원", away: "한화", home: "KT", time: "18:30", isPostseason: true },
    // 10-04 DH: SSG @ NC, 삼성 @ KIA
    { date: "2025-10-04", month: 10, day: 4, venue: "창원", away: "SSG", home: "NC", time: "18:30", isPostseason: true },
    { date: "2025-10-04", month: 10, day: 4, venue: "광주", away: "삼성", home: "KIA", time: "18:30", isPostseason: true },
    { date: "2025-10-06", month: 10, day: 6, venue: "대구", away: "NC", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2025-10-07", month: 10, day: 7, venue: "대구", away: "NC", home: "삼성", time: "18:30", isPostseason: true },
    // --- 플레이오프: SSG vs 삼성 (삼성 3-2) ---
    { date: "2025-10-09", month: 10, day: 9, venue: "문학", away: "삼성", home: "SSG", time: "18:30", isPostseason: true },
    { date: "2025-10-11", month: 10, day: 11, venue: "문학", away: "삼성", home: "SSG", time: "18:30", isPostseason: true },
    { date: "2025-10-13", month: 10, day: 13, venue: "대구", away: "SSG", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2025-10-14", month: 10, day: 14, venue: "대구", away: "SSG", home: "삼성", time: "18:30", isPostseason: true },
    // --- 한국시리즈: 한화 vs 삼성 (한화 4-3) ---
    { date: "2025-10-18", month: 10, day: 18, venue: "대전", away: "삼성", home: "한화", time: "18:30", isPostseason: true },
    { date: "2025-10-19", month: 10, day: 19, venue: "대전", away: "삼성", home: "한화", time: "18:30", isPostseason: true },
    { date: "2025-10-21", month: 10, day: 21, venue: "대구", away: "한화", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2025-10-22", month: 10, day: 22, venue: "대구", away: "한화", home: "삼성", time: "18:30", isPostseason: true },
    { date: "2025-10-24", month: 10, day: 24, venue: "대전", away: "삼성", home: "한화", time: "18:30", isPostseason: true },
    // --- 한국시리즈 6~7차전 (LG 합류, KS 대진 변경) ---
    // 실제 2025 KS는 한화 vs LG (LG 4-2)
    { date: "2025-10-26", month: 10, day: 26, venue: "잠실", away: "한화", home: "LG", time: "18:30", isPostseason: true },
    { date: "2025-10-27", month: 10, day: 27, venue: "잠실", away: "한화", home: "LG", time: "18:30", isPostseason: true },
    { date: "2025-10-29", month: 10, day: 29, venue: "대전", away: "LG", home: "한화", time: "18:30", isPostseason: true },
    { date: "2025-10-30", month: 10, day: 30, venue: "대전", away: "LG", home: "한화", time: "18:30", isPostseason: true },
    { date: "2025-10-31", month: 10, day: 31, venue: "대전", away: "LG", home: "한화", time: "18:30", isPostseason: true },
  ],
};

// Score entries for postseason games
// outcome = non-null means game finished (calendar uses score comparison for W/L, not outcome value)
export const POSTSEASON_SCORES: Record<string, ScoreEntry[]> = {
  // ==================== 2024 ====================
  // --- 와일드카드: KT vs 두산 (KT 2-0) ---
  "2024-10-02": [
    { away: "KT", home: "두산", awayScore: 4, homeScore: 0, outcome: "W", cancelled: false, winPitcher: "쿠에바스", losePitcher: "곽빈", gameIdx: 0 },
  ],
  "2024-10-03": [
    { away: "KT", home: "두산", awayScore: 1, homeScore: 0, outcome: "W", cancelled: false, winPitcher: "벤자민", losePitcher: "이병헌", gameIdx: 0 },
  ],
  // --- 준플레이오프: LG vs KT (LG 3-2) ---
  "2024-10-05": [
    { away: "KT", home: "LG", awayScore: 3, homeScore: 2, outcome: "W", cancelled: false, winPitcher: "김민수", losePitcher: "엔스", gameIdx: 0 },
  ],
  "2024-10-06": [
    { away: "KT", home: "LG", awayScore: 2, homeScore: 7, outcome: "W", cancelled: false, winPitcher: "임찬규", losePitcher: "엄상백", gameIdx: 0 },
  ],
  "2024-10-08": [
    { away: "LG", home: "KT", awayScore: 6, homeScore: 5, outcome: "W", cancelled: false, winPitcher: "손주영", losePitcher: "벤자민", gameIdx: 0 },
  ],
  "2024-10-09": [
    { away: "LG", home: "KT", awayScore: 5, homeScore: 6, outcome: "W", cancelled: false, winPitcher: "박영현", losePitcher: "백승현", gameIdx: 0 },
  ],
  "2024-10-11": [
    { away: "KT", home: "LG", awayScore: 1, homeScore: 4, outcome: "W", cancelled: false, winPitcher: "임찬규", losePitcher: "엄상백", gameIdx: 0 },
  ],
  // --- 플레이오프: 삼성 vs LG (삼성 3-1) ---
  "2024-10-13": [
    { away: "LG", home: "삼성", awayScore: 4, homeScore: 10, outcome: "W", cancelled: false, winPitcher: "레예스", losePitcher: "최원태", gameIdx: 0 },
  ],
  "2024-10-15": [
    { away: "LG", home: "삼성", awayScore: 5, homeScore: 10, outcome: "W", cancelled: false, winPitcher: "원태인", losePitcher: "손주영", gameIdx: 0 },
  ],
  "2024-10-17": [
    { away: "삼성", home: "LG", awayScore: 0, homeScore: 1, outcome: "W", cancelled: false, winPitcher: "임찬규", losePitcher: "이승현", gameIdx: 0 },
  ],
  "2024-10-19": [
    { away: "삼성", home: "LG", awayScore: 1, homeScore: 0, outcome: "W", cancelled: false, winPitcher: "레예스", losePitcher: "손주영", gameIdx: 0 },
  ],
  // --- 한국시리즈: KIA vs 삼성 (KIA 4-1) ---
  // Game 1 was rained out from 10-21→10-22→10-23, played as DH with Game 2
  "2024-10-23": [
    { away: "삼성", home: "KIA", awayScore: 1, homeScore: 5, outcome: "W", cancelled: false, winPitcher: "곽도규", losePitcher: "김태훈", gameIdx: 0 },
    { away: "삼성", home: "KIA", awayScore: 3, homeScore: 8, outcome: "W", cancelled: false, winPitcher: "양현종", losePitcher: "황동재", gameIdx: 0 },
  ],
  "2024-10-25": [
    { away: "KIA", home: "삼성", awayScore: 2, homeScore: 4, outcome: "W", cancelled: false, winPitcher: "레예스", losePitcher: "라우어", gameIdx: 0 },
  ],
  "2024-10-26": [
    { away: "KIA", home: "삼성", awayScore: 9, homeScore: 2, outcome: "W", cancelled: false, winPitcher: "네일", losePitcher: "원태인", gameIdx: 0 },
  ],
  "2024-10-28": [
    { away: "삼성", home: "KIA", awayScore: 5, homeScore: 7, outcome: "W", cancelled: false, winPitcher: "곽도규", losePitcher: "이상민", gameIdx: 0 },
  ],

  // ==================== 2025 ====================
  // --- 와일드카드: SSG @ KIA 단판 (KIA 1-0) ---
  "2025-10-02": [
    { away: "SSG", home: "KIA", awayScore: 2, homeScore: 7, outcome: "W", cancelled: false, winPitcher: "이도현", losePitcher: "송영진", gameIdx: 0 },
  ],
  // --- 준플레이오프: NC vs 삼성 (삼성 3-1) ---
  // 10-03: 한화 vs KT 무승부 (6-6) — 우천으로 다른 경기 취소, 유일하게 진행된 경기
  "2025-10-03": [
    { away: "한화", home: "KT", awayScore: 6, homeScore: 6, outcome: "W", cancelled: false, winPitcher: null, losePitcher: null, gameIdx: 0 },
  ],
  // 10-04 DH: SSG @ NC, 삼성 @ KIA
  "2025-10-04": [
    { away: "SSG", home: "NC", awayScore: 1, homeScore: 7, outcome: "W", cancelled: false, winPitcher: "라일리", losePitcher: "김광현", gameIdx: 0 },
    { away: "삼성", home: "KIA", awayScore: 8, homeScore: 9, outcome: "W", cancelled: false, winPitcher: "정해영", losePitcher: "홍원표", gameIdx: 0 },
  ],
  "2025-10-06": [
    { away: "NC", home: "삼성", awayScore: 4, homeScore: 1, outcome: "W", cancelled: false, winPitcher: "구창모", losePitcher: "후라도", gameIdx: 0 },
  ],
  "2025-10-07": [
    { away: "NC", home: "삼성", awayScore: 0, homeScore: 3, outcome: "W", cancelled: false, winPitcher: "원태인", losePitcher: "로건", gameIdx: 0 },
  ],
  // --- 플레이오프: SSG vs 삼성 (삼성 3-2) ---
  "2025-10-09": [
    { away: "삼성", home: "SSG", awayScore: 5, homeScore: 2, outcome: "W", cancelled: false, winPitcher: "최원태", losePitcher: "화이트", gameIdx: 0 },
  ],
  "2025-10-11": [
    { away: "삼성", home: "SSG", awayScore: 3, homeScore: 4, outcome: "W", cancelled: false, winPitcher: "조병현", losePitcher: "후라도", gameIdx: 0 },
  ],
  "2025-10-13": [
    { away: "SSG", home: "삼성", awayScore: 3, homeScore: 5, outcome: "W", cancelled: false, winPitcher: "원태인", losePitcher: "앤더슨", gameIdx: 0 },
  ],
  "2025-10-14": [
    { away: "SSG", home: "삼성", awayScore: 2, homeScore: 5, outcome: "W", cancelled: false, winPitcher: "이호성", losePitcher: "이로운", gameIdx: 0 },
  ],
  // --- 한국시리즈: 한화 vs LG (LG 4-2) ---
  "2025-10-18": [
    { away: "삼성", home: "한화", awayScore: 8, homeScore: 9, outcome: "W", cancelled: false, winPitcher: "폰세", losePitcher: "배찬승", gameIdx: 0 },
  ],
  "2025-10-19": [
    { away: "삼성", home: "한화", awayScore: 7, homeScore: 3, outcome: "W", cancelled: false, winPitcher: "최원태", losePitcher: "와이스", gameIdx: 0 },
  ],
  "2025-10-21": [
    { away: "한화", home: "삼성", awayScore: 5, homeScore: 4, outcome: "W", cancelled: false, winPitcher: "문동주", losePitcher: "후라도", gameIdx: 0 },
  ],
  "2025-10-22": [
    { away: "한화", home: "삼성", awayScore: 4, homeScore: 7, outcome: "W", cancelled: false, winPitcher: "가라비토", losePitcher: "한승혁", gameIdx: 0 },
  ],
  "2025-10-24": [
    { away: "삼성", home: "한화", awayScore: 2, homeScore: 11, outcome: "W", cancelled: false, winPitcher: "폰세", losePitcher: "최원태", gameIdx: 0 },
  ],
  "2025-10-26": [
    { away: "한화", home: "LG", awayScore: 2, homeScore: 8, outcome: "W", cancelled: false, winPitcher: "톨허스트", losePitcher: "문동주", gameIdx: 0 },
  ],
  "2025-10-27": [
    { away: "한화", home: "LG", awayScore: 5, homeScore: 13, outcome: "W", cancelled: false, winPitcher: "김진성", losePitcher: "류현진", gameIdx: 0 },
  ],
  "2025-10-29": [
    { away: "LG", home: "한화", awayScore: 3, homeScore: 7, outcome: "W", cancelled: false, winPitcher: "김서현", losePitcher: "유영찬", gameIdx: 0 },
  ],
  "2025-10-30": [
    { away: "LG", home: "한화", awayScore: 7, homeScore: 4, outcome: "W", cancelled: false, winPitcher: "이정용", losePitcher: "박상원", gameIdx: 0 },
  ],
  "2025-10-31": [
    { away: "LG", home: "한화", awayScore: 4, homeScore: 1, outcome: "W", cancelled: false, winPitcher: "톨허스트", losePitcher: "정우주", gameIdx: 0 },
  ],
};
