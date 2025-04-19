
import { supabase } from '@/integrations/supabase/client';
import { CourseFormData, GenerationType, GeneratedCourse } from '@/types';

// Function for testing Edge Function connectivity
export const testEdgeFunctionConnection = async (): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Testing connection to Edge Function");
    
    // Use direct fetch with full URL for more reliable connection
    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHp4cHlua3l6Y3J5dHl1ZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTcwNjcsImV4cCI6MjA2MDE5MzA2N30._NHAy4AFExT03NettnTE4J8SdodAh8nQb_78U1dzKj4";
    const testUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course/test-connection`;
    
    console.log(`courseGeneration.ts - Calling test endpoint: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    console.log("courseGeneration.ts - Direct fetch status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("courseGeneration.ts - Direct fetch error:", response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log("courseGeneration.ts - Direct fetch raw response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("courseGeneration.ts - Error parsing JSON response:", e);
      data = { raw: responseText };
    }
    
    console.log("courseGeneration.ts - Direct fetch parsed response:", data);
    return data;
  } catch (error) {
    console.error("courseGeneration.ts - Error testing connection:", error);
    throw error;
  }
};

// Function for testing Claude API
export const testClaudeAPI = async (): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Testing Claude API connection");
    
    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHp4cHlua3l6Y3J5dHl1ZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTcwNjcsImV4cCI6MjA2MDE5MzA2N30._NHAy4AFExT03NettnTE4J8SdodAh8nQb_78U1dzKj4";
    const testUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course/test-claude`;
    
    console.log(`courseGeneration.ts - Calling Claude API test endpoint: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    console.log("courseGeneration.ts - Direct fetch for Claude test status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("courseGeneration.ts - Direct fetch for Claude test error:", response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log("courseGeneration.ts - Direct fetch for Claude test raw response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("courseGeneration.ts - Error parsing JSON response for Claude test:", e);
      data = { raw: responseText };
    }
    
    console.log("courseGeneration.ts - Direct fetch for Claude test parsed response:", data);
    return data;
  } catch (error) {
    console.error("courseGeneration.ts - Error testing Claude API:", error);
    throw error;
  }
};

// Full diagnosis function
export const runFullDiagnosis = async (): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Rulare diagnosticare completă");
    
    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHp4cHlua3l6Y3J5dHl1ZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTcwNjcsImV4cCI6MjA2MDE5MzA2N30._NHAy4AFExT03NettnTE4J8SdodAh8nQb_78U1dzKj4";
    const diagnosisUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course/full-diagnosis`;
    
    console.log(`courseGeneration.ts - Apelare endpoint diagnoză completă: ${diagnosisUrl}`);
    
    const response = await fetch(diagnosisUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    console.log("courseGeneration.ts - Status fetch direct pentru diagnoză:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("courseGeneration.ts - Eroare fetch direct pentru diagnoză:", response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log("courseGeneration.ts - Răspuns brut fetch direct pentru diagnoză:", responseText.substring(0, 200) + "...");
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("courseGeneration.ts - Eroare parsare JSON pentru diagnoză:", e);
      data = { raw: responseText.substring(0, 1000) + "..." };
    }
    
    console.log("courseGeneration.ts - Răspuns parsat fetch direct pentru diagnoză:", 
      JSON.stringify(data, (key, value) => {
        if (typeof value === 'string' && value.length > 100) {
          return value.substring(0, 100) + '...';
        }
        return value;
      }));
      
    return data;
  } catch (error) {
    console.error("courseGeneration.ts - Eroare la rularea diagnosticării complete:", error);
    throw error;
  }
};

// Function to generate a course
export const generateCourse = async (formData: CourseFormData): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Inițiere generare curs cu formData:", formData);

    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHp4cHlua3l6Y3J5dHl1ZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTcwNjcsImV4cCI6MjA2MDE5MzA2N30._NHAy4AFExT03NettnTE4J8SdodAh8nQb_78U1dzKj4";
    const generateUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course`;
    
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`courseGeneration.ts - Încercare ${attempt} din ${maxAttempts}`);
        
        const diagnosticInfo = {
          clientTimestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          attemptNumber: attempt
        };
        
        const response = await fetch(generateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
            'Authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY
          },
          body: JSON.stringify({
            action: 'start',
            formData,
            timestamp: new Date().toISOString(),
            diagnostic: diagnosticInfo
          })
        });
        
        console.log(`courseGeneration.ts - Status răspuns (încercare ${attempt}):`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`courseGeneration.ts - Eroare răspuns (încercare ${attempt}):`, response.status, errorText);
          
          lastError = new Error(errorText || `HTTP error ${response.status}`);
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 1000}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          } else {
            throw lastError;
          }
        }
        
        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error(`courseGeneration.ts - Eroare parsare JSON (încercare ${attempt}):`, e);
          console.log(`courseGeneration.ts - Răspuns brut:`, responseText);
          
          lastError = new Error('Răspuns invalid de la server');
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 1000}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          } else {
            throw new Error('Răspuns invalid de la server');
          }
        }
        
        console.log("courseGeneration.ts - Răspuns de la Edge Function:", data);
        
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
    
    throw lastError || new Error('Nu s-a putut genera cursul după mai multe încercări');

  } catch (error) {
    console.error("courseGeneration.ts - Eroare în timpul generării cursului:", error);
    throw error;
  }
};

