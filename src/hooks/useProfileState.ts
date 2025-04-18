
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
        .from('subscribers')
        .update({
          email: data.email,
          subscription_tier: data.subscription?.tier,
          subscription_end: data.subscription?.expiresAt?.toISOString(),
          subscribed: data.subscription?.active
        })
        .eq('user_id', profile?.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Map the database fields to User interface
      const mappedProfile: User = {
        id: updatedProfile.user_id,
        email: updatedProfile.email,
        name: profile?.name,
        subscription: {
          tier: updatedProfile.subscription_tier as 'Free' | 'Basic' | 'Pro' | 'Enterprise',
          expiresAt: updatedProfile.subscription_end ? new Date(updatedProfile.subscription_end) : new Date(),
          active: !!updatedProfile.subscribed
        },
        generationsLeft: profile?.generationsLeft || 0,
        generatedCourses: profile?.generatedCourses || []
      };

      setProfile(mappedProfile);
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

  // Funcție pentru a decrementa numărul de generări disponibile
  // Returnează success=true dacă operația a reușit
  const decrementGenerationsLeft = async (userId: string): Promise<boolean> => {
    try {
      console.log("Decrementarea generărilor disponibile pentru utilizatorul:", userId);
      
      // Obținem mai întâi datele curente ale abonamentului pentru a afla tier-ul
      const { data: subscriberData, error: getError } = await supabase
        .from('subscribers')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();
      
      if (getError) {
        console.error("Eroare la obținerea datelor abonamentului:", getError);
        return false;
      }
      
      // Actualizăm profilul dacă există
      if (profile) {
        // Verificăm dacă utilizatorul mai are generări disponibile
        if (profile.generationsLeft <= 0) {
          console.warn("Utilizatorul nu mai are generări disponibile");
          return false;
        }
        
        console.log("Decrementare cu succes, generări înainte:", profile.generationsLeft);
        setProfile({
          ...profile,
          generationsLeft: Math.max(0, (profile.generationsLeft || 0) - 1)
        });
        console.log("Generări după decrementare:", Math.max(0, (profile.generationsLeft || 0) - 1));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Eroare la decrementarea generărilor disponibile:", err);
      return false;
    }
  };

  const refreshProfile = async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return null;

      // Changed to let instead of const since we might need to reassign it
      let subscriberData;
      const { data, error: profileError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();
      
      subscriberData = data;

      if (profileError) {
        console.log("Creating new subscriber profile for user:", session.session.user.id);
        // If profile doesn't exist yet (new user), create one with default values
        const { data: newSubscriber, error: insertError } = await supabase
          .from('subscribers')
          .insert({
            user_id: session.session.user.id,
            email: session.session.user.email,
            subscription_tier: 'Free',
            subscribed: false
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        
        // Use the newly created subscriber data
        subscriberData = newSubscriber;
      }

      // Determină numărul de generări disponibile bazat pe tier
      let generationsLeft = 0;
      const tier = subscriberData.subscription_tier as 'Free' | 'Basic' | 'Pro' | 'Enterprise';
      
      // Asigură că fiecare cont are cel puțin o generare disponibilă (pentru Preview)
      switch (tier) {
        case 'Free':
          generationsLeft = 1; // Conturile Free primesc 1 generare pentru Preview
          break;
        case 'Basic':
          generationsLeft = 3;
          break;
        case 'Pro':
          generationsLeft = 10;
          break;
        case 'Enterprise':
          generationsLeft = 30;
          break;
        default:
          generationsLeft = 1; // Valoare implicită pentru siguranță
      }

      // Map the database fields to User interface
      const mappedProfile: User = {
        id: subscriberData.user_id,
        email: subscriberData.email,
        name: session.session.user.user_metadata?.name || subscriberData.email?.split('@')[0] || '',
        subscription: {
          tier: subscriberData.subscription_tier as 'Free' | 'Basic' | 'Pro' | 'Enterprise',
          expiresAt: subscriberData.subscription_end ? new Date(subscriberData.subscription_end) : new Date(),
          active: !!subscriberData.subscribed
        },
        generationsLeft: generationsLeft,
        generatedCourses: []
      };

      setProfile(mappedProfile);
      return mappedProfile;
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
    decrementGenerationsLeft,
    isLoading,
    error
  };
};
