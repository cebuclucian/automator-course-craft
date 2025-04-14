
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
      // Since we're using a mock auth system in this demo, we'll retrieve the user from localStorage
      const storedUserData = localStorage.getItem("automatorUser");
      let userProfile = null;
      
      if (storedUserData) {
        userProfile = JSON.parse(storedUserData);
        const tier = userProfile?.subscription?.tier || 'Free';
        const generatedCoursesCount = userProfile?.generatedCourses?.length || 0;
        
        let maxCourses = 1; // Default for Free tier
        
        switch (tier) {
          case 'Basic':
            maxCourses = 3;
            break;
          case 'Pro':
            maxCourses = 10;
            break;
          case 'Enterprise':
            maxCourses = 30;
            break;
        }
        
        if (generatedCoursesCount >= maxCourses) {
          throw new Error(`Ai atins limita de ${maxCourses} materiale pentru pachetul ${tier}.`);
        }
      }
    }
    
    console.log("Calling Supabase Edge Function: generate-course");
    
    // Call the Supabase Edge Function with timeout handling
    const functionPromise = supabase.functions.invoke('generate-course', {
      body: { formData },
    });
    
    // Set a timeout to handle potential hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Generarea a durat prea mult. Vă rugăm să încercați din nou.")), 60000); // 60s timeout
    });
    
    // Race between function call and timeout
    const result = await Promise.race([functionPromise, timeoutPromise]);
    
    if ('error' in result && result.error) {
      console.error("Error from generate-course function:", result.error);
      throw new Error(result.error.message || "Nu am putut genera cursul");
    }
    
    const { data } = result;
    
    if (!data || !data.success) {
      console.error("API returned an error:", data?.error);
      throw new Error(data?.error || "Nu am putut genera cursul");
    }
    
    console.log("Course generated successfully:", data);
    return data.data;
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
