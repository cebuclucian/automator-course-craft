
import { CourseFormData } from "@/types";

export const getMockData = (formData: CourseFormData) => {
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
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    },
    jobId: null,
    status: 'completed'
  };
};
