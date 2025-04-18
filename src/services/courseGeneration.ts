
import { CourseFormData } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getMockData } from "./mockDataService";
import { isAdminUser } from "./generationsService";

export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  try {
    console.log("Generating course with data:", formData);
    
    // Check user authentication
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error("Utilizator neautentificat");
    }
    
    // Verifică dacă utilizatorul este admin
    const isAdmin = await isAdminUser(userData.user.id);
    
    // Verifică doar limitele de abonament pentru utilizatorii non-admin
    if (!isAdmin) {
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
        
      if (subscriberError) throw new Error("Nu am putut verifica detaliile abonamentului.");
    } else {
      console.log("Admin user detected - bypassing subscription checks");
    }
    
    console.log("Calling Supabase Edge Function: generate-course");
    
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        formData,
        action: 'start' 
      },
    });
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Error from generate-course function:", result.error);
      const errorMessage = typeof result.error === 'object' && result.error !== null && 'message' in result.error 
        ? String(result.error.message) 
        : "Nu am putut genera cursul";
      throw new Error(errorMessage);
    }
    
    const responseData = result as { data?: { success?: boolean, error?: string, data?: any, jobId?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API returned an error:", responseData.data?.error);
      throw new Error(responseData.data?.error || "Nu am putut genera cursul");
    }
    
    console.log("Course generation job started successfully:", responseData.data);
    
    // Get mock data for immediate display while actual generation happens
    const mockData = getMockData(formData);
    mockData.jobId = responseData.data.jobId;
    mockData.status = 'processing';
    
    return mockData;
  } catch (error: any) {
    console.error("Error in generateCourse:", error);
    toast({
      title: "Eroare la generarea materialelor",
      description: error.message || "A apărut o eroare neașteptată",
      variant: "destructive"
    });
    throw error;
  }
};

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
