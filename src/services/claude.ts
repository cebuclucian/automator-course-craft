
import { CourseFormData } from "@/types";

// In a real app, this would be a call to an API service
// For our demo purposes, we'll simulate the API call
export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Construct the prompt with variables replaced
  const prompt = buildPrompt(formData);
  
  // In a real application, this would call Claude Haiku API
  // For demo, return a mock response
  return mockCourseData(formData);
};

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

const mockCourseData = (formData: CourseFormData): any => {
  // Mock data structure that would come from the Claude API
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
      }
    ],
    metadata: {
      subject: formData.subject,
      level: formData.level,
      audience: formData.audience,
      duration: formData.duration,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
    }
  };
};
