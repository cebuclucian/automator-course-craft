import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContextType, User } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Improved refreshUser function to fetch the latest user data
  const refreshUser = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // For admin@automator.ro, check for subscription in DB via Supabase
      const storedUser = localStorage.getItem("automatorUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // If user is admin@automator.ro, check Supabase for Pro subscription
        if (parsedUser.email === 'admin@automator.ro') {
          console.log("Checking admin subscription status...");
          
          // Query the subscribers table to get latest subscription data
          const { data: subscriberData, error } = await supabase
            .from('subscribers')
            .select('*')
            .eq('email', 'admin@automator.ro')
            .single();
          
          console.log("Subscriber data from DB:", subscriberData);
          console.log("Subscriber error:", error);
          
          if (subscriberData && subscriberData.subscription_tier === 'Pro' && subscriberData.subscribed) {
            // Update the user with Pro subscription data from DB
            parsedUser.subscription = {
              tier: 'Pro',
              expiresAt: new Date(subscriberData.subscription_end),
              active: true
            };
            
            // Update localStorage
            localStorage.setItem("automatorUser", JSON.stringify(parsedUser));
            
            console.log("Updated user with Pro subscription:", parsedUser);
          }
        }
        
        setUser(parsedUser);
      }
    } catch (err) {
      console.error("Error refreshing user data", err);
      setError(err instanceof Error ? err.message : "An error occurred while refreshing user data");
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes, using localStorage
  // In a real app, this would connect to an authentication API
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo, just create a user
      const mockUser: User = {
        id: "user123",
        email,
        name: email.split("@")[0],
        subscription: {
          tier: "Free",
          expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          active: true
        },
        generationsLeft: 0,
        generatedCourses: []
      };
      
      setUser(mockUser);
      localStorage.setItem("automatorUser", JSON.stringify(mockUser));
      
      toast({
        title: "Autentificare reușită",
        description: `Bine ai revenit, ${mockUser.name}!`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create a new user
      const mockUser: User = {
        id: "user" + Math.floor(Math.random() * 10000),
        email,
        name,
        subscription: {
          tier: "Free", 
          expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          active: true
        },
        generationsLeft: 0,
        generatedCourses: []
      };
      
      setUser(mockUser);
      localStorage.setItem("automatorUser", JSON.stringify(mockUser));
      
      toast({
        title: "Înregistrare reușită",
        description: `Bine ai venit, ${name}!`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during registration");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock Google authentication API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Create a mock Google user for testing
      const mockGoogleUser: User = {
        id: "google-user-" + Math.floor(Math.random() * 10000),
        email: "demo.user@gmail.com",
        name: "Demo User",
        subscription: {
          tier: "Free",
          expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          active: true
        },
        generationsLeft: 0,
        generatedCourses: [],
        googleAuth: true
      };
      
      setUser(mockGoogleUser);
      localStorage.setItem("automatorUser", JSON.stringify(mockGoogleUser));
      
      toast({
        title: "Autentificare Google reușită",
        description: `Bine ai venit, ${mockGoogleUser.name}!`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during Google authentication");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem("automatorUser");
      setUser(null);
      toast({
        title: "Deconectare reușită",
        description: "Te-ai deconectat cu succes.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during logout");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    register,
    loginWithGoogle,
    logout,
    isLoading,
    error,
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
