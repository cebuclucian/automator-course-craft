
import { CourseFormData } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Function to generate course materials using Claude API via Supabase Edge Function
export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  try {
    console.log("Generating course with data:", formData);
    
    // Check user subscription limits
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      // We need to check the user's subscription details from our auth system
      // Verificăm abonamentul utilizatorului din baza de date
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
        
      if (subscriberError) throw new Error("Nu am putut verifica detaliile abonamentului.");
      
      if (subscriberData) {
        const tier = subscriberData.subscription_tier || 'Free';
        
        // Verificăm dacă utilizatorul are generări disponibile
        let generationsLeft = 0;
        
        switch (tier) {
          case 'Basic':
            generationsLeft = 3;
            break;
          case 'Pro':
            generationsLeft = 10;
            break;
          case 'Enterprise':
            generationsLeft = 30;
            break;
          default: // Free tier
            generationsLeft = 1;
        }
        
        if (generationsLeft <= 0) {
          throw new Error(`Ai atins limita de generări pentru pachetul ${tier}.`);
        }
      }
    }
    
    console.log("Calling Supabase Edge Function: generate-course");
    
    // Call the Supabase Edge Function with timeout handling
    const functionPromise = supabase.functions.invoke('generate-course', {
      body: { formData },
    });
    
    // Set a timeout to handle potential hanging requests - increased from 60s to 180s
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Generarea a durat prea mult. Vă rugăm să încercați din nou.")), 180000); // 180s timeout (3 minute)
    });
    
    // Race between function call and timeout
    const result = await Promise.race([functionPromise, timeoutPromise]);
    
    // Properly type the result and check for errors
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Error from generate-course function:", result.error);
      const errorMessage = typeof result.error === 'object' && result.error !== null && 'message' in result.error 
        ? String(result.error.message) 
        : "Nu am putut genera cursul";
      throw new Error(errorMessage);
    }
    
    // TypeScript will now recognize result as having a data property
    const responseData = result as { data?: { success?: boolean, error?: string, data?: any } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API returned an error:", responseData.data?.error);
      throw new Error(responseData.data?.error || "Nu am putut genera cursul");
    }
    
    console.log("Course generated successfully:", responseData.data);
    return responseData.data.data;
  } catch (error: any) {
    console.error("Error in generateCourse:", error);
    // Display toast error for feedback
    toast({
      title: "Eroare la generarea materialelor",
      description: error.message || "A apărut o eroare neașteptată",
      variant: "destructive"
    });
    throw error;
  }
};
