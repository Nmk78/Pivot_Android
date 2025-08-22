import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Mic, MicOff, Square, Pause, Play } from 'lucide-react-native';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { cn } from '@/lib/utils';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface VoiceRecorderButtonProps {
  onRecordingComplete: (audioUri: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceRecorderButton({ 
  onRecordingComplete, 
  disabled = false,
  size = 'md' 
}: VoiceRecorderButtonProps) {
  const {
    isRecording,
    isPaused,
    recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatDuration,
    error,
  } = useVoiceRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useSharedValue(1);

  // Pulse animation for recording state
  React.useEffect(() => {
    if (isRecording && !isPaused) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, isPaused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const audioUri = await stopRecording();
      if (audioUri) {
        onRecordingComplete(audioUri);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await resumeRecording();
      } else {
        await pauseRecording();
      }
    } catch (err) {
      console.error('Failed to pause/resume recording:', err);
    }
  };

  const handleCancel = () => {
    resetRecording();
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  if (error) {
    return (
      <View className="items-center">
        <Text className="text-red-500 text-xs mb-2">{error}</Text>
        <Pressable
          onPress={handleStartRecording}
          disabled={disabled}
          className={cn(
            sizeClasses[size],
            'rounded-full bg-red-100 items-center justify-center',
            disabled && 'opacity-50'
          )}
        >
          <Mic size={iconSizes[size]} color="#ef4444" />
        </Pressable>
      </View>
    );
  }

  if (isRecording) {
    return (
      <View className="items-center">
        <Text className="text-gray-600 text-xs mb-2">
          {formatDuration(recordingDuration)}
        </Text>
        <View className="flex-row items-center space-x-2">
          <Animated.View style={animatedStyle}>
            <Pressable
              onPress={handlePauseResume}
              className={cn(
                sizeClasses[size],
                'rounded-full bg-blue-500 items-center justify-center'
              )}
            >
              {isPaused ? (
                <Play size={iconSizes[size]} color="white" />
              ) : (
                <Pause size={iconSizes[size]} color="white" />
              )}
            </Pressable>
          </Animated.View>
          
          <Pressable
            onPress={handleStopRecording}
            disabled={isProcessing}
            className={cn(
              sizeClasses[size],
              'rounded-full bg-red-500 items-center justify-center',
              isProcessing && 'opacity-50'
            )}
          >
            <Square size={iconSizes[size]} color="white" />
          </Pressable>
          
          <Pressable
            onPress={handleCancel}
            className={cn(
              sizeClasses[size],
              'rounded-full bg-gray-500 items-center justify-center'
            )}
          >
            <MicOff size={iconSizes[size]} color="white" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handleStartRecording}
      disabled={disabled}
      className={cn(
        sizeClasses[size],
        'rounded-full bg-blue-500 items-center justify-center',
        disabled && 'opacity-50'
      )}
    >
      <Mic size={iconSizes[size]} color="white" />
    </Pressable>
  );
}
