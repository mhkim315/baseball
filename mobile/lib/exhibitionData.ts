import { TEAM_NAME_TO_ID } from "@shared/constants";
import { ApiClient } from "@shared/api-client";

export interface ExhibitionGame {
  date: string;
  venue: string;
  away: string;
  home: string;
  time: string;
  awayScore: number | null;
  homeScore: number | null;
  gameId: string;
  awayTeamId: string;
  homeTeamId: string;
  awayStarter: string | null;
  homeStarter: string | null;
  winPitcher: string | null;
  losePitcher: string | null;
  cancelled: boolean;
}

interface ExhibitionResponse {
  year: number;
  games: ExhibitionGame[];
}

const cache = new Map<number, ExhibitionGame[]>();
const client = new ApiClient({ baseUrl: "https://api.fullcount.kr", timeout: 8000 });

export async function fetchExhibitionGames(year?: number): Promise<ExhibitionGame[]> {
  const y = year ?? new Date().getFullYear();
  if (cache.has(y)) return cache.get(y)!;
  try {
    const path = year != null
      ? `/exhibition-games?year=${year}`
      : "/exhibition-games";
    const data = await client.get<ExhibitionResponse>(path);
    if (!data) {
      cache.set(y, []);
      return [];
    }
    const games = (data.games || []).map((g) => ({
      ...g,
      awayTeamId: TEAM_NAME_TO_ID[g.away] || "",
      homeTeamId: TEAM_NAME_TO_ID[g.home] || "",
    }));
    cache.set(y, games);
  } catch {
    cache.set(y, []);
  }
  return cache.get(y)!;
}
