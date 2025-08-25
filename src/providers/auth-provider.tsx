import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type Session, type User } from '@/lib/auth-service';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<Pick<User, 'full_name' | 'username'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    checkSession();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkSession = async () => {
    try {
      const existingSession = await authService.getSession();
      if (existingSession) {
        // Verify session is still valid by fetching current user
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setSession(existingSession);
          setUser(currentUser);
        } else {
          // Session is invalid, clear it
          await authService.logout();
          setSession(null);
          setUser(null);
        }
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const newSession = await authService.loginWithNotification({
        username: email,
        password,
      });
      setSession(newSession);
      setUser(newSession.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    setLoading(true);
    try {
      await authService.register({
        email,
        password,
        username,
        full_name: fullName,
      });
      // Note: After registration, user needs to sign in separately
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.logoutWithNotification();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<Pick<User, 'full_name' | 'username'>>) => {
    try {
      const updatedUser = await authService.updateUser(userData);
      setUser(updatedUser);
      // Update session with new user data
      if (session) {
        setSession({ ...session, user: updatedUser });
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
