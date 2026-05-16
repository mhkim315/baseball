import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "@/lib/theme";

const EMOTIONS = [
  { id: "excited", emoji: "😆", label: "신나" },
  { id: "happy", emoji: "🤩", label: "최고" },
  { id: "neutral", emoji: "😐", label: "보통" },
  { id: "sad", emoji: "😢", label: "아쉬워" },
  { id: "angry", emoji: "😤", label: "화나" },
];

interface EmotionPickerProps {
  value: string | null;
  onChange: (emotion: string) => void;
}

export default function EmotionPicker({ value, onChange }: EmotionPickerProps) {
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
            <Text style={[styles.emoji, value === e.id && styles.emojiSelected]}>
              {e.emoji}
            </Text>
            <Text style={[styles.label, value === e.id && styles.labelSelected]}>
              {e.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const EMOTION_EMOJI: Record<string, string> = {};
for (const e of EMOTIONS) {
  EMOTION_EMOJI[e.id] = e.emoji;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  item: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: theme.muted,
    minWidth: 56,
  },
  emoji: {
    fontSize: 26,
  },
  emojiSelected: {
    fontSize: 26,
  },
  label: {
    fontSize: 10,
    color: theme.mutedForeground,
    marginTop: 2,
  },
  labelSelected: {
    color: theme.background,
  },
});
