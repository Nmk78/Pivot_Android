import AsyncStorage from "@react-native-async-storage/async-storage";
import { config, getApiUrl } from './config';
import { authService } from './auth-service';

// Standardized API Error Types
export interface ApiError {
  message: string;
  status: number;
  detail?: string;
  code?: string;
}

export class ApiException extends Error {
  public readonly status: number;
  public readonly detail?: string;
  public readonly code?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.status = error.status;
    this.detail = error.detail;
    this.code = error.code;
  }

  static fromResponse(status: number, responseText: string): ApiException {
    let detail = responseText;
    let message = `API error: ${status}`;
    
    try {
      const errorData = JSON.parse(responseText);
      detail = errorData.detail || errorData.message || responseText;
      message = detail;
    } catch {
      // Keep original responseText as detail
    }

    return new ApiException({
      message,
      status,
      detail,
      code: `HTTP_${status}`
    });
  }
}

// Types based on API documentation

// Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  created_at: string;
  last_login: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface UpdateUserRequest {
  full_name?: string;
  username?: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  username: string;
}

// File Types
export interface FileUploadResponse {
  status: string;
  message: string;
  file_id: string;
  data: Array<{
    filename: string;
    file_id: string;
    file_type: string;
    status: string;
    message: string;
  }>;
}

export interface FileInfo {
  id: string;
  filename: string;
  upload_date: string;
  size: number;
}

export interface FilesListResponse {
  files: FileInfo[];
  count: number;
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
  user_id: string;
  history: Array<{
    session: {
      id: string;
      title: string;
    };
    messages: ChatMessage[];
  }>;
  total_sessions: number;
}

export interface SessionStats {
  total_messages: number;
  total_tokens: number;
  average_response_time: number;
  session_duration: number;
}

export interface SearchResult {
  id: string;
  session_id: string;
  content: string;
  created_at: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
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
      throw new Error('Authentication required but no token available, Maybe you are guest user');
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
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: url
      });
      throw ApiException.fromResponse(response.status, errorText);
    }

    const result = await response.json();
    console.log("API Response:", result);
    return result;
  } catch (error) {
    console.error("Network Error:", error);
    
    // Re-throw ApiException as-is
    if (error instanceof ApiException) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      const isCorsIssue = url.includes('localhost') || url.includes('127.0.0.1');
      const errorMessage = isCorsIssue 
        ? `Network request failed. This might be a CORS issue. Please ensure your API server is running and allows requests from this app. URL: ${url}`
        : `Network request failed. Please check your internet connection and API server status. URL: ${url}`;
      throw new ApiException({
        message: errorMessage,
        status: 0,
        detail: error.message,
        code: 'NETWORK_ERROR'
      });
    }
    
    // Handle other errors
    throw new ApiException({
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0,
      detail: error instanceof Error ? error.stack : String(error),
      code: 'UNKNOWN_ERROR'
    });
  }
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

// Authentication Endpoints
export async function registerUser(userData: RegisterRequest): Promise<User> {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: userData,
  });
}

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me', {
    requireAuth: true,
  });
}

export async function updateCurrentUser(userData: UpdateUserRequest): Promise<User> {
  return apiRequest<User>('/auth/me', {
    method: 'PUT',
    body: userData,
    requireAuth: true,
  });
}

export async function createAdminUser(adminData: CreateAdminRequest): Promise<User> {
  return apiRequest<User>('/auth/admin/create', {
    method: 'POST',
    body: adminData,
    requireAuth: true,
  });
}

export async function getAllUsers(limit = 100, offset = 0): Promise<User[]> {
  return apiRequest<User[]>(`/auth/admin/users?limit=${limit}&offset=${offset}`, {
    requireAuth: true,
  });
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

export async function getSessionStats(sessionId: string): Promise<SessionStats> {
  return apiRequest<SessionStats>(`/chat/sessions/${sessionId}/stats`);
}

export async function searchMessages(query: string, limit = 20): Promise<SearchResponse> {
  return apiRequest<SearchResponse>(`/chat/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
    requireAuth: true,
  });
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

  return apiRequest<TextWithFileResponse>('/chat/text-with-file', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function getUserChatHistory(limit = 20, offset = 0): Promise<ChatHistoryResponse> {
  return apiRequest<ChatHistoryResponse>(`/chat-history?limit=${limit}&offset=${offset}`, {
    requireAuth: true,
  });
}

// Speech Endpoints
export async function speechToText(audioFile: File, sessionId?: string, language: 'auto' | 'en' | 'my' = 'auto'): Promise<SpeechResponse> {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  console.log("Sending audio file:", {
    name: audioFile.name,
    size: audioFile.size,
    type: audioFile.type,
    language
  });

  const endpoint = language === 'auto' ? '/speech' : `/speech/${language}`;
  
  return apiRequest<SpeechResponse>(endpoint, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

// Note: speechStream endpoint removed as it's not documented in the current API
