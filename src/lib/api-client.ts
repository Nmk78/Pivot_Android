import AsyncStorage from "@react-native-async-storage/async-storage";
import { config, getApiUrl } from './config';

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
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, isFormData = false } = options;

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

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

// File Endpoints
export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<FileUploadResponse>('/file', {
    method: 'POST',
    body: formData,
    isFormData: true,
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

// Text Endpoints
export async function textQuery(query: string): Promise<TextQueryResponse> {
  return apiRequest<TextQueryResponse>('/text', {
    method: 'POST',
    body: { query },
  });
}

export async function textQueryWithFile(
  query: string,
  file: File
): Promise<TextWithFileResponse> {
  const formData = new FormData();
  formData.append('query', query);
  formData.append('file', file);

  return apiRequest<TextWithFileResponse>('/text-with-file', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function getChatHistory(): Promise<ChatHistoryResponse> {
  return apiRequest<ChatHistoryResponse>('/chat-history');
}

// Speech Endpoints
export async function speechToText(audioFile: File): Promise<SpeechResponse> {
  const formData = new FormData();
  formData.append('audio_file', audioFile);

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
