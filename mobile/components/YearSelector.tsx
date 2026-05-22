import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/lib/ThemeContext";
import { fetchSeasons } from "@/lib/api";

let _availableYears: number[] | null = null;
let _fetchPromise: Promise<number[]> | null = null;

async function getAvailableYears(): Promise<number[]> {
  if (_availableYears) return _availableYears;
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = (async () => {
    try {
      const res = await fetchSeasons();
      _availableYears = (res?.years ?? [new Date().getFullYear()]).filter((y) => y !== 2020);
    } catch {
      _availableYears = [new Date().getFullYear()];
    }
    return _availableYears;
  })();
  return _fetchPromise;
}

interface YearSelectorProps {
  year: number;
  onYearChange: (year: number) => void;
}

export default function YearSelector({ year, onYearChange }: YearSelectorProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    getAvailableYears().then(setYears);
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    chip: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingVertical: 4, paddingHorizontal: 10,
      borderRadius: 10, backgroundColor: theme.secondary,
    },
    chipText: { fontSize: 13, fontWeight: "600", color: theme.foreground },
    chipArrow: { fontSize: 8, color: theme.mutedForeground },
    overlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center", alignItems: "center", padding: 16,
    },
    pickerModal: {
      backgroundColor: theme.card, borderRadius: 20, padding: 14,
      width: "100%", maxWidth: 280,
    },
    pickerTitle: {
      fontSize: 14, fontWeight: "600", color: theme.foreground,
      textAlign: "center", marginBottom: 8,
    },
    pickerRow: {
      paddingVertical: 12, paddingHorizontal: 16,
      borderRadius: 10, alignItems: "center",
    },
    pickerRowActive: { backgroundColor: theme.secondary },
    pickerYearText: { fontSize: 16, fontWeight: "600", color: theme.foreground },
    pickerYearTextActive: { fontSize: 18, fontWeight: "800", color: theme.primary },
  }), [theme]);

  return (
    <>
      <Pressable style={styles.chip} onPress={() => setOpen(true)}>
        <Text style={styles.chipText}>{year}</Text>
        <Text style={styles.chipArrow}>▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerModal} onPress={() => {}}>
            <Text style={styles.pickerTitle}>시즌 선택</Text>
            <ScrollView>
              {years.map((y) => (
                <Pressable
                  key={y}
                  style={[styles.pickerRow, y === year && styles.pickerRowActive]}
                  onPress={() => { onYearChange(y); setOpen(false); }}
                >
                  <Text style={[styles.pickerYearText, y === year && styles.pickerYearTextActive]}>
                    {y}년
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
