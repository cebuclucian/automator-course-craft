
import { supabase } from '@/integrations/supabase/client';
import { CourseFormData, GenerationType, GeneratedCourse } from '@/types';
import { UUID } from 'crypto';

// Funcție pentru testarea conectivității Edge Function
export const testEdgeFunctionConnection = async (): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Testare conexiune Edge Function");
    
    // URL complet pentru endpoint-ul de test
    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const testUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course/test-connection`;
    
    console.log(`courseGeneration.ts - Apelare endpoint test: ${testUrl}`);
    
    // Prima dată încercăm cu invoke standard
    try {
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: { action: 'test-connection' }
      });
      
      if (error) {
        console.log("courseGeneration.ts - Eroare invoke standard:", error);
        throw error;
      }
      
      console.log("courseGeneration.ts - Succes invoke standard:", data);
      return data;
    } catch (invokeError) {
      console.log("courseGeneration.ts - Încercare direct cu fetch:", invokeError);
      
      // Backup: încercăm cu fetch direct
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("courseGeneration.ts - Eroare fetch:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("courseGeneration.ts - Răspuns fetch direct:", data);
      return data;
    }
  } catch (error) {
    console.error("courseGeneration.ts - Error testing connection:", error);
    throw error;
  }
};

// Funcție pentru testarea API Claude
export const testClaudeAPI = async (): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Testare conexiune API Claude");
    
    // URL complet pentru endpoint-ul de test Claude
    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const testUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course/test-claude`;
    
    console.log(`courseGeneration.ts - Apelare endpoint test Claude: ${testUrl}`);
    
    // Prima dată încercăm cu invoke standard
    try {
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: { action: 'test-claude' }
      });
      
      if (error) {
        console.log("courseGeneration.ts - Eroare invoke standard pentru Claude:", error);
        throw error;
      }
      
      console.log("courseGeneration.ts - Succes invoke standard pentru Claude:", data);
      return data;
    } catch (invokeError) {
      console.log("courseGeneration.ts - Încercare direct cu fetch pentru Claude:", invokeError);
      
      // Backup: încercăm cu fetch direct
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("courseGeneration.ts - Eroare fetch Claude:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("courseGeneration.ts - Răspuns fetch direct Claude:", data);
      return data;
    }
  } catch (error) {
    console.error("courseGeneration.ts - Error testing Claude API:", error);
    throw error;
  }
};

// Funcție pentru a genera un curs cu text
export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Inițiere generare curs cu formData:", formData);

    // Apelare Edge Function pentru generare curs
    console.log("courseGeneration.ts - Invocare Edge Function generate-course");
    
    // Adăugăm retry pentru robustețe
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`courseGeneration.ts - Încercare ${attempt} din ${maxAttempts}`);
        
        const { data, error } = await supabase.functions.invoke('generate-course', {
          body: { 
            action: 'start',
            formData,
            timestamp: new Date().toISOString() // Pentru a preveni caching-ul
          }
        });
        
        console.log("courseGeneration.ts - Răspuns de la Edge Function:", data);
        
        if (error) {
          console.error(`courseGeneration.ts - Eroare Edge Function (încercare ${attempt}):`, error);
          lastError = error;
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 1000}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          } else {
            throw error;
          }
        }
        
        if (!data || !data.success) {
          const errorMessage = data?.error || 'Răspuns invalid de la server';
          console.error(`courseGeneration.ts - Răspuns de eroare (încercare ${attempt}):`, errorMessage);
          
          lastError = new Error(errorMessage);
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 1000}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          } else {
            throw new Error(errorMessage);
          }
        }
        
        // Răspuns de succes
        return {
          jobId: data.jobId,
          status: data.status || 'processing',
          data: data.data
        };
      } catch (requestError: any) {
        console.error(`courseGeneration.ts - Eroare request (încercare ${attempt}):`, requestError);
        lastError = requestError;
        
        if (attempt < maxAttempts) {
          console.log(`courseGeneration.ts - Așteptare ${attempt * 1000}ms înainte de reîncercare...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }
    
    // Dacă am ajuns aici, toate încercările au eșuat
    throw lastError || new Error('Nu s-a putut genera cursul după mai multe încercări');

  } catch (error) {
    console.error("courseGeneration.ts - Eroare în timpul generării cursului:", error);
    throw error;
  }
};

// Verificare status job
export const checkCourseGenerationStatus = async (jobId: string): Promise<any> => {
  try {
    console.log(`courseGeneration.ts - Verificare status pentru jobId: ${jobId}`);
    
    // Adăugăm retry pentru robustețe
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`courseGeneration.ts - Verificare status încercare ${attempt} din ${maxAttempts}`);
        
        const { data, error } = await supabase.functions.invoke('generate-course', {
          body: { 
            action: 'status',
            jobId,
            timestamp: new Date().toISOString() // Pentru a preveni caching-ul
          }
        });
        
        if (error) {
          console.error(`courseGeneration.ts - Eroare Edge Function la verificare status (încercare ${attempt}):`, error);
          lastError = error;
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 500}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          } else {
            throw error;
          }
        }
        
        if (!data) {
          const errorMessage = 'Răspuns gol de la server la verificarea statusului';
          console.error(`courseGeneration.ts - ${errorMessage} (încercare ${attempt})`);
          
          lastError = new Error(errorMessage);
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 500}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          } else {
            throw new Error(errorMessage);
          }
        }
        
        console.log(`courseGeneration.ts - Status job ${jobId}:`, data);
        return data;
      } catch (requestError: any) {
        console.error(`courseGeneration.ts - Eroare request la verificare status (încercare ${attempt}):`, requestError);
        lastError = requestError;
        
        if (attempt < maxAttempts) {
          console.log(`courseGeneration.ts - Așteptare ${attempt * 500}ms înainte de reîncercare...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
          continue;
        }
      }
    }
    
    // Dacă am ajuns aici, toate încercările au eșuat
    throw lastError || new Error('Nu s-a putut verifica statusul după mai multe încercări');
  } catch (error) {
    console.error(`courseGeneration.ts - Eroare la verificarea statusului job ${jobId}:`, error);
    throw error;
  }
};
