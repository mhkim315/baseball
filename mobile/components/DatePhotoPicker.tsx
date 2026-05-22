import { useState, useEffect, useMemo, useRef } from "react";
import {
  View, Text, Pressable, FlatList, StyleSheet, useWindowDimensions,
  ActivityIndicator, Linking,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/lib/ThemeContext";
import BottomSheet from "@/components/BottomSheet";

const NUM_COLUMNS = 3;
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_PHOTOS = 10;

interface DatePhotoPickerProps {
  visible: boolean;
  date: Date;
  onSelect: (uris: string[]) => void;
  onClose: () => void;
}

function formatDateLabel(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

export default function DatePhotoPicker({ visible, date, onSelect, onClose }: DatePhotoPickerProps) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const cellSize = screenWidth / NUM_COLUMNS;

  const [currentDate, setCurrentDate] = useState(date);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [perm, setPerm] = useState<MediaLibrary.PermissionResponse | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (visible) {
      setCurrentDate(date);
      setSelectedIds(new Set());
      checkPermission();
    }
  }, [visible, date]);

  // Reload photos when date or permission changes
  useEffect(() => {
    if (visible && perm?.granted) {
      loadPhotos();
    }
  }, [currentDate, perm, visible]);

  const checkPermission = async () => {
    const p = await MediaLibrary.getPermissionsAsync();
    if (p.status === "undetermined") {
      const r = await MediaLibrary.requestPermissionsAsync();
      setPerm(r);
    } else {
      setPerm(p);
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const page = await MediaLibrary.getAssetsAsync({
        first: 300,
        sortBy: [["creationTime", false]],
        createdAfter: dayStart,
        createdBefore: dayEnd,
        mediaType: ["photo"],
      });
      setAssets(page.assets);
    } catch (e) {
      console.warn("loadPhotos failed", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      if (prev.size >= MAX_PHOTOS) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const uris = assets.filter((a) => selectedIds.has(a.id)).map((a) => a.uri);
    onSelect(uris);
  };

  const handleFullGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        onSelect([result.assets[0].uri]);
      }
    } catch (e) {
      console.warn("fullGallery failed", e);
    }
  };

  const navigateDay = (delta: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  };

  const today = new Date();
  const isToday = currentDate.toDateString() === today.toDateString();
  const canGoForward = !isToday;
  const teamColor = theme.foreground;

  const styles = useMemo(() => StyleSheet.create({
    container: { minHeight: 300 },
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    navBtnDisabled: { opacity: 0.3 },
    navArrow: { fontSize: 18, color: theme.foreground },
    dateLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.foreground,
    },
    fullBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.muted,
    },
    fullBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.mutedForeground,
    },
    // Grid
    cell: { width: cellSize, height: cellSize },
    image: { width: "100%", height: "100%" },
    checkOverlay: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    listContent: { paddingBottom: 80 },
    // Empty
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyText: { fontSize: 14, color: theme.mutedForeground, marginTop: 12 },
    emptySub: { fontSize: 12, color: theme.mutedForeground, marginTop: 6 },
    // Permission states
    permContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    permText: { fontSize: 14, color: theme.mutedForeground, textAlign: "center", lineHeight: 20 },
    permBtn: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    permBtnText: { fontSize: 14, fontWeight: "700" },
    // Loading
    loader: { paddingVertical: 60 },
    // Limited access banner
    limitedBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.muted,
      marginHorizontal: 12,
      marginTop: 8,
      borderRadius: 8,
    },
    limitedText: { fontSize: 12, color: theme.mutedForeground, flex: 1 },
    limitedBtn: {
      marginLeft: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.foreground,
    },
    limitedBtnText: { fontSize: 12, fontWeight: "600", color: theme.background },
    // Bottom bar
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
    },
    confirmBtn: {
      backgroundColor: teamColor,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    confirmBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
  }), [theme, cellSize]);

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const selected = selectedIds.has(item.id);
    return (
      <Pressable style={styles.cell} onPress={() => toggleSelect(item.id)}>
        <ExpoImage source={{ uri: item.uri }} style={styles.image} contentFit="cover" />
        <View style={[
          styles.checkOverlay,
          {
            borderColor: selected ? teamColor : "rgba(255,255,255,0.8)",
            backgroundColor: selected ? teamColor : "rgba(0,0,0,0.25)",
          },
        ]}>
          {selected && <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  const noAccess = perm && !perm.granted && perm.status !== "undetermined";

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="85%">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.navBtn} onPress={() => navigateDay(-1)}>
            <Text style={styles.navArrow}>◀</Text>
          </Pressable>
          <Text style={styles.dateLabel}>{formatDateLabel(currentDate)}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
              onPress={() => navigateDay(1)}
              disabled={!canGoForward}
            >
              <Text style={[styles.navArrow, !canGoForward && { opacity: 0.3 }]}>▶</Text>
            </Pressable>
            <Pressable style={styles.fullBtn} onPress={handleFullGallery}>
              <Text style={styles.fullBtnText}>전체</Text>
            </Pressable>
          </View>
        </View>

        {/* Limited access banner */}
        {perm?.accessPrivileges === "limited" && (
          <View style={styles.limitedBanner}>
            <Text style={styles.limitedText}>일부 사진만 표시됩니다</Text>
            <Pressable style={styles.limitedBtn} onPress={() => MediaLibrary.presentPermissionsPickerAsync()}>
              <Text style={styles.limitedBtnText}>선택</Text>
            </Pressable>
          </View>
        )}

        {/* Permission denied */}
        {noAccess ? (
          <View style={styles.permContainer}>
            <Text style={styles.permText}>사진 접근 권한이 필요합니다.</Text>
            <Text style={[styles.permText, { marginTop: 4 }]}>설정에서 권한을 허용해주세요.</Text>
            <Pressable
              style={[styles.permBtn, { backgroundColor: teamColor }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={[styles.permBtnText, { color: "#fff" }]}>설정 열기</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={teamColor} />
        ) : assets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>📷</Text>
            <Text style={styles.emptyText}>이날 찍은 사진이 없습니다</Text>
            <Text style={styles.emptySub}>다른 날짜를 선택하거나 전체 갤러리에서 찾아보세요</Text>
          </View>
        ) : (
          <FlatList
            data={assets}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews
            windowSize={5}
          />
        )}

        {/* Bottom confirm bar */}
        {selectedIds.size > 0 && (
          <View style={styles.bottomBar}>
            <Pressable style={[styles.confirmBtn, { backgroundColor: teamColor }]} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>선택한 {selectedIds.size}장 추가</Text>
            </Pressable>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}
