import { useState } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { 
  decrementGenerations, 
  isAdminUser, 
  checkAndResetMonthlyGenerations, 
  getAvailableGenerations,
  calculateInitialGenerations 
} from "@/services/generationsService";

export const useProfileState = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert expiresAt to string if it's a Date object
      const subscriptionEndDate = data.subscription?.expiresAt 
        ? (data.subscription.expiresAt instanceof Date 
            ? data.subscription.expiresAt.toISOString() 
            : data.subscription.expiresAt)
        : undefined;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('subscribers')
        .update({
          email: data.email,
          subscription_tier: data.subscription?.tier,
          subscription_end: subscriptionEndDate,
          subscribed: data.subscription?.active
        })
        .eq('user_id', profile?.id)
        .select()
        .single();

      if (updateError) throw updateError;

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

  const decrementGenerationsLeft = async (userId: string): Promise<boolean> => {
    const isAdmin = await isAdminUser(userId);
    
    if (isAdmin) {
      return true;
    }
    
    const success = await decrementGenerations(userId);
    
    if (success && profile && profile.id === userId) {
      const updatedGenerations = await getAvailableGenerations(userId);
      
      if (updatedGenerations !== null) {
        setProfile({
          ...profile,
          generationsLeft: updatedGenerations
        });
      } else {
        setProfile({
          ...profile,
          generationsLeft: Math.max(0, (profile.generationsLeft || 0) - 1)
        });
      }
    }
    
    return success;
  };

  const refreshProfile = async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return null;

      await checkAndResetMonthlyGenerations(session.session.user.id);

      let subscriberData;
      const { data, error: profileError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();
      
      subscriberData = data;

      if (profileError) {
        console.log("Creating new subscriber profile for user:", session.session.user.id);
        const { data: newSubscriber, error: insertError } = await supabase
          .from('subscribers')
          .insert({
            user_id: session.session.user.id,
            email: session.session.user.email,
            subscription_tier: 'Free',
            subscribed: false,
            generations_left: 1
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        
        subscriberData = newSubscriber;
      }

      const isAdmin = subscriberData.email === 'admin@automator.ro';
      
      const generationsLeft = isAdmin ? 
        999999 : 
        (subscriberData.generations_left ?? calculateInitialGenerations(subscriberData.subscription_tier || 'Free'));
      
      const subscriptionTier = isAdmin ? 'Enterprise' : (subscriberData.subscription_tier as 'Free' | 'Basic' | 'Pro' | 'Enterprise');
      
      const isSubscribed = isAdmin ? true : !!subscriberData.subscribed;

      const mappedProfile: User = {
        id: subscriberData.user_id,
        email: subscriberData.email,
        name: session.session.user.user_metadata?.name || subscriberData.email?.split('@')[0] || '',
        subscription: {
          tier: subscriptionTier,
          expiresAt: subscriberData.subscription_end ? new Date(subscriberData.subscription_end) : new Date(2099, 11, 31),
          active: isSubscribed
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
