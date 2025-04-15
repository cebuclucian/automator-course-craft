
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "./cors.ts";
import { handleStartJob } from "./handlers/startJob.ts";
import { handleCheckStatus } from "./handlers/checkStatus.ts";
import { mockCourseData } from "./helpers/mockData.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

// In-memory store for job tracking (in a production app, this would use a database)
export const jobStore = new Map();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verifică dacă cheia API Claude este configurată
    if (!CLAUDE_API_KEY) {
      console.error("Claude API Key is not set!");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Claude API Key is not configured" 
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
    
    // Verifică dacă cererea conține date valide
    if (!req.body) {
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

    const requestData = await req.json();
    
    // Check what action is requested
    const action = requestData.action || 'start';
    
    if (action === 'start') {
      return handleStartJob(requestData, corsHeaders);
    } else if (action === 'status') {
      return handleCheckStatus(requestData, corsHeaders);
    } else {
      return new Response(
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
  } catch (error) {
    console.error('Error in generate-course function:', error);
    
    // Try to provide mock data in case of general error
    try {
      const requestData = await req.json();
      
      if (requestData.action === 'status') {
        const jobId = requestData.jobId;
        if (jobId) {
          return new Response(
            JSON.stringify({
              success: true,
              status: 'error',
              error: "Failed to check status: " + error.message
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
      
      const mockData = mockCourseData(requestData.formData || {});
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: mockData,
          jobId: 'fallback-' + Date.now(),
          note: "Generated using fallback system" 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (fallbackError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to generate course: " + error.message 
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
