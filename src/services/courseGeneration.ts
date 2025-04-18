
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
      console.error("Authentication error: User not authenticated");
      throw new Error("Utilizator neautentificat");
    }
    
    // Verifică dacă utilizatorul este admin
    const isAdmin = await isAdminUser(userData.user.id);
    console.log("User is admin:", isAdmin);
    
    // Verifică doar limitele de abonament pentru utilizatorii non-admin
    if (!isAdmin) {
      console.log("Checking subscription details for non-admin user");
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
        
      if (subscriberError) {
        console.error("Subscription verification error:", subscriberError);
        throw new Error("Nu am putut verifica detaliile abonamentului.");
      }

      console.log("Subscriber data retrieved:", subscriberData);
    } else {
      console.log("Admin user detected - bypassing subscription checks");
    }
    
    console.log("Calling Supabase Edge Function: generate-course");
    
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        formData,
        action: 'start' 
      },
      // Add a longer timeout to prevent client-side timeout issues
      abortSignal: AbortSignal.timeout(60000), // 60 seconds
    });
    
    console.log("Edge function response received:", result);
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Error from generate-course function:", result.error);
      const errorMessage = typeof result.error === 'object' && result.error !== null && 'message' in result.error 
        ? String(result.error.message) 
        : "Nu am putut genera cursul";
      throw new Error(errorMessage);
    }
    
    const responseData = result as { data?: { success?: boolean, error?: string, data?: any, jobId?: string, status?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API returned an error or invalid response:", responseData.data);
      throw new Error(responseData.data?.error || "Nu am putut genera cursul");
    }
    
    console.log("Course generation job started successfully:", responseData.data);
    
    // Return job information including status and job ID
    const jobId = responseData.data.jobId;
    const status = responseData.data.status || 'processing';
    const mockData = getMockData(formData);
    
    return {
      ...mockData,
      jobId,
      status
    };
  } catch (error: any) {
    console.error("Error in generateCourse:", error);
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
      // Add a longer timeout
      abortSignal: AbortSignal.timeout(30000), // 30 seconds
    });
    
    console.log("Status check response:", result);
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Error checking job status:", result.error);
      throw new Error("Nu am putut verifica statusul generării");
    }
    
    const responseData = result as { data?: { success?: boolean, status?: string, data?: any, error?: string, startedAt?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API returned an error for status check:", responseData.data);
      throw new Error(responseData.data?.error || "Nu am putut verifica statusul generării");
    }
    
    console.log("Job status:", responseData.data.status);
    return {
      ...responseData.data,
      startedAt: responseData.data.startedAt || new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Error checking course generation status:", error);
    throw error;
  }
};
