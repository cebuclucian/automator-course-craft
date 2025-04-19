
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";
import { buildPrompt } from "../helpers/promptBuilder.ts";
import { processJob } from "../helpers/jobProcessor.ts";
import { mockCourseData } from "../helpers/mockData.ts";

// Handler for starting a new job
export async function handleStartJob(requestData, corsHeaders) {
  console.log("CRITICAL: startJob handler called with data:", JSON.stringify(requestData));
  
  const { formData } = requestData;
  
  // Check for formData existence
  if (!formData) {
    console.error("CRITICAL: Form data missing in request");
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
    // Log API key configuration
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    console.log(`CRITICAL: Claude API Key configured: ${CLAUDE_API_KEY ? 'Yes' : 'No'}`);
    
    if (!CLAUDE_API_KEY) {
      console.error("CRITICAL: Claude API Key is missing");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API key configuration error" 
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
    
    // Generate unique job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Build prompt - using form language
    const prompt = buildPrompt(formData);
    
    console.log(`CRITICAL: Starting job ${jobId} for subject: ${formData.subject}, duration: ${formData.duration}, language: ${formData.language}`);
    console.log(`CRITICAL: Job ${jobId} prompt length: ${prompt.length} characters`);
    
    // Create mock data with appropriate sections for immediate response
    const mockData = mockCourseData(formData);
    
    // Ensure mockData has appropriate sections
    if (!mockData.sections || mockData.sections.length === 0) {
      console.log(`CRITICAL: Job ${jobId} mock data has no sections, creating default ones`);
      mockData.sections = [
        { 
          type: 'lesson-plan', 
          title: 'Plan de lecție',
          content: `# Plan de lecție: ${formData.subject}\n\n## Obiective\n- Înțelegerea conceptelor de bază\n- Dezvoltarea abilităților practice\n- Aplicarea cunoștințelor în scenarii reale`
        },
        { 
          type: 'slides', 
          title: 'Slide-uri prezentare',
          content: `# Prezentare: ${formData.subject}\n\n## Slide 1: Introducere\n- Despre acest curs\n- Importanța subiectului\n- Ce vom învăța`
        },
        { 
          type: 'trainer-notes', 
          title: 'Note pentru trainer',
          content: `# Note pentru trainer: ${formData.subject}\n\n## Pregătire\n- Asigurați-vă că toate materialele sunt disponibile\n- Verificați echipamentele\n\n## Sfaturi de livrare\n- Începeți cu o activitate de spargere a gheții\n- Folosiți exemple relevante pentru audiență`
        },
        { 
          type: 'exercises', 
          title: 'Exerciții',
          content: `# Exerciții: ${formData.subject}\n\n## Exercițiul 1: Aplicare practică\n**Timp**: 15 minute\n**Materiale**: Fișe de lucru\n\n**Instrucțiuni**:\n1. Împărțiți participanții în grupuri de 3-4 persoane\n2. Distribuiți fișele de lucru\n3. Acordați 10 minute pentru rezolvare\n4. Facilitați o discuție de 5 minute despre soluții`
        }
      ];
    }
    
    // Store job with initial state and mock data
    jobStore.set(jobId, {
      status: 'processing',
      formData,
      data: mockData,
      startedAt: new Date().toISOString(),
      initialDataReturned: true
    });
    
    // Log number of active jobs and their IDs for debugging
    console.log(`CRITICAL: Current active jobs: ${jobStore.size}`);
    console.log(`CRITICAL: Job keys in store: ${[...jobStore.keys()].join(', ')}`);

    // CRITICAL FIX: Check explicitly if Edge Runtime exists before trying to use waitUntil
    const hasEdgeRuntime = typeof EdgeRuntime !== 'undefined';
    console.log(`CRITICAL: Edge Runtime available: ${hasEdgeRuntime}`);
    
    // Use waitUntil to handle async job
    try {
      console.log(`CRITICAL: Attempting to start background processing for job ${jobId}`);
      
      if (hasEdgeRuntime) {
        EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
        console.log(`CRITICAL: Background processing started for job ${jobId} using EdgeRuntime.waitUntil`);
      } else {
        // Fallback if EdgeRuntime isn't available
        console.log(`CRITICAL: EdgeRuntime not available, starting processJob directly`);
        // Start the job but don't wait for result - it will run in background
        processJob(jobId, prompt, formData)
          .then(() => console.log(`CRITICAL: Job ${jobId} processing complete`))
          .catch(err => console.error(`CRITICAL: Error in background job ${jobId} processing:`, err));
      }
    } catch (error) {
      console.error(`CRITICAL: Error starting background processing for job ${jobId}:`, error);
      // CRITICAL FIX: Start job processing directly even if waitUntil fails
      console.log(`CRITICAL: Attempting direct processJob after waitUntil failure`);
      processJob(jobId, prompt, formData)
        .then(() => console.log(`CRITICAL: Direct job ${jobId} processing complete`))
        .catch(err => console.error(`CRITICAL: Error in direct job ${jobId} processing:`, err));
    }
    
    // Return immediately with job ID and mock data
    console.log(`CRITICAL: Job ${jobId} returns immediate mock data with ${mockData.sections?.length || 0} sections`);
    
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        data: mockData,
        status: "processing",
        message: "Job started successfully and will continue processing in background"
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("CRITICAL: Error in startJob handler:", error);
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
