import { useState } from "react";
import {
  View, Text, Pressable, TextInput, Modal, StyleSheet, Image, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { TEAM_COLORS } from "@shared/teamColors";
import EmotionPicker from "@/components/EmotionPicker";
import { theme } from "@/lib/theme";
import { addJikgwanRecord, getMyTeam } from "@/lib/db";
import { savePhoto, resizePhoto, generatePhotoName } from "@/lib/camera";

interface DiaryEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function DiaryEntryModal({ visible, onClose, onSaved }: DiaryEntryModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [emotion, setEmotion] = useState<string | null>(null);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [line3, setLine3] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dateStr = formatDate(selectedDate);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "앨범 접근 권한이 필요합니다");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!line1.trim() && !line2.trim() && !line3.trim()) {
      Alert.alert("알림", "내용을 입력해주세요");
      return;
    }
    setSaving(true);
    try {
      let savedPhotoUri: string | null = null;
      if (photoUri) {
        const resized = await resizePhoto(photoUri);
        const fileName = generatePhotoName();
        savedPhotoUri = await savePhoto(resized, fileName);
      }

      const myTeam = await getMyTeam();

      await addJikgwanRecord({
        game_id: "",
        date: dateStr,
        photo_path: savedPhotoUri,
        memo: null,
        score_away: null,
        score_home: null,
        emotion,
        three_line_1: line1.trim() || null,
        three_line_2: line2.trim() || null,
        three_line_3: line3.trim() || null,
        frame_style: "classic",
        stadium: null,
        is_win: null,
      });

      Alert.alert("저장 완료", "직관 기록이 저장되었습니다");
      resetForm();
      onSaved();
    } catch {
      Alert.alert("오류", "저장 중 문제가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setEmotion(null);
    setLine1("");
    setLine2("");
    setLine3("");
    setPhotoUri(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Date selector */}
            <View style={styles.dateRow}>
              <Pressable onPress={() => changeDate(-1)} hitSlop={8}>
                <Text style={styles.dateArrow}>◀</Text>
              </Pressable>
              <View style={styles.dateCenter}>
                <Text style={styles.dateText}>{dateStr}</Text>
                <Pressable onPress={() => setSelectedDate(new Date())}>
                  <Text style={styles.todayBtn}>오늘</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => changeDate(1)} hitSlop={8}>
                <Text style={styles.dateArrow}>▶</Text>
              </Pressable>
            </View>

            {/* Emotion */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>오늘의 기분</Text>
              <EmotionPicker value={emotion} onChange={setEmotion} />
            </View>

            {/* Photo picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>사진</Text>
              {photoUri ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                  <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                    <Text style={styles.removePhotoText}>제거</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.photoBtn} onPress={pickPhoto}>
                  <Text style={styles.photoBtnIcon}>🖼️</Text>
                  <Text style={styles.photoBtnText}>앨범에서 선택</Text>
                </Pressable>
              )}
            </View>

            {/* Three-line diary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>세줄일기</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={line1}
                  onChangeText={setLine1}
                  placeholder="💭 오늘의 감정"
                  placeholderTextColor="#999"
                  maxLength={30}
                  multiline
                />
                <Text style={styles.charCount}>{line1.length}/30</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={line2}
                  onChangeText={setLine2}
                  placeholder="📝 있었던 일"
                  placeholderTextColor="#999"
                  maxLength={50}
                  multiline
                />
                <Text style={styles.charCount}>{line2.length}/50</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={line3}
                  onChangeText={setLine3}
                  placeholder="🌟 내일의 다짐"
                  placeholderTextColor="#999"
                  maxLength={30}
                  multiline
                />
                <Text style={styles.charCount}>{line3.length}/30</Text>
              </View>
            </View>
          </ScrollView>

          {/* Save button */}
          <View style={styles.bottomRow}>
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={theme.background} size="small" />
              ) : (
                <Text style={styles.saveText}>저장</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 32,
  },
  handleRow: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  // Date row
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  dateArrow: {
    fontSize: 14,
    color: theme.foreground,
    paddingHorizontal: 8,
  },
  dateCenter: {
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.foreground,
  },
  todayBtn: {
    fontSize: 11,
    color: theme.mutedForeground,
    textDecorationLine: "underline",
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.foreground,
    marginBottom: 10,
  },
  // Photo
  photoPreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderRadius: 12,
  },
  removePhoto: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removePhotoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: "dashed",
    backgroundColor: theme.muted,
  },
  photoBtnIcon: {
    fontSize: 20,
  },
  photoBtnText: {
    fontSize: 13,
    color: theme.mutedForeground,
    fontWeight: "500",
  },
  // Input
  inputRow: {
    position: "relative",
    marginBottom: 10,
  },
  input: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    paddingRight: 50,
    fontSize: 14,
    color: theme.foreground,
    borderWidth: 1,
    borderColor: theme.border,
    lineHeight: 20,
    minHeight: 44,
  },
  charCount: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontSize: 10,
    color: theme.mutedForeground,
  },
  // Bottom actions
  bottomRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    color: theme.foreground,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.foreground,
    alignItems: "center",
  },
  saveText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.background,
  },
});
