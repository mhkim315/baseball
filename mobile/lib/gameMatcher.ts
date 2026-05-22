import { fetchTodayGames, fetchDailyScores, type TodayGame, type ScoreEntry } from "@/lib/api";
import { TEAM_COLORS } from "@shared/teamColors";

export interface MatchedGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  stadium: string;
  date: string;
}

/**
 * Try to match a game from the API using gameId.
 * Falls back to matching by stadium name if no gameId.
 */
export async function matchGame(
  gameId?: string,
  stadium?: string,
  gameIdx?: number
): Promise<MatchedGame | null> {
  if (!gameId && !stadium) return null;

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  try {
    const todayData = await fetchTodayGames();
    const allGames = [
      ...(todayData?.games ?? []),
      ...(todayData?.nextGames ?? []),
    ];

    for (const g of allGames) {
      if (gameId && g.id === gameId) {
        return buildMatch(g, dateStr);
      }
    }

    // Fallback: match by venue name
    if (stadium) {
      const normalized = stadium.replace(/\s/g, "");
      for (const g of allGames) {
        if (g.venue?.replace(/\s/g, "").includes(normalized) || normalized.includes(g.venue?.replace(/\s/g, "") || "")) {
          return buildMatch(g, dateStr);
        }
      }
    }

    // Try score endpoint for finished games
    const scores = await fetchDailyScores(dateStr);
    if (scores?.games) {
      for (const s of scores.games) {
        if (gameIdx !== undefined && (s.gameIdx ?? 0) !== gameIdx) continue;
        const homeTeam = findTeamByShortName(s.home);
        const awayTeam = findTeamByShortName(s.away);
        if (homeTeam && awayTeam) {
          return {
            gameId: "",
            homeTeam,
            awayTeam,
            homeScore: s.homeScore,
            awayScore: s.awayScore,
            stadium: stadium || "",
            date: dateStr,
          };
        }
      }
    }
  } catch {
    // Silently fail, return null
  }

  return null;
}

function buildMatch(g: TodayGame, dateStr: string): MatchedGame {
  return {
    gameId: g.id,
    homeTeam: g.home.id,
    awayTeam: g.away.id,
    homeScore: g.score?.home ?? null,
    awayScore: g.score?.away ?? null,
    stadium: g.venue || "",
    date: dateStr,
  };
}

function findTeamByShortName(name: string): string | null {
  for (const [id, info] of Object.entries(TEAM_COLORS)) {
    if (info.shortName === name) return id;
  }
  return null;
}
