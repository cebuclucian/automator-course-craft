import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { handleStartJob } from "./handlers/startJob.ts";
import { handleCheckStatus } from "./handlers/checkStatus.ts";
import { mockCourseData } from "./helpers/mockData.ts";

// Safe retrieval of Claude API key from environment variables
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

// Check and log API key availability for debugging
console.log(`generate-course - CLAUDE_API_KEY is ${CLAUDE_API_KEY ? 'configured' : 'missing'}`);

// In-memory store for tracking jobs (in a production app, would use a database)
export const jobStore = new Map();

// Periodic cleanup of old jobs (to prevent memory leaks)
const cleanupInterval = setInterval(() => {
  // Find jobs older than 24 hours
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  let removedCount = 0;
  
  jobStore.forEach((job, id) => {
    const startedAt = job.startedAt ? new Date(job.startedAt).getTime() : 0;
    if ((now - startedAt) > dayInMs) {
      jobStore.delete(id);
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`Cleanup - ${removedCount} old jobs removed from store`);
  }
}, 60 * 60 * 1000); // Run every hour

// Stop cleanup when function is closed
addEventListener('beforeunload', (ev) => {
  console.log('Edge function shutting down, reason:', ev.detail?.reason);
  clearInterval(cleanupInterval);
});

// Test endpoint for checking connectivity - now improved for debugging
async function handleTestConnection(req) {
  console.log("generate-course - Handle test-connection request");
  const url = new URL(req.url);
  console.log("generate-course - Request URL:", url.toString());
  console.log("generate-course - Path:", url.pathname);
  console.log("generate-course - Headers:", Object.fromEntries(req.headers));
  
  // Check if this is a request for the specific public endpoint
  const isTestConnectionEndpoint = url.pathname.endsWith('/test-connection');
  console.log("generate-course - Is test connection endpoint:", isTestConnectionEndpoint);
  
  // Return detailed information for debugging
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      timestamp: Date.now(),
      apiKeyConfigured: !!CLAUDE_API_KEY,
      jobStoreSize: jobStore.size,
      requestUrl: url.toString(),
      endpoint: "test-connection",
      message: 'Edge Function is running correctly',
      headers: Object.fromEntries(req.headers)
    }), 
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  );
}

