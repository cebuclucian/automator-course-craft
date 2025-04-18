
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
    
    // Call the edge function with more detailed logging
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        formData,
        action: 'start' 
      }
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
    
    // Make sure we have a jobId for status checking
    const jobId = responseData.data.jobId;
    if (!jobId) {
      console.error("No job ID returned from API:", responseData.data);
      throw new Error("Eroare sistem: Nu s-a putut obține un ID pentru job");
    }
    
    // Use the mock data for initial display/storage in localStorage
    // This approach allows us to see something immediately while the real data is being generated
    const resultData = responseData.data.data || getMockData(formData);
    
    // Debug the response data
    console.log("Generation response data that will be stored:", resultData);
    
    // Store the generated course in localStorage
    const automatorUser = localStorage.getItem('automatorUser');
    if (automatorUser) {
      try {
        const user = JSON.parse(automatorUser);
        const generatedCourses = user.generatedCourses || [];
        
        // Create a new course object with better date handling
        const newCourse = {
          id: jobId,
          createdAt: new Date().toISOString(), // Store as ISO string for consistency
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          formData,
          sections: resultData.sections || [],
          previewMode: formData.generationType === 'Preview',
          status: responseData.data.status || 'processing',
          jobId
        };
        
        console.log("New course object being added to localStorage:", newCourse);
        
        // Add the new course to the user's courses
        user.generatedCourses = [newCourse, ...generatedCourses];
        
        // Save updated user data to localStorage
        localStorage.setItem('automatorUser', JSON.stringify(user));
        
        console.log("Updated user data stored in localStorage with new course:", newCourse);
      } catch (error) {
        console.error("Error updating localStorage with new course:", error);
      }
    }
    
    // Return job information including status and job ID
    const status = responseData.data.status || 'processing';
    
    return {
      ...resultData,
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
    
    // Call edge function to check status with improved error handling
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        action: 'status',
        jobId 
      }
    });
    
    console.log("Status check full response:", JSON.stringify(result, null, 2));
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Error checking job status:", result.error);
      throw new Error("Nu am putut verifica statusul generării");
    }
    
    const responseData = result as { data?: { success?: boolean, status?: string, data?: any, error?: string, startedAt?: string, message?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API returned an error for status check:", responseData.data);
      throw new Error(responseData.data?.error || "Nu am putut verifica statusul generării");
    }
    
    // Log additional details about the response
    console.log("Job status from API:", responseData.data.status);
    console.log("Job data:", responseData.data.data ? "Present" : "Missing");
    
    if (responseData.data.message) {
      console.log("Job message:", responseData.data.message);
    }
    
    // Check if status is completed and update localStorage
    if (responseData.data.status === 'completed') {
      console.log("Job completed, updating localStorage with final data");
      
      const automatorUser = localStorage.getItem('automatorUser');
      if (automatorUser) {
        try {
          const user = JSON.parse(automatorUser);
          const generatedCourses = user.generatedCourses || [];
          
          // Find the course with matching jobId
          const updatedCourses = generatedCourses.map(course => {
            if (course.jobId === jobId) {
              console.log("Found course to update in localStorage:", course.id);
              return {
                ...course,
                status: 'completed',
                sections: responseData.data.data?.sections || course.sections,
                completedAt: new Date().toISOString()
              };
            }
            return course;
          });
          
          // Update user data in localStorage
          user.generatedCourses = updatedCourses;
          localStorage.setItem('automatorUser', JSON.stringify(user));
          console.log("Updated course status in localStorage to completed");
        } catch (error) {
          console.error("Error updating course status in localStorage:", error);
        }
      }
    }
    
    // Validate data if completed
    if (responseData.data.status === 'completed' && 
        responseData.data.data && 
        (!responseData.data.data.sections || responseData.data.data.sections.length === 0)) {
      console.warn("Job returned empty or invalid data structure:", responseData.data.data);
      // Ensure basic section structure even if data is missing
      if (responseData.data.data) {
        responseData.data.data.sections = responseData.data.data.sections || [
          { title: 'Plan de lecție', content: 'Conținut indisponibil', categories: [], type: 'lesson-plan' },
          { title: 'Slide-uri prezentare', content: 'Conținut indisponibil', categories: [], type: 'slides' },
          { title: 'Note trainer', content: 'Conținut indisponibil', categories: [], type: 'trainer-notes' },
          { title: 'Exerciții', content: 'Conținut indisponibil', categories: [], type: 'exercises' }
        ];
      }
    }
    
    return {
      ...responseData.data,
      startedAt: responseData.data.startedAt || new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Error checking course generation status:", error);
    throw error;
  }
};
