import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const useAuthMethods = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserFromStorage = () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('automatorUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Error loading user from localStorage:", err);
        setError("Eroare la încărcarea datelor utilizatorului");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

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
    user,
    login, 
    register, 
    loginWithGoogle, 
    loginWithGithub, 
    loginWithFacebook, 
    logout,
    isLoading,
    error
  };
};
