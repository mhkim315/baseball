import { config } from "./config";
import { toast } from "sonner";

export type {
  GameData, StandingsData, TeamData, ScoreEntry,
  StadiumBrief, FoodPlace, SurroundingSpot, EatsSpot,
  CheerSection, PlayerCheer, StandingRow, TodayGame, GameDetail,
} from "@shared/types";
import type {
  GameData, StandingsData, TeamData, ScoreEntry,
  StadiumBrief, FoodPlace, SurroundingSpot, EatsSpot,
  CheerSection, PlayerCheer, StandingRow, TodayGame, GameDetail,
} from "@shared/types";

let lastErrorToast = 0;

// Generic fetch helper (8s timeout)
async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${config.apiBase}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    const now = Date.now();
    if (now - lastErrorToast > 3000) {
      lastErrorToast = now;
      toast.error("데이터를 불러오지 못했습니다", {
        description: "잠시 후 다시 시도해 주세요",
      });
    }
    console.error(`API error [${path}]:`, error);
    return null;
  }
}

// Games
export async function fetchGames(date?: string): Promise<GameData[]> {
  const url = date ? `${config.apiBase}/games/${date}` : `${config.apiBase}/games`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

// Standings (DB)
export async function fetchStandings(): Promise<StandingsData[]> {
  const data = await apiFetch<StandingsData[]>("/standings");
  return data ?? [];
}

// Teams
export async function fetchTeams(): Promise<TeamData[]> {
  const data = await apiFetch<TeamData[]>("/teams");
  return data ?? [];
}

// Stadium briefs
export async function fetchStadiumBriefs(): Promise<Record<string, StadiumBrief> | null> {
  return apiFetch<Record<string, StadiumBrief>>("/stadium-brief");
}

export async function fetchStadiumBrief(id: string): Promise<StadiumBrief | null> {
  return apiFetch<StadiumBrief>(`/stadium-brief/${id}`);
}

// Stadium foods
export async function fetchStadiumFoods(stadiumId: string): Promise<FoodPlace[] | null> {
  const data = await apiFetch<{ stadiumId: string; places: FoodPlace[] }>(`/stadium-foods/${stadiumId}`);
  return data?.places ?? null;
}

// Stadium surroundings (parking/transit spots)
export async function fetchStadiumSurroundings(stadiumId: string): Promise<{ center: number[]; zoom: number; spots: SurroundingSpot[] } | null> {
  return apiFetch<{ center: number[]; zoom: number; spots: SurroundingSpot[] }>(`/stadium-surroundings/${stadiumId}`);
}

// Stadium nearby restaurants
export async function fetchStadiumEats(stadiumId: string): Promise<{ name: string; center: number[]; spots: EatsSpot[] } | null> {
  return apiFetch<{ name: string; center: number[]; spots: EatsSpot[] }>(`/stadium-eats/${stadiumId}`);
}

// Cheering songs
export async function fetchCheeringSongs(teamId: string): Promise<{ sections: CheerSection[] } | null> {
  return apiFetch<{ sections: CheerSection[] }>(`/cheering-songs/${teamId}`);
}

// Cheering players
export async function fetchCheeringPlayers(teamId: string): Promise<{ players: PlayerCheer[] } | null> {
  return apiFetch<{ players: PlayerCheer[] }>(`/cheering-players/${teamId}`);
}

// Standings (JSON, more detailed)
export async function fetchStandingsJson(): Promise<{ source: string; fetchedAt: string; rows: StandingRow[] } | null> {
  return apiFetch<{ source: string; fetchedAt: string; rows: StandingRow[] }>("/standings/json");
}

// Daily scores
export async function fetchDailyScores(date: string): Promise<{ date: string; games: any[] } | null> {
  return apiFetch<{ date: string; games: any[] }>(`/daily-scores/${date}`);
}

export async function fetchAllDailyScores(): Promise<{ dates: Record<string, any[]> } | null> {
  return apiFetch<{ dates: Record<string, any[]> }>("/daily-scores");
}

// Schedule
export async function fetchSchedule(): Promise<{ year: number; games: any[] } | null> {
  return apiFetch<{ year: number; games: any[] }>("/schedule");
}

export async function fetchScheduleByMonth(month: number): Promise<{ year: number; month: number; games: any[] } | null> {
  return apiFetch<{ year: number; month: number; games: any[] }>(`/schedule/${month}`);
}

// Today's games (with starters)
export async function fetchTodayGames(): Promise<{ date: string; games: TodayGame[] } | null> {
  return apiFetch<{ date: string; games: TodayGame[] }>("/today-games");
}

// Game detail (with lineup)
export async function fetchGameDetail(gameId: string): Promise<GameDetail | null> {
  return apiFetch<GameDetail>(`/game-detail/${gameId}`);
}
