import { useRef } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { theme } from "@/lib/theme";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  // Default: show Tue→Mon (Mon at end, via scroll)
  // Exception: if today is Monday in current week, show Mon→Sun
  const today = new Date();
  const todayMonday = new Date(today);
  todayMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const startFromMonday = today.getDay() === 1 && +monday === +todayMonday;
  const start = new Date(monday);
  start.setDate(monday.getDate() + (startFromMonday ? 0 : 1));
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

interface DateStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  hasGameDates?: string[];
  teamColor?: string;
}

export default function DateStrip({ selectedDate, onDateChange, hasGameDates = [], teamColor }: DateStripProps) {
  const scrollRef = useRef<ScrollView>(null);

  const goPrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };

  const goNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };

  const weekDates = getWeekDates(selectedDate);

  const goToday = () => onDateChange(new Date());

  return (
    <View style={styles.container}>
      <View style={styles.stripRow}>
        <Pressable onPress={goPrevWeek} style={styles.weekBtn} hitSlop={8}>
          <Text style={styles.weekArrow}>‹</Text>
        </Pressable>

        <View style={styles.todayBtnWrapper}>
          <Pressable
            onPress={goToday}
            style={[styles.todayBtn, isToday(selectedDate) && styles.todayBtnHidden]}
            hitSlop={8}
          >
            <Text style={[styles.todayBtnText, isToday(selectedDate) && styles.todayBtnHidden]}>오늘</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {weekDates.map((date) => {
            const sel = isSameDay(date, selectedDate);
            const today = isToday(date);
            const dayIndex = date.getDay();
            const ds = formatDateStr(date);
            const hasGame = hasGameDates.includes(ds);

            return (
              <Pressable
                key={ds}
                onPress={() => onDateChange(date)}
                style={[styles.dateItem, sel && { backgroundColor: teamColor || theme.foreground }]}
              >
                <Text style={[styles.dayText, sel && styles.dayTextSelected, dayIndex === 0 && !sel && styles.sunday, dayIndex === 6 && !sel && styles.saturday]}>
                  {DAYS[dayIndex]}
                </Text>
                <Text style={[styles.dateNum, sel && styles.dateNumSelected]}>
                  {date.getDate()}
                </Text>
                {today && !sel && <View style={styles.todayDot} />}
                {hasGame && !sel && !today && <View style={styles.gameDot} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable onPress={goNextWeek} style={styles.weekBtn} hitSlop={8}>
          <Text style={styles.weekArrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.card,
  },
  stripRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
  },
  weekBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  weekArrow: { fontSize: 22, color: "#888", fontWeight: "300", lineHeight: 24 },
  todayBtnWrapper: { width: 48, alignItems: "center", justifyContent: "center" },
  todayBtn: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, backgroundColor: theme.muted },
  todayBtnHidden: { opacity: 0 },
  todayBtnText: { fontSize: 11, fontWeight: "600", color: theme.primary },
  scrollContent: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  dateItem: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 48,
  },
  dateItemSelected: {
    backgroundColor: theme.foreground,
  },
  dayText: {
    fontSize: 10,
    color: theme.mutedForeground,
    marginBottom: 4,
  },
  dayTextSelected: {
    color: "rgba(255,255,255,0.7)",
  },
  dateNum: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.foreground,
  },
  dateNumSelected: {
    color: theme.background,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.destructive,
    marginTop: 4,
  },
  gameDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.primary,
    marginTop: 4,
  },
  sunday: {
    color: theme.destructive,
  },
  saturday: {
    color: theme.info,
  },
});
