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
    // If user is not authenticated and trying to access protected app routes, redirect to login
    // Allow guest access to app - don't force redirect to login
    // else if (!user && inAuthGroup) {
    //   router.replace("/login");
    // }
    
    // If no segments or undefined (app just started)
    else if (!segments[0]) {
      // Allow guest access - redirect to app regardless of authentication status
      // Users can choose to login from within the app if needed
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
