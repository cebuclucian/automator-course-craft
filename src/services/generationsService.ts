
import { supabase } from "@/integrations/supabase/client";

export const calculateInitialGenerations = (tier: string): number => {
  switch (tier) {
    case 'Basic':
      return 3;
    case 'Pro':
      return 10;
    case 'Enterprise':
      return 30;
    default: // Free tier
      return 1;
  }
};

export const decrementGenerations = async (userId: string): Promise<boolean> => {
  try {
    console.log("Decrementarea generărilor disponibile pentru utilizatorul:", userId);
    
    const { data: subscriberData, error: getError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (getError) {
      console.error("Eroare la obținerea datelor abonamentului:", getError);
      return false;
    }
    
    let currentGenerations = subscriberData.generations_left;
    
    if (currentGenerations === undefined || currentGenerations === null) {
      currentGenerations = calculateInitialGenerations(subscriberData.subscription_tier || 'Free');
    }
    
    if (currentGenerations <= 0) {
      console.warn("Utilizatorul nu mai are generări disponibile");
      return false;
    }
    
    const newGenerations = Math.max(0, currentGenerations - 1);
    
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ generations_left: newGenerations })
      .eq('user_id', userId);
      
    if (updateError) {
      console.error("Eroare la actualizarea generărilor disponibile:", updateError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Eroare la decrementarea generărilor disponibile:", err);
    return false;
  }
};
