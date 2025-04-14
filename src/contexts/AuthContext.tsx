
import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContextType, User } from "@/types";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { login, register, loginWithGoogle, logout, error } = useAuthActions();
  const { refreshUser: refreshSubscriptionStatus } = useSubscriptionStatus();
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem("automatorUser");
        if (storedUser) {
          try {
            // First set the user from localStorage
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Then try to refresh the subscription status if needed
            if (parsedUser.email === 'admin@automator.ro') {
              const refreshedUser = await refreshSubscriptionStatus();
              if (refreshedUser) {
                setUser(refreshedUser);
              }
            }
          } catch (e) {
            console.error("Error parsing stored user", e);
            toast({
              title: "Eroare",
              description: "Eroare la încărcarea datelor utilizatorului.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeUser();
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
    try {
      const refreshedUser = await refreshSubscriptionStatus();
      if (refreshedUser) {
        setUser(refreshedUser);
        console.log("User refreshed successfully:", refreshedUser);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza informațiile utilizatorului.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
