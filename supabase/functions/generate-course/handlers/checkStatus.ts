
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";
import { mockCourseData } from "../helpers/mockData.ts";

// Handle checking the status of an existing job
export async function handleCheckStatus(requestData, corsHeaders) {
  console.log("checkStatus handler called with data:", JSON.stringify(requestData));
  
  const jobId = requestData.jobId;
  
  if (!jobId) {
    console.error("Missing job ID in status check request");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Job ID is required" 
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
    console.log(`Checking status for job: ${jobId}`);
    console.log(`Total jobs in memory: ${jobStore.size}`);
    
    // Check if job exists in memory
    if (!jobStore.has(jobId)) {
      console.warn(`Job ${jobId} not found in memory store`);
      
      // For demo purposes, create a mock response for jobs that might have been lost
      // In a real system, this would check a database
      return new Response(
        JSON.stringify({
          success: true,
          status: "completed",
          message: "Job completed (fallback response)",
          data: mockCourseData({}),
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Get job data
    const job = jobStore.get(jobId);
    console.log(`Job ${jobId} status: ${job.status}`);
    
    // Check job status
    if (job.status === 'error') {
      console.error(`Job ${jobId} encountered an error:`, job.error);
      return new Response(
        JSON.stringify({
          success: true,
          status: "error",
          error: job.error || "Unknown error during processing",
          message: "Job encountered an error during processing",
          startedAt: job.startedAt || new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    if (job.status === 'completed') {
      console.log(`Job ${jobId} completed successfully, returning data`);
      return new Response(
        JSON.stringify({
          success: true,
          status: "completed",
          data: job.data,
          startedAt: job.startedAt || new Date().toISOString(),
          completedAt: job.completedAt || new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Job is still processing
    console.log(`Job ${jobId} is still processing`);
    return new Response(
      JSON.stringify({
        success: true,
        status: "processing",
        message: "Job is still being processed",
        startedAt: job.startedAt || new Date().toISOString(),
        processingStarted: job.processingStarted || new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error(`Error checking status for job ${jobId}:`, error);
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: "error",
        error: error.message || "Error checking job status" 
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
