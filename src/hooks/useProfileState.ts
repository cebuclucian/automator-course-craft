
import { useState } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useProfileState = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profile?.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(updatedProfile as User);
      toast({
        title: "Profil actualizat",
        description: "Datele profilului au fost actualizate cu succes."
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la actualizarea profilului";
      setError(message);
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profile as User);
      return profile as User;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la încărcarea profilului";
      setError(message);
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    updateProfile,
    refreshProfile,
    isLoading,
    error
  };
};
