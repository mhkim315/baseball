import * as db from "./db";
import {
  fetchDailyScores as apiDailyScores,
  fetchScheduleByMonth as apiScheduleByMonth,
  fetchTodayGames as apiTodayGames,
  fetchGameDetail as apiGameDetail,
  fetchAllDailyScores as apiAllDailyScores,
  type ScoreEntry,
  type ScheduleGame,
  type TodayGame,
  type GameDetail,
} from "./api";

function cacheKey(name: string, id: string): string {
  return `${name}:${id}`;
}

const now = () => new Date();
const todayStr = () => now().toISOString().slice(0, 10);
const thisYear = () => now().getFullYear();

function safeParse(json: string): unknown | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function ttlForDate(dateStr: string): number {
  const today = todayStr();
  if (dateStr < today) return Infinity;       // past: never expire
  if (dateStr === today) return 300_000;      // today: 5 minutes
  return 3600_000;                             // future: 1 hour
}

async function fetchWithCache<T>(
  cacheKeyStr: string,
  ttl: number,
  fetcher: () => Promise<T | null>
): Promise<T | null> {
  const cached = await db.getCache(cacheKeyStr);
  if (cached) {
    const parsed = safeParse(cached.data);
    if (parsed && Date.now() - cached.updatedAt < ttl) {
      return parsed as T;
    }
    // If parse failed or TTL expired, delete stale entry
    if (!parsed) {
      await db.deleteCache(cacheKeyStr);
    }
  }

  const fresh = await fetcher();
  if (fresh) {
    await db.setCache(cacheKeyStr, JSON.stringify(fresh));
    return fresh;
  }

  // API failed — return stale cache if available
  if (cached) {
    const parsed = safeParse(cached.data);
    if (parsed) return parsed as T;
  }
  return null;
}

// Schedule by month — never changes, cache forever (key includes year)
export async function cachedScheduleByMonth(month: number): Promise<{ games: ScheduleGame[] } | null> {
  return fetchWithCache(cacheKey("schedule", `${thisYear()}:${month}`), Infinity, () =>
    apiScheduleByMonth(month)
  );
}

// Daily scores — TTL based on date
export async function cachedDailyScores(date: string): Promise<{ games: ScoreEntry[] } | null> {
  return fetchWithCache(cacheKey("scores", date), ttlForDate(date), () =>
    apiDailyScores(date)
  );
}

// All daily scores — for calendar
export async function cachedAllDailyScores(): Promise<{ dates: Record<string, ScoreEntry[]> } | null> {
  return fetchWithCache("allscores", 300_000, () =>
    apiAllDailyScores()
  );
}

// Today's games — date-qualified key to survive midnight
export async function cachedTodayGames(): Promise<{ games: TodayGame[]; nextGames?: TodayGame[] } | null> {
  return fetchWithCache(cacheKey("today", todayStr()), 300_000, () =>
    apiTodayGames()
  );
}

// Game detail — moderate TTL
export async function cachedGameDetail(gameId: string): Promise<GameDetail | null> {
  return fetchWithCache(cacheKey("game", gameId), 600_000, () =>
    apiGameDetail(gameId)
  );
}
