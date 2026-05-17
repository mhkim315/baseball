import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, Pressable, TextInput, Modal, StyleSheet, Image,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { TEAM_COLORS, TEAM_LIST } from "@shared/teamColors";
import { TEAM_ID_TO_CODE } from "@shared/constants";
import EmotionPicker from "@/components/EmotionPicker";
import { TeamBadge } from "@/components/TeamBadge";
import { theme } from "@/lib/theme";
import { addJikgwanRecord, updateJikgwanRecord, getMyTeam, type JikgwanRecord } from "@/lib/db";
import { savePhoto, resizePhoto, generatePhotoName } from "@/lib/camera";
import { fetchScheduleByMonth, fetchDailyScores, type ScheduleGame, type ScoreEntry } from "@/lib/api";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
function formatDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
function formatDateForApi(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseEditPhotos(record: JikgwanRecord): string[] {
  if (record.photos) {
    try {
      const parsed = JSON.parse(record.photos);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  if (record.photo_path) return [record.photo_path];
  return [];
}

function parseGameTeamIds(gameId: string): { awayId: string; homeId: string } {
  const codeMap: Record<string, string> = {};
  for (const [id, c] of Object.entries(TEAM_ID_TO_CODE)) {
    codeMap[c] = id;
  }
  const m = gameId.match(/^\d+-(\w{4})-\d+$/);
  if (m) {
    return {
      awayId: codeMap[m[1].slice(0, 2)] || "",
      homeId: codeMap[m[1].slice(2, 4)] || "",
    };
  }
  return { awayId: "", homeId: "" };
}

function gameEmotions(game: GameOption): { away: "joyful" | "sad" | "neutral"; home: "joyful" | "sad" | "neutral" } | null {
  if (game.cancelled) return { away: "neutral", home: "neutral" };
  if (game.homeScore == null || game.awayScore == null) return null;
  if (game.homeScore === game.awayScore) return { away: "neutral", home: "neutral" };
  if (game.homeScore > game.awayScore) return { away: "sad", home: "joyful" };
  return { away: "joyful", home: "sad" };
}

// Game data for the selected date
interface GameOption {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  cancelled: boolean;
  venue: string;
  time: string;
}

interface DiaryEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editRecord?: JikgwanRecord | null;
}

export default function DiaryEntryModal({ visible, onClose, onSaved, editRecord }: DiaryEntryModalProps) {
  const now = new Date();
  const [step, setStep] = useState<"calendar" | "games" | "write">("calendar");

  // Calendar state
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now);

  // Games state
  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null);

  // Write state
  const [emotion, setEmotion] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [userTeam, setUserTeam] = useState("doosan");
  const [cheeredTeam, setCheeredTeam] = useState<string | null>(null);

  // Film stamp compositing
  const [stampingUri, setStampingUri] = useState<string | null>(null);
  const [stampInfo, setStampInfo] = useState({
    awayTeam: "", homeTeam: "", awayScore: null as number | null,
    homeScore: null as number | null, stadium: "", date: "",
  });
  const hiddenStampRef = useRef<View>(null);

  const dateStr = formatDate(selectedDate);
  const dateStrShort = `${String(selectedDate.getMonth() + 1)}월 ${selectedDate.getDate()}일`;

  // Reset on open
  useEffect(() => {
    if (visible) {
      setCheeredTeam(null);
      if (editRecord) {
        setStep("write");
        setSelectedDate(new Date());
        setSelectedGame(null);
        setEmotion(editRecord.emotion || null);
        setContent(editRecord.memo || "");
        setPhotoUris(parseEditPhotos(editRecord));
        setCheeredTeam(editRecord.cheered_team || null);
        setGames([]);
      } else {
        setStep("calendar");
        setSelectedDate(new Date());
        setSelectedGame(null);
        setEmotion(null);
        setContent("");
        setPhotoUris([]);
        setGames([]);
      }
      getMyTeam().then((t) => { if (t) setUserTeam(t); });
      setStampingUri(null);
    }
  }, [visible, editRecord]);

  // Fetch games when date is selected
  const loadGames = useCallback(async (date: Date) => {
    setGamesLoading(true);
    try {
      const month = date.getMonth() + 1;
      const apiDate = formatDateForApi(date);
      const [schedule, scores] = await Promise.all([
        fetchScheduleByMonth(month),
        fetchDailyScores(apiDate),
      ]);

      const daySched = (schedule?.games ?? []).filter(
        (g: ScheduleGame) => g.date === apiDate
      );

      const scoreMap = new Map<string, ScoreEntry>();
      for (const s of scores?.games ?? []) {
        scoreMap.set(`${s.away} vs ${s.home}`, s);
      }

      const gameOpts: GameOption[] = daySched.map((g: ScheduleGame) => {
        const score = scoreMap.get(`${g.away} vs ${g.home}`);
        return {
          gameId: "",
          homeTeam: TEAM_LIST.find((t) => t.shortName === g.home)?.id || "",
          awayTeam: TEAM_LIST.find((t) => t.shortName === g.away)?.id || "",
          homeScore: score?.homeScore ?? null,
          awayScore: score?.awayScore ?? null,
          cancelled: score?.cancelled ?? false,
          venue: g.venue || "",
          time: g.time || "",
        };
      });

      // Sort: my team's game first
      const sorted = [...gameOpts].sort((a, b) => {
        const aMy = userTeam && (a.homeTeam === userTeam || a.awayTeam === userTeam);
        const bMy = userTeam && (b.homeTeam === userTeam || b.awayTeam === userTeam);
        if (aMy && !bMy) return -1;
        if (!aMy && bMy) return 1;
        return 0;
      });

      setGames(sorted.slice(0, 5));
    } catch {
      setGames([]);
    } finally {
      setGamesLoading(false);
    }
  }, [userTeam]);

  const handleDateSelect = (d: number) => {
    const date = new Date(calYear, calMonth, d);
    setSelectedDate(date);
    loadGames(date);
    setStep("games");
  };

  const handleGameSelect = (game: GameOption) => {
    setSelectedGame(game);
    const isMyGame = userTeam && (game.homeTeam === userTeam || game.awayTeam === userTeam);
    if (isMyGame || (game.homeScore == null && game.awayScore == null) || game.cancelled) {
      setCheeredTeam(null);
      setStep("write");
      return;
    }
    const home = TEAM_COLORS[game.homeTeam];
    const away = TEAM_COLORS[game.awayTeam];
    Alert.alert(
      "응원 팀 선택",
      "어느 팀을 응원했나요?",
      [
        { text: away?.shortName || "원정팀", onPress: () => { setCheeredTeam(game.awayTeam); setStep("write"); } },
        { text: home?.shortName || "홈팀", onPress: () => { setCheeredTeam(game.homeTeam); setStep("write"); } },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "앨범 접근 권한이 필요합니다");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const stampPhoto = async (uri: string): Promise<string> => {
    setStampingUri(uri);
    // Wait for state update to render the hidden compositor
    await new Promise((r) => setTimeout(r, 150));
    const shotUri = await captureRef(hiddenStampRef, { format: "jpg", quality: 0.92 });
    if (!shotUri) throw new Error("capture failed");
    const resized = await resizePhoto(shotUri);
    const fileName = generatePhotoName();
    return await savePhoto(resized, fileName);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!content.trim()) {
      Alert.alert("알림", "내용을 입력해주세요");
      return;
    }
    setSaving(true);
    try {
      // Compute stamp data from selected game or edit record
      const stampAwayTeam = selectedGame?.awayTeam ||
        (editRecord?.game_id ? parseGameTeamIds(editRecord.game_id).awayId : null);
      const stampHomeTeam = selectedGame?.homeTeam ||
        (editRecord?.game_id ? parseGameTeamIds(editRecord.game_id).homeId : null);
      const stampAwayScore = selectedGame?.awayScore ?? editRecord?.score_away ?? null;
      const stampHomeScore = selectedGame?.homeScore ?? editRecord?.score_home ?? null;
      const stampStadium = selectedGame?.venue || editRecord?.stadium || null;
      const stampDate = editRecord?.date || dateStr;
      const hasStampData = !!(stampAwayTeam || stampHomeTeam);

      if (hasStampData) {
        setStampInfo({
          awayTeam: stampAwayTeam || "",
          homeTeam: stampHomeTeam || "",
          awayScore: stampAwayScore,
          homeScore: stampHomeScore,
          stadium: stampStadium || "",
          date: stampDate,
        });
      }

      let savedPhotoUris: string[] = [];
      if (photoUris.length > 0) {
        for (const uri of photoUris) {
          try {
            let savedUri: string;
            if (hasStampData) {
              savedUri = await stampPhoto(uri);
            } else {
              const resized = await resizePhoto(uri);
              const fileName = generatePhotoName();
              savedUri = await savePhoto(resized, fileName);
            }
            savedPhotoUris.push(savedUri);
            try {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status === "granted") {
                await MediaLibrary.saveToLibraryAsync(savedUri);
              }
            } catch (e) {
              console.warn("MediaLibrary save failed", e);
            }
          } catch (e) {
            throw new Error(`사진 처리 실패: ${uri}`);
          }
        }
      }
      const photosJson = savedPhotoUris.length > 0 ? JSON.stringify(savedPhotoUris) : null;

      const myTeam = await getMyTeam();
      const targetTeam = cheeredTeam || myTeam;
      let isWin: number | null = null;
      if (targetTeam) {
        const hScore = selectedGame?.homeScore ?? editRecord?.score_home ?? null;
        const aScore = selectedGame?.awayScore ?? editRecord?.score_away ?? null;
        if (hScore != null && aScore != null) {
          let isHome: boolean | null = null;
          if (selectedGame) {
            isHome = selectedGame.homeTeam === targetTeam;
          } else if (editRecord) {
            const gt = parseGameTeamIds(editRecord.game_id);
            isHome = gt.homeId === targetTeam;
          }
          if (isHome === true) {
            isWin = hScore > aScore ? 1 : hScore < aScore ? -1 : 0;
          } else if (isHome === false) {
            isWin = aScore > hScore ? 1 : aScore < hScore ? -1 : 0;
          }
        }
      }

      let gameId = "";
      try {
        const awayCode = selectedGame?.awayTeam ? TEAM_ID_TO_CODE[selectedGame.awayTeam] || "" : "";
        const homeCode = selectedGame?.homeTeam ? TEAM_ID_TO_CODE[selectedGame.homeTeam] || "" : "";
        gameId = awayCode && homeCode ? `0000-${awayCode}${homeCode}-0` : "";
      } catch {}

      if (editRecord) {
        await updateJikgwanRecord(editRecord.id, {
          memo: content.trim(),
          emotion: emotion || null,
          photos: photosJson,
          is_win: isWin,
          cheered_team: (cheeredTeam || null) as string | null,
        });
      } else {
        await addJikgwanRecord({
          game_id: gameId || "",
          date: dateStr,
          photo_path: savedPhotoUris[0] || null,
          photos: photosJson,
          memo: content.trim(),
          score_away: selectedGame?.awayScore != null ? selectedGame.awayScore : null,
          score_home: selectedGame?.homeScore != null ? selectedGame.homeScore : null,
          emotion: emotion || null,
          three_line_1: null,
          three_line_2: null,
          three_line_3: null,
          frame_style: "classic",
          stadium: selectedGame?.venue || null,
          is_win: isWin != null ? isWin : null,
          cheered_team: (cheeredTeam || myTeam || null) as string | null,
        });
      }

      Alert.alert("저장 완료", editRecord ? "기록이 수정되었습니다" : "직관 기록이 저장되었습니다");
      onSaved();
    } catch (e) {
      console.warn("DiaryEntryModal handleSave error", e);
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("저장 오류", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // --- Calendar helpers ---
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth;

  const cells: { day: number; isToday: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isToday: isCurrentMonth && today.getDate() === d });
  }

  const calPrev = () => {
    const m = calMonth === 0 ? 11 : calMonth - 1;
    setCalYear(calMonth === 0 ? calYear - 1 : calYear);
    setCalMonth(m);
  };
  const calNext = () => {
    const m = calMonth === 11 ? 0 : calMonth + 1;
    setCalYear(calMonth === 11 ? calYear + 1 : calYear);
    setCalMonth(m);
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Hidden stamp compositor — renders photo + film stamp as composite image */}
        {stampingUri && (
          <View ref={hiddenStampRef} style={{ position: "absolute", left: 0, top: 0, width: 300, height: 400 }} collapsable={false}>
            <View>
              <Image source={{ uri: stampingUri }} style={{ width: 300, height: 400 }} resizeMode="cover" />
              <View style={stampStyles.container}>
                <View style={stampStyles.bg}>
                    {stampInfo.awayTeam && stampInfo.homeTeam && (
                      <Text style={stampStyles.text} numberOfLines={1}>
                        {TEAM_COLORS[stampInfo.awayTeam]?.shortName} vs {TEAM_COLORS[stampInfo.homeTeam]?.shortName}
                      </Text>
                    )}
                    {stampInfo.homeScore != null && (
                      <Text style={[stampStyles.text, stampStyles.score]}>{stampInfo.awayScore}:{stampInfo.homeScore}</Text>
                    )}
                    {stampInfo.stadium ? (
                      <Text style={stampStyles.text} numberOfLines={1}>{stampInfo.stadium}</Text>
                    ) : null}
                    <Text style={stampStyles.text}>{stampInfo.date}</Text>
                  </View>
                </View>
              </View>
          </View>
        )}
        <View style={styles.sheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header with step */}
          <View style={styles.stepHeader}>
            {step === "calendar" && <Text style={styles.stepTitle}>날짜 선택</Text>}
            {step === "games" && (
              <View style={styles.stepBackRow}>
                <Pressable onPress={() => setStep("calendar")} hitSlop={8}>
                  <Text style={styles.backArrow}>◀</Text>
                </Pressable>
                <Text style={styles.stepTitle}>{dateStrShort} 경기</Text>
                <View style={{ width: 20 }} />
              </View>
            )}
            {step === "write" && (
              <View style={styles.stepBackRow}>
                <Pressable onPress={() => setStep("games")} hitSlop={8}>
                  <Text style={styles.backArrow}>◀</Text>
                </Pressable>
                <Text style={styles.stepTitle}>{editRecord ? "기록 수정" : "기록 작성"}</Text>
                <View style={{ width: 20 }} />
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Step 1: Calendar */}
            {step === "calendar" && (
              <View>
                {/* Month nav */}
                <View style={styles.calHeader}>
                  <Pressable onPress={calPrev} hitSlop={8}>
                    <Text style={styles.calNav}>◀</Text>
                  </Pressable>
                  <Text style={styles.calMonth}>{calYear}년 {calMonth + 1}월</Text>
                  <Pressable onPress={calNext} hitSlop={8}>
                    <Text style={styles.calNav}>▶</Text>
                  </Pressable>
                </View>

                {/* Day headers */}
                <View style={styles.calDayRow}>
                  {DAYS.map((d, i) => (
                    <Text key={d} style={[styles.calDayHeader, (i === 0 || i === 6) && { color: theme.mutedForeground }]}>{d}</Text>
                  ))}
                </View>

                {/* Grid */}
                <View style={styles.calGrid}>
                  {cells.map((cell, idx) => {
                    if (cell.day === 0) return <View key={`e-${idx}`} style={styles.calCell} />;
                    return (
                      <Pressable
                        key={`d-${cell.day}`}
                        style={styles.calCell}
                        onPress={() => handleDateSelect(cell.day)}
                      >
                        <View style={[styles.calDayInner, cell.isToday && styles.calDayToday]}>
                          <Text style={styles.calDayNum}>
                            {cell.day}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

              </View>
            )}

            {/* Step 2: Game list */}
            {step === "games" && (
              <View>
                {gamesLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>경기 불러오는 중...</Text>
                  </View>
                ) : games.length === 0 ? (
                  <View style={styles.noGamesBox}>
                    <Text style={styles.noGamesIcon}>⚾</Text>
                    <Text style={styles.noGamesText}>{dateStrShort}에는 경기가 없어요</Text>
                    <Pressable style={styles.writeWithoutGame} onPress={() => { setSelectedGame(null); setStep("write"); }}>
                      <Text style={styles.writeWithoutGameText}>경기정보 없이 쓰기</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                  <View style={styles.gameList}>
                    {games.map((g, i) => {
                      const home = TEAM_COLORS[g.homeTeam];
                      const away = TEAM_COLORS[g.awayTeam];
                      const hasScore = g.homeScore != null && g.awayScore != null;
                      const emotions = gameEmotions(g);
                      const isMyGame = userTeam && (g.homeTeam === userTeam || g.awayTeam === userTeam);
                      const myTeamColor = isMyGame ? TEAM_COLORS[userTeam]?.primary : null;
                      return (
                        <Pressable
                          key={`${g.homeTeam}-${g.awayTeam}-${i}`}
                          style={[styles.gameCard, isMyGame && myTeamColor && { borderColor: myTeamColor, borderWidth: 2 }]}
                          onPress={() => handleGameSelect(g)}
                        >
                          <View style={styles.gameCardTop}>
                            {/* MY badge at edge */}
                            {userTeam === g.awayTeam && (
                              <View style={[styles.myBadgeEdge, { left: 0 }]}>
                                <Text style={[styles.myBadge, { backgroundColor: myTeamColor || "#333" }]}>MY</Text>
                              </View>
                            )}
                            {userTeam === g.homeTeam && (
                              <View style={[styles.myBadgeEdge, { right: 0 }]}>
                                <Text style={[styles.myBadge, { backgroundColor: myTeamColor || "#333" }]}>MY</Text>
                              </View>
                            )}

                            <View style={styles.gameTeamRow}>
                              <TeamBadge teamId={g.awayTeam} size="sm" emotion={emotions?.away ?? "default"} />
                              <Text style={[styles.gameTeamName, { color: away?.primary }]}>
                                {away?.shortName || "?"}
                              </Text>
                              {hasScore && (
                                <Text style={styles.gameScore}>{g.awayScore}</Text>
                              )}
                            </View>

                            {g.cancelled ? (
                              <Text style={styles.gameVs}>취소</Text>
                            ) : (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Text style={styles.gameVs}>VS</Text>
                                <Text style={styles.gameMeta}>{g.time}</Text>
                              </View>
                            )}

                            <View style={styles.gameTeamRow}>
                              {hasScore && (
                                <Text style={styles.gameScore}>{g.homeScore}</Text>
                              )}
                              <Text style={[styles.gameTeamName, { color: home?.primary }]}>
                                {home?.shortName || "?"}
                              </Text>
                              <TeamBadge teamId={g.homeTeam} size="sm" emotion={emotions?.home ?? "default"} />
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Pressable style={styles.writeWithoutGame} onPress={() => { setSelectedGame(null); setStep("write"); }}>
                    <Text style={styles.writeWithoutGameText}>경기정보 없이 쓰기</Text>
                  </Pressable>
                  </>
                )}
              </View>
            )}

            {/* Step 3: Write */}
            {step === "write" && (
              <View>
                {/* Selected game summary */}
                {selectedGame && (
                  <View style={styles.selectedGameBanner}>
                    <TeamBadge teamId={selectedGame.awayTeam} size="sm" />
                    <Text style={styles.selectedGameText}>
                      {TEAM_COLORS[selectedGame.awayTeam]?.shortName} VS {TEAM_COLORS[selectedGame.homeTeam]?.shortName}
                    </Text>
                    <TeamBadge teamId={selectedGame.homeTeam} size="sm" />
                  </View>
                )}

                {/* Edit mode: game info + team selector */}
                {editRecord && editRecord.game_id && parseGameTeamIds(editRecord.game_id).awayId && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>응원팀</Text>
                    <View style={styles.editGameRow}>
                      {(() => {
                        const gt = parseGameTeamIds(editRecord.game_id);
                        const ac = TEAM_COLORS[gt.awayId];
                        const hc = TEAM_COLORS[gt.homeId];
                        const hasScores = editRecord.score_away != null && editRecord.score_home != null;
                        return (
                          <>
                            <Pressable style={[styles.cheerTeamCard, cheeredTeam === gt.awayId && { borderColor: ac?.primary || "#333", borderWidth: 2 }]} onPress={() => setCheeredTeam(gt.awayId)}>
                              <TeamBadge teamId={gt.awayId} size="sm" />
                              <Text style={[styles.cheerTeamName, { color: ac?.primary }]}>{ac?.shortName || "?"}</Text>
                              {hasScores && <Text style={styles.cheerTeamScore}>{editRecord.score_away}</Text>}
                              {cheeredTeam === gt.awayId && <Text style={styles.cheerTeamBadge}>✓</Text>}
                            </Pressable>
                            <Text style={styles.gameVs}>VS</Text>
                            <Pressable style={[styles.cheerTeamCard, cheeredTeam === gt.homeId && { borderColor: hc?.primary || "#333", borderWidth: 2 }]} onPress={() => setCheeredTeam(gt.homeId)}>
                              <TeamBadge teamId={gt.homeId} size="sm" />
                              <Text style={[styles.cheerTeamName, { color: hc?.primary }]}>{hc?.shortName || "?"}</Text>
                              {hasScores && <Text style={styles.cheerTeamScore}>{editRecord.score_home}</Text>}
                              {cheeredTeam === gt.homeId && <Text style={styles.cheerTeamBadge}>✓</Text>}
                            </Pressable>
                          </>
                        );
                      })()}
                    </View>
                    {editRecord.score_away != null && editRecord.score_home != null && cheeredTeam && (
                      <Text style={styles.winResultText}>
                        {(() => {
                          const gt = parseGameTeamIds(editRecord.game_id);
                          const isHome = cheeredTeam === gt.homeId;
                          const sA = editRecord.score_away ?? 0;
                          const sH = editRecord.score_home ?? 0;
                          if (sA === sH) return "무승부";
                          const won = isHome ? sH > sA : sA > sH;
                          return won ? "승리!" : "패배";
                        })()}
                      </Text>
                    )}
                  </View>
                )}

                {/* Emotion */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>오늘의 기분</Text>
                  <EmotionPicker value={emotion} onChange={setEmotion} teamId={userTeam} />
                </View>

                {/* Photos */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>사진 ({photoUris.length}장)</Text>
                  <View style={styles.photoGrid}>
                    {photoUris.map((uri, i) => (
                      <View key={i} style={styles.photoThumbWrap}>
                        <Image source={{ uri }} style={styles.photoThumb} />
                        <Pressable style={styles.photoRemove} onPress={() => setPhotoUris((prev) => prev.filter((_, idx) => idx !== i))}>
                          <Text style={styles.photoRemoveText}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                    <Pressable style={styles.photoAddBtn} onPress={pickPhoto}>
                      <Text style={styles.photoAddIcon}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Free-form diary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>직관일기</Text>
                  <TextInput
                    style={styles.diaryInput}
                    value={content}
                    onChangeText={setContent}
                    placeholder={`${dateStrShort}의 직관 이야기를 자유롭게 적어보세요 :)`}
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom button */}
          <View style={styles.bottomRow}>
            {step === "write" ? (
              <>
                <Pressable style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>취소</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color={theme.background} size="small" />
                  ) : (
                    <Text style={styles.saveText}>저장</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.cancelBtnFull} onPress={handleClose}>
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 8,
  },
  handleRow: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border },

  // Step header
  stepHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.foreground,
    textAlign: "center",
  },
  stepBackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backArrow: { fontSize: 16, color: theme.foreground },

  scrollContent: { padding: 20, paddingTop: 0 },

  // Calendar
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calNav: { fontSize: 14, color: theme.foreground, paddingHorizontal: 8 },
  calMonth: { fontSize: 16, fontWeight: "700", color: theme.foreground },
  calDayRow: { flexDirection: "row", marginBottom: 4 },
  calDayHeader: {
    flex: 1, textAlign: "center", fontSize: 11,
    color: theme.mutedForeground, fontWeight: "600", paddingVertical: 4,
  },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: "14.28%", aspectRatio: 1,
    justifyContent: "center", alignItems: "center",
  },
  calDayInner: {
    width: 28, height: 28,
    justifyContent: "center", alignItems: "center",
    borderRadius: 14,
  },
  calDayToday: {
    backgroundColor: theme.muted,
  },
  calDayNum: { fontSize: 14, color: theme.foreground, fontWeight: "500" },

  // Games
  loadingBox: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 13, color: theme.mutedForeground },
  noGamesBox: { alignItems: "center", paddingVertical: 40, gap: 12 },
  noGamesIcon: { fontSize: 40 },
  noGamesText: { fontSize: 14, color: theme.mutedForeground },
  writeWithoutGame: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 12, backgroundColor: theme.muted,
    alignSelf: "center", marginTop: 8,
  },
  writeWithoutGameText: { fontSize: 13, fontWeight: "600", color: theme.foreground },
  gameList: { gap: 10 },
  gameCard: {
    backgroundColor: theme.card, borderRadius: 14, borderWidth: 1,
    borderColor: theme.border, paddingVertical: 10, paddingHorizontal: 14,
  },
  gameCardTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  gameTeamRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  gameTeamName: { fontSize: 14, fontWeight: "600" },
  gameScore: { fontSize: 18, fontWeight: "700", color: theme.foreground },
  myBadge: {
    fontSize: 10, fontWeight: "800", color: "#fff",
    backgroundColor: "#333", paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4, overflow: "hidden",
  },
  myBadgeEdge: {
    position: "absolute", top: 0, bottom: 0, justifyContent: "center", zIndex: 1,
  },
  gameVs: { fontSize: 12, color: theme.mutedForeground, fontWeight: "600" },
  gameMeta: { fontSize: 11, color: theme.mutedForeground },

  // Selected game banner
  selectedGameBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, marginBottom: 20,
    backgroundColor: theme.muted, borderRadius: 12, padding: 12,
  },
  selectedGameText: { fontSize: 14, fontWeight: "700", color: theme.foreground },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.foreground, marginBottom: 10 },

  // Photo grid
  photoGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
  photoThumbWrap: {
    position: "relative", borderRadius: 10, overflow: "hidden",
  },
  photoThumb: {
    width: 80, height: 80, borderRadius: 10,
  },
  photoRemove: {
    position: "absolute", top: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", alignItems: "center",
  },
  photoRemoveText: { color: "#fff", fontSize: 14, fontWeight: "700", lineHeight: 16 },
  photoAddBtn: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 1, borderColor: theme.border, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center",
    backgroundColor: theme.muted,
  },
  photoAddIcon: { fontSize: 24, color: theme.mutedForeground },

  // Input
  inputRow: { position: "relative", marginBottom: 10 },
  input: {
    backgroundColor: theme.card, borderRadius: 12,
    padding: 14, paddingRight: 50,
    fontSize: 14, color: theme.foreground,
    borderWidth: 1, borderColor: theme.border,
    lineHeight: 20, minHeight: 44,
  },
  diaryInput: {
    backgroundColor: theme.card, borderRadius: 14,
    padding: 16,
    fontSize: 15, color: theme.foreground,
    borderWidth: 1, borderColor: theme.border,
    lineHeight: 24, minHeight: 160,
  },
  charCount: {
    position: "absolute", bottom: 8, right: 12,
    fontSize: 10, color: theme.mutedForeground,
  },

  // Bottom
  bottomRow: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 20, paddingTop: 8,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border, alignItems: "center",
  },
  cancelBtnFull: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: theme.muted, alignItems: "center",
  },
  cancelText: { fontSize: 14, color: theme.foreground, fontWeight: "600" },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: theme.foreground, alignItems: "center",
  },
  saveText: { fontSize: 14, fontWeight: "700", color: theme.background },
  editGameRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  cheerTeamCard: {
    alignItems: "center", gap: 6,
    backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
    paddingVertical: 12, paddingHorizontal: 20, minWidth: 100,
  },
  cheerTeamName: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  cheerTeamScore: { fontSize: 18, fontWeight: "700", color: theme.foreground },
  cheerTeamBadge: {
    position: "absolute", top: -6, right: -6,
    fontSize: 12, fontWeight: "800", color: "#fff",
    backgroundColor: theme.foreground,
    width: 20, height: 20, borderRadius: 10, textAlign: "center", lineHeight: 20,
    overflow: "hidden",
  },
  winResultText: {
    fontSize: 14, fontWeight: "700", color: theme.foreground,
    textAlign: "center", marginTop: 8,
  },
});

const stampStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    right: 0,
    padding: 10,
  },
  bg: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 1,
    alignItems: "flex-end",
  },
  text: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    fontFamily: "monospace",
    includeFontPadding: false,
  },
  score: {
    fontSize: 14,
    fontWeight: "700",
  },
});
