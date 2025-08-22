import { useState, useCallback } from 'react';
import { chatService, ChatMessage } from '@/lib/chat-service';
import { generateUUID } from '@/lib/utils';
import { SelectedFile } from './useFilePicker';

export interface UseChatStateReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithFile: (content: string, file: SelectedFile) => Promise<void>;
  sendSpeechMessage: (audioUri: string) => Promise<void>;
  uploadFileForContext: (file: SelectedFile) => Promise<string>;
  clearMessages: () => void;
  error: string | null;
}

export function useChatState(): UseChatStateReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

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
      const response = await chatService.sendMessage(content);
      
      const assistantMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
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
  }, []);

  const sendMessageWithFile = useCallback(async (content: string, file: SelectedFile) => {
    if (!content.trim() || !file) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.sendMessageWithFile(content, file.uri);
      
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
  }, []);

  const sendSpeechMessage = useCallback(async (audioUri: string) => {
    if (!audioUri) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatService.sendSpeechMessage(audioUri);
      
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
  }, []);

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
  };
}
