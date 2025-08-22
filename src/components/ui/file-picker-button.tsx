import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { FileText, X, Upload } from 'lucide-react-native';
import { useFilePicker, SelectedFile } from '@/hooks/useFilePicker';
import { cn } from '@/lib/utils';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface FilePickerButtonProps {
  onFileSelected: (file: SelectedFile) => void;
  onFileRemoved: () => void;
  selectedFile: SelectedFile | null;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean; // When true, always show as icon only
}

export function FilePickerButton({ 
  onFileSelected, 
  onFileRemoved,
  selectedFile,
  disabled = false,
  size = 'md',
  compact = false
}: FilePickerButtonProps) {
  const {
    pickDocument,
    clearFile,
    isPicking,
    error,
  } = useFilePicker();

  const handlePickDocument = async () => {
    try {
      const file = await pickDocument();
      if (file) {
        onFileSelected(file);
      }
    } catch (err) {
      console.error('Failed to pick document:', err);
    }
  };

  const handleRemoveFile = () => {
    clearFile();
    onFileRemoved();
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

  if (selectedFile && !compact) {
    return (
      <View className="items-center">
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="flex-row items-center space-x-2"
        >
          <View className="flex-row items-center bg-green-100 rounded-lg px-3 py-2">
            <FileText size={iconSizes[size]} color="#16a34a" />
            <Text className="text-green-700 text-xs ml-2 max-w-32" numberOfLines={1}>
              {selectedFile.name}
            </Text>
          </View>
          
          <Pressable
            onPress={handleRemoveFile}
            className={cn(
              sizeClasses[size],
              'rounded-full bg-red-500 items-center justify-center'
            )}
          >
            <X size={iconSizes[size]} color="white" />
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center">
        <Text className="text-red-500 text-xs mb-2">{error}</Text>
        <Pressable
          onPress={handlePickDocument}
          disabled={disabled || isPicking}
          className={cn(
            sizeClasses[size],
            'rounded-full bg-red-100 items-center justify-center',
            (disabled || isPicking) && 'opacity-50'
          )}
        >
          <Upload size={iconSizes[size]} color="#ef4444" />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePickDocument}
      disabled={disabled || isPicking}
      className={cn(
        sizeClasses[size],
        'rounded-full items-center justify-center',
        selectedFile && compact 
          ? 'bg-green-500 dark:bg-green-600' 
          : 'bg-blue-500 dark:bg-blue-600',
        (disabled || isPicking) && 'opacity-50'
      )}
    >
      {selectedFile && compact ? (
        <FileText size={iconSizes[size]} color="white" />
      ) : (
        <Upload size={iconSizes[size]} color="white" />
      )}
    </Pressable>
  );
}
