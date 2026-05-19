import { useMemo } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/lib/ThemeContext";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/db";

interface ExpenseFormProps {
  category: ExpenseCategory;
  onCategoryChange: (cat: ExpenseCategory) => void;
  amount: string;
  onAmountChange: (amt: string) => void;
  memo: string;
  onMemoChange: (memo: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  cancelLabel: string;
  autoFocusAmount?: boolean;
}

export default function ExpenseForm({
  category,
  onCategoryChange,
  amount,
  onAmountChange,
  memo,
  onMemoChange,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  autoFocusAmount,
}: ExpenseFormProps) {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    form: {
      backgroundColor: theme.muted, borderRadius: 14,
      padding: 16, gap: 14,
    },
    catScroll: {
      marginBottom: 2,
    },
    catPill: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingVertical: 8, paddingHorizontal: 14,
      borderRadius: 20, backgroundColor: theme.card,
      borderWidth: 1, borderColor: theme.border,
      marginRight: 8,
    },
    catPillActive: {
      backgroundColor: theme.foreground, borderColor: theme.foreground,
    },
    catPillIcon: { fontSize: 15 },
    catPillLabel: { fontSize: 13, fontWeight: "600", color: theme.foreground },
    catPillLabelActive: { color: theme.background },
    amtRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
    },
    amountInput: {
      flex: 1,
      backgroundColor: theme.card, borderRadius: 10,
      padding: 12, fontSize: 16, color: theme.foreground,
      borderWidth: 1, borderColor: theme.border,
    },
    unit: {
      fontSize: 14, color: theme.mutedForeground, fontWeight: "600",
    },
    memoInput: {
      backgroundColor: theme.card, borderRadius: 10,
      padding: 12, fontSize: 13, color: theme.foreground,
      borderWidth: 1, borderColor: theme.border,
    },
    actions: {
      flexDirection: "row", gap: 10,
    },
    cancelBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 12,
      borderWidth: 1, borderColor: theme.border,
      alignItems: "center",
    },
    cancelText: {
      fontSize: 14, fontWeight: "600", color: theme.foreground,
    },
    saveBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 12,
      backgroundColor: theme.foreground, alignItems: "center",
    },
    saveText: {
      fontSize: 14, fontWeight: "700", color: theme.background,
    },
  }), [theme]);

  return (
    <View style={styles.form}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
        {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, typeof EXPENSE_CATEGORIES[ExpenseCategory]][]).map(([key, info]) => (
          <Pressable
            key={key}
            style={[styles.catPill, category === key && styles.catPillActive]}
            onPress={() => onCategoryChange(key)}
          >
            <Text style={styles.catPillIcon}>{info.icon}</Text>
            <Text style={[styles.catPillLabel, category === key && styles.catPillLabelActive]}>{info.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.amtRow}>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={onAmountChange}
          placeholder="금액"
          placeholderTextColor={theme.mutedForeground}
          keyboardType="number-pad"
          autoFocus={autoFocusAmount}
        />
        <Text style={styles.unit}>원</Text>
      </View>

      <TextInput
        style={styles.memoInput}
        value={memo}
        onChangeText={onMemoChange}
        placeholder="무엇을 사셨나요? (선택)"
        placeholderTextColor={theme.mutedForeground}
      />

      <View style={styles.actions}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>{saveLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
