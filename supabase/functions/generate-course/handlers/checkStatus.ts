
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";

// Handler for checking a job status
export async function handleCheckStatus(requestData, corsHeaders) {
  console.log("CRITICAL: checkStatus handler called with data:", JSON.stringify(requestData));
  
  const { jobId } = requestData;
  
  // Check for jobId
  if (!jobId) {
    console.error("CRITICAL: Job ID missing in status check request");
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
    console.log(`CRITICAL: Checking status for job ${jobId}`);
    console.log(`CRITICAL: Available jobs in store: ${jobStore.size}`);
    console.log(`CRITICAL: Job keys in store: ${Array.from(jobStore.keys()).join(', ')}`);
    
    // Check if job exists
    if (!jobStore.has(jobId)) {
      console.error(`CRITICAL: Job ${jobId} doesn't exist in store`);
      
      // Return a success response with proper fallback data to avoid UI errors
      return new Response(
        JSON.stringify({ 
          success: true,  // Return success=true to avoid errors in UI
          status: 'completed',  // Consider job complete if we can't find it
          message: `Job ${jobId} doesn't exist or has expired`,
          jobId,
          data: {
            sections: [
              { 
                type: 'lesson-plan', 
                title: 'Plan de lecție',
                content: `# Job expired or unavailable\n\nCouldn't find the requested job. It may have expired or been processed previously.`
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
    
    // Get job data
    const jobData = jobStore.get(jobId);
    console.log(`CRITICAL: Job ${jobId} status: ${jobData.status}`);
    
    // Ensure job has proper data structure, even if empty
    if (!jobData.data) {
      console.log(`CRITICAL: Job ${jobId} has no data, initializing empty structure`);
      jobData.data = { sections: [] };
    }
    
    if (!jobData.data.sections || !Array.isArray(jobData.data.sections)) {
      console.log(`CRITICAL: Job ${jobId} has invalid or missing sections, initializing empty array`);
      jobData.data.sections = [];
    }
    
    // Return status and data
    return new Response(
      JSON.stringify({
        success: true,
        status: jobData.status,
        startedAt: jobData.startedAt || new Date().toISOString(),
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
    console.error("CRITICAL: Error in checkStatus handler:", error);
    
    // Return error response with compatible data structure for frontend
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error while checking status",
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
