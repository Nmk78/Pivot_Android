import type React from "react";
import {
  View,
  Text,
  type TextInput,
  KeyboardAvoidingView,
  Keyboard,
  useColorScheme,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Paperclip, ArrowUp, X } from "lucide-react-native";
import { Button } from "./button";
import Animated, {
  useAnimatedStyle,
  useAnimatedKeyboard,
  withSpring,
  FadeIn,
  FadeOut,
  withTiming,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatTextInput } from "./chat-text-input";
import { forwardRef, useEffect, useState } from "react";
import { useImagePicker } from "@/hooks/useImagePicker";
import { Image } from "expo-image";
import { useStore } from "@/lib/globalStore";
import { VoiceRecorderButton } from "./voice-recorder-button";
import { FilePickerButton } from "./file-picker-button";
import { SelectedFile } from "@/hooks/useFilePicker";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { Mic } from "lucide-react-native";

type Props = {
  input: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onVoiceRecordingComplete: (audioUri: string) => void;
  onFileSelected: (file: SelectedFile) => void;
  onFileRemoved: () => void;
  selectedFile: SelectedFile | null;
  scrollViewRef: React.RefObject<ScrollView>;
  focusOnMount?: boolean;
  disabled?: boolean;
};

interface SelectedImagesProps {
  uris: string[];
  onRemove: (uri: string) => void;
}

interface ImageItemProps {
  uri: string;
  onRemove: (uri: string) => void;
}

const ImageItem = ({ uri, onRemove }: ImageItemProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Animated.View
      key={uri}
      className="relative"
      entering={FadeIn.delay(150).springify()}
    >
      <Image
        source={{ uri }}
        style={{
          width: 55,
          height: 55,
          borderRadius: 6,
        }}
        contentFit="cover"
        onLoadEnd={() => setTimeout(() => setIsLoading(false), 2000)}
      >
        {isLoading && (
          <Animated.View className="h-[55px] w-[55px] items-center justify-center rounded-md bg-gray-300 dark:bg-gray-600">
            <ActivityIndicator size="small" color="white" />
          </Animated.View>
        )}
      </Image>
      <Pressable
        onPress={() => onRemove(uri)}
        className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full bg-gray-200"
      >
        <X size={12} color="black" />
      </Pressable>
    </Animated.View>
  );
};

