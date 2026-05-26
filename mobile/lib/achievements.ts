import { getJikgwanRecords, getBadges, upsertBadge, checkAttendance, type Badge, type JikgwanRecord } from "@/lib/db";
import { computeStreakStats } from "@/lib/stats";
import { resolveIsWin } from "@/lib/expenseStats";
import { parseGameTeamIds } from "@shared/constants";

// --- Types ---

export type BadgeTier = "tutorial" | "easy" | "medium" | "hard" | "epic";

export interface BadgeDefinition {
  id: string;
  badgeKey: string;
  emoji: string;
  title: string;
  description: string;
  tier: BadgeTier;
  xp: number;
  category: "milestone" | "streak" | "attendance" | "exploration" | "secret";
  progressTarget: number;
  check: (records: JikgwanRecord[], existingBadges: Badge[], attendanceStreak: number) => BadgeEvalResult;
}

export interface BadgeEvalResult {
  unlocked: boolean;
  progressCurrent: number;
  progressTarget: number;
  qualifyingDate?: string; // YYYY.MM.DD — 경기 기준 배지는 record.date, 없으면 today (행위 기준)
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  progress: number;
}

// --- Badge Definitions (15 total) ---

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── 직관 마일스톤 (5) ──
  {
    id: "first_step",
    badgeKey: "first_step",
    emoji: "👣",
    title: "첫걸음",
    description: "첫 번째 직관 기록을 작성했어요",
    tier: "tutorial",
    xp: 5,
    category: "milestone",
    progressTarget: 1,
    check: (records) => {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      return {
        unlocked: records.length >= 1,
        progressCurrent: Math.min(records.length, 1),
        progressTarget: 1,
        qualifyingDate: records.length >= 1 ? sorted[0].date : undefined,
      };
    },
  },
  {
    id: "games_10",
    badgeKey: "games_10",
    emoji: "⭐",
    title: "10회 달성",
    description: "직관 10회를 기록했어요",
    tier: "easy",
    xp: 10,
    category: "milestone",
    progressTarget: 10,
    check: (records) => {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      return {
        unlocked: records.length >= 10,
        progressCurrent: Math.min(records.length, 10),
        progressTarget: 10,
        qualifyingDate: records.length >= 10 ? sorted[9].date : undefined,
      };
    },
  },
  {
    id: "games_30",
    badgeKey: "games_30",
    emoji: "🌟",
    title: "30회 달성",
    description: "직관 30회를 기록했어요",
    tier: "medium",
    xp: 25,
    category: "milestone",
    progressTarget: 30,
    check: (records) => {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      return {
        unlocked: records.length >= 30,
        progressCurrent: Math.min(records.length, 30),
        progressTarget: 30,
        qualifyingDate: records.length >= 30 ? sorted[29].date : undefined,
      };
    },
  },
  {
    id: "games_50",
    badgeKey: "games_50",
    emoji: "💎",
    title: "50회 달성",
    description: "직관 50회를 기록했어요",
    tier: "hard",
    xp: 50,
    category: "milestone",
    progressTarget: 50,
    check: (records) => {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      return {
        unlocked: records.length >= 50,
        progressCurrent: Math.min(records.length, 50),
        progressTarget: 50,
        qualifyingDate: records.length >= 50 ? sorted[49].date : undefined,
      };
    },
  },
  {
    id: "games_100",
    badgeKey: "games_100",
    emoji: "👑",
    title: "100회 달성",
    description: "직관 100회를 기록했어요",
    tier: "epic",
    xp: 100,
    category: "milestone",
    progressTarget: 100,
    check: (records) => {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      return {
        unlocked: records.length >= 100,
        progressCurrent: Math.min(records.length, 100),
        progressTarget: 100,
        qualifyingDate: records.length >= 100 ? sorted[99].date : undefined,
      };
    },
  },
  // ── 연승 기록 (3) ──
  {
    id: "streak_3",
    badgeKey: "streak_3",
    emoji: "🔥",
    title: "3연승",
    description: "직관 3연승을 달성했어요",
    tier: "easy",
    xp: 10,
    category: "streak",
    progressTarget: 3,
    check: (records) => {
      const s = computeStreakStats(records);
      const best = Math.max(s.longestWin, s.currentType === "W" ? s.currentCount : 0);
      let qualifyingDate: string | undefined;
      if (best >= 3) {
        const games = records
          .filter((r) => { const iw = resolveIsWin(r); return iw != null && iw !== 0; })
          .sort((a, b) => a.date.localeCompare(b.date));
        let run = 0;
        for (const g of games) {
          if (resolveIsWin(g) === 1) { run++; if (run === 3) { qualifyingDate = g.date; break; } }
          else { run = 0; }
        }
      }
      return {
        unlocked: best >= 3,
        progressCurrent: Math.min(best, 3),
        progressTarget: 3,
        qualifyingDate,
      };
    },
  },
  {
    id: "streak_5",
    badgeKey: "streak_5",
    emoji: "🔥🔥",
    title: "5연승",
    description: "직관 5연승을 달성했어요",
    tier: "medium",
    xp: 25,
    category: "streak",
    progressTarget: 5,
    check: (records) => {
      const s = computeStreakStats(records);
      const best = Math.max(s.longestWin, s.currentType === "W" ? s.currentCount : 0);
      let qualifyingDate: string | undefined;
      if (best >= 5) {
        const games = records
          .filter((r) => { const iw = resolveIsWin(r); return iw != null && iw !== 0; })
          .sort((a, b) => a.date.localeCompare(b.date));
        let run = 0;
        for (const g of games) {
          if (resolveIsWin(g) === 1) { run++; if (run === 5) { qualifyingDate = g.date; break; } }
          else { run = 0; }
        }
      }
      return {
        unlocked: best >= 5,
        progressCurrent: Math.min(best, 5),
        progressTarget: 5,
        qualifyingDate,
      };
    },
  },
  {
    id: "streak_10",
    badgeKey: "streak_10",
    emoji: "💥",
    title: "10연승",
    description: "직관 10연승을 달성했어요",
    tier: "epic",
    xp: 100,
    category: "streak",
    progressTarget: 10,
    check: (records) => {
      const s = computeStreakStats(records);
      const best = Math.max(s.longestWin, s.currentType === "W" ? s.currentCount : 0);
      let qualifyingDate: string | undefined;
      if (best >= 10) {
        const games = records
          .filter((r) => { const iw = resolveIsWin(r); return iw != null && iw !== 0; })
          .sort((a, b) => a.date.localeCompare(b.date));
        let run = 0;
        for (const g of games) {
          if (resolveIsWin(g) === 1) { run++; if (run === 10) { qualifyingDate = g.date; break; } }
          else { run = 0; }
        }
      }
      return {
        unlocked: best >= 10,
        progressCurrent: Math.min(best, 10),
        progressTarget: 10,
        qualifyingDate,
      };
    },
  },
  // ── 앱 출석 (4) ──
  {
    id: "attend_first",
    badgeKey: "attend_first",
    emoji: "👋",
    title: "첫방문",
    description: "앱에 첫 출석했어요",
    tier: "tutorial",
    xp: 5,
    category: "attendance",
    progressTarget: 1,
    check: (_recs, _badges, streak) => ({
      unlocked: streak >= 1,
      progressCurrent: Math.min(streak, 1),
      progressTarget: 1,
    }),
  },
  {
    id: "attend_3",
    badgeKey: "attend_3",
    emoji: "📅",
    title: "3일 연속 출석",
    description: "3일 연속으로 앱에 방문했어요",
    tier: "easy",
    xp: 10,
    category: "attendance",
    progressTarget: 3,
    check: (_recs, _badges, streak) => ({
      unlocked: streak >= 3,
      progressCurrent: Math.min(streak, 3),
      progressTarget: 3,
    }),
  },
  {
    id: "attend_7",
    badgeKey: "attend_7",
    emoji: "🗓️",
    title: "7일 연속 출석",
    description: "7일 연속으로 앱에 방문했어요",
    tier: "medium",
    xp: 25,
    category: "attendance",
    progressTarget: 7,
    check: (_recs, _badges, streak) => ({
      unlocked: streak >= 7,
      progressCurrent: Math.min(streak, 7),
      progressTarget: 7,
    }),
  },
  {
    id: "attend_14",
    badgeKey: "attend_14",
    emoji: "🏆",
    title: "14일 연속 출석",
    description: "14일 연속으로 앱에 방문했어요",
    tier: "hard",
    xp: 50,
    category: "attendance",
    progressTarget: 14,
    check: (_recs, _badges, streak) => ({
      unlocked: streak >= 14,
      progressCurrent: Math.min(streak, 14),
      progressTarget: 14,
    }),
  },
  // ── 탐험 (2) ──
  {
    id: "first_away",
    badgeKey: "first_away",
    emoji: "✈️",
    title: "첫 원정",
    description: "첫 원정 경기를 직관했어요",
    tier: "easy",
    xp: 10,
    category: "exploration",
    progressTarget: 1,
    check: (records) => {
      const awayRecords = records.filter((r) => {
        if (!r.cheered_team || !r.game_id) return false;
        const ids = parseGameTeamIds(r.game_id);
        return ids.homeId && ids.homeId !== r.cheered_team;
      }).sort((a, b) => a.date.localeCompare(b.date));
      const awayCount = awayRecords.length;
      return {
        unlocked: awayCount >= 1,
        progressCurrent: Math.min(awayCount, 1),
        progressTarget: 1,
        qualifyingDate: awayCount >= 1 ? awayRecords[0].date : undefined,
      };
    },
  },
  {
    id: "stadium_3",
    badgeKey: "stadium_3",
    emoji: "🏟️",
    title: "구장 3개",
    description: "서로 다른 3개 구장을 방문했어요",
    tier: "medium",
    xp: 25,
    category: "exploration",
    progressTarget: 3,
    check: (records) => {
      const sorted = [...records].filter((r) => r.stadium).sort((a, b) => a.date.localeCompare(b.date));
      const stadiums = new Set<string>();
      let qualifyingDate: string | undefined;
      for (const r of sorted) {
        stadiums.add(r.stadium!);
        if (stadiums.size >= 3) { qualifyingDate = r.date; break; }
      }
      return {
        unlocked: stadiums.size >= 3,
        progressCurrent: Math.min(stadiums.size, 3),
        progressTarget: 3,
        qualifyingDate,
      };
    },
  },
  // ── 시크릿 (1) ──
  {
    id: "owl",
    badgeKey: "owl",
    emoji: "🦉",
    title: "올빼미",
    description: "새벽 0시~6시 사이에 직관 기록을 작성했어요",
    tier: "medium",
    xp: 25,
    category: "secret",
    progressTarget: 1,
    check: (records) => {
      const owlRecord = records.find((r) => {
        if (!r.created_at) return false;
        const hour = new Date(r.created_at.replace(" ", "T")).getHours();
        return hour >= 0 && hour < 6;
      });
      return {
        unlocked: !!owlRecord,
        progressCurrent: owlRecord ? 1 : 0,
        progressTarget: 1,
        qualifyingDate: owlRecord ? owlRecord.date : undefined,
      };
    },
  },
];

