import { useState, useRef, useMemo } from "react";
import {
  View, Text, Pressable, Image, StyleSheet,
  PanResponder, Dimensions, Modal,
} from "react-native";
import { useTheme } from "@/lib/ThemeContext";
import { cropToSquare } from "@/lib/camera";

interface PhotoCropperProps {
  visible: boolean;
  imageUri: string;
  onCrop: (croppedUri: string) => void;
  onCancel: () => void;
}

const CROP_SIZE = Dimensions.get("window").width - 32;
const SCALE = 1.5; // Image is larger than crop area, enabling pan

export default function PhotoCropper({ visible, imageUri, onCrop, onCancel }: PhotoCropperProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Pan offset
  const pan = useRef({ tx: 0, ty: 0 }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.tx = offsetRef.current.x;
        pan.ty = offsetRef.current.y;
      },
      onPanResponderMove: (_, gs) => {
        const maxTx = (imageDisplayRef.current.w - CROP_SIZE) / 2;
        const maxTy = (imageDisplayRef.current.h - CROP_SIZE) / 2;
        offsetRef.current.x = Math.max(-maxTx, Math.min(maxTx, pan.tx + gs.dx));
        offsetRef.current.y = Math.max(-maxTy, Math.min(maxTy, pan.ty + gs.dy));
        imageRef.current?.setNativeProps({ style: { transform: [{ translateX: offsetRef.current.x }, { translateY: offsetRef.current.y }] } });
      },
    })
  ).current;

  const imageRef = useRef<Image>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const imageDisplayRef = useRef({ w: 0, h: 0 });

  const handleImageLoad = (e: any) => {
    const { width: imgW, height: imgH } = e.nativeEvent.source;
    // Scale image so smaller dimension fills CROP_SIZE
    const scale = Math.max(CROP_SIZE / imgW, CROP_SIZE / imgH) * SCALE;
    const dispW = imgW * scale;
    const dispH = imgH * scale;
    imageDisplayRef.current = { w: dispW, h: dispH };
    setImageSize({ width: dispW, height: dispH });
    offsetRef.current = { x: 0, y: 0 };
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { w: dispW, h: dispH } = imageDisplayRef.current;
      const offset = offsetRef.current;
      // Visible region center crop calculation
      const visLeft = Math.max(0, (dispW - CROP_SIZE) / 2 + offset.x);
      const visTop = Math.max(0, (dispH - CROP_SIZE) / 2 + offset.y);
      const visWidth = Math.min(CROP_SIZE, dispW);
      const visHeight = Math.min(CROP_SIZE, dispH);

      // Get image's actual dimensions from the source
      const imgInfo = await new Promise<{ width: number; height: number }>((resolve) => {
        Image.getSize(imageUri, (w, h) => resolve({ width: w, height: h }), () => resolve({ width: 0, height: 0 }));
      });
      if (imgInfo.width === 0 || dispW === 0) {
        onCrop(imageUri);
        return;
      }

      const scaleX = imgInfo.width / dispW;
      const scaleY = imgInfo.height / dispH;
      const cropRect = {
        originX: Math.round(visLeft * scaleX),
        originY: Math.round(visTop * scaleY),
        width: Math.round(visWidth * scaleX),
        height: Math.round(visHeight * scaleY),
      };

      const cropped = await cropToSquare(imageUri, cropRect);
      onCrop(cropped);
    } catch {
      onCrop(imageUri);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      zIndex: 200,
      justifyContent: "center",
      alignItems: "center",
    },
    guide: {
      width: CROP_SIZE,
      height: CROP_SIZE,
      overflow: "hidden",
      borderRadius: 4,
      borderWidth: 2,
      borderColor: "#fff",
    },
    maskTop: {
      position: "absolute", top: 0, left: 0, right: 0,
      height: "100%",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    hint: {
      color: "#fff",
      fontSize: 13,
      textAlign: "center",
      marginTop: 16,
      opacity: 0.7,
    },
    bottomRow: {
      flexDirection: "row",
      gap: 16,
      marginTop: 32,
    },
    btn: {
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 14,
      minWidth: 120,
      alignItems: "center",
    },
    cancelBtn: {
      backgroundColor: "#555",
    },
    confirmBtn: {
      backgroundColor: theme.foreground,
    },
    btnText: {
      fontSize: 15,
      fontWeight: "700",
    },
    confirmText: {
      color: theme.background,
    },
    cancelText: {
      color: "#fff",
    },
    loadingText: {
      color: "#fff",
      fontSize: 14,
      marginTop: 16,
    },
  }), [theme]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 16 }}>
        사진 영역 선택
      </Text>

      <View style={styles.guide} {...panResponder.panHandlers}>
        <Image
          ref={imageRef}
          source={{ uri: imageUri }}
          style={[{
            width: imageSize.width || CROP_SIZE,
            height: imageSize.height || CROP_SIZE,
            position: "absolute",
            top: (CROP_SIZE - (imageSize.height || CROP_SIZE)) / 2,
            left: (CROP_SIZE - (imageSize.width || CROP_SIZE)) / 2,
            opacity: imageSize.width > 0 ? 1 : 0,
          }]}
          onLoad={handleImageLoad}
        />
      </View>

      <Text style={styles.hint}>드래그하여 사진 위치를 조정하세요</Text>

      <View style={styles.bottomRow}>
        <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
          <Text style={[styles.btnText, styles.cancelText]}>취소</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.confirmBtn]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={[styles.btnText, styles.confirmText]}>
            {loading ? "처리중..." : "사용하기"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
