
import React, { createContext, useState, useContext, useEffect } from "react";
import { AuthContextType, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");
        setSession(currentSession);
        if (currentSession?.user) {
          const mappedUser: User = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.email?.split('@')[0] || '',
            subscription: {
              tier: 'Free',
              expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
              active: true
            },
            generationsLeft: 0,
            generatedCourses: []
          };
          setUser(mappedUser);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Session exists" : "No session");
      setSession(currentSession);
      if (currentSession?.user) {
        const mappedUser: User = {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          name: currentSession.user.email?.split('@')[0] || '',
          subscription: {
            tier: 'Free',
            expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            active: true
          },
          generationsLeft: 0,
          generatedCourses: []
        };
        setUser(mappedUser);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
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
      toast({
        title: "Eroare la autentificare",
        description: error.message,
        variant: "destructive"
      });
      return false;
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

  const logout = async () => {
    try {
      // Check if we have a session before attempting to sign out
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log("No active session found. Cleaning up local state only.");
        // If no session, just clear the local state
        setUser(null);
        setSession(null);
        
        toast({
          title: "Deconectare reușită",
          description: "Te-ai deconectat cu succes.",
        });
        
        return true;
      }
      
      // If we have a session, proceed with sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);

      toast({
        title: "Deconectare reușită",
        description: "Te-ai deconectat cu succes.",
      });

      return true;
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, clean up the local state
      setUser(null);
      setSession(null);
      
      toast({
        title: "Avertisment la deconectare",
        description: "Sesiunea a fost curățată local, dar a apărut o eroare la server.",
        variant: "warning"
      });
      
      return true; // Return true anyway as we've cleaned up locally
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const mappedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || '',
          subscription: {
            tier: 'Free',
            expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            active: true
          },
          generationsLeft: 0,
          generatedCourses: []
        };
        setUser(mappedUser);
      }
      return true;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return false;
    }
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
