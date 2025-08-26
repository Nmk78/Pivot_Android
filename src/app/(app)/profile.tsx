import { View, Alert, ScrollView } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import { Edit3, Save, X, LogOut, User } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

export default function Profile() {
  const router = useRouter();
  const { user, signOut, updateUser, loading } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by the auth provider
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim() || !username.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await updateUser({
        full_name: fullName,
        username: username,
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update profile",
      );
    }
  };

  const { bottom } = useSafeAreaInsets();

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-gray-500 dark:text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      className="flex-1 bg-white dark:bg-slate-950"
      style={{ paddingBottom: bottom }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Profile",
          headerStyle: {
            backgroundColor: isDarkColorScheme ? "#1e293b" : "#51a2ff",
          },
          headerTitleStyle: { color: "white" },
        }}
      />

      <ScrollView className="flex-1 p-6">
        {/* Profile Header */}
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <User size={40} color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"} />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {user.full_name || user.username}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {user.email}
          </Text>
        </View>

        {/* Profile Information */}
        <Card className="mb-6 bg-white p-6 dark:bg-slate-800">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Information
            </Text>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsEditing(true)}
                className="flex-row items-center"
              >
                <View className="flex-row items-center">
                  <Edit3
                    size={16}
                    color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"}
                  />
                  <Text className="ml-2 text-blue-600 dark:text-blue-400">
                    Edit
                  </Text>
                </View>
              </Button>
            )}
          </View>

          <View className="space-y-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Text>
              {isEditing ? (
                <Input
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  editable={!loading}
                  className="bg-gray-50 dark:bg-slate-700"
                />
              ) : (
                <Text className="text-gray-900 dark:text-white">
                  {user.full_name || "Not set"}
                </Text>
              )}
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </Text>
              {isEditing ? (
                <Input
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  editable={!loading}
                  className="bg-gray-50 dark:bg-slate-700"
                />
              ) : (
                <Text className="text-gray-900 dark:text-white">
                  {user.username || "Not set"}
                </Text>
              )}
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </Text>
              <Text className="text-gray-900 dark:text-white">{user.role}</Text>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Member Since
              </Text>
              <Text className="text-gray-900 dark:text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {isEditing && (
            <View className="mt-6 flex-row space-x-3">
              <Button
                onPress={handleUpdateProfile}
                disabled={loading}
                className="flex-1 rounded-r-none bg-blue-600"
              >
                <Text className="text-white">
                  {loading ? "Updating..." : "Save Changes"}
                </Text>
              </Button>

              <Button
                variant="default"
                onPress={() => {
                  setIsEditing(false);
                  setFullName(user.full_name);
                  setUsername(user.username);
                }}
                className="flex-1 rounded-l-none bg-slate-600"
              >
                <Text className="text-white">
                  Cancel
                </Text>
              </Button>
            </View>
          )}
        </Card>

        {/* Actions */}
        <View className="space-y-3">
          <Button
            variant="destructive"
            onPress={handleSignOut}
            className="flex-row items-center justify-center"
          >
            <Text className="text-white">Sign Out</Text>
          </Button>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
