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

// Keeping the buildPrompt function for reference, but the actual implementation is in the edge function
const buildPrompt = (formData: CourseFormData): string => {
  // Template string from the brief
  let promptTemplate = `# Sistem pentru generarea automată a materialelor de curs fizic și academic

## Configurare inițială
- Limba: {{LIMBA}} (Română/Engleză)
- Subiect curs: {{SUBIECT}} 
- Nivel: {{NIVEL}} (Începător/Intermediar/Avansat)
- Public țintă: {{PUBLICUL_TINTA}} (Elevi/Studenți/Profesori/Profesioniști/Manageri)
- Durată: {{DURATA}} (1 oră/2 ore/4 ore/8 ore/2 zile/3 zile/4 zile/5 zile)
- Ton: {{TON}} (Socratic/Energizant/Haios/Profesional)
- Context: {{CONTEXT}} (Corporativ/Academic)
- Tip generare: {{TIP_GENERARE}} (CAMP ASCUNS: Preview/Complet)`;

  // Replace variables in template
  promptTemplate = promptTemplate
    .replace('{{LIMBA}}', formData.language)
    .replace('{{SUBIECT}}', formData.subject)
    .replace('{{NIVEL}}', formData.level)
    .replace('{{PUBLICUL_TINTA}}', formData.audience)
    .replace('{{DURATA}}', formData.duration)
    .replace('{{TON}}', formData.tone)
    .replace('{{CONTEXT}}', formData.context)
    .replace('{{TIP_GENERARE}}', formData.generationType || 'Preview');

  return promptTemplate;
};

// Keeping the mock data function for reference, but the actual implementation is in the edge function
const mockCourseData = (formData: CourseFormData): any => {
  // Mock data structure that would come from the Claude API
  // Implementation moved to the edge function
  return {};
};
