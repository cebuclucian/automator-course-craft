
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";
import { buildPrompt } from "../helpers/promptBuilder.ts";
import { processJob } from "../helpers/jobProcessor.ts";
import { mockCourseData } from "../helpers/mockData.ts";

// Handle starting a new job
export async function handleStartJob(requestData, corsHeaders) {
  const { formData } = requestData;
  
  // Verify formData exists
  if (!formData) {
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

  // Generate a unique job ID
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Construct the prompt
  const prompt = buildPrompt(formData);
  
  console.log(`Starting job ${jobId} for subject: ${formData.subject}, duration: ${formData.duration}`);
  
  // Store the job with initial state
  jobStore.set(jobId, {
    status: 'processing',
    formData,
    startedAt: new Date().toISOString(),
  });
  
  // For long-running jobs, start the processing in the background using waitUntil
  const complexJob = formData.duration.includes('zile') || formData.duration.includes('days');
  
  if (complexJob) {
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
    // For simpler jobs, process immediately (but still return mock data quickly)
    EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
    
    // Return mock data immediately
    const mockData = mockCourseData(formData);
    
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
}
