import { useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from "react-native";
import { TEAM_COLORS } from "@shared/teamColors";
import { TEAM_ID_TO_CODE } from "@shared/constants";
import { TeamBadge } from "@/components/TeamBadge";
import { EMOTION_CHARACTER } from "@/components/EmotionPicker";
import { theme } from "@/lib/theme";
import type { JikgwanRecord } from "@/lib/db";

interface DiaryCardProps {
  record: JikgwanRecord;
  teamId: string | null;
  onShare?: (uri: string) => void;
  onDelete?: (record: JikgwanRecord) => void;
  onEdit?: (record: JikgwanRecord) => void;
}

export default function DiaryCard({ record, teamId, onShare, onDelete, onEdit }: DiaryCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const photoWidth = screenWidth - 2; // card border
  const teams = parseGameId(record.game_id);
  const homeTeam = teams.homeId ? TEAM_COLORS[teams.homeId] : null;
  const awayTeam = teams.awayId ? TEAM_COLORS[teams.awayId] : null;
  const hasScore = record.score_away != null && record.score_home != null;
  const emotionChar = record.emotion ? EMOTION_CHARACTER[record.emotion] ?? null : null;
  const emotionTeam = teams.homeId || teams.awayId;
  const diaryContent = record.memo || record.three_line_1 || "";

  const photos = parsePhotos(record);
  const [photoIndex, setPhotoIndex] = useState(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
    setPhotoIndex(idx);
  }, []);

  return (
    <View style={styles.card}>
      {/* Photos - swipeable */}
      {photos.length > 0 ? (
        <View style={styles.photoContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={[styles.photo, { width: photoWidth }]} />
            ))}
          </ScrollView>
          {/* Dots */}
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noPhoto}>
          <Text style={styles.noPhotoIcon}>⚾</Text>
        </View>
      )}

      {/* Body */}
      <View style={styles.body}>
        {/* Game info bar */}
        {(homeTeam || awayTeam) && (
          <View style={styles.gameBar}>
            <Text style={[styles.teamName, awayTeam && { color: awayTeam.primary }]} numberOfLines={1}>
              {awayTeam?.shortName || ""}
            </Text>
            {hasScore ? (
              <Text style={styles.score}>{record.score_away}:{record.score_home}</Text>
            ) : (
              <Text style={styles.vs}>VS</Text>
            )}
            <Text style={[styles.teamName, homeTeam && { color: homeTeam.primary }]} numberOfLines={1}>
              {homeTeam?.shortName || ""}
            </Text>
          </View>
        )}

        {/* Meta: stadium + date + emotion */}
        <View style={styles.metaRow}>
          {record.stadium && <Text style={styles.metaText}>{record.stadium}</Text>}
          {record.stadium && <Text style={styles.metaDot}> · </Text>}
          <Text style={styles.metaText}>{record.date}</Text>
          {emotionChar && emotionTeam && (
            <>
              <Text style={styles.metaDot}> · </Text>
              <TeamBadge teamId={emotionTeam} size="sm" emotion={emotionChar} />
            </>
          )}
          {record.is_win === 1 && <Text style={styles.winTag}>승</Text>}
          {record.is_win === -1 && <Text style={styles.lossTag}>패</Text>}
        </View>

        {/* Diary content */}
        {diaryContent ? (
          <Text style={styles.diary}>{diaryContent}</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onShare && photos[0] && (
          <Pressable onPress={() => onShare(photos[0])} style={styles.actionBtn}>
            <Text style={styles.actionText}>공유</Text>
          </Pressable>
        )}
        <Pressable onPress={() => onEdit?.(record)} style={styles.actionBtn}>
          <Text style={styles.actionText}>수정</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => onDelete?.(record)} style={styles.actionBtn}>
          <Text style={[styles.actionText, { color: "#ef4444" }]}>삭제</Text>
        </Pressable>
      </View>
    </View>
  );
}

function parsePhotos(record: JikgwanRecord): string[] {
  if (record.photos) {
    try {
      const parsed = JSON.parse(record.photos);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  if (record.photo_path) return [record.photo_path];
  return [];
}

function parseGameId(gameId: string): { awayId?: string; homeId?: string } {
  const match = gameId.match(/^\d+-(\w{4})-\d+$/);
  if (!match) return {};
  const code = match[1];
  const TEAM_CODE_TO_ID: Record<string, string> = {};
  for (const [id, c] of Object.entries(TEAM_ID_TO_CODE)) {
    TEAM_CODE_TO_ID[c] = id;
  }
  return {
    awayId: TEAM_CODE_TO_ID[code.slice(0, 2)],
    homeId: TEAM_CODE_TO_ID[code.slice(2, 4)],
  };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.border,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    height: 340,
    resizeMode: "cover",
  },
  noPhoto: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.muted,
  },
  noPhotoIcon: { fontSize: 40 },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  gameBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "700",
  },
  score: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.foreground,
  },
  vs: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.mutedForeground,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: theme.mutedForeground,
  },
  metaDot: {
    fontSize: 11,
    color: theme.mutedForeground,
  },
  winTag: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
    marginLeft: 4,
  },
  lossTag: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
    marginLeft: 4,
  },
  diary: {
    fontSize: 14,
    color: theme.foreground,
    lineHeight: 22,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    color: theme.mutedForeground,
    fontWeight: "500",
  },
});
