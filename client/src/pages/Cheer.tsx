import { useState, useEffect } from "react";
import { TEAM_COLORS, TEAM_LIST } from "@/lib/teamColors";
import { fetchCheeringSongs, fetchCheeringPlayers, type CheerSection, type PlayerCheer } from "@/lib/api";
import { Music, ExternalLink, User, ChevronDown, ChevronUp } from "lucide-react";

export default function Cheer() {
  const [selectedTeam, setSelectedTeam] = useState("doosan");
  const [activeTab, setActiveTab] = useState<"songs" | "players">("songs");
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const [sections, setSections] = useState<CheerSection[]>([]);
  const [players, setPlayers] = useState<PlayerCheer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchCheeringSongs(selectedTeam),
      fetchCheeringPlayers(selectedTeam),
    ]).then(([songsData, playersData]) => {
      if (songsData) setSections(songsData.sections);
      if (playersData) setPlayers(playersData.players);
      setLoading(false);
    });
  }, [selectedTeam]);

  const team = TEAM_COLORS[selectedTeam];
  const totalSongs = sections.reduce((a, s) => a + s.songs.length, 0);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* 모바일 헤더 */}
      <div className="md:hidden px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold">응원</h1>
        <p className="text-sm text-muted-foreground mt-0.5">구단별 응원가와 선수 응원가를 확인하세요</p>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-2 md:mt-6">
        {/* 팀 선택 2×5 그리드 */}
        <div className="grid grid-cols-5 gap-2">
          {TEAM_LIST.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTeam(t.id); setExpandedSection(0); }}
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all border text-center ${
                selectedTeam === t.id
                  ? "text-white border-transparent shadow-sm"
                  : "text-foreground border-border bg-card hover:bg-accent"
              }`}
              style={
                selectedTeam === t.id
                  ? { backgroundColor: t.primary, borderColor: t.primary }
                  : undefined
              }
            >
              {t.shortName}
            </button>
          ))}
        </div>

        {/* 팀 헤더 */}
        {team && (
          <div className="bg-card rounded-2xl border border-border p-5 mt-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2"
                style={{
                  backgroundColor: team.primary,
                  color: team.secondary,
                  borderColor: team.tertiary === "#FFFFFF" ? team.primary : team.tertiary,
                }}
              >
                {team.shortName}
              </div>
              <div>
                <h3 className="font-semibold text-base">{team.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  응원가 {totalSongs}곡 · 선수 {players.length}명
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 전환 */}
        <div className="flex gap-1 mt-4 bg-accent/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("songs")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
              activeTab === "songs"
                ? "bg-card shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Music size={16} />
            <span>팀 응원가</span>
          </button>
          <button
            onClick={() => setActiveTab("players")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
              activeTab === "players"
                ? "bg-card shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User size={16} />
            <span>선수 응원가</span>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="mt-3 pb-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* 팀 응원가 */}
              {activeTab === "songs" && (
                <div className="flex flex-col gap-2">
                  {sections.length > 0 ? (
                    sections.map((section, sIdx) => (
                      <div key={sIdx} className="bg-card rounded-2xl border border-border overflow-hidden">
                        {/* 섹션 헤더 */}
                        <button
                          onClick={() => setExpandedSection(expandedSection === sIdx ? null : sIdx)}
                          className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: team?.primary }}
                            />
                            <span className="text-sm font-semibold">{section.title}</span>
                            <span className="text-xs text-muted-foreground">{section.songs.length}곡</span>
                          </div>
                          {expandedSection === sIdx ? (
                            <ChevronUp size={16} className="text-muted-foreground" />
                          ) : (
                            <ChevronDown size={16} className="text-muted-foreground" />
                          )}
                        </button>

                        {/* 곡 목록 */}
                        {expandedSection === sIdx && (
                          <div className="border-t border-border">
                            {section.songs.map((song, songIdx) => (
                              <a
                                key={songIdx}
                                href={song.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors border-b border-border last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: (team?.primary || "#000") + "15" }}
                                  >
                                    <Music size={14} style={{ color: team?.primary }} />
                                  </div>
                                  <span className="text-sm font-medium">{song.name}</span>
                                </div>
                                <ExternalLink size={14} className="text-muted-foreground flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-card rounded-2xl border border-border p-8 text-center">
                      <p className="text-muted-foreground text-sm">응원가 정보를 불러오는 중입니다</p>
                    </div>
                  )}
                </div>
              )}

              {/* 선수 응원가 */}
              {activeTab === "players" && (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-accent/30">
                    <p className="text-xs text-muted-foreground">
                      선수 이름을 탭하면 YouTube에서 응원가를 검색합니다
                    </p>
                  </div>
                  {players.length > 0 ? (
                    <div className="grid grid-cols-3 gap-px bg-border">
                      {players.map((player, i) => (
                        <a
                          key={i}
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(team?.name + " " + player.name + " 응원가")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-card flex flex-col items-center gap-2 py-4 hover:bg-accent/20 transition-colors"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: (team?.primary || "#000") + "15", color: team?.primary }}
                          >
                            {player.name.slice(0, 1)}
                          </div>
                          <span className="text-xs font-medium">{player.name}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground text-sm">선수 응원가 정보 준비 중</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
