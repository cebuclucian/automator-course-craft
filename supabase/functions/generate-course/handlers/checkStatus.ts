
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";

export const handleCheckStatus = async (requestData: any, headers: Record<string, string>) => {
  try {
    const jobId = requestData.jobId;
    const diagnosticInfo = requestData.diagnostic || {};
    
    // Log detaliat pentru debugging
    console.log(`CheckStatus - Request primit la ${new Date().toISOString()} pentru jobId: ${jobId || 'undefined'}`);
    console.log(`CheckStatus - Request data:`, JSON.stringify(requestData));
    
    if (!jobId) {
      console.error("CheckStatus - Missing jobId in request");
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID-ul job-ului lipsește din cerere",
          timestamp: new Date().toISOString()
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
    console.log(`CheckStatus - JobStore size: ${jobStore.size}`);
    console.log(`CheckStatus - JobStore keys: ${Array.from(jobStore.keys()).join(', ')}`);
    
    // Verificăm dacă job-ul există în store
    const jobData = jobStore.get(jobId);
    
    if (!jobData) {
      console.error(`CheckStatus - Job ${jobId} nu există în store`);
      
      // Returnăm un status special pentru job-uri care nu există
      return new Response(
        JSON.stringify({
          success: true,
          status: 'not_found',
          message: `Job-ul cu ID ${jobId} nu a fost găsit. Este posibil să fi expirat sau să nu fi fost creat.`,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`CheckStatus - Status curent pentru job ${jobId}: ${jobData.status}, milestone: ${jobData.milestone || 'undefined'}`);
    console.log(`CheckStatus - Job data:`, JSON.stringify(jobData, (key, value) => {
      // Excludem conținutul mare pentru a evita logarea prea mult text
      if (key === 'data' || key === 'sections') {
        return '[Conținut ascuns pentru brevitate]';
      }
      return value;
    }));
    
    // Calculăm timpul scurs și estimăm progresul
    const startTime = jobData.startedAt ? new Date(jobData.startedAt).getTime() : Date.now();
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const lastUpdateTime = jobData.lastUpdated ? new Date(jobData.lastUpdated).getTime() : startTime;
    const secondsSinceLastUpdate = Math.floor((currentTime - lastUpdateTime) / 1000);
    
    // Logăm informații despre timp
    console.log(`CheckStatus - Job ${jobId} a început acum ${elapsedSeconds} secunde`);
    console.log(`CheckStatus - Ultima actualizare acum ${secondsSinceLastUpdate} secunde`);
    
    // Verificăm dacă job-ul pare blocat (fără actualizări recente)
    const MAX_INACTIVE_TIME = 60; // secunde
    let jobBlocked = false;
    
    if (
      jobData.status === 'processing' && 
      secondsSinceLastUpdate > MAX_INACTIVE_TIME && 
      jobData.milestone !== 'api_call_started' && 
      jobData.milestone !== 'api_response_received'
    ) {
      console.warn(`CheckStatus - Posibil job blocat: ${jobId}, fără actualizări de ${secondsSinceLastUpdate} secunde`);
      jobBlocked = true;
    }
    
    // Estimare procentaj progres bazat pe milestone, secțiuni procesate și timp scurs
    let progressPercent = 10; // Default initial progress
    let statusMessage = "Se procesează cererea...";
    
    if (jobData.status === 'completed') {
      progressPercent = 100;
      statusMessage = "Generare finalizată cu succes!";
    } else if (jobData.status === 'error') {
      progressPercent = 100;
      statusMessage = `Eroare: ${jobData.error || 'Necunoscută'}`;
    } else if (jobData.status === 'processing') {
      // Progres bazat pe milestone și secțiuni procesate (dacă există)
      if (jobData.milestone === 'job_created') {
        progressPercent = 10;
        statusMessage = "Job creat, se inițiază procesarea...";
      } else if (jobData.milestone === 'processing_started') {
        progressPercent = 15;
        statusMessage = "Procesare pornită, se pregătește apelul API...";
      } else if (jobData.milestone === 'api_call_started' || 
                jobData.milestone === 'api_call_started_alt' || 
                jobData.milestone === 'api_call_started_emergency') {
        progressPercent = 20;
        statusMessage = "Apel API Claude inițiat, se așteaptă răspunsul...";
      } else if (jobData.milestone === 'api_response_received') {
        progressPercent = 50;
        statusMessage = "Răspuns primit de la API, se procesează conținutul...";
      } else if (jobData.milestone === 'processing_content') {
        progressPercent = 75;
        statusMessage = "Se procesează conținutul generat...";
      } else if (jobData.processedSections && jobData.totalSections) {
        // Calculăm progresul bazat pe secțiunile procesate (45% la 95%)
        const sectionProgress = jobData.processedSections / jobData.totalSections;
        progressPercent = 45 + Math.floor(sectionProgress * 50);
        statusMessage = `Procesare secțiuni: ${jobData.processedSections}/${jobData.totalSections}`;
      } else {
        // Estimare liniară bazată pe timp (până la 90% max pentru processing)
        progressPercent = Math.min(10 + Math.floor(elapsedSeconds / 5), 90);
        
        if (jobBlocked) {
          statusMessage = "Procesare în curs (fără actualizări recente)...";
          // Nu mărim progresul peste 60% dacă job-ul pare blocat
          progressPercent = Math.min(progressPercent, 60);
        } else {
          statusMessage = "Procesare în curs...";
        }
      }
    }
    
    // Construirea răspunsului în funcție de status
    const response = {
      success: true,
      jobId: jobId,
      status: jobData.status,
      startedAt: jobData.startedAt,
      progressPercent,
      elapsedSeconds,
      statusMessage,
      milestone: jobData.milestone || null,
      lastUpdated: jobData.lastUpdated,
      secondsSinceLastUpdate,
      jobBlocked
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
        console.log(`CheckStatus - Job ${jobId} returnat cu ${jobData.sections.length} secțiuni`);
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
      console.log(`CheckStatus - Job ${jobId} returnat cu format vechi de date`);
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
          errorDetails: jobData.errorDetails || null,  // Adăugat pentru diagnosticare
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
    
    // Răspuns standard pentru job-uri în procesare
    console.log(`CheckStatus - Returnare status pentru job ${jobId}: ${jobData.status}, progres: ${progressPercent}%, milestone: ${jobData.milestone || 'undefined'}`);
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
        error: `Eroare verificare status: ${error.message || 'Unknown error'}`,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
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
