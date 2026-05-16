import { useState, useRef } from "react";
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { TEAM_COLORS } from "@shared/teamColors";
import { TeamBadge } from "@/components/TeamBadge";
import { savePhoto, resizePhoto, generatePhotoName } from "@/lib/camera";
import { theme } from "@/lib/theme";

const FRAMES = [
  { id: "classic", label: "기본", bg: "#fff" },
  { id: "retro", label: "레트로", bg: "#f0e6d3" },
  { id: "rounded", label: "라운드", bg: theme.card },
  { id: "team", label: "팀컬러", bg: "#fff" },
  { id: "ticket", label: "티켓", bg: "#fef3c7" },
];

export default function JikgwanPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    photoUri: string;
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    stadium: string;
  }>();
  const [frameStyle, setFrameStyle] = useState("classic");
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  const homeColor = TEAM_COLORS[params.homeTeam]?.primary || "#fff";
  const awayColor = TEAM_COLORS[params.awayTeam]?.primary || "#fff";

  const handleNext = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Resize and save the photo
      const resized = await resizePhoto(params.photoUri);
      const fileName = generatePhotoName();
      const savedUri = await savePhoto(resized, fileName);

      // Navigate to write.tsx with saved photo and game data
      router.push({
        pathname: "/jikgwan/write",
        params: {
          photoUri: savedUri,
          gameId: params.gameId ?? "",
          homeTeam: params.homeTeam ?? "",
          awayTeam: params.awayTeam ?? "",
          homeScore: params.homeScore ?? "",
          awayScore: params.awayScore ?? "",
          stadium: params.stadium ?? "",
          dateStr,
          frameStyle,
        },
      });
    } catch {
      // Silently fail, let user retry
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Photo preview */}
      <View style={[styles.photoContainer, { borderColor: FRAMES.find((f) => f.id === frameStyle)?.bg || "#fff", borderWidth: frameStyle === "rounded" ? 0 : 10, borderRadius: frameStyle === "rounded" ? 16 : 20 }]}>
        <Image source={{ uri: params.photoUri }} style={styles.photo} />

        {/* Team overlay at bottom */}
        <View style={styles.overlay}>
          {(params.homeTeam || params.awayTeam) && (
            <View style={styles.infoContainer}>
              <View style={styles.matchupRow}>
                <View style={styles.teamInfo}>
                  {params.awayTeam && <TeamBadge teamId={params.awayTeam} size="sm" variant="ball" />}
                  <Text style={[styles.teamLabel, { color: awayColor }]}>
                    {params.awayTeam ? TEAM_COLORS[params.awayTeam]?.shortName : ""}
                  </Text>
                </View>
                {params.homeScore ? (
                  <Text style={styles.scoreText}>{params.awayScore}:{params.homeScore}</Text>
                ) : null}
                <View style={styles.teamInfo}>
                  {params.homeTeam && <TeamBadge teamId={params.homeTeam} size="sm" variant="ball" />}
                  <Text style={[styles.teamLabel, { color: homeColor }]}>
                    {params.homeTeam ? TEAM_COLORS[params.homeTeam]?.shortName : ""}
                  </Text>
                </View>
              </View>
              {params.stadium && (
                <Text style={styles.metaText}>{params.stadium} · {dateStr}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Frame selector */}
      <View style={styles.frameSelector}>
        <Text style={styles.frameTitle}>프레임 선택</Text>
        <View style={styles.frameRow}>
          {FRAMES.map((f) => (
            <Pressable
              key={f.id}
              style={[
                styles.frameItem,
                { backgroundColor: f.bg },
                frameStyle === f.id && styles.frameItemActive,
              ]}
              onPress={() => setFrameStyle(f.id)}
            >
              <Text style={[
                styles.frameLabel,
                f.id === "ticket" && { color: "#92400e" },
              ]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.retakeBtn} onPress={() => router.back()}>
          <Text style={styles.retakeText}>다시 찍기</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={handleNext} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.nextText}>다음</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  photoContainer: {
    margin: 20,
    marginTop: 60,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  infoContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 14,
    gap: 6,
  },
  matchupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  teamInfo: {
    alignItems: "center",
    gap: 4,
  },
  teamLabel: { fontSize: 12, fontWeight: "bold" },
  scoreText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  metaText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    textAlign: "center",
  },
  // Frame selector
  frameSelector: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  frameTitle: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  frameRow: {
    flexDirection: "row",
    gap: 8,
  },
  frameItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  frameItemActive: {
    borderColor: "#fff",
    borderWidth: 2,
  },
  frameLabel: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  // Actions
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    alignItems: "center",
  },
  retakeText: { color: "#fff", fontSize: 14 },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  nextText: { color: "#000", fontSize: 14, fontWeight: "600" },
});
