
import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContextType, User } from "@/types";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { login, register, loginWithGoogle, logout, error } = useAuthActions();
  const { refreshUser } = useSubscriptionStatus();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("automatorUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing stored user", e);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const loggedInUser = await login(email, password);
    if (loggedInUser) setUser(loggedInUser);
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    const registeredUser = await register(email, password, name);
    if (registeredUser) setUser(registeredUser);
  };

  const handleGoogleLogin = async () => {
    const googleUser = await loginWithGoogle();
    if (googleUser) setUser(googleUser);
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) setUser(null);
  };

  const handleRefreshUser = async () => {
    setIsLoading(true);
    const refreshedUser = await refreshUser();
    if (refreshedUser) setUser(refreshedUser);
    setIsLoading(false);
  };

  const value = {
    user,
    login: handleLogin,
    register: handleRegister,
    loginWithGoogle: handleGoogleLogin,
    logout: handleLogout,
    isLoading,
    error,
    refreshUser: handleRefreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