// --- XP / Level System ---

const LEVEL_TITLES = ["루키", "비기너", "아마추어", "세미프로", "프로", "올스타", "레전드"];

function xpForLevel(level: number): number {
  return level * (level + 1) * 20;
}

function tierXP(tier: BadgeTier): number {
  const map: Record<BadgeTier, number> = {
    tutorial: 5, easy: 10, medium: 25, hard: 50, epic: 100,
  };
  return map[tier];
}

export function computeLevel(badges: Badge[]): LevelInfo {
  const totalXP = badges
    .filter((b) => b.unlocked_date)
    .reduce((sum, b) => {
      const def = BADGE_DEFINITIONS.find((d) => d.badgeKey === b.badge_key);
      return sum + (def ? tierXP(def.tier) : 0);
    }, 0);

  let level = 1;
  let accumulated = 0;
  for (let lv = 1; lv <= 7; lv++) {
    const needed = xpForLevel(lv);
    if (totalXP >= accumulated + needed) {
      accumulated += needed;
      level = lv + 1;
    } else {
      break;
    }
  }
  level = Math.min(level, 7);

  const requiredXP = xpForLevel(level);
  const prevTotal = level > 1
    ? Array.from({ length: level - 1 }, (_, i) => xpForLevel(i + 1)).reduce((a, b) => a + b, 0)
    : 0;
  const xpIntoLevel = totalXP - prevTotal;

  return {
    level,
    title: LEVEL_TITLES[level - 1],
    currentXP: xpIntoLevel,
    requiredXP,
    progress: Math.min(xpIntoLevel / requiredXP, 1),
  };
}

