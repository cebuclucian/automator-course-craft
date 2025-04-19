
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
    
    // Construirea răspunsului în funcție de status
    const response = {
      success: true,
      jobId: jobId,
      status: jobData.status,
      startedAt: jobData.startedAt
    };
    
    // Dacă job-ul este finalizat, includem și datele generate
    if (jobData.status === 'completed') {
      console.log(`CheckStatus - Job ${jobId} este finalizat, returnare date`);
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
    
    // Dacă job-ul a eșuat, includem eroarea
    if (jobData.status === 'error') {
      console.log(`CheckStatus - Job ${jobId} a eșuat, returnare eroare`);
      return new Response(
        JSON.stringify({
          ...response,
          error: jobData.error
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
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
