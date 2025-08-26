import AsyncStorage from "@react-native-async-storage/async-storage";
import { config, getApiUrl } from './config';
import { ApiException } from './api-client';

// Types based on API documentation
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

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
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

// Remove AuthError interface as we now use ApiException

export interface Session {
  user: User;
  access_token: string;
  expires_at: number;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const EXPIRES_KEY = 'auth_expires';

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.api.baseUrl;
  }

  private async apiRequest<T>(
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
    
    console.log(`API Request: ${method} ${url}`);
    
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Auth API Error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: url
        });
        throw ApiException.fromResponse(response.status, errorText);
      }

      return await response.json();
    } catch (error) {
      // Re-throw ApiException as-is
      if (error instanceof ApiException) {
        throw error;
      }
      
      // Handle network and other errors
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new ApiException({
          message: 'Network connection failed. Please check your internet connection.',
          status: 0,
          detail: error.message,
          code: 'NETWORK_ERROR'
        });
      }
      
      throw new ApiException({
        message: error instanceof Error ? error.message : 'Authentication request failed',
        status: 0,
        detail: error instanceof Error ? error.stack : String(error),
        code: 'UNKNOWN_ERROR'
      });
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    try {
      const user = await this.apiRequest<User>('/auth/register', {
        method: 'POST',
        body: userData,
      });
      return user;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException({
        message: 'Registration failed',
        status: 0,
        detail: error instanceof Error ? error.message : String(error),
        code: 'REGISTRATION_ERROR'
      });
    }
  }

  async login(credentials: LoginRequest): Promise<Session> {
    try {
      // API expects form data for login
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await this.apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      console.log("🚀 ~ AuthService ~ login ~ response:", response)


      // Calculate expiration time
      const expiresAt = Date.now() + (response.expires_in * 1000);

      const session: Session = {
        user: response.user,
        access_token: response.access_token,
        expires_at: expiresAt,
      };

      // Store session data
      await this.storeSession(session);

      return session;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException({
        message: 'Login failed',
        status: 0,
        detail: error instanceof Error ? error.message : String(error),
        code: 'LOGIN_ERROR'
      });
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, EXPIRES_KEY]);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await this.getToken();
      if (!token) return null;

      const user = await this.apiRequest<User>('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      // If token is invalid, clear stored session
      await this.logout();
      return null;
    }
  }

  async updateUser(userData: Partial<Pick<User, 'full_name' | 'username'>>): Promise<User> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No authentication token');

      const user = await this.apiRequest<User>('/auth/me', {
        method: 'PUT',
        body: userData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update stored user data
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Update failed');
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const [token, userStr, expiresStr] = await AsyncStorage.multiGet([
        TOKEN_KEY,
        USER_KEY,
        EXPIRES_KEY,
      ]);

      if (!token[1] || !userStr[1] || !expiresStr[1]) {
        return null;
      }

      const expiresAt = parseInt(expiresStr[1]);
      
      // Check if token is expired
      if (Date.now() >= expiresAt) {
        await this.logout();
        return null;
      }

      return {
        access_token: token[1],
        user: JSON.parse(userStr[1]),
        expires_at: expiresAt,
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const session = await this.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  private async storeSession(session: Session): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, session.access_token],
        [USER_KEY, JSON.stringify(session.user)],
        [EXPIRES_KEY, session.expires_at.toString()],
      ]);
    } catch (error) {
      console.error('Error storing session:', error);
      throw new Error('Failed to store session');
    }
  }

  // Auth state change listeners (for compatibility with existing code)
  private listeners: Array<(session: Session | null) => void> = [];

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(session: Session | null): void {
    this.listeners.forEach(callback => callback(session));
  }

  // Override login to notify listeners
  async loginWithNotification(credentials: LoginRequest): Promise<Session> {
    try {
      const session = await this.login(credentials);      
      if (session && session.user) {
        this.notifyListeners(session);
        return session;
      } else {
        throw new ApiException({
          message: 'Login failed: Invalid response from server',
          status: 500,
          detail: 'Server returned invalid session data',
          code: 'INVALID_SESSION_RESPONSE'
        });
      }
    } catch (error) {
      console.error("Login with notification failed:", error);
      throw error;
    }
  }  
  
  async loginWithoutNotification(credentials: LoginRequest): Promise<Session> {
    try {
      const session = await this.login(credentials);
      console.log("🚀 ~ AuthService ~ loginWithoutNotification ~ session:", session);
      // Don't notify listeners to prevent automatic redirects
      return session;
    } catch (error) {
      console.error("Login without notification failed:", error);
      throw error;
    }
  }

  // Override logout to notify listeners
  async logoutWithNotification(): Promise<void> {
    await this.logout();
    this.notifyListeners(null);
  }

  
}

export const authService = new AuthService();

// Export types for compatibility
export type { Session as AuthSession };
