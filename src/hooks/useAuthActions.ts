
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      const mockUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.email?.split("@")[0] || '',
        subscription: {
          tier: "Free",
          expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          active: true
        },
        generationsLeft: 0,
        generatedCourses: []
      };
      
      localStorage.setItem("automatorUser", JSON.stringify(mockUser));
      
      toast({
        title: "Autentificare reușită",
        description: `Bine ai revenit, ${mockUser.name}!`,
      });
      
      return mockUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during login";
      setError(errorMessage);
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) throw authError;
      
      const mockUser: User = {
        id: data.user?.id || "user" + Math.floor(Math.random() * 10000),
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
      
      localStorage.setItem("automatorUser", JSON.stringify(mockUser));
      
      toast({
        title: "Înregistrare reușită",
        description: `Bine ai venit, ${name}!`,
      });
      
      return mockUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during registration";
      setError(errorMessage);
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (authError) throw authError;
      
      // Note: The actual user data will be set in the auth state listener
      // This is just a placeholder for the flow
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
      
      localStorage.setItem("automatorUser", JSON.stringify(mockGoogleUser));
      
      toast({
        title: "Autentificare Google reușită",
        description: `Bine ai venit, ${mockGoogleUser.name}!`,
      });
      
      return mockGoogleUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during Google authentication";
      setError(errorMessage);
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      
      localStorage.removeItem("automatorUser");
      toast({
        title: "Deconectare reușită",
        description: "Te-ai deconectat cu succes.",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during logout";
      setError(errorMessage);
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    loginWithGoogle,
    logout,
    isLoading,
    error
  };
};

