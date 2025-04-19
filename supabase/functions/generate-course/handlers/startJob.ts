
import { processJob } from "../helpers/jobProcessor.ts";
import { jobStore } from "../index.ts";
import { mockCourseData } from "../helpers/mockData.ts";
import { v4 as uuidv4 } from "https://deno.land/std@0.167.0/uuid/mod.ts";

export const handleStartJob = async (requestData: any, headers: Record<string, string>) => {
  try {
    // Verificare date formular
    const formData = requestData.formData;
    
    if (!formData) {
      console.error("StartJob - Missing formData in request");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Datele formularului lipsesc"
        }),
        {
          status: 400,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log("StartJob - Procesare cerere cu formData:", JSON.stringify(formData));
    
    // Verificare Claude API Key
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    if (!CLAUDE_API_KEY) {
      console.error("StartJob - Claude API Key is not set");
      
      // Generăm date mock dacă nu avem cheie API
      console.log("StartJob - Generare date mock pentru formular:", JSON.stringify(formData));
      const mockData = mockCourseData(formData);
      const mockJobId = `mock-${Date.now()}-${uuidv4()}`;
      
      jobStore.set(mockJobId, {
        status: 'completed',
        formData,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: mockData
      });
      
      console.log(`StartJob - Job mock creat cu ID: ${mockJobId}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          jobId: mockJobId,
          status: 'completed',
          message: "Date generate în mod mock (cheia API Claude lipsește)"
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Generare ID unic pentru job
    const jobId = `job-${Date.now()}-${uuidv4().substring(0, 8)}`;
    console.log(`StartJob - Job ID generat: ${jobId}`);
    
    // Înregistrare job în store
    jobStore.set(jobId, {
      status: 'processing',
      formData,
      startedAt: new Date().toISOString()
    });
    
    console.log(`StartJob - Job înregistrat în store cu statusul "processing"`);
    
    // Procesare job în background
    processJob(jobId, formData).then(() => {
      console.log(`StartJob - Job ${jobId} a fost preluat pentru procesare`);
    }).catch(error => {
      console.error(`StartJob - Eroare la pornirea procesării pentru job ${jobId}:`, error);
      
      // Actualizare status job în caz de eroare
      jobStore.set(jobId, {
        status: 'error',
        formData,
        startedAt: (jobStore.get(jobId)?.startedAt || new Date().toISOString()),
        completedAt: new Date().toISOString(),
        error: error.message || "Eroare necunoscută la procesarea job-ului"
      });
    });
    
    // Returnare răspuns imediat
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: 'processing',
        message: "Job înregistrat și procesat în background"
      }),
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("StartJob - Eroare:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Eroare la înregistrarea job-ului: ${error.message || 'Unknown error'}`
      }),
      {
        status: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
