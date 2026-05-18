import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/ThemeContext";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/db";
import { computeExpenseStats, formatAmount } from "@/lib/expenseStats";

interface ExpenseStatsProps {
  expenses: Expense[];
}

export default function ExpenseStats({ expenses }: ExpenseStatsProps) {
  const { theme } = useTheme();
  const stats = useMemo(() => computeExpenseStats(expenses), [expenses]);
  const maxCatAmount = stats.categoryTotals.length > 0 ? stats.categoryTotals[0].amount : 1;

  const styles = useMemo(() => StyleSheet.create({
    container: { gap: 16, paddingBottom: 100 },
    card: {
      backgroundColor: theme.card, borderRadius: 16,
      borderWidth: 1, borderColor: theme.border, padding: 16,
    },
    cardTitle: { fontSize: 14, fontWeight: "700", color: theme.foreground, marginBottom: 12 },
    // Season total
    totalRow: {
      flexDirection: "row", justifyContent: "center", alignItems: "baseline", gap: 4,
      paddingVertical: 16,
    },
    totalLabel: { fontSize: 13, color: theme.mutedForeground },
    totalAmount: { fontSize: 32, fontWeight: "800", color: theme.foreground },
    totalUnit: { fontSize: 14, color: theme.mutedForeground, fontWeight: "600" },
    // Category bar
    catRow: {
      flexDirection: "row", alignItems: "center",
      marginBottom: 12, gap: 8,
    },
    catIcon: { fontSize: 16, width: 24 },
    catLabel: { fontSize: 12, color: theme.foreground, fontWeight: "600", width: 50 },
    barBg: {
      flex: 1, height: 20, borderRadius: 10,
      backgroundColor: theme.muted, overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: 10 },
    catAmount: {
      fontSize: 12, color: theme.foreground, fontWeight: "700",
      width: 80, textAlign: "right",
    },
    // Monthly
    monthRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    monthLabel: { fontSize: 14, color: theme.foreground, fontWeight: "600" },
    monthAmount: { fontSize: 14, color: theme.foreground, fontWeight: "700" },
    monthLast: { borderBottomWidth: 0 },
    noData: {
      fontSize: 13, color: theme.mutedForeground,
      textAlign: "center", paddingVertical: 24,
    },
  }), [theme]);

  if (expenses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.noData}>아직 지출 기록이 없어요</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Season Total */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>2026시즌 총 지출</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>총</Text>
          <Text style={styles.totalAmount}>{stats.seasonTotal.toLocaleString()}</Text>
        </View>
      </View>

      {/* Category breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>카테고리별 지출</Text>
        {stats.categoryTotals.map((cat) => {
          const pct = Math.round((cat.amount / maxCatAmount) * 100);
          const color = cat.category === "ticket" ? "#3b82f6"
            : cat.category === "food" ? "#22c55e"
            : cat.category === "transport" ? "#f59e0b"
            : cat.category === "goods" ? "#a855f7"
            : cat.category === "uniform" ? "#ec4899"
            : "#6b7280";
          return (
            <View key={cat.category} style={styles.catRow}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={styles.catLabel}>{cat.label}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.catAmount}>{formatAmount(cat.amount)}</Text>
            </View>
          );
        })}
      </View>

      {/* Monthly trend */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>월별 지출</Text>
        {stats.monthlyTotals.map((m, i) => (
          <View key={`${m.year}-${m.month}`} style={[styles.monthRow, i === stats.monthlyTotals.length - 1 && styles.monthLast]}>
            <Text style={styles.monthLabel}>{m.month}월</Text>
            <Text style={styles.monthAmount}>{formatAmount(m.amount)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
