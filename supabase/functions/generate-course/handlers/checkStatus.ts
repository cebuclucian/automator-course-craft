
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";

// Handler pentru verificarea statusului unui job
export async function handleCheckStatus(requestData, corsHeaders) {
  console.log("CRITICAL: handler checkStatus apelat cu datele:", JSON.stringify(requestData));
  
  const { jobId } = requestData;
  
  // Verificare existență jobId
  if (!jobId) {
    console.error("CRITICAL: ID job lipsă în cererea de verificare status");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "ID job este necesar" 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  try {
    console.log(`CRITICAL: Verificare status pentru job ${jobId}`);
    console.log(`CRITICAL: Joburi disponibile în store: ${jobStore.size}`);
    console.log(`CRITICAL: Chei job în store: ${Array.from(jobStore.keys()).join(', ')}`);
    
    // Verificare existență job în store
    if (!jobStore.has(jobId)) {
      console.error(`CRITICAL: Job ${jobId} nu există în store`);
      
      return new Response(
        JSON.stringify({ 
          success: true,  // Returnăm succes=true pentru evitarea erorilor în UI
          status: 'completed',  // Considerăm job-ul complet dacă nu îl mai găsim
          message: `Job ${jobId} nu există sau a expirat`,
          jobId,
          data: {
            sections: [
              { 
                type: 'lesson-plan', 
                title: 'Plan de lecție',
                content: `# Job expirat sau indisponibil\n\nNu am putut găsi job-ul solicitat. Este posibil să fi expirat sau să fi fost procesat anterior.`
              }
            ]
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Obținere informații job
    const jobData = jobStore.get(jobId);
    console.log(`CRITICAL: Status job ${jobId}: ${jobData.status}`);
    
    // Asigurăm că job-ul are date structurate corect, chiar dacă sunt goale
    if (!jobData.data) {
      jobData.data = { sections: [] };
    }
    
    if (!jobData.data.sections || !Array.isArray(jobData.data.sections)) {
      jobData.data.sections = [];
    }
    
    // Returnare status și date
    return new Response(
      JSON.stringify({
        success: true,
        status: jobData.status,
        startedAt: jobData.startedAt,
        completedAt: jobData.completedAt,
        error: jobData.error,
        data: jobData.data,
        message: jobData.message
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("CRITICAL: Eroare în handler checkStatus:", error);
    // Returnează un răspuns de eroare, dar cu o structură de date compatibilă pentru frontend
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Eroare internă de server la verificarea statusului",
        status: 'error',
        data: {
          sections: []
        }
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}
