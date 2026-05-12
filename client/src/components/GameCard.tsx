import { TEAM_COLORS } from "@/lib/teamColors";

interface GameCardProps {
  homeTeam: string;
  awayTeam: string;
  time: string;
  stadium: string;
  homePitcher?: string;
  awayPitcher?: string;
  status?: "scheduled" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  onClick?: () => void;
}

export default function GameCard({
  homeTeam,
  awayTeam,
  time,
  stadium,
  homePitcher,
  awayPitcher,
  status = "scheduled",
  homeScore,
  awayScore,
  onClick,
}: GameCardProps) {
  const home = TEAM_COLORS[homeTeam];
  const away = TEAM_COLORS[awayTeam];

  if (!home || !away) return null;

  const hasResult = status === "finished" && homeScore !== undefined && awayScore !== undefined;
  const homeWon = hasResult ? homeScore! > awayScore! : null;

  const cardStyle: React.CSSProperties = {
    borderLeft: `3px solid ${home.primary}`,
  };

  if (home.primary && away.primary && home.primary !== away.primary) {
    cardStyle.background = `linear-gradient(135deg, ${away.primary}08 0%, transparent 40%, transparent 60%, ${home.primary}08 100%)`;
  } else if (home.primary) {
    cardStyle.background = `linear-gradient(135deg, transparent 0%, ${home.primary}06 50%, transparent 100%)`;
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-2xl border border-border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] text-left"
      style={cardStyle}
    >
      {/* 상단: 시간 및 구장 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground font-medium">{time}</span>
        <span className="text-xs text-muted-foreground">{stadium}</span>
      </div>

      {/* 중앙: 팀 매치업 */}
      <div className="flex items-center justify-between">
        {/* 원정팀 */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2"
            style={{
              backgroundColor: away.primary,
              color: away.secondary,
              borderColor: away.tertiary === "#FFFFFF" ? away.primary : away.tertiary,
            }}
          >
            {away.shortName}
          </div>
          {awayPitcher && (
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {awayPitcher}
            </span>
          )}
        </div>

        {/* 스코어 또는 VS */}
        <div className="flex flex-col items-center gap-1 px-4">
          {status === "finished" || status === "live" ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{awayScore}</span>
              <span className="text-sm text-muted-foreground">:</span>
              <span className="text-2xl font-bold">{homeScore}</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">VS</span>
          )}
          {status === "live" && (
            <span className="text-[10px] font-medium text-destructive animate-pulse">
              LIVE
            </span>
          )}
        </div>

        {/* 홈팀 */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2"
            style={{
              backgroundColor: home.primary,
              color: home.secondary,
              borderColor: home.tertiary === "#FFFFFF" ? home.primary : home.tertiary,
            }}
          >
            {home.shortName}
          </div>
          {homePitcher && (
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {homePitcher}
            </span>
          )}
        </div>
      </div>

      {/* 하단: 라인업 확인 안내 */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-center text-xs text-muted-foreground">
          탭하여 라인업 확인 →
        </p>
      </div>
    </button>
  );
}
