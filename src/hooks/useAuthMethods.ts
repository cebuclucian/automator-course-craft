
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAuthMethods = () => {
  const { toast } = useToast();

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

  return { login, register, loginWithGoogle, logout };
};
