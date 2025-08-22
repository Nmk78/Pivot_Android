import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { config } from '@/lib/config';

export interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
}

export interface FilePickerState {
  selectedFile: SelectedFile | null;
  isPicking: boolean;
  error: string | null;
}

export interface FilePickerActions {
  pickDocument: () => Promise<SelectedFile | null>;
  clearFile: () => void;
  validateFile: (file: SelectedFile) => boolean;
}

export function useFilePicker(): FilePickerState & FilePickerActions {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: SelectedFile): boolean => {
    // Check file size
    if (file.size > config.upload.maxFileSize) {
      setError(`File size exceeds ${config.upload.maxFileSize / (1024 * 1024)}MB limit`);
      return false;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.upload.allowedFileTypes.includes(fileExtension)) {
      setError(`File type not supported. Allowed types: ${config.upload.allowedFileTypes.join(', ')}`);
      return false;
    }

    setError(null);
    return true;
  }, []);

  const pickDocument = useCallback(async (): Promise<SelectedFile | null> => {
    try {
      setIsPicking(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'text/plain', // .txt
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return null;
      }

      const file = result.assets[0];
      
      const selectedFile: SelectedFile = {
        uri: file.uri,
        name: file.name || 'Unknown file',
        size: file.size || 0,
        type: file.mimeType || '',
        mimeType: file.mimeType || '',
      };

      // Validate the file
      if (!validateFile(selectedFile)) {
        return null;
      }

      setSelectedFile(selectedFile);
      return selectedFile;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick document';
      setError(errorMessage);
      console.error('Error picking document:', err);
      return null;
    } finally {
      setIsPicking(false);
    }
  }, [validateFile]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return {
    // State
    selectedFile,
    isPicking,
    error,
    
    // Actions
    pickDocument,
    clearFile,
    validateFile,
  };
}
