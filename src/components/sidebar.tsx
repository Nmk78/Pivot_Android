import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useChatState } from "@/hooks/useChatState";
import { Image } from "expo-image";
import { Button } from "./ui/button";
import { Plus, Edit3, Check, X, User } from "lucide-react-native";
import { useAuth } from "@/providers/auth-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { Input } from "./ui/input";
import { chatService } from "@/lib/chat-service";
import { useStore } from "@/lib/globalStore";
export default function Sidebar() {
  const router = useRouter();
  const {
    chatSessions,
    setCurrentChatId,
    createNewChat,
    refreshSessions,
    currentSessionId,
  } = useChatState();
  const { setChatId } = useStore();
  const { user } = useAuth();
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleNewChat = async () => {
    try {
      const newSessionId = await createNewChat();
      setChatId({ id: newSessionId, from: "newChat" });
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleProfile = () => {
    router.push("/(app)/profile");
  };

  const handleEditTitle = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle || `Chat ${sessionId}`);
  };

  const handleSaveTitle = async () => {
    if (!editingSessionId || !editingTitle.trim()) {
      Alert.alert("Error", "Title cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      await chatService.updateSessionTitle(
        editingSessionId,
        editingTitle.trim(),
      );
      await refreshSessions(); // Refresh the sessions list
      setEditingSessionId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Error updating session title:", error);
      Alert.alert("Error", "Failed to update session title");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  return (
    <View className="flex-1 rounded-r-2xl bg-white p-4 dark:bg-gray-900">
      <TouchableOpacity
        onLongPress={() => {
          router.replace("/(app)/about");
        }}
        className="mb-6 mt-12 items-center"
      >
        <Image
          source={require("@/assets/logo.png")}
          style={{
            width: 120,
            height: 120,
            alignSelf: "center",
            marginBottom: 5,
            marginTop: 20,
          }}
          contentFit="contain"
        />
        <Text className="text-md pb-4 text-center text-gray-500 dark:text-gray-400">
          Your legal counsellor.
        </Text>
      </TouchableOpacity>
      <View className="my-5">
        <Button
          className="flex flex-row items-center justify-center space-x-3 bg-blue-500 text-lg text-white"
          onPress={handleNewChat}
        >
          <Plus size={20} className="mr-3 h-6 w-6 text-white" color="white" />
          <Text className="font-semibold text-white">New Chat</Text>
        </Button>
      </View>
      <Text
        className="font-normal text-gray-500 dark:text-gray-200"
        style={{ fontSize: 18, marginVertical: 10 }}
      >
        Recent Chats
      </Text>
      {user && chatSessions ? (
        <FlatList
          className="mb-5 h-full w-full space-y-2 rounded-3xl bg-gray-200 px-2 dark:bg-gray-700"
          data={chatSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between px-2 py-1">
              {editingSessionId === item.id ? (
                <View className="flex-1 flex-row items-center space-x-2">
                  <Input
                    value={editingTitle}
                    onChangeText={setEditingTitle}
                    className="flex-1 rounded-2xl border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-200"
                    placeholder="Enter title"
                    editable={!isUpdating}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={handleSaveTitle}
                    disabled={isUpdating}
                    className="p-1"
                  >
                    <Check
                      size={20}
                      color={isDarkColorScheme ? "#10b981" : "#059669"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    disabled={isUpdating}
                    className="p-1"
                  >
                    <X
                      size={20}
                      color={isDarkColorScheme ? "#ef4444" : "#dc2626"}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      console.log("🫡🫡🫡🫡item.id", item.id);
                      setCurrentChatId(item.id);
                      setChatId({ id: item.id, from: "history" });
                      router.push("/(app)");
                    }}
                    className={`flex-1 rounded-xl ${
                      currentSessionId === item.id
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Text
                      className={`px-3 py-2 text-lg font-normal ${
                        currentSessionId === item.id
                          ? "font-medium text-blue-700 dark:text-blue-300"
                          : "text-gray-500 dark:text-gray-200"
                      }`}
                    >
                      {item.title || `Chat ${item.id}`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEditTitle(item.id, item.title)}
                    className="p-2"
                  >
                    <Edit3
                      size={14}
                      color={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        />
      ) : !user ? (
        <View className="mb-5 h-full w-full flex-1 items-center justify-center rounded-3xl bg-gray-200 dark:bg-gray-700">
          <Text className="text-center text-gray-500 dark:text-gray-200">
            Only available for authenticated users.
          </Text>
        </View>
      ) : (
        <View className="mb-5 h-full w-full flex-1 items-center justify-center rounded-3xl bg-gray-200 dark:bg-gray-700">
          <Text className="text-center text-gray-500 dark:text-gray-200">
            No chat history available.
          </Text>
        </View>
      )}
      {user ? (
        <TouchableOpacity
          onPress={handleProfile}
          className="mb-4 flex-row items-center space-x-3"
        >
          <User
            size={40}
            color={!isDarkColorScheme ? "white" : "black"}
            className="text-gray-400 dark:text-white"
          />
          <View className="ml-4">
            <Text className="text-lg font-semibold text-gray-800 dark:text-white">
              {user.full_name || user.username}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="mb-4">
          <View className="mb-3 flex-row items-center space-x-6">
            <User
              size={40}
              color={!isDarkColorScheme ? "white" : "black"}
              className="text-gray-400 dark:text-white"
            />
            <View className="ml-4">
              <Text className="text-lg font-semibold text-gray-600 dark:text-white">
                Guest User
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-300">
                Sign in to save your chats
              </Text>
            </View>
          </View>
          <Button
            variant="pill"
            className="bg-blue-500"
            onPress={() => router.push("/login")}
          >
            <Text className="text-gray-100">Sign In</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
