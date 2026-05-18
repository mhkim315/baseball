import { useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getDaysInMonth, getFirstDayOfMonth } from "@shared/constants";
import { useTheme } from "@/lib/ThemeContext";
import { getDailyTotals, formatAmount } from "@/lib/expenseStats";
import type { Expense, JikgwanRecord } from "@/lib/db";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface ExpenseCalendarProps {
  year: number;
  month: number;
  expenses: Expense[];
  records?: JikgwanRecord[];
  onSelectDate: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

export default function ExpenseCalendar({
  year, month, expenses, records, onSelectDate, onMonthChange,
}: ExpenseCalendarProps) {
  const { theme } = useTheme();

  const dailyTotals = useMemo(() => getDailyTotals(expenses), [expenses]);
  const recordDates = useMemo(() => {
    const set = new Set<string>();
    if (records) {
      for (const r of records) {
        set.add(r.date);
      }
    }
    return set;
  }, [records]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells: { day: number; isToday: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isToday: isCurrentMonth && today.getDate() === d });
  }

  const monthTranslateX = useRef(new Animated.Value(0)).current;

  const handlePrev = () => {
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    onMonthChange(y, m);
  };
  const handleNext = () => {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    onMonthChange(y, m);
  };

  const handlePrevRef = useRef(handlePrev);
  handlePrevRef.current = handlePrev;
  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  const monthPanGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((e) => { monthTranslateX.setValue(Math.max(-40, Math.min(40, e.translationX))); })
    .onEnd((e) => {
      if (e.translationX > 60) handlePrevRef.current();
      else if (e.translationX < -60) handleNextRef.current();
      Animated.spring(monthTranslateX, { toValue: 0, useNativeDriver: true }).start();
    });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: theme.card, borderRadius: 16,
      borderWidth: 1, borderColor: theme.border, padding: 12,
    },
    header: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
    },
    navBtn: { fontSize: 14, color: theme.foreground, paddingHorizontal: 8 },
    monthTitle: { fontSize: 16, fontWeight: "700", color: theme.foreground },
    dayRow: { flexDirection: "row", marginBottom: 4 },
    dayHeader: {
      flex: 1, textAlign: "center", fontSize: 11,
      color: theme.mutedForeground, fontWeight: "600", paddingVertical: 4,
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    cell: {
      width: "14.28%", height: 72,
      justifyContent: "center", alignItems: "center",
      borderRadius: 8,
    },
    cellInner: {
      width: "100%", height: "100%",
      justifyContent: "flex-start", alignItems: "center",
      paddingTop: 6, borderRadius: 8, gap: 2,
    },
    dayNum: { fontSize: 13, color: theme.foreground, fontWeight: "500" },
    expenseAmt: {
      fontSize: 10, color: theme.mutedForeground, fontWeight: "600",
    },
    dot: {
      width: 5, height: 5, borderRadius: 3,
      backgroundColor: theme.foreground, marginTop: 1,
    },
  }), [theme]);

  return (
    <GestureDetector gesture={monthPanGesture}>
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateX: monthTranslateX }] }}>
        <View style={styles.header}>
          <Pressable onPress={handlePrev} hitSlop={8}>
            <Text style={styles.navBtn}>◀</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{year}년 {month + 1}월</Text>
          <Pressable onPress={handleNext} hitSlop={8}>
            <Text style={styles.navBtn}>▶</Text>
          </Pressable>
        </View>

        <View style={styles.dayRow}>
          {DAYS.map((d, i) => (
            <Text key={d} style={[styles.dayHeader, (i === 0 || i === 6) && { color: theme.mutedForeground }]}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((cell, idx) => {
            if (cell.day === 0) return <View key={`e-${idx}`} style={styles.cell} />;
            const total = dailyTotals.get(cell.day) || 0;
            const hasRecord = recordDates.has(`${year}.${String(month + 1).padStart(2, "0")}.${String(cell.day).padStart(2, "0")}`);
            const amtStr = formatAmount(total);
            const amtFontSize = amtStr.length > 6 ? 8 : amtStr.length > 4 ? 9 : 10;
            return (
              <Pressable
                key={`d-${cell.day}`}
                style={styles.cell}
                onPress={() => onSelectDate(new Date(year, month, cell.day))}
              >
                <View style={[styles.cellInner, cell.isToday && { borderWidth: 2, borderColor: theme.foreground }]}>
                  <Text style={[styles.dayNum, cell.isToday && { fontWeight: "700" }]}>{cell.day}</Text>
                  {total > 0 && (
                    <Text style={[styles.expenseAmt, { fontSize: amtFontSize }]} numberOfLines={1}>{amtStr}</Text>
                  )}
                  {hasRecord && <View style={styles.dot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
    </GestureDetector>
  );
}
