
import { supabase } from "@/integrations/supabase/client";

// Funcție pentru a verifica dacă un utilizator este admin
export const isAdminUser = async (userId: string): Promise<boolean> => {
  try {
    const { data: userData, error } = await supabase
      .from('subscribers')
      .select('email')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("Eroare la verificarea utilizatorului admin:", error);
      return false;
    }
    
    // Verifică dacă e-mailul este cel admin
    return userData?.email === 'admin@automator.ro';
  } catch (err) {
    console.error("Eroare la verificarea utilizatorului admin:", err);
    return false;
  }
};

/**
 * Calculează numărul inițial de generări disponibile în funcție de pachetul de abonament
 * @param tier Nivelul abonamentului (Free, Basic, Pro, Enterprise)
 * @returns Numărul de generări disponibile
 */
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

/**
 * Decrementează numărul de generări disponibile pentru un utilizator
 * @param userId ID-ul utilizatorului
 * @returns true dacă operația a reușit, false în caz contrar
 */
export const decrementGenerations = async (userId: string): Promise<boolean> => {
  try {
    console.log("Decrementarea generărilor disponibile pentru utilizatorul:", userId);
    
    // Verifică dacă utilizatorul este admin
    const isAdmin = await isAdminUser(userId);
    if (isAdmin) {
      console.log("Utilizator admin detectat - nu se decrementează generări");
      return true; // Bypass pentru admin - întotdeauna returnează succes
    }
    
    const { data: subscriberData, error: getError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (getError) {
      console.error("Eroare la obținerea datelor abonamentului:", getError);
      return false;
    }
    
    // Inițializează contorul de generări dacă este null sau nedefinit
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
      .update({ 
        generations_left: newGenerations,
        last_generation_date: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    if (updateError) {
      console.error("Eroare la actualizarea generărilor disponibile:", updateError);
      return false;
    }
    
    console.log(`Generări actualizate pentru utilizator ${userId}: ${currentGenerations} -> ${newGenerations}`);
    return true;
  } catch (err) {
    console.error("Eroare la decrementarea generărilor disponibile:", err);
    return false;
  }
};

/**
 * Verifică dacă utilizatorul trebuie să primească o resetare a generărilor în funcție de luna curentă
 * @param userId ID-ul utilizatorului
 * @returns true dacă s-a făcut resetarea, false în caz contrar sau eroare
 */
export const checkAndResetMonthlyGenerations = async (userId: string): Promise<boolean> => {
  try {
    // Pentru admin nu procesăm resetarea
    const isAdmin = await isAdminUser(userId);
    if (isAdmin) {
      return true;
    }

    const { data: subscriberData, error: getError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (getError) {
      console.error("Eroare la obținerea datelor pentru resetare:", getError);
      return false;
    }

    const lastGenerationDate = subscriberData.last_generation_date ? new Date(subscriberData.last_generation_date) : null;
    const currentDate = new Date();
    
    // Verificăm dacă trebuie să facem resetarea (luna diferită sau fără dată anterioară)
    const needsReset = !lastGenerationDate || 
      lastGenerationDate.getMonth() !== currentDate.getMonth() || 
      lastGenerationDate.getFullYear() !== currentDate.getFullYear();
    
    if (needsReset) {
      console.log(`Resetare generări pentru utilizatorul ${userId} - luna nouă detectată`);
      
      // Obține numărul corect de generări în funcție de abonament
      const newGenerationsCount = calculateInitialGenerations(subscriberData.subscription_tier || 'Free');
      
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({ 
          generations_left: newGenerationsCount
        })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error("Eroare la resetarea generărilor lunare:", updateError);
        return false;
      }
      
      console.log(`Generări resetate pentru utilizator ${userId}: ${newGenerationsCount}`);
      return true;
    }
    
    return false; // Nu a fost nevoie de resetare
  } catch (err) {
    console.error("Eroare la verificarea resetării generărilor:", err);
    return false;
  }
};

/**
 * Obține numărul de generări disponibile pentru un utilizator
 * @param userId ID-ul utilizatorului
 * @returns Numărul de generări disponibile sau null în caz de eroare
 */
export const getAvailableGenerations = async (userId: string): Promise<number | null> => {
  try {
    // Pentru admin returnăm o valoare mare
    const isAdmin = await isAdminUser(userId);
    if (isAdmin) {
      return 999999; // Practic nelimitat pentru admin
    }

    // Verificăm dacă e nevoie de resetare lunară
    await checkAndResetMonthlyGenerations(userId);
    
    const { data: subscriberData, error: getError } = await supabase
      .from('subscribers')
      .select('generations_left, subscription_tier')
      .eq('user_id', userId)
      .single();
    
    if (getError) {
      console.error("Eroare la obținerea generărilor disponibile:", getError);
      return null;
    }
    
    // Dacă nu există încă valoare pentru generări, returnăm valoarea inițială pentru pachetul respectiv
    if (subscriberData.generations_left === null || subscriberData.generations_left === undefined) {
      return calculateInitialGenerations(subscriberData.subscription_tier || 'Free');
    }
    
    return subscriberData.generations_left;
  } catch (err) {
    console.error("Eroare la obținerea generărilor disponibile:", err);
    return null;
  }
};

