import AsyncStorage from "@react-native-async-storage/async-storage";
import { config, getApiUrl } from './config';
import { authService } from './auth-service';

// Types based on API documentation
export interface FileUploadResponse {
  message: string;
  file_id: string;
  filename: string;
  file_type: string;
}

export interface TextQueryRequest {
  query: string;
}

export interface TextQueryResponse {
  response: string;
  query: string;
}

export interface TextWithFileRequest {
  query: string;
  file: File;
}

export interface TextWithFileResponse {
  response: string;
  query: string;
  file: string;
}

export interface SpeechResponse {
  transcription: string;
  response: string;
  audio_file_id: string;
}

export interface ChatHistoryResponse {
  message: string;
}

export interface FilesListResponse {
  message: string;
}

// API Health Check
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl('/health'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
}

// Generic API client function
async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    isFormData?: boolean;
    requireAuth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, isFormData = false, requireAuth = false } = options;

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Add authorization header if required or available
  if (requireAuth) {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('Authentication required but no token available');
    }
    requestHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    // Add token if available (for authenticated users) but don't require it
    const token = await authService.getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Don't set Content-Type for FormData (browser will set it automatically with boundary)
  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    if (isFormData) {
      requestOptions.body = body;
    } else {
      requestOptions.body = JSON.stringify(body);
    }
  }

  const url = getApiUrl(endpoint);
  console.log("url🍕🍕", url);
  console.log("Request options:", {
    method: requestOptions.method,
    headers: requestOptions.headers,
    bodyType: isFormData ? 'FormData' : 'JSON',
    bodySize: body ? (isFormData ? 'FormData' : JSON.stringify(body).length) : 'None'
  });

  try {
    const response = await fetch(url, requestOptions);
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("API Response:", result);
    return result;
  } catch (error) {
    console.error("Network Error:", error);
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      // Check if it's a CORS issue or server not available
      const isCorsIssue = url.includes('localhost') || url.includes('127.0.0.1');
      const errorMessage = isCorsIssue 
        ? `Network request failed. This might be a CORS issue. Please ensure your API server is running and allows requests from this app. URL: ${url}`
        : `Network request failed. Please check your internet connection and API server status. URL: ${url}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
}

// File Endpoints (Admin only)
export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('files', file); // API expects 'files' for batch upload

  return apiRequest<FileUploadResponse>('/files', {
    method: 'POST',
    body: formData,
    isFormData: true,
    requireAuth: true,
  });
}

export async function uploadFiles(files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  return apiRequest<any>('/files', {
    method: 'POST',
    body: formData,
    isFormData: true,
    requireAuth: true,
  });
}

export async function listFiles(): Promise<FilesListResponse> {
  return apiRequest<FilesListResponse>('/files');
}

export async function deleteFile(fileId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/file/${fileId}`, {
    method: 'DELETE',
  });
}

// Chat Session Management
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_temporary: boolean;
  created_at: string;
  updated_at: string;
  status: 'active' | 'closed';
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type: 'text' | 'audio' | 'file_upload';
  metadata: any;
  created_at: string;
  tokens_used?: number;
  response_time_ms?: number;
}

export interface ChatResponse {
  session_id: string;
  message_id: string;
  content: string;
  metadata: any;
  created_at: string;
  tokens_used: number;
  response_time_ms: number;
}

export async function createChatSession(title?: string, description?: string): Promise<ChatSession> {
  return apiRequest<ChatSession>('/chat/new-session', {
    method: 'POST',
    body: title || description ? { title, description } : undefined,
  });
}

export async function getChatSessions(limit = 15, offset = 0): Promise<ChatSession[]> {
  return apiRequest<ChatSession[]>(`/chat/sessions?limit=${limit}&offset=${offset}`, {
    requireAuth: true,
  });
}

export async function getChatSession(sessionId: string): Promise<ChatSession> {
  return apiRequest<ChatSession>(`/chat/sessions/${sessionId}`);
}

export async function updateChatSession(sessionId: string, title?: string, description?: string): Promise<ChatSession> {
  return apiRequest<ChatSession>(`/chat/sessions/${sessionId}`, {
    method: 'PUT',
    body: { title, description },
  });
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  return apiRequest<void>(`/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

export async function sendChatMessage(sessionId: string, content: string, messageType = 'text'): Promise<ChatResponse> {
  return apiRequest<ChatResponse>(`/chat/sessions/${sessionId}/chat`, {
    method: 'POST',
    body: {
      role: 'user',
      content,
      message_type: messageType,
      metadata: {},
    },
  });
}

export async function getChatHistory(sessionId: string): Promise<{ session_id: string; messages: ChatMessage[]; total_messages: number; created_at: string }> {
  return apiRequest<{ session_id: string; messages: ChatMessage[]; total_messages: number; created_at: string }>(`/chat/sessions/${sessionId}/history`);
}

export async function getChatMessages(sessionId: string, limit = 100, offset = 0): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/chat/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`);
}

// Legacy text query (now uses chat sessions)
export async function textQuery(query: string, sessionId?: string): Promise<TextQueryResponse> {
  if (sessionId) {
    const response = await sendChatMessage(sessionId, query);
    return {
      response: response.content,
      query,
    };
  }
  
  // Create temporary session for anonymous users
  const session = await createChatSession('Temporary Chat');
  const response = await sendChatMessage(session.id, query);
  return {
    response: response.content,
    query,
  };
}

export async function textQueryWithFile(
  query: string,
  file: File,
  sessionId?: string
): Promise<TextWithFileResponse> {
  const formData = new FormData();
  formData.append('query', query);
  formData.append('file', file);
  
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  return apiRequest<TextWithFileResponse>('/text-with-file', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function getUserChatHistory(limit = 20, offset = 0): Promise<any> {
  return apiRequest<any>(`/chat-history?limit=${limit}&offset=${offset}`, {
    requireAuth: true,
  });
}

// Speech Endpoints
export async function speechToText(audioFile: File, sessionId?: string): Promise<SpeechResponse> {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  console.log("Sending audio file:", {
    name: audioFile.name,
    size: audioFile.size,
    type: audioFile.type
  });

  return apiRequest<SpeechResponse>('/speech', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function speechStream(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/speech-stream');
}

// Legacy functions for backward compatibility (if needed)
export async function fetchApi(
  endpoint: string,
  options: { token: string; chatId?: string; method?: string; body?: any },
) {
  const token = await AsyncStorage.getItem("session");

  const response = await fetch(
    `${config.api.baseUrl}${endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`}`,
    {
      method: options.method || "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(options.body && { body: JSON.stringify(options.body) }),
      ...(options.chatId && !options.body && {
        body: JSON.stringify({ chatId: options.chatId }),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getChatsByUserId({ token }: { token: string }) {
  try {
    console.log("getChatsByUserId called");
    const response = await fetchApi("history", {
      token,
    });
    console.log("getChatsByUserId response", response);
    return response;
  } catch (error) {
    console.error("Error fetching chats.", error);
    throw new Error("Failed to fetch chats");
  }
}

export async function getChatById({
  chatId,
  token,
}: {
  chatId: string;
  token: string;
}) {
  try {
    const response = await fetchApi("/api/chat", { chatId, token });
    return response;
  } catch (error) {
    console.error("Error fetching chat.", error);
    throw new Error("Failed to fetch chat");
  }
}