// Enhanced minimal endpoint for testing Claude API
async function handleTestClaude(req) {
  try {
    console.log("generate-course - Handle test-claude request");
    const url = new URL(req.url);
    console.log("generate-course - Request URL:", url.toString());
    console.log("generate-course - Path:", url.pathname);
    console.log("generate-course - Headers:", Object.fromEntries(req.headers));
    
    // Check if this is a request for the specific public endpoint
    const isTestClaudeEndpoint = url.pathname.endsWith('/test-claude');
    console.log("generate-course - Is test Claude endpoint:", isTestClaudeEndpoint);
    
    if (!CLAUDE_API_KEY) {
      console.error("generate-course - Claude API key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Claude API Key not configured",
          endpoint: "test-claude",
          requestUrl: url.toString(),
          apiKeyConfigured: false
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
    
    console.log("generate-course - Testing Claude API connection");
    
    // Extract first and last 4 characters of the API key for verification
    const apiKeyFirstFour = CLAUDE_API_KEY.substring(0, 4);
    const apiKeyLastFour = CLAUDE_API_KEY.substring(CLAUDE_API_KEY.length - 4);
    const maskedApiKey = `${apiKeyFirstFour}...${apiKeyLastFour}`;
    
    // Minimal prompt for testing
    const prompt = "Hello! This is a connectivity test. Please respond with 'Test successful!'";
    
    // Direct call to Claude API with minimal prompt
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
      
      console.log("generate-course - Claude API response status:", response.status);
      
      // Check response
      if (!response.ok) {
        const responseText = await response.text();
        console.error("generate-course - Claude API error:", response.status, responseText);
        
        let errorDetails;
        try {
          errorDetails = JSON.parse(responseText);
        } catch (e) {
          errorDetails = { raw: responseText };
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Claude API returned status ${response.status}`,
            details: errorDetails,
            endpoint: "test-claude",
            requestUrl: url.toString(),
            apiKeyConfigured: true,
            apiKeyMasked: maskedApiKey
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
      
      const responseText = await response.text();
      console.log("generate-course - Claude API raw response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("generate-course - Error parsing JSON response:", e);
        data = { raw: responseText };
      }
      
      console.log("generate-course - Claude API parsed response:", data);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Claude API test successful",
          responseContent: data.content?.[0]?.text || "Empty response",
          endpoint: "test-claude",
          requestUrl: url.toString(),
          apiKeyConfigured: true,
          apiKeyMasked: maskedApiKey,
          rawResponse: responseText
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (apiError) {
      console.error("generate-course - Error calling Claude API:", apiError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error calling Claude API: ${apiError.message || "Unknown error"}`,
          stack: apiError.stack,
          endpoint: "test-claude",
          requestUrl: url.toString(),
          apiKeyConfigured: true,
          apiKeyMasked: maskedApiKey
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
  } catch (error) {
    console.error("generate-course - Error in handleTestClaude:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Error testing Claude API: ${error.message || "Unknown error"}`,
        stack: error.stack,
        endpoint: "test-claude"
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

// New endpoint to check environment variables
async function handleCheckEnv(req) {
  try {
    console.log("generate-course - Handling check-env request");
    
    // Check if CLAUDE_API_KEY is set
    const apiKeyConfigured = !!CLAUDE_API_KEY;
    
    // If configured, extract first and last 4 characters
    let apiKeyMasked = null;
    if (apiKeyConfigured && CLAUDE_API_KEY.length >= 8) {
      const apiKeyFirstFour = CLAUDE_API_KEY.substring(0, 4);
      const apiKeyLastFour = CLAUDE_API_KEY.substring(CLAUDE_API_KEY.length - 4);
      apiKeyMasked = `${apiKeyFirstFour}...${apiKeyLastFour}`;
    }
    
    // Check all environment variables available (names only, not values)
    const envVarNames = Object.keys(Deno.env.toObject());
    
    return new Response(
      JSON.stringify({
        success: true,
        apiKeyConfigured,
        apiKeyMasked,
        availableEnvVars: envVarNames,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("generate-course - Error checking environment variables:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Error checking environment variables: ${error.message || "Unknown error"}`,
        timestamp: new Date().toISOString()
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

// New endpoint for checking environment variables
async function handlePublicDebug(req: Request) {
  try {
    console.log("generate-course - Handling public-debug request");
    
    // Get the CLAUDE_API_KEY status (safely)
    const apiKeyConfigured = !!Deno.env.get('CLAUDE_API_KEY');
    let apiKeyMasked = null;
    
    // If configured, extract first and last 4 characters
    const apiKey = Deno.env.get('CLAUDE_API_KEY');
    if (apiKeyConfigured && apiKey && apiKey.length >= 8) {
      const apiKeyFirstFour = apiKey.substring(0, 4);
      const apiKeyLastFour = apiKey.substring(apiKey.length - 4);
      apiKeyMasked = `${apiKeyFirstFour}...${apiKeyLastFour}`;
    }

    // Check all available environment variables (names only)
    const envVarNames = Object.keys(Deno.env.toObject());
    
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Public debug endpoint is working',
        apiKeyConfigured,
        apiKeyMasked,
        availableEnvVars: envVarNames,
        functionUrl: req.url,
        headers: Object.fromEntries(req.headers)
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("Error in public-debug endpoint:", error);
    return new Response(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message || "Unknown error",
        stack: error.stack
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
}

serve(async (req) => {
  // Measure request processing time for debugging
  const requestStartTime = Date.now();
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  console.log(`generate-course - Request received at ${new Date().toISOString()}: ${req.method} ${pathname}`);
  console.log("generate-course - Headers:", JSON.stringify(Array.from(req.headers.entries())));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add the new public debug endpoint
  if (pathname.endsWith('/public-debug')) {
    console.log("generate-course - Handling public-debug request");
    return await handlePublicDebug(req);
  }

  // Enhanced detection of test endpoints
  // Check if URL path contains test-connection or test-claude
  const isTestConnection = pathname.includes('test-connection');
  const isTestClaude = pathname.includes('test-claude');
  
  console.log("generate-course - Checking test endpoints:");
  console.log("  - isTestConnection:", isTestConnection);
  console.log("  - isTestClaude:", isTestClaude);
  
  // Route test endpoints
  if (isTestConnection) {
    console.log("generate-course - Handling test-connection request");
    return await handleTestConnection(req);
  }
  
  if (isTestClaude) {
    console.log("generate-course - Handling test-claude request");
    return await handleTestClaude(req);
  }

  try {
    // Set up timeout to prevent premature termination
    const abortController = new AbortController();
    const signal = abortController.signal;
    const timeout = setTimeout(() => {
      console.error("Edge function timeout limit approaching, attempting to finalize processing");
      abortController.abort();
    }, 28000); // 28 seconds to allow response return before the 30s Edge Function timeout
    
    // Check if Claude API key is configured
    if (!CLAUDE_API_KEY) {
      console.warn("Claude API key is not set! Will generate mock data.");
    }
    
    // Check if request contains valid data
    if (!req.body) {
      console.error("Request body is empty");
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Request body is empty" 
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

    // Parse request data with timeout handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing JSON from request:", parseError);
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request format" 
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
    
    console.log("Generate-course function received requestData:", JSON.stringify(requestData));
    
    // Check which action is requested
    const action = requestData.action || 'start';
    
    let response;
    
    // Process based on requested action
    if (action === 'start') {
      console.log("Processing 'start' action");
      response = await handleStartJob(requestData, corsHeaders);
    } else if (action === 'status') {
      console.log("Processing 'status' action");
      response = await handleCheckStatus(requestData, corsHeaders);
    } else if (action === 'test-connection') {  // Added for compatibility with old calls
      console.log("Processing 'test-connection' action");
      response = await handleTestConnection(req);
    } else if (action === 'test-claude') {  // Added for compatibility with old calls
      console.log("Processing 'test-claude' action");
      response = await handleTestClaude(req);
    } else if (action === 'check-env') {
      console.log("Processing 'check-env' action");
      response = await handleCheckEnv(req);
    } else {
      console.error("Invalid action specified:", action);
      response = new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid action specified" 
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
    
    // Cleanup and log metrics
    clearTimeout(timeout);
    const processingTime = Date.now() - requestStartTime;
    console.log(`generate-course - Request processed in ${processingTime}ms with status ${response.status}`);
    
    return response;
  } catch (error) {
    console.error('Error in generate-course function:', error);
    
    // Backup attempt to provide mock data in case of general error
    try {
      let requestData;
      try {
        requestData = await req.json();
      } catch (jsonError) {
        console.error("Could not extract data from request for fallback:", jsonError);
        requestData = { action: 'unknown' };
      }
      
      console.log("Attempting fallback for request:", JSON.stringify(requestData));
      
      if (requestData.action === 'status') {
        const jobId = requestData.jobId;
        if (jobId) {
          console.log(`Returning error status for job ${jobId}`);
          return new Response(
            JSON.stringify({
              success: true,
              status: 'error',
              error: "Status check error: " + (error.message || "Unknown error")
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
      
      // Attempt to generate mock data to provide the user with something
      const formData = requestData.formData || {};
      console.log("Generating mock data for form:", formData);
      const mockData = mockCourseData(formData);
      
      // Ensure mockData has sections
      if (!mockData.sections || mockData.sections.length === 0) {
        mockData.sections = [
          { 
            type: 'lesson-plan', 
            title: 'Plan de lecție',
            content: `# Emergency lesson plan\n\n## Objectives\n- Understanding basic concepts\n- Developing practical skills`
          },
          { 
            type: 'slides', 
            title: 'Slide-uri prezentare',
            content: `# Emergency presentation\n\n## Introduction\n- This material was generated in emergency mode`
          },
          { 
            type: 'trainer-notes', 
            title: 'Note pentru trainer',
            content: `# Trainer notes\n\n- This material was generated in emergency mode`
          },
          { 
            type: 'exercises', 
            title: 'Exerciții',
            content: `# Exercises\n\n## Emergency exercise\nApply the basic concepts`
          }
        ];
      }
      
      const mockJobId = 'fallback-' + Date.now();
      
      // Save job in store for later checks
      jobStore.set(mockJobId, {
        status: 'completed',
        formData: formData,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: mockData
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: mockData,
          jobId: mockJobId,
          status: 'completed',
          note: "Generated using backup system" 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (fallbackError) {
      console.error("Error in backup mechanism:", fallbackError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Error generating the course: " + (error.message || "Unknown error") 
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
});
