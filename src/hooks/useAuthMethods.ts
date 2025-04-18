
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

interface AuthMethodsProps {
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthMethods = ({ setUser, setIsLoading, setError }: AuthMethodsProps) => {
  const { toast } = useToast();

  const getInitialGenerationsCount = (tier: 'Free' | 'Basic' | 'Pro' | 'Enterprise'): number => {
    switch (tier) {
      case 'Basic':
        return 3;
      case 'Pro':
        return 10;
      case 'Enterprise':
        return 30;
      default: // Free tier
        return 1;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log("Login successful, user data:", data.user);
      
      // Calculate subscription expiry date (1 month from now)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      // Create user data with correct subscription tier type
      const userData: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
        subscription: {
          tier: 'Free' as const, // Explicitly typed as literal
          expiresAt: expiryDate,
          active: true
        },
        generationsLeft: getInitialGenerationsCount('Free'),
        generatedCourses: [],
        lastGenerationDate: new Date() // Track when they last generated content
      };
      
      // Update localStorage with user data
      localStorage.setItem('automatorUser', JSON.stringify(userData));
      
      // Update user state in context
      setUser(userData);

      toast({
        title: "Autentificare reușită",
        description: `Bine ai revenit, ${data.user.email}!`,
      });

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      toast({
        title: "Eroare la autentificare",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        try {
          const { error: insertError } = await supabase
            .from('subscribers')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              subscription_tier: 'Free',
              subscribed: false
            });
            
          if (insertError) {
            console.error('Error creating subscriber record:', insertError);
          }
        } catch (err) {
          console.error('Error during subscriber creation:', err);
        }
      }

      toast({
        title: "Înregistrare reușită",
        description: "Contul tău a fost creat cu succes!",
      });

      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Eroare la înregistrare",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Eroare la autentificarea cu Google",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const loginWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('GitHub login error:', error);
      toast({
        title: "Eroare la autentificarea cu GitHub",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const loginWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Facebook login error:', error);
      toast({
        title: "Eroare la autentificarea cu Facebook",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem('automatorUser');
      
      toast({
        title: "Deconectare reușită",
        description: "Te-ai deconectat cu succes.",
      });

      return true;
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Eroare la deconectare",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return { 
    login, 
    register, 
    loginWithGoogle, 
    loginWithGithub, 
    loginWithFacebook, 
    logout
  };
};