// Check course generation status
export const checkCourseGenerationStatus = async (jobId: string): Promise<any> => {
  try {
    console.log(`courseGeneration.ts - Verificare status pentru jobId: ${jobId}`);
    
    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHp4cHlua3l6Y3J5dHl1ZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTcwNjcsImV4cCI6MjA2MDE5MzA2N30._NHAy4AFExT03NettnTE4J8SdodAh8nQb_78U1dzKj4";
    const statusUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course`;
    
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`courseGeneration.ts - Verificare status încercare ${attempt} din ${maxAttempts}`);
        
        const diagnosticInfo = {
          clientTimestamp: new Date().toISOString(),
          attemptNumber: attempt
        };
        
        const response = await fetch(statusUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
            'Authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY
          },
          body: JSON.stringify({
            action: 'status',
            jobId,
            timestamp: new Date().toISOString(),
            diagnostic: diagnosticInfo
          })
        });
        
        console.log(`courseGeneration.ts - Status răspuns verificare (încercare ${attempt}):`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`courseGeneration.ts - Eroare răspuns verificare (încercare ${attempt}):`, response.status, errorText);
          
          lastError = new Error(errorText || `HTTP error ${response.status}`);
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 500}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          } else {
            throw lastError;
          }
        }
        
        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error(`courseGeneration.ts - Eroare parsare JSON verificare (încercare ${attempt}):`, e);
          console.log(`courseGeneration.ts - Răspuns brut verificare:`, responseText);
          
          lastError = new Error('Răspuns invalid de la server la verificarea statusului');
          
          if (attempt < maxAttempts) {
            console.log(`courseGeneration.ts - Așteptare ${attempt * 500}ms înainte de reîncercare...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          } else {
            throw new Error('Răspuns invalid de la server la verificarea statusului');
          }
        }
        
        console.log(`courseGeneration.ts - Status job ${jobId}:`, data);
        
        if (data.partialData && data.partialData.sections) {
          console.log(`courseGeneration.ts - Job ${jobId} are secțiuni parțiale: ${data.partialData.sections.length}`);
          data.partialSections = data.partialData.sections;
        }
        
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
    
    throw lastError || new Error('Nu s-a putut verifica statusul după mai multe încercări');
  } catch (error) {
    console.error(`courseGeneration.ts - Eroare la verificarea statusului job ${jobId}:`, error);
    throw error;
  }
};