// --- Badge Evaluation Engine ---

export async function evaluateBadges(): Promise<Badge[]> {
  const [records, existingBadges, attendanceStreak] = await Promise.all([
    getJikgwanRecords(),
    getBadges(),
    checkAttendance(),
  ]);

  const existingMap = new Map(existingBadges.map((b) => [b.badge_key, b]));
  const newlyUnlocked: Badge[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  for (const def of BADGE_DEFINITIONS) {
    const existing = existingMap.get(def.badgeKey);
    if (existing?.unlocked_date) continue;

    const result = def.check(records, existingBadges, attendanceStreak);

    if (result.unlocked) {
      await upsertBadge({
        id: def.id,
        badge_key: def.badgeKey,
        unlocked_date: result.qualifyingDate ?? todayStr,
        progress_current: result.progressTarget,
        progress_target: result.progressTarget,
      });
      newlyUnlocked.push({
        id: def.id,
        badge_key: def.badgeKey,
        unlocked_date: result.qualifyingDate ?? todayStr,
        progress_current: result.progressTarget,
        progress_target: result.progressTarget,
        is_notified: 0,
      });
    } else if (result.progressCurrent !== existing?.progress_current) {
      await upsertBadge({
        id: def.id,
        badge_key: def.badgeKey,
        unlocked_date: null,
        progress_current: result.progressCurrent,
        progress_target: result.progressTarget,
      });
    }
  }

  return newlyUnlocked;
}
