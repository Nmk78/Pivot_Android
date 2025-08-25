import { 
  textQuery, 
  textQueryWithFile, 
  speechToText, 
  uploadFile,
  createChatSession,
  sendChatMessage,
  getChatHistory,
  getChatSessions,
  type ChatSession
} from './api-client';
import { authService } from './auth-service';
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
  sendMessage: (message: string, sessionId?: string) => Promise<{ response: string; sessionId: string }>;
  sendMessageWithFile: (message: string, fileUri: string, sessionId?: string) => Promise<{ userMessage: ChatMessage; response: string; sessionId: string }>;
  sendSpeechMessage: (audioUri: string, sessionId?: string) => Promise<{ userMessage: ChatMessage; response: string; transcription: string; sessionId: string }>;
  uploadFileForContext: (fileUri: string, fileName: string) => Promise<string>;
  createSession: (title?: string) => Promise<ChatSession>;
  getSessions: () => Promise<ChatSession[]>;
  getSessionHistory: (sessionId: string) => Promise<ChatMessage[]>;
}

class ChatServiceImpl implements ChatService {
  private currentSessionId: string | null = null;

  async sendMessage(message: string, sessionId?: string): Promise<{ response: string; sessionId: string }> {
    try {
      let activeSessionId = sessionId || this.currentSessionId;
      
      if (!activeSessionId) {
        // Create a new session if none exists
        const session = await createChatSession('New Chat');
        activeSessionId = session.id;
        this.currentSessionId = activeSessionId;
      }

      const response = await sendChatMessage(activeSessionId, message);
      return {
        response: response.content,
        sessionId: activeSessionId,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async sendMessageWithFile(message: string, fileUri: string, sessionId?: string): Promise<{ userMessage: ChatMessage; response: string; sessionId: string }> {
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

      let activeSessionId = sessionId || this.currentSessionId;
      
      if (!activeSessionId) {
        const session = await createChatSession('File Chat');
        activeSessionId = session.id;
        this.currentSessionId = activeSessionId;
      }

      const response = await textQueryWithFile(message, fileData as any, activeSessionId);
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        fileUri: fileUri,
      };

      return {
        userMessage,
        response: response.response || 'No response received',
        sessionId: activeSessionId,
      };
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw new Error('Failed to send message with file');
    }
  }

  async sendSpeechMessage(audioUri: string, sessionId?: string): Promise<{ userMessage: ChatMessage; response: string; transcription: string; sessionId: string }> {
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

      let activeSessionId = sessionId || this.currentSessionId;
      
      if (!activeSessionId) {
        const session = await createChatSession('Voice Chat');
        activeSessionId = session.id;
        this.currentSessionId = activeSessionId;
      }

      const response = await speechToText(fileData as any, activeSessionId);
      
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
        transcription: response.transcription || '',
        sessionId: activeSessionId,
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

  async createSession(title?: string): Promise<ChatSession> {
    try {
      const session = await createChatSession(title || 'New Chat');
      this.currentSessionId = session.id;
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async getSessions(): Promise<ChatSession[]> {
    try {
      return await getChatSessions();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw new Error('Failed to fetch sessions');
    }
  }

  async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const history = await getChatHistory(sessionId);
      return history.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw new Error('Failed to fetch session history');
    }
  }

  setCurrentSession(sessionId: string) {
    this.currentSessionId = sessionId;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
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
