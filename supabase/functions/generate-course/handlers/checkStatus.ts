
import { corsHeaders } from "../cors.ts";
import { jobStore } from "../index.ts";
import { mockCourseData } from "../helpers/mockData.ts";

// Handle checking job status
export async function handleCheckStatus(requestData, corsHeaders) {
  const { jobId } = requestData;
  
  if (!jobId) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Job ID is missing" 
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
  
  // Get job from store
  const job = jobStore.get(jobId);
  
  if (!job) {
    // If job not found, it might have been cleaned up or never existed
    // For demo purposes, simulate a completed job
    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        data: mockCourseData({ subject: 'Unknown Subject' }),
        message: "Job not found in memory, returning simulated result"
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Return job status and data if completed
  return new Response(
    JSON.stringify({
      success: true,
      status: job.status,
      data: job.status === 'completed' ? job.data : null,
      error: job.error || null,
      message: `Job ${jobId} is ${job.status}`
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
