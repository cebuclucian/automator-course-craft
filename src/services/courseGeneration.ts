
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
    console.log(`courseGeneration.ts - Using ANON_KEY: ${ANON_KEY.substring(0, 15)}...`);
    
    // First, try using the Supabase SDK
    try {
      console.log("courseGeneration.ts - Attempting to call via Supabase SDK");
      const { data: sdkData, error: sdkError } = await supabase.functions.invoke('generate-course/test-connection');
      
      if (!sdkError) {
        console.log("courseGeneration.ts - Supabase SDK call succeeded:", sdkData);
        return sdkData;
      } else {
        console.error("courseGeneration.ts - Supabase SDK error:", sdkError);
        // We'll continue with direct fetch below
      }
    } catch (sdkErr) {
      console.error("courseGeneration.ts - Supabase SDK exception:", sdkErr);
      // Continue with direct fetch
    }
    
    // Try with Direct fetch as a fallback - with EVERY possible auth header combination
    console.log("courseGeneration.ts - Attempting direct fetch with multiple auth headers");
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${ANON_KEY}`,
        'authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Apikey': ANON_KEY,
        'api-key': ANON_KEY,
        'Api-Key': ANON_KEY,
        'anon-key': ANON_KEY,
        'Anon-Key': ANON_KEY
      }
    });
    
    console.log("courseGeneration.ts - Direct fetch status:", response.status);
    console.log("courseGeneration.ts - Response headers:", Object.fromEntries(response.headers.entries()));
    
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
    
    // First, try the SDK approach
    try {
      console.log("courseGeneration.ts - Attempting Claude test via Supabase SDK");
      const { data: sdkData, error: sdkError } = await supabase.functions.invoke('generate-course/test-claude');
      
      if (!sdkError) {
        console.log("courseGeneration.ts - Claude test via SDK succeeded:", sdkData);
        return sdkData;
      } else {
        console.error("courseGeneration.ts - Claude test via SDK error:", sdkError);
        // We'll continue with direct fetch below
      }
    } catch (sdkErr) {
      console.error("courseGeneration.ts - Claude test via SDK exception:", sdkErr);
      // Continue with direct fetch
    }
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${ANON_KEY}`,
        'authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Apikey': ANON_KEY,
        'api-key': ANON_KEY,
        'Api-Key': ANON_KEY,
        'anon-key': ANON_KEY,
        'Anon-Key': ANON_KEY
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
    
    // First, try the SDK approach
    try {
      console.log("courseGeneration.ts - Attempting diagnosis via Supabase SDK");
      const { data: sdkData, error: sdkError } = await supabase.functions.invoke('generate-course/full-diagnosis');
      
      if (!sdkError) {
        console.log("courseGeneration.ts - Diagnosis via SDK succeeded:", sdkData);
        return sdkData;
      } else {
        console.error("courseGeneration.ts - Diagnosis via SDK error:", sdkError);
        // We'll continue with direct fetch below
      }
    } catch (sdkErr) {
      console.error("courseGeneration.ts - Diagnosis via SDK exception:", sdkErr);
      // Continue with direct fetch
    }
    
    // Try with direct fetch with all possible auth headers
    const response = await fetch(diagnosisUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${ANON_KEY}`,
        'authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Apikey': ANON_KEY,
        'api-key': ANON_KEY,
        'Api-Key': ANON_KEY,
        'anon-key': ANON_KEY,
        'Anon-Key': ANON_KEY
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

// Function to test auth-debug endpoint
export const testAuthDebug = async (): Promise<any> => {
  try {
    console.log("courseGeneration.ts - Testing auth-debug endpoint");
    
    const PROJECT_ID = "ittzxpynkyzcrytyudlt";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHp4cHlua3l6Y3J5dHl1ZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTcwNjcsImV4cCI6MjA2MDE5MzA2N30._NHAy4AFExT03NettnTE4J8SdodAh8nQb_78U1dzKj4";
    const authDebugUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/generate-course/auth-debug`;
    
    console.log(`courseGeneration.ts - Calling auth-debug endpoint: ${authDebugUrl}`);
    
    // Try with direct fetch with all possible auth headers
    const response = await fetch(authDebugUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${ANON_KEY}`,
        'authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Apikey': ANON_KEY,
        'api-key': ANON_KEY,
        'Api-Key': ANON_KEY,
        'anon-key': ANON_KEY,
        'Anon-Key': ANON_KEY
      }
    });
    
    console.log("courseGeneration.ts - Auth debug status:", response.status);
    console.log("courseGeneration.ts - Auth debug headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("courseGeneration.ts - Auth debug error:", response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log("courseGeneration.ts - Auth debug raw response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("courseGeneration.ts - Error parsing JSON for auth debug:", e);
      data = { raw: responseText };
    }
    
    console.log("courseGeneration.ts - Auth debug parsed response:", data);
    return data;
  } catch (error) {
    console.error("courseGeneration.ts - Error testing auth debug:", error);
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
        
        // First, try the Supabase SDK
        try {
          console.log("courseGeneration.ts - Trying course generation via Supabase SDK");
          
          const { data: sdkData, error: sdkError } = await supabase.functions.invoke('generate-course', {
            body: {
              action: 'start',
              formData,
              timestamp: new Date().toISOString(),
              diagnostic: diagnosticInfo
            }
          });
          
          if (!sdkError && sdkData) {
            console.log("courseGeneration.ts - Generation via SDK succeeded:", sdkData);
            return sdkData;
          } else {
            console.error("courseGeneration.ts - SDK generation error:", sdkError);
            // Continue with direct fetch below
          }
        } catch (sdkErr) {
          console.error("courseGeneration.ts - SDK generation exception:", sdkErr);
          // Continue with direct fetch
        }
        
        // Attempt direct fetch with multiple auth headers
        console.log("courseGeneration.ts - Attempting course generation via direct fetch");
        
        const response = await fetch(generateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
            'Authorization': `Bearer ${ANON_KEY}`,
            'authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY,
            'Apikey': ANON_KEY,
            'api-key': ANON_KEY,
            'Api-Key': ANON_KEY,
            'anon-key': ANON_KEY,
            'Anon-Key': ANON_KEY
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
        
        // Try SDK first
        try {
          console.log("courseGeneration.ts - Attempting status check via Supabase SDK");
          const { data: sdkData, error: sdkError } = await supabase.functions.invoke('generate-course', {
            body: {
              action: 'status',
              jobId,
              timestamp: new Date().toISOString(),
              diagnostic: diagnosticInfo
            }
          });
          
          if (!sdkError) {
            console.log("courseGeneration.ts - Status check via SDK succeeded:", sdkData);
            return sdkData;
          } else {
            console.error("courseGeneration.ts - SDK status check error:", sdkError);
            // Continue with direct fetch
          }
        } catch (sdkErr) {
          console.error("courseGeneration.ts - SDK status check exception:", sdkErr);
          // Continue with direct fetch
        }
        
        const response = await fetch(statusUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
            'Authorization': `Bearer ${ANON_KEY}`,
            'authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY,
            'Apikey': ANON_KEY,
            'api-key': ANON_KEY,
            'Api-Key': ANON_KEY,
            'anon-key': ANON_KEY,
            'Anon-Key': ANON_KEY
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
