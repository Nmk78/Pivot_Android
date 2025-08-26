import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useColorScheme } from "@/lib/useColorScheme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Github, 
  Mail, 
  Globe, 
  Users, 
  Code, 
  Heart,
  ArrowLeft,
  ExternalLink
} from "lucide-react-native";
import Constants from "expo-constants";

export default function AboutPage() {
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();

  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const buildVersion = Constants.expoConfig?.extra?.buildNumber || "1";
  const expoVersion = Constants.expoConfig?.sdkVersion || "Unknown";

  const teamMembers = [
    {
      name: "Team Cyber Pearl",
      role: "Pivot AI Chatbot",
      description: "Empower Myanmar SMEs and Start-up legal compliance with AI"
    }
  ];

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "About",
          headerStyle: { 
            backgroundColor: isDarkColorScheme ? "#1e293b" : "#51a2ff" 
          },
          headerTitleStyle: { color: "white" },
          headerTintColor: "white",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 px-6 py-4">
        {/* App Logo and Name */}
        <View className="items-center mb-8 mt-4">
          <Image
            source={require("@/assets/logo.png")}
            style={{
              width: 120,
              height: 120,
            }}
            contentFit="contain"
          />
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Pivot
          </Text>
          <Text className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
            Your Legal Counsellor
          </Text>
        </View>

        {/* Version Information */}
        <Card className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center mb-3">
            <Code size={20} color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"} />
            <Text className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
              Version Information
            </Text>
          </View>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">App Version:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{appVersion}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">Build Number:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{buildVersion}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">Expo SDK:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{expoVersion}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">Platform:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">
                {Constants.platform?.ios ? "iOS" : "Android"}
              </Text>
            </View>
          </View>
        </Card>

        {/* About the App */}
        <Card className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center mb-3">
            <Globe size={20} color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"} />
            <Text className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
              About Pivot
            </Text>
          </View>
          <Text className="text-gray-700 dark:text-gray-300 leading-6">
            Pivot is an AI-powered legal consultation platform designed to provide accessible, 
            intelligent legal guidance. Our mission is to democratize legal assistance by making 
            professional legal advice available to everyone through advanced artificial intelligence 
            and natural language processing.
          </Text>
        </Card>

        {/* Team Information */}
        <Card className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center mb-4">
            <Users size={20} color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"} />
            <Text className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
              Our Team
            </Text>
          </View>
          {teamMembers.map((member, index) => (
            <View key={index} className="mb-4 last:mb-0">
              <Text className="text-base font-medium text-gray-900 dark:text-white">
                {member.name}
              </Text>
              <Text className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                {member.role}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {member.description}
              </Text>
            </View>
          ))}
        </Card>

        {/* Features */}
        <Card className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center mb-3">
            <Heart size={20} color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"} />
            <Text className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
              Key Features
            </Text>
          </View>
          <View className="space-y-2">
            <Text className="text-gray-700 dark:text-gray-300">• AI-powered legal consultation</Text>
            <Text className="text-gray-700 dark:text-gray-300">• Document analysis and review</Text>
            <Text className="text-gray-700 dark:text-gray-300">• Voice message support</Text>
            <Text className="text-gray-700 dark:text-gray-300">• Multi-session chat management</Text>
            <Text className="text-gray-700 dark:text-gray-300">• Dark/Light theme support</Text>
            <Text className="text-gray-700 dark:text-gray-300">• Secure user authentication</Text>
          </View>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center mb-3">
            <Mail size={20} color={isDarkColorScheme ? "#60a5fa" : "#3b82f6"} />
            <Text className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
              Contact & Support
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => handleOpenLink("mailto:support@pivot-legal.com")}
            className="flex-row items-center mb-2"
          >
            <Mail size={16} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
            <Text className="text-blue-600 dark:text-blue-400 ml-2">
              naymyokhant78@gmail.com
            </Text>
            <ExternalLink size={12} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} className="ml-1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => handleOpenLink("https://pivot-legal.com")}
            className="flex-row items-center mb-2"
          >
            <Globe size={16} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
            <Text className="text-blue-600 dark:text-blue-400 ml-2">
              pivot-legal.com
            </Text>
            <ExternalLink size={12} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} className="ml-1" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleOpenLink("https://github.com/Nmk78/Pivot_Android")}
            className="flex-row items-center"
          >
            <Github size={16} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} />
            <Text className="text-blue-600 dark:text-blue-400 ml-2">
              GitHub Repository
            </Text>
            <ExternalLink size={12} color={isDarkColorScheme ? "#9ca3af" : "#6b7280"} className="ml-1" />
          </TouchableOpacity>
        </Card>

        {/* Legal Notice */}
        <Card className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <Text className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            <Text className="font-semibold">Legal Notice:</Text> This app provides general legal information 
            and should not be considered as professional legal advice. Always consult with a qualified 
            attorney for specific legal matters.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
