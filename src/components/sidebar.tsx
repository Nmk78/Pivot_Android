import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useChatState } from "@/hooks/useChatState";
import { Image } from "expo-image";
import { Button } from "./ui/button";
import { Plus } from "lucide-react-native";
import { Avatar } from "./ui/avatar";
import { CircleUserRound, UserCircle2 } from "lucide-react-native";
import { useAuth } from "@/providers/auth-provider";

export default function Sidebar() {
  const router = useRouter();
  const { chatSessions, setCurrentChatId, createNewChat } = useChatState();
  const { user } = useAuth();
  const handleNewChat = () => {
    createNewChat();
  };

  const handleProfile = () => {
    router.push("/(app)/profile");
  };

  return (
    <View className="flex-1 rounded-r-2xl bg-white p-4 dark:bg-gray-900">
      <View className="my-12 items-center">
        <Image
          source={require("@/assets/logo.png")}
          style={{
            width: 120,
            height: 120,
            alignSelf: "center",
            marginBottom: 10,
          }}
          contentFit="contain"
        />
        <Text className="text-md pb-4 text-center text-gray-500 dark:text-gray-400">
          Your AI companion.
        </Text>
      </View>
      <View className="my-5">
        <Button
          className="flex flex-row items-center justify-center space-x-3 bg-blue-500 text-lg text-white"
          onPress={handleNewChat}
        >
          <Plus size={20} className="mr-3 h-6 w-6 text-white" color="white" />
          <Text className="font-semibold text-white">New Chat</Text>
        </Button>
      </View>
      <Text style={{ fontSize: 18, marginVertical: 10 }}>Chat History</Text>
      {chatSessions ? (
        <FlatList
          className="mb-5 h-full w-full rounded-3xl border-2 border-gray-200 bg-gray-200 dark:border-gray-700"
          data={chatSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setCurrentChatId(item.id)}>
              <Text>{item.title || `Chat ${item.id}`}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View className="flex-1 w-full h-full justify-center items-center border-2 border-gray-200 dark:border-gray-700 bg-gray-200 rounded-3xl mb-5">
          <Text className="text-center">No chat history available.</Text>
        </View>
      )}
      {user ? (
        <TouchableOpacity
          onPress={handleProfile}
          className="flex-row items-center space-x-3 mb-4"
        >
          <UserCircle2 size={40} className="text-gray-800 dark:text-white" />
          <View>
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
          <View className="flex-row items-center space-x-3 mb-3">
            <UserCircle2 size={40} className="text-gray-400" />
            <View>
              <Text className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                Guest User
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-500">
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
