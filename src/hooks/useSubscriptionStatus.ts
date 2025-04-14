
import { useState } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useSubscriptionStatus = () => {
  const { toast } = useToast();
  
  const refreshUser = async (): Promise<User | null> => {
    try {
      const storedUser = localStorage.getItem("automatorUser");
      if (!storedUser) return null;
      
      const parsedUser = JSON.parse(storedUser);
      
      // For admin user, check subscription status from database
      if (parsedUser.email === 'admin@automator.ro') {
        console.log("Checking admin subscription status...");
        
        try {
          const { data: subscriberData, error } = await supabase
            .from('subscribers')
            .select('*')
            .eq('email', 'admin@automator.ro')
            .maybeSingle(); // Using maybeSingle instead of single to avoid errors
          
          console.log("Subscriber data from DB:", subscriberData);
          
          if (error) throw error;
          
          if (subscriberData && 
              subscriberData.subscription_tier === 'Pro' && 
              subscriberData.subscribed) {
            
            // Create a new subscription object with the updated data
            const updatedSubscription = {
              tier: subscriberData.subscription_tier,
              expiresAt: new Date(subscriberData.subscription_end),
              active: true
            };
            
            // Create a new user object with the updated subscription
            const updatedUser = {
              ...parsedUser,
              subscription: updatedSubscription,
              generationsLeft: parsedUser.generationsLeft || 10 // Default to 10 generations for Pro users
            };
            
            // Save the updated user to localStorage
            localStorage.setItem("automatorUser", JSON.stringify(updatedUser));
            console.log("Updated user with Pro subscription:", updatedUser);
            
            return updatedUser;
          }
        } catch (dbError) {
          console.error("Error fetching subscription data:", dbError);
          // Continue with the existing user data instead of failing completely
        }
      }
      
      return parsedUser;
    } catch (err) {
      console.error("Error refreshing user data", err);
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
