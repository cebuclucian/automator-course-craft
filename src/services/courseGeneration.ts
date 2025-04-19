
import { CourseFormData } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getMockData } from "./mockDataService";
import { isAdminUser } from "./generationsService";

export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  try {
    console.log("CRITICAL: Începere funcție generateCourse cu datele:", JSON.stringify(formData));
    
    // Verificare autentificare utilizator
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      console.error("CRITICAL: Eroare autentificare: Utilizator neautentificat");
      throw new Error("Utilizator neautentificat");
    }
    
    console.log("CRITICAL: Autentificare utilizator verificată, ID:", userData.user.id);
    
    // Verifică dacă utilizatorul este admin
    const isAdmin = await isAdminUser(userData.user.id);
    console.log("CRITICAL: Utilizator admin:", isAdmin);
    
    // Verifică doar limitele de abonament pentru utilizatorii non-admin
    if (!isAdmin) {
      console.log("CRITICAL: Verificare detalii abonament pentru utilizator non-admin");
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
        
      if (subscriberError) {
        console.error("CRITICAL: Eroare verificare abonament:", subscriberError);
        throw new Error("Nu am putut verifica detaliile abonamentului.");
      }

      console.log("CRITICAL: Date abonat recuperate:", subscriberData);
      console.log("CRITICAL: Generații rămase:", subscriberData.generations_left);
      
      // Verificare explicită pentru generații rămase
      if (subscriberData.generations_left <= 0 && !isAdmin) {
        console.error("CRITICAL: BLOCAJ - Utilizator fără generații rămase");
        throw new Error("Nu mai aveți generări disponibile pentru acest abonament.");
      }
    } else {
      console.log("CRITICAL: Utilizator admin detectat - ocolire verificări abonament");
    }
    
    console.log("CRITICAL: Apelare Edge Function Supabase: generate-course");
    console.log("CRITICAL: Moment apelare API:", new Date().toISOString());
    
    // Apelare edge function cu logging detaliat
    console.log("CRITICAL: Trimitere request cu body:", JSON.stringify({ 
      formData,
      action: 'start' 
    }));
    
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        formData,
        action: 'start' 
      }
    });
    
    console.log("CRITICAL: Răspuns Edge Function primit:", JSON.stringify(result));
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("CRITICAL: Eroare de la funcția generate-course:", result.error);
      const errorMessage = typeof result.error === 'object' && result.error !== null && 'message' in result.error 
        ? String(result.error.message) 
        : "Nu am putut genera cursul";
      throw new Error(errorMessage);
    }
    
    const responseData = result as { data?: { success?: boolean, error?: string, data?: any, jobId?: string, status?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("CRITICAL: API a returnat o eroare sau răspuns invalid:", responseData.data);
      throw new Error(responseData.data?.error || "Nu am putut genera cursul");
    }
    
    console.log("CRITICAL: Job generare curs pornit cu succes:", responseData.data);
    
    // Ne asigurăm că avem un jobId pentru verificarea statusului
    const jobId = responseData.data.jobId;
    if (!jobId) {
      console.error("CRITICAL: Niciun job ID returnat de la API:", responseData.data);
      throw new Error("Eroare sistem: Nu s-a putut obține un ID pentru job");
    }
    
    // Folosim datele mock pentru afișare/stocare inițială în localStorage
    const resultData = responseData.data.data || getMockData(formData);
    
    // Debug date răspuns
    console.log("CRITICAL: Date răspuns generare care vor fi stocate:", resultData);
    
    // Stocare curs generat în localStorage
    const automatorUser = localStorage.getItem('automatorUser');
    if (automatorUser) {
      try {
        const user = JSON.parse(automatorUser);
        const generatedCourses = user.generatedCourses || [];
        
        // Creare nou obiect curs cu gestionare mai bună a datelor
        const newCourse = {
          id: jobId,
          createdAt: new Date().toISOString(), // Stocare ca string ISO pentru consistență
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 zile de acum
          formData,
          sections: resultData.sections || [],
          previewMode: formData.generationType === 'Preview',
          status: responseData.data.status || 'processing',
          jobId
        };
        
        console.log("CRITICAL: Obiect nou curs adăugat în localStorage:", newCourse);
        
        // Adăugare curs nou la cursurile utilizatorului
        user.generatedCourses = [newCourse, ...generatedCourses];
        
        // Salvare date actualizate utilizator în localStorage
        localStorage.setItem('automatorUser', JSON.stringify(user));
        
        console.log("CRITICAL: Date utilizator actualizate stocate în localStorage cu noul curs");
      } catch (error) {
        console.error("CRITICAL: Eroare actualizare localStorage cu noul curs:", error);
      }
    }
    
    // Returnare informații job inclusiv status și job ID
    const status = responseData.data.status || 'processing';
    
    return {
      ...resultData,
      jobId,
      status
    };
  } catch (error: any) {
    console.error("CRITICAL: Eroare în generateCourse:", error);
    throw error;
  }
};

