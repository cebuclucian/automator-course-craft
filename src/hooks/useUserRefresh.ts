
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const useUserRefresh = () => {
  const { toast } = useToast();

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
        return mappedUser;
      }
      return null;
    } catch (error) {
      console.error("Error refreshing user:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza datele utilizatorului.",
        variant: "destructive"
      });
      return null;
    }
  };

  return { refreshUser };
};
