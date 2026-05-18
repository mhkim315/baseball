import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, Pressable, TextInput, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/ThemeContext";
import { EXPENSE_CATEGORIES, addExpense, type ExpenseCategory } from "@/lib/db";
import { formatAmount } from "@/lib/expenseStats";

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  presetDate?: Date | null;
}

export default function ExpenseModal({ visible, onClose, onSaved, presetDate }: ExpenseModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetTranslateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(presetDate || now);
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  // Animate open
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      sheetTranslateY.setValue(500);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(sheetTranslateY, {
          toValue: 0, useNativeDriver: true, tension: 50, friction: 9,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1, duration: 250, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Track keyboard
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setSelectedDate(presetDate || new Date());
      setCategory("food");
      setAmount("");
      setMemo("");
    }
  }, [visible, presetDate]);

  const dateStr = `${selectedDate.getFullYear()}.${String(selectedDate.getMonth() + 1).padStart(2, "0")}.${String(selectedDate.getDate()).padStart(2, "0")}`;

  const handleSave = async () => {
    const amt = parseInt(amount.replace(/,/g, ""));
    if (!amt || amt <= 0) return;
    try {
      await addExpense({
        record_id: null,
        date: dateStr,
        category,
        amount: amt,
        memo: memo.trim() || null,
      });
      onSaved();
      handleClose();
    } catch (e) {
      console.warn("ExpenseModal save error", e);
    }
  };

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, { toValue: 500, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setShouldRender(false);
      onClose();
    });
  }, [sheetTranslateY, backdropOpacity, onClose]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 999, justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "92%",
    },
    handleRow: { alignItems: "center", paddingVertical: 16 },
    handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: theme.border },
    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 20, marginBottom: 16,
    },
    headerBtn: {
      paddingVertical: 8, paddingHorizontal: 12,
      borderRadius: 10, minWidth: 52, alignItems: "center",
    },
    headerCancelBtn: {
      borderWidth: 1, borderColor: theme.border,
    },
    headerSaveBtn: {
      backgroundColor: theme.foreground,
    },
    headerBtnText: {
      fontSize: 14, fontWeight: "600",
    },
    headerCancelText: {
      color: theme.foreground,
    },
    headerSaveText: {
      fontWeight: "700", color: theme.background,
    },
    title: {
      flex: 1,
      fontSize: 17, fontWeight: "700", color: theme.foreground, textAlign: "center",
    },
    content: { padding: 20, paddingTop: 0 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.foreground, marginBottom: 10 },
    dateText: { fontSize: 15, color: theme.foreground, fontWeight: "600" },
    catRow: {
      flexDirection: "row", gap: 8, flexWrap: "wrap",
    },
    catBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingVertical: 10, paddingHorizontal: 14,
      borderRadius: 12, backgroundColor: theme.card,
      borderWidth: 1, borderColor: theme.border,
    },
    catBtnActive: {
      borderColor: theme.foreground, backgroundColor: theme.muted,
    },
    catIcon: { fontSize: 16 },
    catLabel: { fontSize: 13, color: theme.foreground, fontWeight: "500" },
    input: {
      backgroundColor: theme.card, borderRadius: 12,
      padding: 14, fontSize: 16, color: theme.foreground,
      borderWidth: 1, borderColor: theme.border,
    },
    memoInput: {
      backgroundColor: theme.card, borderRadius: 12,
      padding: 14, fontSize: 14, color: theme.foreground,
      borderWidth: 1, borderColor: theme.border,
    },
    bottomRow: {
      flexDirection: "row", gap: 12,
      paddingHorizontal: 20, paddingTop: 8,
    },
    cancelBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      borderWidth: 1, borderColor: theme.border, alignItems: "center",
    },
    cancelText: { fontSize: 14, color: theme.foreground, fontWeight: "600" },
    saveBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 14,
      backgroundColor: theme.foreground, alignItems: "center",
    },
    saveText: { fontSize: 14, fontWeight: "700", color: theme.background },
  }), [theme]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity, backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ justifyContent: "flex-end" }}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }], paddingBottom: Math.max(insets.bottom, 8) + keyboardHeight }]}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Pressable style={[styles.headerBtn, styles.headerCancelBtn]} onPress={handleClose}>
              <Text style={[styles.headerBtnText, styles.headerCancelText]}>취소</Text>
            </Pressable>
            <Text style={styles.title}>지출 기록</Text>
            <Pressable style={[styles.headerBtn, styles.headerSaveBtn]} onPress={handleSave}>
              <Text style={[styles.headerBtnText, styles.headerSaveText]}>저장</Text>
            </Pressable>
          </View>

          <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>날짜</Text>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>카테고리</Text>
              <View style={styles.catRow}>
                {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, { label: string; icon: string }][]).map(([key, info]) => (
                  <Pressable
                    key={key}
                    style={[styles.catBtn, category === key && styles.catBtnActive]}
                    onPress={() => setCategory(key)}
                  >
                    <Text style={styles.catIcon}>{info.icon}</Text>
                    <Text style={styles.catLabel}>{info.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>금액</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                autoFocus
              />
            </View>

            {/* Memo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>메모 (선택)</Text>
              <TextInput
                style={styles.memoInput}
                value={memo}
                onChangeText={setMemo}
                placeholder="무엇을 샀나요?"
                placeholderTextColor="#999"
              />
            </View>
          </Animated.ScrollView>

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
