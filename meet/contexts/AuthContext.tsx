import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// Types
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  
  // Google
  loginWithGoogle: () => Promise<boolean>; // Returns true if real auth succeeded, false if fallback needed
  fetchGoogleAccountsMock: () => Promise<any[]>;
  loginWithGoogleAccountMock: (accountId: string) => Promise<void>;
  
  // Email
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  
  // Phone
  sendPhoneOtp: (phone: string) => Promise<string>; 
  verifyPhoneOtp: (phone: string, inputOtp: string, actualOtp: string) => Promise<void>;
  
  logout: () => Promise<void>;
  
  // Modal State
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('civic_user_session');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem('civic_user_session');
      }
    }
    setLoading(false);
  }, []);

  const saveUserSession = (u: User) => {
    setUser(u);
    localStorage.setItem('civic_user_session', JSON.stringify(u));
    setIsAuthModalOpen(false);
  };

  // --- ACTIONS ---

  // Attempts Real Google Popup. Returns false if not configured (to trigger mock UI).
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const user = await authService.initRealGoogleAuth();
      saveUserSession(user);
      return true;
    } catch (error: any) {
      if (error.message === 'GOOGLE_AUTH_NOT_CONFIGURED') {
        console.warn("Google Client ID not found. Falling back to simulation mode.");
        return false; 
      }
      throw error;
    }
  };

  // Fallback Mock Actions
  const fetchGoogleAccountsMock = async () => {
    return await authService.getGoogleAccountsMock();
  };

  const loginWithGoogleAccountMock = async (accountId: string) => {
    const user = await authService.signInWithGoogleAccountMock(accountId);
    saveUserSession(user);
  };

  const loginWithEmail = async (email: string, pass: string) => {
     const user = await authService.loginEmail(email, pass);
     saveUserSession(user);
  };

  const signupWithEmail = async (name: string, email: string, pass: string) => {
    const user = await authService.signupEmail(name, email, pass);
    saveUserSession(user);
 };

  const sendPhoneOtp = async (phone: string) => {
    return await authService.sendOtp(phone);
  };

  const verifyPhoneOtp = async (phone: string, inputOtp: string, actualOtp: string) => {
    const user = await authService.verifyOtp(phone, inputOtp, actualOtp);
    saveUserSession(user);
  };

  const logout = async () => {
    // Simulate API call
    await new Promise(r => setTimeout(r, 300));
    setUser(null);
    localStorage.removeItem('civic_user_session');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider value={{
      user, loading, 
      loginWithGoogle,
      fetchGoogleAccountsMock, loginWithGoogleAccountMock,
      loginWithEmail, signupWithEmail, 
      sendPhoneOtp, verifyPhoneOtp, 
      logout,
      isAuthModalOpen, openAuthModal, closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};