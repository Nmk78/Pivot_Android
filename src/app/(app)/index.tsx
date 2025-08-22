import { generateUUID } from "@/lib/utils";
import { Redirect, Stack, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, type TextInput, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LottieLoader } from "@/components/lottie-loader";
import { ChatInterface } from "@/components/chat-interface";
import { ChatInput } from "@/components/ui/chat-input";
import { SuggestedActions } from "@/components/suggested-actions";
import type { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useStore } from "@/lib/globalStore";
import { MessageCirclePlusIcon, Menu } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useChatState } from "@/hooks/useChatState";
import { SelectedFile } from "@/hooks/useFilePicker";

type WeatherResult = {
  city: string;
  temperature: number;
  weatherCode: string;
  humidity: number;
  wind: number;
};

const HomePage = () => {
  const {
    clearImageUris,
    setBottomChatHeightHandler,
    setFocusKeyboard,
    chatId,
    setChatId,
  } = useStore();
  const inputRef = useRef<TextInput>(null);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  // Initialize chatId if not set
  useEffect(() => {
    if (!chatId) {
      setChatId({ id: generateUUID(), from: "newChat" });
    }
  }, []);

  const {
    messages,
    isLoading,
    sendMessage,
    sendMessageWithFile,
    sendSpeechMessage,
    uploadFileForContext,
    clearMessages,
    error,
  } = useChatState();

  const handleNewChat = useCallback(() => {
    // Reset messages first
    clearMessages();
    clearImageUris();
    setInputText("");
    setSelectedFile(null);

    // Small delay to ensure state updates have propagated
    setTimeout(() => {
      const newChatId = generateUUID();
      setChatId({ id: newChatId, from: "newChat" });
      inputRef.current?.focus();
      setBottomChatHeightHandler(false);
    }, 100);
  }, [clearImageUris, setBottomChatHeightHandler, clearMessages, setChatId]);

  const handleTextChange = (text: string) => {
    setInputText(text);
  };

  const handleSubmit = useCallback(async () => {
    const textToSend = inputText.trim();
    if (!textToSend && !selectedFile) return;
    
    setInputText('');
    
    try {
      if (selectedFile && textToSend) {
        // Send message with file context
        const message = await sendMessageWithFile(textToSend, selectedFile);
        // The message is already added to the chat state by the hook
        setSelectedFile(null); // Clear file after sending
      } else if (selectedFile && !textToSend) {
        // Upload file for context
        await uploadFileForContext(selectedFile);
        setSelectedFile(null); // Clear file after uploading
      } else if (textToSend) {
        // Send regular text message
        await sendMessage(textToSend);
      }
      
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error message to the user here
    }
  }, [inputText, selectedFile, sendMessage, sendMessageWithFile, uploadFileForContext]);

  const handleVoiceRecordingComplete = useCallback(async (audioUri: string) => {
    try {
      await sendSpeechMessage(audioUri);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error processing voice recording:', error);
      // You might want to show an error message to the user here
    }
  }, [sendSpeechMessage]);

  const handleFileSelected = useCallback((file: SelectedFile) => {
    setSelectedFile(file);
  }, []);

  const handleFileRemoved = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const { bottom } = useSafeAreaInsets();
  const scrollViewRef = useRef<GHScrollView>(null);

  // Reset messages when chatId changes
  useEffect(() => {
    if (chatId) {
      clearMessages();
      setInputText("");
      setSelectedFile(null);
    }
  }, [chatId, clearMessages]);

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      className="flex-1 bg-white dark:bg-black"
      style={{ paddingBottom: bottom }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Pivot",

          headerRight: () => (
            <Pressable disabled={!messages.length} onPress={handleNewChat}>
              <MessageCirclePlusIcon
                size={20}
                color={!messages.length ? "#11f" : "black"}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="container relative mx-auto flex-1 bg-white dark:bg-slate-950"
        ref={scrollViewRef}
      >
        <ChatInterface
          messages={messages}
          scrollViewRef={scrollViewRef}
          isLoading={isLoading}
        />
      </ScrollView>

      {messages.length === 0 && (
        <SuggestedActions 
          hasInput={inputText.length > 0} 
          append={async (message) => {
            await sendMessage(message.content);
          }} 
        />
      )}

      <ChatInput
        ref={inputRef}
        scrollViewRef={scrollViewRef}
        input={inputText}
        onChangeText={handleTextChange}
        focusOnMount={false}
        onSubmit={handleSubmit}
        onVoiceRecordingComplete={handleVoiceRecordingComplete}
        onFileSelected={handleFileSelected}
        onFileRemoved={handleFileRemoved}
        selectedFile={selectedFile}
        disabled={isLoading}
      />
    </Animated.View>
  );
};

export default HomePage;
