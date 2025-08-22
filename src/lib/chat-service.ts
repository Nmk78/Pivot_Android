import { textQuery, textQueryWithFile, speechToText, uploadFile } from './api-client';
import * as FileSystem from 'expo-file-system';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fileUri?: string; // Added for file messages
  audioUri?: string; // Added for voice messages
  transcription?: string; // Added for voice messages
}

export interface ChatService {
  sendMessage: (message: string) => Promise<string>;
  sendMessageWithFile: (message: string, fileUri: string) => Promise<{ userMessage: ChatMessage; response: string }>;
  sendSpeechMessage: (audioUri: string) => Promise<{ userMessage: ChatMessage; response: string; transcription: string }>;
  uploadFileForContext: (fileUri: string, fileName: string) => Promise<string>;
}

class ChatServiceImpl implements ChatService {
  async sendMessage(message: string): Promise<string> {
    try {
      const response = await textQuery(message);
      return response.response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async sendMessageWithFile(message: string, fileUri: string): Promise<{ userMessage: ChatMessage; response: string }> {
    try {
      // For React Native, we'll use the file URI directly with FormData
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      // Create a file object compatible with React Native FormData
      const fileName = fileUri.split('/').pop() || 'file';
      const fileData = {
        uri: fileUri,
        type: this.getMimeType(fileName),
        name: fileName,
      };

      const response = await textQueryWithFile(message, fileData as any);
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        fileUri: fileUri,
      };

      return {
        userMessage,
        response: response.response || 'No response received'
      };
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw new Error('Failed to send message with file');
    }
  }

  async sendSpeechMessage(audioUri: string): Promise<{ userMessage: ChatMessage; response: string; transcription: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Create a file object compatible with React Native FormData
      const fileName = `recording_${Date.now()}.wav`;
      const fileData = {
        uri: audioUri,
        type: 'audio/wav',
        name: fileName,
      };

      const response = await speechToText(fileData as any);
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: `[Voice Message] ${response.transcription || 'Voice message'}`,
        timestamp: new Date(),
        audioUri: audioUri,
        transcription: response.transcription || '',
      };

      return {
        userMessage,
        response: response.response || 'No response received',
        transcription: response.transcription || ''
      };
    } catch (error) {
      console.error('Error processing speech:', error);
      throw new Error('Failed to process speech');
    }
  }

  async uploadFileForContext(fileUri: string, fileName: string): Promise<string> {
    try {
      // Convert file URI to File object for API
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      // Create a file object compatible with React Native FormData
      const fileData = {
        uri: fileUri,
        type: this.getMimeType(fileName),
        name: fileName,
      };

      const response = await uploadFile(fileData as any);
      return response.file_id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      case 'wav':
        return 'audio/wav';
      case 'mp3':
        return 'audio/mpeg';
      case 'm4a':
        return 'audio/mp4';
      default:
        return 'application/octet-stream';
    }
  }
}

export const chatService = new ChatServiceImpl();
