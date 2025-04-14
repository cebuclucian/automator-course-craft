
import { CourseFormData } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Function to generate course materials using Claude API via Supabase Edge Function
export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  try {
    console.log("Generating course with data:", formData);
    
    // Check user subscription limits
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('subscription, generatedCourses')
        .eq('id', userData.user.id)
        .single();
        
      if (userProfile) {
        const tier = userProfile.subscription?.tier || 'Free';
        const generatedCoursesCount = userProfile.generatedCourses?.length || 0;
        
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
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-course', {
      body: { formData },
    });
    
    if (error) {
      console.error("Error calling generate-course function:", error);
      throw new Error(error.message || "Failed to generate course");
    }
    
    if (!data || !data.success) {
      console.error("API returned an error:", data?.error);
      throw new Error(data?.error || "Failed to generate course");
    }
    
    console.log("Course generated successfully:", data);
    return data.data;
  } catch (error) {
    console.error("Error in generateCourse:", error);
    throw error;
  }
};
