import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { TeamBadge } from "@/components/TeamBadge";
import { useTheme } from "@/lib/ThemeContext";

export type EmotionId = "neutral" | "joyful" | "sad" | "angry" | "furious" | "shocked";

// Maps our emotion IDs to character image names (matches {teamId}_{character}.png)
const EMOTIONS: { id: EmotionId; character: EmotionId; label: string }[] = [
  { id: "neutral", character: "neutral", label: "보통" },
  { id: "joyful", character: "joyful", label: "기쁨" },
  { id: "sad", character: "sad", label: "슬픔" },
  { id: "angry", character: "angry", label: "화남" },
  { id: "furious", character: "furious", label: "대노" },
  { id: "shocked", character: "shocked", label: "놀람" },
];

// Lookup: emotion ID → character image name for TeamBadge
export const EMOTION_CHARACTER: Record<string, EmotionId> = {};
for (const e of EMOTIONS) {
  EMOTION_CHARACTER[e.id] = e.character;
}

interface EmotionPickerProps {
  value: string | null;
  onChange: (emotion: string) => void;
  teamId: string;
}

export default function EmotionPicker({ value, onChange, teamId }: EmotionPickerProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: "center",
    },
    row: {
      flexDirection: "row",
      gap: 8,
    },
    item: {
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 14,
      backgroundColor: theme.muted,
      minWidth: 56,
      gap: 4,
    },
    label: {
      fontSize: 10,
      color: theme.mutedForeground,
      fontWeight: "500",
    },
    labelSelected: {
      color: theme.background,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {EMOTIONS.map((e) => (
          <Pressable
            key={e.id}
            style={[
              styles.item,
              value === e.id && { backgroundColor: theme.foreground },
            ]}
            onPress={() => onChange(e.id)}
          >
            <TeamBadge
              teamId={teamId}
              size="sm"
              emotion={e.character}
            />
            <Text style={[styles.label, value === e.id && styles.labelSelected]}>
              {e.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