const SelectedImages = ({ uris, onRemove }: SelectedImagesProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(uris.length === 0 ? 0 : 65, {
        duration: 200,
      }),
    };
  }, [uris.length]);

  return (
    <Animated.View
      className="overflow-hidden"
      style={[animatedStyle]}
      entering={FadeIn.delay(150).springify()}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        className="mb-4 overflow-visible px-4 py-2"
        style={{ minHeight: 65 }}
      >
        <View className="flex-row gap-4">
          {uris.map((uri) => (
            <ImageItem key={uri} uri={uri} onRemove={onRemove} />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export const ChatInput = forwardRef<TextInput, Props>(
  (
    { 
      input, 
      onChangeText, 
      onSubmit, 
      onVoiceRecordingComplete,
      onFileSelected,
      onFileRemoved,
      selectedFile,
      scrollViewRef, 
      focusOnMount = false,
      disabled = false 
    },
    ref,
  ) => {
    const { bottom } = useSafeAreaInsets();
    const keyboard = useAnimatedKeyboard();
    const { pickImage } = useImagePicker();
    const { selectedImageUris, addImageUri, removeImageUri } = useStore();

    // Get recording state for floating indicator
    const { isRecording, recordingDuration, formatDuration } = useVoiceRecorder();
    
    // Local loading state for better UX
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    useEffect(() => {
      if (focusOnMount) {
        (ref as React.RefObject<TextInput>).current?.focus();
      }
    }, [focusOnMount]);

    useEffect(() => {
      const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
      const focusSubscription = Keyboard.addListener("keyboardWillShow", () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });

      return () => {
        showSubscription.remove();
      };
    }, [scrollViewRef]);

    const animatedStyles = useAnimatedStyle(() => ({
      paddingBottom: withSpring(keyboard.height.value - bottom, {
        damping: 20,
        stiffness: 200,
      }),
    }));

    const colorScheme = useColorScheme();

    const handleAttachmentSelect = async (type: "photo" | "file") => {
      if (type === "photo") {
        const imageUris = await pickImage();
        if (imageUris) {
          imageUris.forEach((uri) => {
            addImageUri(uri);
          });
        }
      }
    };

    // Get placeholder text based on selected file
    const getPlaceholder = () => {
      if (selectedFile) {
        return `Ask about ${selectedFile.name}...`;
      }
      return "Message";
    };

    // Handle submit with loading delay for better UX
    const handleSubmitWithDelay = async () => {
      if (isLocalLoading) return;
      
      setIsLocalLoading(true);
      
      try {
        await onSubmit();
      } finally {
        // Ensure loading shows for at least 0.5 seconds
        setTimeout(() => {
          setIsLocalLoading(false);
        }, 500);
      }
    };

    return (
      <KeyboardAvoidingView>
        <Animated.View style={animatedStyles}>
          <SelectedImages uris={selectedImageUris} onRemove={removeImageUri} />
          
          {/* Floating File/Recording Status */}
          {selectedFile && (
            <Animated.View 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="mx-4 mb-2"
            >
              <View className="flex-row items-center justify-between bg-green-50 dark:bg-green-900/50 rounded-lg px-3 py-2 border border-green-200 dark:border-green-700/50">
                <View className="flex-row items-center flex-1">
                  <Paperclip size={16} color={colorScheme === 'dark' ? '#4ade80' : '#16a34a'} />
                  <View className="ml-2 flex-1">
                    <Text className="text-green-700 dark:text-green-200 text-sm font-medium" numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text className="text-green-600 dark:text-green-300 text-xs">
                      File selected • Tap to ask about this file
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={onFileRemoved}
                  className="ml-2 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800/50"
                >
                  <X size={18} color={colorScheme === 'dark' ? '#4ade80' : '#16a34a'} />
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Floating Recording Status */}
          {isRecording && (
            <Animated.View 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="mx-4 mb-2"
            >
              <View className="flex-row items-center justify-between bg-red-50 dark:bg-red-900/50 rounded-lg px-3 py-2 border border-red-200 dark:border-red-700/50">
                <View className="flex-row items-center flex-1">
                  <Animated.View
                    style={{
                      transform: [{ scale: withTiming(1.2, { duration: 500 }) }]
                    }}
                  >
                    <Mic size={16} color={colorScheme === 'dark' ? '#f87171' : '#dc2626'} />
                  </Animated.View>
                  <View className="ml-2 flex-1">
                    <Text className="text-red-700 dark:text-red-200 text-sm font-medium">
                      Recording... {formatDuration(recordingDuration)}
                    </Text>
                    <Text className="text-red-600 dark:text-red-300 text-xs">
                      Tap stop when finished
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
          
          <View className="flex-row items-end gap-2 bg-background px-4 py-2">
            {/* File Picker Button - Compact */}
            <FilePickerButton
              onFileSelected={onFileSelected}
              onFileRemoved={onFileRemoved}
              selectedFile={selectedFile}
              disabled={disabled}
              size="md"
              compact={true}
            />
            
            {/* Voice Recorder Button - Compact */}
            <VoiceRecorderButton
              onRecordingComplete={onVoiceRecordingComplete}
              disabled={disabled}
              size="md"
            />
            
            {/* Text Input */}
            <ChatTextInput
              ref={ref}
              className="flex-1 rounded-[20] bg-muted py-[8]"
              placeholder={getPlaceholder()}
              multiline
              value={input}
              onChangeText={onChangeText}
              editable={!disabled}
            />
            
            {/* Send Button */}
            <Button
              size="icon"
              className="android:h-12 android:w-12 rounded-full bg-black dark:bg-white"
              onPress={() => {
                handleSubmitWithDelay();
                Keyboard.dismiss();
              }}
              disabled={disabled || isLocalLoading || (!input.trim() && !selectedFile)}
            >
              {isLocalLoading ? (
                <ActivityIndicator 
                  size="small" 
                  color={colorScheme === "dark" ? "black" : "white"} 
                />
              ) : (
                <ArrowUp
                  color={colorScheme === "dark" ? "black" : "white"}
                  size={20}
                  className="h-6 w-6"
                />
              )}
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  },
);
