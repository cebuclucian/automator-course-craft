
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useUserRefresh } from "@/hooks/useUserRefresh";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>; 
  logout: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void | boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    user,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    loginWithFacebook, 
    logout,
    isLoading,
    error
  } = useAuthMethods();
  
  const { refreshUser } = useUserRefresh();
  
  // Add debugging to track user state changes
  useEffect(() => {
    console.log("AuthContext - User state changed:", user);
    console.log("AuthContext - Is loading:", isLoading);
    console.log("AuthContext - Generated courses count:", user?.generatedCourses?.length || 0);
  }, [user, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        loginWithFacebook,
        logout,
        isLoading,
        error,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Remove the redundant export of AuthContext and useAuth at the end of the file
