import { useState, useCallback, useEffect } from 'react';
import { chatService, ChatMessage } from '@/lib/chat-service';
import { generateUUID } from '@/lib/utils';
import { SelectedFile } from './useFilePicker';
import { type ChatSession } from '@/lib/api-client';

export interface UseChatStateReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithFile: (content: string, file: SelectedFile) => Promise<void>;
  sendSpeechMessage: (audioUri: string) => Promise<void>;
  uploadFileForContext: (file: SelectedFile) => Promise<string>;
  clearMessages: () => void;
  error: string | null;
  // New properties for session management
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentChatId: (sessionId: string) => void;
  createNewChat: () => Promise<void>;
  loadChatHistory: (sessionId: string) => Promise<void>;
}

export function useChatState(): UseChatStateReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const sessions = await chatService.getSessions();
      setChatSessions(sessions);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  }, []);

  const createNewChat = useCallback(async () => {
    try {
      const newSession = await chatService.createSession('New Chat');
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Failed to create new chat:', err);
      setError('Failed to create new chat');
    }
  }, []);

  const setCurrentChatId = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    chatService.setCurrentSession(sessionId);
    await loadChatHistory(sessionId);
  }, []);

  const loadChatHistory = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      const history = await chatService.getSessionHistory(sessionId);
      setMessages(history);
      setError(null);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Create a new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      await createNewChat();
      sessionId = chatService.getCurrentSessionId();
    }

    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(content, sessionId || undefined);
      
      const assistantMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update current session ID if it changed
      if (response.sessionId !== sessionId) {
        setCurrentSessionId(response.sessionId);
        chatService.setCurrentSession(response.sessionId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, createNewChat]);

  const sendMessageWithFile = useCallback(async (content: string, file: SelectedFile) => {
    if (!content.trim() || !file) return;

    // Create a new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      await createNewChat();
      sessionId = chatService.getCurrentSessionId();
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.sendMessageWithFile(content, file.uri, sessionId || undefined);
      
      // Add user message
      setMessages(prev => [...prev, result.userMessage]);
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update current session ID if it changed
      if (result.sessionId !== sessionId) {
        setCurrentSessionId(result.sessionId);
        chatService.setCurrentSession(result.sessionId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message with file';
      setError(errorMessage);
      
      // Add user message even if it fails
      const userMessage: ChatMessage = {
        id: generateUUID(),
        role: 'user',
        content: `${content.trim()} [with file: ${file.name}]`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      const errorChatMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, createNewChat]);

  const sendSpeechMessage = useCallback(async (audioUri: string) => {
    if (!audioUri) return;

    // Create a new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      await createNewChat();
      sessionId = chatService.getCurrentSessionId();
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.sendSpeechMessage(audioUri, sessionId || undefined);
      
      // Add user message
      setMessages(prev => [...prev, result.userMessage]);
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update current session ID if it changed
      if (result.sessionId !== sessionId) {
        setCurrentSessionId(result.sessionId);
        chatService.setCurrentSession(result.sessionId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process speech';
      setError(errorMessage);
      
      const errorChatMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error processing your speech: ${errorMessage}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, createNewChat]);

  const uploadFileForContext = useCallback(async (file: SelectedFile): Promise<string> => {
    if (!file) throw new Error('No file provided');

    setIsLoading(true);
    setError(null);

    try {
      const fileId = await chatService.uploadFileForContext(file.uri, file.name);
      
      const assistantMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `File "${file.name}" uploaded successfully. You can now ask questions about this document.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      return fileId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      
      const errorChatMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error uploading your file: ${errorMessage}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    sendMessageWithFile,
    sendSpeechMessage,
    uploadFileForContext,
    clearMessages,
    error,
    // New properties
    chatSessions,
    currentSessionId,
    setCurrentChatId,
    createNewChat,
    loadChatHistory,
  };
}
