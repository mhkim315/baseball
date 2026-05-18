import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function RootLayoutInner() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="onboarding" options={{ presentation: "modal" }} />
        <Stack.Screen name="jikgwan" options={{ headerShown: false }} />
        <Stack.Screen name="cheer" options={{ headerShown: false }} />
        <Stack.Screen name="standings" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
