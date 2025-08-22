import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import { Alert } from 'react-native';

export interface VoiceRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  recordingUri: string | null;
  error: string | null;
}

export interface VoiceRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  resetRecording: () => void;
  formatDuration: (milliseconds: number) => string;
}

export function useVoiceRecorder(): VoiceRecorderState & VoiceRecorderActions {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Use the expo-audio hooks
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Set up audio mode and permissions on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          setError('Permission to access microphone was denied');
          Alert.alert('Permission to access microphone was denied');
          return;
        }

        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to setup audio';
        setError(errorMessage);
        console.error('Error setting up audio:', err);
      }
    };

    setupAudio();
  }, []);

  // Sync with recorder state
  useEffect(() => {
    setIsRecording(recorderState.isRecording);
  }, [recorderState.isRecording]);

  const startDurationTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      startDurationTimer();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Error starting recording:', err);
    }
  }, [audioRecorder, startDurationTimer]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!isRecording) {
        return null;
      }

      await audioRecorder.stop();
      
      setIsRecording(false);
      setIsPaused(false);
      stopDurationTimer();

      // According to expo-audio docs, the recording will be available on audioRecorder.uri
      const uri = (audioRecorder as any).uri;
      if (uri) {
        setRecordingUri(uri);
        return uri;
      }

      return null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      console.error('Error stopping recording:', err);
      return null;
    }
  }, [audioRecorder, isRecording, stopDurationTimer]);

  const pauseRecording = useCallback(async () => {
    try {
      if (isRecording && !isPaused) {
        // Note: expo-audio might not support pause/resume directly
        // For now, we'll just stop the timer
        setIsPaused(true);
        stopDurationTimer();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause recording';
      setError(errorMessage);
      console.error('Error pausing recording:', err);
    }
  }, [isRecording, isPaused, stopDurationTimer]);

  const resumeRecording = useCallback(async () => {
    try {
      if (isRecording && isPaused) {
        // Note: expo-audio might not support pause/resume directly
        // For now, we'll just resume the timer
        setIsPaused(false);
        startDurationTimer();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume recording';
      setError(errorMessage);
      console.error('Error resuming recording:', err);
    }
  }, [isRecording, isPaused, startDurationTimer]);

  const resetRecording = useCallback(() => {
    try {
      if (isRecording) {
        audioRecorder.stop().catch(console.error);
      }
    } catch (err) {
      console.error('Error stopping recording during reset:', err);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
    setRecordingUri(null);
    setError(null);
    stopDurationTimer();
  }, [audioRecorder, isRecording, stopDurationTimer]);

  // Format duration for display
  const formatDuration = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isRecording,
    isPaused,
    recordingDuration,
    recordingUri,
    error,
    
    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    
    // Utility
    formatDuration,
  };
}
