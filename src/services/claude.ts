
import { CourseFormData } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    
    // Now we're using a different approach for lengthy generations
    // Initial call just starts the process and returns a job ID
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        formData,
        action: 'start' 
      },
    });
    
    // Check for errors in the response
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Error from generate-course function:", result.error);
      const errorMessage = typeof result.error === 'object' && result.error !== null && 'message' in result.error 
        ? String(result.error.message) 
        : "Nu am putut genera cursul";
      throw new Error(errorMessage);
    }
    
    // TypeScript will now recognize result as having a data property
    const responseData = result as { data?: { success?: boolean, error?: string, data?: any, jobId?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API returned an error:", responseData.data?.error);
      throw new Error(responseData.data?.error || "Nu am putut genera cursul");
    }
    
    console.log("Course generation job started successfully:", responseData.data);
    
    // Return mock data for immediate display while the actual generation happens in background
    // Include the jobId for checking status later
    const mockData = getMockData(formData);
    mockData.jobId = responseData.data.jobId;
    mockData.status = 'processing';
    
    return mockData;
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

// Function to check the status of a course generation job
export const checkCourseGenerationStatus = async (jobId: string): Promise<any> => {
  try {
    console.log("Checking status for job:", jobId);
    
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        action: 'status',
        jobId 
      },
    });
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Error checking job status:", result.error);
      throw new Error("Nu am putut verifica statusul generării");
    }
    
    const responseData = result as { data?: { success?: boolean, status?: string, data?: any, error?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API returned an error:", responseData.data?.error);
      throw new Error(responseData.data?.error || "Nu am putut verifica statusul generării");
    }
    
    return responseData.data;
  } catch (error: any) {
    console.error("Error checking course generation status:", error);
    throw error;
  }
};

// Helper function to get mock data for immediate display
const getMockData = (formData: CourseFormData) => {
  // This mock data structure mimics what would come from the Claude API
  const isPreview = formData.generationType !== 'Complet';
  
  return {
    sections: [
      {
        title: "Plan și obiective",
        content: `Plan de curs pentru ${formData.subject}`,
        categories: [
          {
            name: "Obiective de învățare",
            content: isPreview 
              ? "Aceasta este o versiune preview a obiectivelor de învățare. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\n1. Înțelegerea conceptelor de bază\n2. Dezvoltarea abilităților practice" 
              : "Lista completă a obiectivelor de învățare pentru acest curs...\n\n1. Înțelegerea conceptelor de bază\n2. Dezvoltarea abilităților practice\n3. Aplicarea cunoștințelor în situații reale\n4. Evaluarea și îmbunătățirea performanței"
          },
          {
            name: "Structura cursului",
            content: isPreview 
              ? "Aceasta este o versiune preview a structurii cursului. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nModulul 1: Introducere\nModulul 2: Concepte fundamentale" 
              : "Structura completă a cursului...\n\nModulul 1: Introducere\nModulul 2: Concepte fundamentale\nModulul 3: Aplicații practice\nModulul 4: Studii de caz\nModulul 5: Evaluare și feedback"
          }
        ]
      },
      {
        title: "Materiale trainer",
        content: `Materiale pentru trainer pe tema ${formData.subject}`,
        categories: [
          {
            name: "Ghid trainer",
            content: isPreview 
              ? "Aceasta este o versiune preview a ghidului pentru trainer. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nIntroducere:\nAcest curs este conceput pentru a fi interactiv și practic." 
              : "Ghidul complet pentru trainer...\n\nIntroducere:\nAcest curs este conceput pentru a fi interactiv și practic.\n\nMetodologie:\nUtilizați o combinație de prezentări, discuții și exerciții practice.\n\nSugestii de facilitare:\n1. Începeți cu un exercițiu de spargere a gheții\n2. Încurajați participarea activă\n3. Utilizați exemple relevante pentru domeniul participanților"
          },
          {
            name: "Note de prezentare",
            content: isPreview 
              ? "Aceasta este o versiunea preview a notelor de prezentare. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nSlide 1: Introducere\nPrezentați-vă și stabiliți obiectivele cursului." 
              : "Notele complete de prezentare pentru fiecare slide...\n\nSlide 1: Introducere\nPrezentați-vă și stabiliți obiectivele cursului.\n\nSlide 2: Agenda\nPrezentați pe scurt structura zilei și ce vor învăța participanții.\n\nSlide 3: Concepte cheie\nExplicați conceptele fundamentale cu exemple concrete din industria relevantă."
          }
        ]
      },
      {
        title: "Materiale suport",
        content: `Materiale suport pentru ${formData.subject}`,
        categories: [
          {
            name: "Handout-uri",
            content: isPreview 
              ? "Aceasta este o versiune preview a handout-urilor. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nHandout 1: Principiile de bază\nO prezentare concisă a conceptelor fundamentale." 
              : "Handout-urile complete pentru acest curs...\n\nHandout 1: Principiile de bază\nO prezentare concisă a conceptelor fundamentale.\n\nHandout 2: Exerciții practice\nExerciții și activități pentru a practica conceptele învățate.\n\nHandout 3: Resurse adiționale\nO listă de resurse pentru studiu individual și aprofundare."
          },
          {
            name: "Exerciții",
            content: isPreview 
              ? "Aceasta este o versiune preview a exercițiilor. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nExercițiul 1: Analiză de caz\nStudiați următorul scenariu și identificați conceptele cheie aplicate." 
              : "Exercițiile complete pentru acest curs...\n\nExercițiul 1: Analiză de caz\nStudiați următorul scenariu și identificați conceptele cheie aplicate.\n\nExercițiul 2: Simulare practică\nLucrați în echipe pentru a aplica conceptele învățate într-o simulare realistă.\n\nExercițiul 3: Dezbatere\nOrganizați o dezbatere pe tema [subiect controversat relevant] utilizând argumentele bazate pe conceptele învățate."
          }
        ]
      }
    ],
    metadata: {
      subject: formData.subject,
      level: formData.level,
      audience: formData.audience,
      duration: formData.duration,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
    },
    jobId: null, // Add default jobId property
    status: 'completed' // Add default status property
  };
};
