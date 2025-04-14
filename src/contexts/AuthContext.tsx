
import React, { createContext, useContext } from "react";
import { AuthContextType } from "@/types";
import { useAuthState } from "@/hooks/useAuthState";
import { login, register, loginWithGoogle, logout } from "@/utils/authOperations";
import { useUserProfile } from "@/hooks/useUserProfile";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, setUser } = useAuthState();
  const { refreshUser: refreshUserProfile } = useUserProfile();

  const refreshUser = async () => {
    const updatedUser = await refreshUserProfile();
    if (updatedUser) {
      setUser(updatedUser);
      return true;
    }
    return false;
  };

  const value = {
    user,
    login,
    register,
    loginWithGoogle,
    logout,
    isLoading,
    error: null,
    refreshUser
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
