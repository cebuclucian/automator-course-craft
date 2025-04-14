
import React, { createContext, useContext } from "react";
import { User } from "@/types";
import { useProfileState } from "@/hooks/useProfileState";

interface UserProfileContextType {
  profile: User | null;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshProfile: () => Promise<User | null>;
  isLoading: boolean;
  error: string | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, updateProfile, refreshProfile, isLoading, error } = useProfileState();

  const value = {
    profile,
    updateProfile,
    refreshProfile,
    isLoading,
    error
  };

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
