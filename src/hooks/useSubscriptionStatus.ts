
import { useState } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useSubscriptionStatus = () => {
  const refreshUser = async (): Promise<User | null> => {
    try {
      const storedUser = localStorage.getItem("automatorUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        if (parsedUser.email === 'admin@automator.ro') {
          console.log("Checking admin subscription status...");
          
          const { data: subscriberData, error } = await supabase
            .from('subscribers')
            .select('*')
            .eq('email', 'admin@automator.ro');
          
          console.log("Subscriber data from DB:", subscriberData);
          console.log("Subscriber error:", error);
          
          if (subscriberData && subscriberData.length > 0 && 
              subscriberData[0].subscription_tier === 'Pro' && 
              subscriberData[0].subscribed) {
            parsedUser.subscription = {
              tier: 'Pro',
              expiresAt: new Date(subscriberData[0].subscription_end),
              active: true
            };
            
            localStorage.setItem("automatorUser", JSON.stringify(parsedUser));
            console.log("Updated user with Pro subscription:", parsedUser);
          }
        }
        
        return parsedUser;
      }
      return null;
    } catch (err) {
      console.error("Error refreshing user data", err);
      return null;
    }
  };

  return { refreshUser };
};
