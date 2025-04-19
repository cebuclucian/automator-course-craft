
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";

export const handleCheckStatus = async (requestData: any, headers: Record<string, string>) => {
  try {
    const jobId = requestData.jobId;
    
    if (!jobId) {
      console.error("CheckStatus - Missing jobId in request");
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID-ul job-ului lipsește din cerere"
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
    
    console.log(`CheckStatus - Verificare status pentru job: ${jobId}`);
    
    // Verificăm dacă job-ul există în store
    const jobData = jobStore.get(jobId);
    
    if (!jobData) {
      console.error(`CheckStatus - Job ${jobId} nu există în store`);
      
      // Returnăm un status special pentru job-uri care nu există
      return new Response(
        JSON.stringify({
          success: true,
          status: 'not_found',
          message: `Job-ul cu ID ${jobId} nu a fost găsit. Este posibil să fi expirat sau să nu fi fost creat.`
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`CheckStatus - Status curent pentru job ${jobId}: ${jobData.status}`);
    
    // Calculăm timpul scurs și estimăm progresul
    const startTime = jobData.startedAt ? new Date(jobData.startedAt).getTime() : Date.now();
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    
    // Estimare procentaj progres bazat pe milestone, secțiuni procesate și timp scurs
    let progressPercent = 10; // Default initial progress
    
    if (jobData.status === 'completed') {
      progressPercent = 100;
    } else if (jobData.status === 'error') {
      progressPercent = 100;
    } else if (jobData.status === 'processing') {
      // Progres bazat pe milestone și secțiuni procesate (dacă există)
      if (jobData.milestone === 'api_call_started') {
        progressPercent = 20;
      } else if (jobData.milestone === 'api_response_received') {
        progressPercent = 50;
      } else if (jobData.milestone === 'processing_content') {
        progressPercent = 75;
      } else if (jobData.processedSections && jobData.totalSections) {
        // Calculăm progresul bazat pe secțiunile procesate (45% la 95%)
        const sectionProgress = jobData.processedSections / jobData.totalSections;
        progressPercent = 45 + Math.floor(sectionProgress * 50);
      } else {
        // Estimare liniară bazată pe timp (până la 90% max pentru processing)
        progressPercent = Math.min(10 + Math.floor(elapsedSeconds / 5), 90);
      }
    }
    
    // Construirea răspunsului în funcție de status
    const response = {
      success: true,
      jobId: jobId,
      status: jobData.status,
      startedAt: jobData.startedAt,
      progressPercent,
      elapsedSeconds
    };
    
    // Adăugăm informații despre secțiunile procesate, dacă există
    if (jobData.processedSections !== undefined && jobData.totalSections !== undefined) {
      response.processedSections = jobData.processedSections;
      response.totalSections = jobData.totalSections;
    }
    
    // Dacă job-ul este finalizat, includem și datele generate
    if (jobData.status === 'completed') {
      console.log(`CheckStatus - Job ${jobId} este finalizat, returnare date`);
      
      // Pentru versiunea incrementală, verificăm dacă avem date în formatul nou (cu secțiuni multiple)
      if (jobData.processedSections && jobData.sections && Array.isArray(jobData.sections)) {
        return new Response(
          JSON.stringify({
            ...response,
            data: { sections: jobData.sections },
            completedAt: jobData.completedAt
          }),
          {
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // Fallback la formatul vechi
      return new Response(
        JSON.stringify({
          ...response,
          data: jobData.data,
          completedAt: jobData.completedAt
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Dacă job-ul a eșuat, includem eroarea și datele de rezervă (fallback)
    if (jobData.status === 'error') {
      console.log(`CheckStatus - Job ${jobId} a eșuat, returnare eroare și date fallback`);
      return new Response(
        JSON.stringify({
          ...response,
          error: jobData.error,
          data: jobData.data, // Includem datele de rezervă în caz de eroare
          completedAt: jobData.completedAt
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Returnăm secțiunile procesate până acum pentru job-uri în procesare
    if (jobData.sections && Array.isArray(jobData.sections) && jobData.sections.length > 0) {
      console.log(`CheckStatus - Job ${jobId} în procesare, returnare secțiuni parțiale (${jobData.sections.length})`);
      response.partialData = { sections: jobData.sections };
    }
    
    // Adăugăm milestone și ultimul update pentru job-uri în procesare
    if (jobData.milestone) {
      response.milestone = jobData.milestone;
    }
    
    if (jobData.lastUpdated) {
      response.lastUpdated = jobData.lastUpdated;
    }
    
    // Răspuns standard pentru job-uri în procesare
    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("CheckStatus - Eroare:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Eroare verificare status: ${error.message || 'Unknown error'}`
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
