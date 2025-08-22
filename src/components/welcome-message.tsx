import { View, Pressable, Linking } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { MessageCircle } from "@/lib/icons";

export const WelcomeMessage = () => {
  return (
    <View className="max-w-xl rounded-xl p-6">
      <View className="mb-8 h-[50] flex-row items-center justify-center gap-2 space-x-4">
        <Image
          source={require("@/assets/expo-logo.png")}
          style={{ width: 30, height: 30, top: 2, right: 4 }}
          contentFit="contain"
        />
        <Text className="mr-1">+</Text>
        <Text className="mt-3 text-5xl">▲</Text>
        <Text className="mr-1">+</Text>
        <MessageCircle size={32} color="black" />
      </View>

      <View className="space-y-4">
        <Text className="text-center leading-7">
          Write a Quick user Guide for the Pivot App here
        </Text>
      </View>
    </View>
  );
};
