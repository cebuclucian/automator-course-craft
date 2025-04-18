
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";
import { buildPrompt } from "../helpers/promptBuilder.ts";
import { processJob } from "../helpers/jobProcessor.ts";
import { mockCourseData } from "../helpers/mockData.ts";

// Handle starting a new job
export async function handleStartJob(requestData, corsHeaders) {
  console.log("startJob handler called with data:", JSON.stringify(requestData));
  
  const { formData } = requestData;
  
  // Verify formData exists
  if (!formData) {
    console.error("Missing form data in request");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Form data is missing" 
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
    // Generate a unique job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Construct the prompt - this is where language is used
    const prompt = buildPrompt(formData);
    
    console.log(`Starting job ${jobId} for subject: ${formData.subject}, duration: ${formData.duration}, language: ${formData.language}`);
    console.log(`Job ${jobId} prompt length: ${prompt.length} characters`);
    
    // Store the job with initial state
    jobStore.set(jobId, {
      status: 'processing',
      formData,
      startedAt: new Date().toISOString(),
    });
    
    // Log the number of active jobs and their IDs for debugging
    console.log(`Current active jobs: ${jobStore.size}`);
    console.log(`Job keys in store: ${[...jobStore.keys()].join(', ')}`);
    
    // For long-running jobs, start the processing in the background using waitUntil
    const complexJob = formData.duration.includes('zile') || formData.duration.includes('days');
    
    if (complexJob) {
      console.log(`Job ${jobId} identified as complex - processing in background`);
      // Use waitUntil to handle the job asynchronously
      EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
      
      // Return immediately with job ID
      return new Response(
        JSON.stringify({
          success: true,
          jobId,
          message: "Job started successfully and will continue processing in the background",
          status: "processing"
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      console.log(`Job ${jobId} identified as simple - still using background processing`);
      // For simpler jobs, process immediately (but still return mock data quickly)
      EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
      
      // Generate enhanced mock data immediately with proper sections
      const mockData = mockCourseData(formData);
      
      // Asigurăm-ne că mockData are secțiunile necesare
      if (!mockData.sections || mockData.sections.length === 0) {
        mockData.sections = [
          { 
            type: 'lesson-plan', 
            content: `# Plan de lecție: ${formData.subject}\n\n## Obiective\n- Înțelegerea conceptelor de bază\n- Dezvoltarea abilităților practice\n- Aplicarea cunoștințelor în scenarii reale`
          },
          { 
            type: 'slides', 
            content: `# Prezentare: ${formData.subject}\n\n## Slide 1: Introducere\n- Despre acest curs\n- Importanța subiectului\n- Ce vom învăța`
          },
          { 
            type: 'trainer-notes', 
            content: `# Note pentru trainer: ${formData.subject}\n\n## Pregătire\n- Asigurați-vă că toate materialele sunt disponibile\n- Verificați echipamentele\n\n## Sfaturi de livrare\n- Începeți cu o activitate de spargere a gheții\n- Folosiți exemple relevante pentru audiență`
          },
          { 
            type: 'exercises', 
            content: `# Exerciții: ${formData.subject}\n\n## Exercițiul 1: Aplicare practică\n**Timp**: 15 minute\n**Materiale**: Fișe de lucru\n\n**Instrucțiuni**:\n1. Împărțiți participanții în grupuri de 3-4 persoane\n2. Distribuiți fișele de lucru\n3. Acordați 10 minute pentru rezolvare\n4. Facilitați o discuție de 5 minute despre soluții`
          }
        ];
      }
      
      console.log(`Job ${jobId} returning immediate mock data with ${mockData.sections.length} sections`);
      
      // Înregistrăm și jobul cu datele mock inițiale
      const tempJob = jobStore.get(jobId);
      jobStore.set(jobId, {
        ...tempJob,
        data: mockData,
        initialDataReturned: true
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          jobId,
          data: mockData,
          status: "processing"
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error("Error in startJob handler:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
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
