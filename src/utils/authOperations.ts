
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const login = async (email: string, password: string) => {
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

export const register = async (email: string, password: string, name: string) => {
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

export const loginWithGoogle = async () => {
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

export const logout = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log("No active session found. Cleaning up local state only.");
      toast({
        title: "Deconectare reușită",
        description: "Te-ai deconectat cu succes.",
      });
      return true;
    }
    
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
      title: "Avertisment la deconectare",
      description: "Sesiunea a fost curățată local, dar a apărut o eroare la server.",
      variant: "destructive"
    });
    return true;
  }
};
