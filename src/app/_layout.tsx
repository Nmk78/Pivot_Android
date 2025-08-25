import Providers from "@/providers";
import { Stack } from "expo-router";
import { useAuth } from "@/providers/auth-provider";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(app)";
    const inAuthScreens = segments[0] === "login" || segments[0] === "signup";

    // If user is authenticated and on auth screens, redirect to app
    if (user && inAuthScreens) {
      router.replace("/(app)");
    }
    // If no segments or undefined (app just started), go to main app (guest mode allowed)
    else if (!segments[0]) {
      router.replace("/(app)");
    }
  }, [user, segments, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="signup" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  );
}