export const checkCourseGenerationStatus = async (jobId: string): Promise<any> => {
  try {
    console.log("Verificare status pentru job:", jobId);
    
    if (!jobId) {
      console.error("ID job lipsă în cererea de verificare status");
      throw new Error("ID job este necesar pentru verificarea statusului");
    }
    
    // Apelare edge function pentru verificare status cu gestionare îmbunătățită a erorilor
    const result = await supabase.functions.invoke('generate-course', {
      body: { 
        action: 'status',
        jobId 
      }
    });
    
    console.log("Răspuns complet verificare status:", JSON.stringify(result, null, 2));
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Eroare verificare status job:", result.error);
      throw new Error("Nu am putut verifica statusul generării");
    }
    
    const responseData = result as { data?: { success?: boolean, status?: string, data?: any, error?: string, startedAt?: string, message?: string } };
    
    if (!responseData.data || !responseData.data.success) {
      console.error("API a returnat o eroare pentru verificare status:", responseData.data);
      throw new Error(responseData.data?.error || "Nu am putut verifica statusul generării");
    }
    
    // Log detalii suplimentare despre răspuns
    console.log("Status job de la API:", responseData.data.status);
    console.log("Date job:", responseData.data.data ? "Prezente" : "Lipsă");
    
    if (responseData.data.message) {
      console.log("Mesaj job:", responseData.data.message);
    }
    
    // Verificare dacă status este completed și actualizare localStorage
    if (responseData.data.status === 'completed') {
      console.log("Job finalizat, actualizare localStorage cu date finale");
      
      const automatorUser = localStorage.getItem('automatorUser');
      if (automatorUser) {
        try {
          const user = JSON.parse(automatorUser);
          const generatedCourses = user.generatedCourses || [];
          
          // Găsire curs cu jobId corespunzător
          const updatedCourses = generatedCourses.map(course => {
            if (course.jobId === jobId) {
              console.log("Curs găsit pentru actualizare în localStorage:", course.id);
              console.log("Date noi curs:", responseData.data.data);
              
              // Verificare și asigurare că avem secțiuni valide
              let sections = course.sections || [];
              if (responseData.data.data?.sections && Array.isArray(responseData.data.data.sections)) {
                sections = responseData.data.data.sections;
                console.log("Secțiuni actualizate din răspunsul API:", sections.length);
              } else {
                console.warn("Secțiuni lipsă sau invalide în răspunsul API");
              }
              
              return {
                ...course,
                status: 'completed',
                sections: sections,
                completedAt: new Date().toISOString()
              };
            }
            return course;
          });
          
          // Actualizare date utilizator în localStorage
          user.generatedCourses = updatedCourses;
          localStorage.setItem('automatorUser', JSON.stringify(user));
          console.log("Status curs actualizat în localStorage la completed");
        } catch (error) {
          console.error("Eroare actualizare status curs în localStorage:", error);
        }
      }
    }
    
    // Validare date dacă este completed
    if (responseData.data.status === 'completed' && 
        responseData.data.data) {
        
      if (!responseData.data.data.sections || responseData.data.data.sections.length === 0) {
        console.warn("Job a returnat structură de date goală sau invalidă:", responseData.data.data);
        // Asigurare structură secțiuni de bază chiar dacă datele lipsesc
        if (responseData.data.data) {
          responseData.data.data.sections = [
            { title: 'Plan de lecție', content: 'Conținut indisponibil', categories: [], type: 'lesson-plan' },
            { title: 'Slide-uri prezentare', content: 'Conținut indisponibil', categories: [], type: 'slides' },
            { title: 'Note trainer', content: 'Conținut indisponibil', categories: [], type: 'trainer-notes' },
            { title: 'Exerciții', content: 'Conținut indisponibil', categories: [], type: 'exercises' }
          ];
        }
      } else {
        console.log("Job a returnat secțiuni valide:", responseData.data.data.sections.length);
      }
    }
    
    // Implementare nouă: forțare refresh listei de materiale după completare
    if (responseData.data.status === 'completed') {
      setTimeout(() => {
        // Acest lucru va determina ca orice component care utilizează localStorage 
        // să se actualizeze (prin adăugarea unui event listener care ascultă pentru 'storage')
        const event = new StorageEvent('storage', {
          key: 'automatorUser',
          newValue: localStorage.getItem('automatorUser')
        });
        window.dispatchEvent(event);
        console.log("Eveniment storage declanșat pentru reîmprospătare UI");
      }, 500);
    }
    
    return {
      ...responseData.data,
      startedAt: responseData.data.startedAt || new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Eroare verificare status generare curs:", error);
    throw error;
  }
};
