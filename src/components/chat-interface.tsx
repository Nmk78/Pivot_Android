import { View, ScrollView, ActivityIndicator } from "react-native";

// import Markdown from "react-native-markdown-display";
import { CustomMarkdown } from "@/components/ui/markdown";
import { useKeyboard } from "@react-native-community/hooks";
import { Text } from "@/components/ui/text";
import WeatherCard from "@/components/weather";
import { WelcomeMessage } from "@/components/welcome-message";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LottieLoader } from "@/components/lottie-loader";
import { ChatMessage } from "@/lib/chat-service";
import { Paperclip, Mic } from "lucide-react-native";
import { useColorScheme } from "react-native";

type ToolInvocation = {
  toolName: string;
  toolCallId: string;
  state: string;
  result?: any;
};

type Message = ChatMessage & {
  toolInvocations?: ToolInvocation[];
};

type ChatInterfaceProps = {
  messages: Message[];
  scrollViewRef: React.RefObject<ScrollView>;
  isLoading?: boolean;
};

export const ChatInterface = forwardRef<ScrollView, ChatInterfaceProps>(
  ({ messages, scrollViewRef, isLoading }, ref) => {
    const { keyboardShown, keyboardHeight } = useKeyboard();
    const colorScheme = useColorScheme();

    return (
      <View className="flex-1">
        <ScrollView ref={ref} className="flex-1 space-y-4 p-4">
          {!messages.length && <WelcomeMessage />}
          {messages.length > 0
            ? messages.map((m, index) => (
                <React.Fragment key={m.id}>
                  {m.toolInvocations?.map((t) => {
                    if (t.toolName === "getWeather") {
                      if (t.state !== "result") {
                        return (
                          <View
                            key={t.toolCallId}
                            className={cn(
                              "mt-4 max-w-[85%] rounded-2xl bg-muted/50 p-4",
                            )}
                          >
                            <ActivityIndicator size="small" color="black" />
                            <Text>Getting weather data...</Text>
                          </View>
                        );
                      }
                      if (t.state === "result") {
                        return (
                          <WeatherCard
                            key={t.toolCallId}
                            city={t.result.city || "Unknown"}
                            temperature={t.result.current.temperature_2m}
                            weatherCode={t.result.current.weathercode}
                            humidity={t.result.current.relative_humidity_2m}
                            wind={t.result.current.wind_speed_10m}
                          />
                        );
                      }
                    }
                    return null;
                  })}

                  <View
                    className={cn(
                      "flex-row rounded-3xl mb-3 px-4 py-2",
                      m.role === "user"
                        ? // User messages → right aligned, white/light blue
                          "ml-auto w-min max-w-[85%] bg-white text-blue-700 shadow-sm dark:bg-blue-900 dark:text-blue-100"
                        : // Bot messages → left aligned, blue background
                          "w-fit max-w-[85%] bg-blue-100 pl-0 text-blue-900 shadow-sm dark:bg-blue-800 dark:text-blue-50",
                    )}
                  >
                    {m.content.length > 0 && (
                      <>
                        {m.role !== "user" && (
                          <View className="mr-2 mt-1 h-8 w-8 items-center justify-center">
                            <Text className="text-base text-blue-900 dark:text-blue-100">
                              🤖
                            </Text>
                          </View>
                        )}

                        <View className="w-auto flex-shrink text-black dark:text-white">
                          <CustomMarkdown content={m.content} />

                          {m.role === "user" && (
                            <View className="mt-2 flex-row items-center space-x-2">
                              {m.fileUri && (
                                <View className="flex-row items-center rounded-full bg-blue-50 px-2 py-1 dark:bg-blue-700/40">
                                  <Paperclip
                                    size={14}
                                    color={
                                      colorScheme === "dark"
                                        ? "#93c5fd"
                                        : "#2563eb"
                                    }
                                  />
                                  <Text className="ml-1 text-xs text-blue-700 dark:text-blue-300">
                                    File attached
                                  </Text>
                                </View>
                              )}
                              {m.audioUri && (
                                <View className="flex-row items-center rounded-full bg-blue-50 px-2 py-1 dark:bg-blue-700/40">
                                  <Mic
                                    size={14}
                                    color={
                                      colorScheme === "dark"
                                        ? "#c4b5fd"
                                        : "#2563eb"
                                    }
                                  />
                                  <Text className="ml-1 text-xs text-blue-700 dark:text-blue-200">
                                    Voice message
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </View>

                  {isLoading &&
                    messages[messages.length - 1].role === "user" &&
                    m === messages[messages.length - 1] && (
                      <View className="flex-row">
                        <View
                          className={
                            "mr-2 mt-1 h-8 w-8 items-center justify-center rounded-full bg-gray-200"
                          }
                        >
                          <Text className="text-base">{"🤖"}</Text>
                        </View>
                        <View className="-ml-2 -mt-[1px]">
                          <LottieLoader width={40} height={40} />
                        </View>
                      </View>
                    )}
                </React.Fragment>
              ))
            : null}
        </ScrollView>
      </View>
    );
  },
);
