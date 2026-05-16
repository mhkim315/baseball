import type { JikgwanRecord } from "@/lib/db";

export interface DiaryStats {
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  stadiums: string[];
  emotionCounts: Record<string, number>;
}

export function computeDiaryStats(records: JikgwanRecord[]): DiaryStats {
  const wins = records.filter((r) => r.is_win === 1).length;
  const draws = records.filter((r) => r.is_win === 0).length;
  const losses = records.filter((r) => r.is_win === -1).length;
  const totalGames = wins + draws + losses;
  const winRate = totalGames > 0 ? wins / totalGames : 0;

  const stadiums = [
    ...new Set(records.map((r) => r.stadium).filter(Boolean)),
  ] as string[];

  const emotionCounts: Record<string, number> = {};
  for (const r of records) {
    if (r.emotion) {
      emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
    }
  }

  // Streak: current consecutive days with records
  const dates = [
    ...new Set(records.map((r) => r.date)),
  ].sort().reverse();
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = `${expected.getFullYear()}.${String(expected.getMonth() + 1).padStart(2, "0")}.${String(expected.getDate()).padStart(2, "0")}`;
    if (dates[i] === expectedStr) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = parseDateStr(dates[i - 1]);
    const curr = parseDateStr(dates[i]);
    if (prev && curr) {
      const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.round(diffDays) === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  return {
    totalGames,
    wins,
    draws,
    losses,
    winRate,
    currentStreak,
    longestStreak,
    stadiums,
    emotionCounts,
  };
}

function parseDateStr(dateStr: string): Date | null {
  const parts = dateStr.split(".");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  return new Date(y, m - 1, d);
}
