
import React, { createContext, useContext } from "react";
import { AuthContextType } from "@/types";
import { useSession } from "@/hooks/useSession";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useUserRefresh } from "@/hooks/useUserRefresh";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useSession();
  const { login, register, loginWithGoogle, logout } = useAuthMethods();
  const { refreshUser } = useUserRefresh();

  const value = {
    user,
    login,
    register,
    loginWithGoogle,
    logout,
    isLoading,
    error: null,
    refreshUser: async () => {
      const updatedUser = await refreshUser();
      return !!updatedUser;
    }
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
