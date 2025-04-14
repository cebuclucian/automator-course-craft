
import { CourseFormData } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Function to generate course materials using Claude API via Supabase Edge Function
export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  try {
    console.log("Generating course with data:", formData);
    
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
