
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
      console.error("Login error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Attempting to register user:", { email, name });
      
      // First, check if the email is already registered
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing user:", checkError);
      }
      
      if (existingUser) {
        throw new Error("Acest email este deja înregistrat. Te rugăm să te autentifici.");
      }
      
      // Proceed with registration
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) {
        console.error("Auth error during registration:", authError);
        throw authError;
      }

      console.log("Registration response:", data);
      
      // Verificăm dacă avem un user valid returnat și dacă nu e în email confirmation
      if (!data.user) {
        throw new Error("Nu am putut crea contul. Te rugăm să încerci din nou.");
      }
      
      // Check if email confirmation is required
      if (data.session === null) {
        toast({
          title: "Înregistrare reușită",
          description: "Te rugăm să-ți confirmi adresa de email pentru a continua.",
        });
        return { emailConfirmationRequired: true };
      }
      
      // If no email confirmation is required, proceed with login
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
      console.error("Registration error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Definim originea actuală pentru redirectare
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log("Setting Google redirect to:", redirectTo);
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
        }
      });

      if (authError) {
        console.error("Google auth error:", authError);
        throw authError;
      }
      
      // Returnăm true pentru a indica că procesul a început cu succes
      // Autentificarea efectivă va fi gestionată de redirect
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during Google authentication";
      setError(errorMessage);
      console.error("Google login error:", err);
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
      console.error("Logout error:", err);
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
