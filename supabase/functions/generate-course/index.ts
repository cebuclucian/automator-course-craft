
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { startJob } from "./handlers/startJob.ts";
import { checkStatus } from "./handlers/checkStatus.ts";
import { JobStore } from "./helpers/jobProcessor.ts";

export interface Job {
  id: string;
  status: "processing" | "completed" | "error";
  formData: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  progressPercent: number;
  milestone?: string;
  statusMessage?: string;
  data?: any;
  partialData?: any;
  error?: string;
  errorDetails?: any;
}

// Store global pentru job-uri 
// Notă: Aceasta este o soluție temporară. În producție, ar trebui să folosim un store persistent
// sau o bază de date pentru a păstra starea job-urilor între cereri.
const jobStore = new JobStore();

// Verificăm existența API key-ului pentru Claude
const apiKey = Deno.env.get('CLAUDE_API_KEY');
if (apiKey) {
  console.log("generate-course - CLAUDE_API_KEY is configured");
} else {
  console.warn("generate-course - CLAUDE_API_KEY is missing");
}

// Function to extract and log auth details for debugging
function extractAuthDetails(req: Request) {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || 'missing';
  const apiKeyHeader = req.headers.get('apikey') || req.headers.get('Apikey') || req.headers.get('ApiKey') || req.headers.get('api-key') || req.headers.get('Api-Key') || 'missing';
  const anonKeyHeader = req.headers.get('anon-key') || req.headers.get('Anon-Key') || req.headers.get('anonKey') || req.headers.get('AnonKey') || 'missing';
  const clientInfo = req.headers.get('x-client-info') || 'missing';
  const origin = req.headers.get('origin') || 'missing';
  
  console.log("Auth details:");
  console.log(`- Authorization header: ${authHeader.substring(0, 15)}...`);
  console.log(`- apikey header: ${apiKeyHeader.substring(0, 15)}...`);
  console.log(`- anon-key header: ${anonKeyHeader.substring(0, 15)}...`);
  console.log(`- x-client-info: ${clientInfo}`);
  console.log(`- origin: ${origin}`);
  
  // Log all headers for comprehensive debugging
  console.log("All headers received:");
  for (const [key, value] of req.headers.entries()) {
    console.log(`- ${key}: ${value.substring(0, 30)}...`);
  }
  
  return { authHeader, apiKeyHeader, anonKeyHeader, clientInfo, origin };
}

// Funcție de procesare a cererilor
serve(async (req) => {
  // Logging cerere
  const now = new Date().toISOString();
  const url = new URL(req.url);
  console.log(`generate-course - Request received at ${now}: ${req.method} ${url.pathname}`);
  console.log(`generate-course - Headers count: ${req.headers.size}`);
  
  // Log important headers for debugging
  const { authHeader, apiKeyHeader, anonKeyHeader, clientInfo, origin } = extractAuthDetails(req);
  
  // Gestionare CORS preflight - should be the top priority
  if (req.method === 'OPTIONS') {
    console.log("generate-course - Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders 
    });
  }
  
  // Verificăm dacă cererea este pentru testare
  const pathSegments = new URL(req.url).pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  console.log("generate-course - Path analysis:");
  console.log(`  - Full path: ${url.pathname}`);
  console.log(`  - Path segments: ${pathSegments.join(', ')}`);
  console.log(`  - Last segment: ${lastSegment}`);

  // Endpoint pentru autentificare detaliată
  if (lastSegment === 'auth-debug') {
    console.log("generate-course - Handling auth-debug endpoint");
    
    // Extract all headers for debugging
    const allHeaders = {};
    for (const [key, value] of req.headers.entries()) {
      allHeaders[key] = value;
    }
    
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Auth debug endpoint",
        timestamp: now,
        authHeader,
        apiKeyHeader,
        anonKeyHeader,
        allHeaders,
        apiKeyConfigured: !!apiKey,
        corsHeadersUsed: corsHeaders,
        clientOrigin: origin,
        requestUrl: req.url,
        requestMethod: req.method
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Debug endpoint pentru CORS
  if (lastSegment === 'debug-cors') {
    console.log("generate-course - Handling debug-cors endpoint");
    
    // NO AUTH CHECK FOR TESTING
    
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "CORS debug endpoint",
        timestamp: now,
        requestHeaders: Object.fromEntries(req.headers.entries()),
        corsHeadersUsed: corsHeaders,
        clientOrigin: origin,
        authHeaderReceived: authHeader !== 'missing',
        apiKeyHeaderReceived: apiKeyHeader !== 'missing',
        anonKeyHeaderReceived: anonKeyHeader !== 'missing',
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Endpoint test pentru conexiune - NO AUTH REQUIRED FOR TESTING
  if (lastSegment === 'test-connection') {
    console.log("generate-course - Handling test-connection endpoint");
    
    // For testing, we'll accept any request to this endpoint
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: now,
        message: "Connection to Edge Function successful",
        receivedHeaders: {
          authorization: authHeader.substring(0, 20) + '...',
          apikey: apiKeyHeader.substring(0, 20) + '...',
          anonKey: anonKeyHeader.substring(0, 20) + '...',
          origin: origin
        },
        pathInfo: {
          fullPath: url.pathname,
          lastSegment: lastSegment
        }
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Endpoint test pentru API Claude - NO AUTH REQUIRED FOR TESTING
  if (lastSegment === 'test-claude') {
    console.log("generate-course - Handling test-claude endpoint");
    
    // Verificăm dacă API key-ul este configurat
    if (!apiKey) {
      console.warn("generate-course - Claude API key not configured for test");
      
      return new Response(
        JSON.stringify({
          status: "error",
          timestamp: now,
          message: "Claude API key not configured",
          apiKeyConfigured: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Returnăm informații despre API key (mascat)
    const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
    
    console.log(`generate-course - Claude API key is configured (masked: ${maskedKey})`);
    
    try {
      console.log("generate-course - Testing Claude API with a simple query");
      
      // Facem un apel simplu către API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 20,
          temperature: 0.1,
          system: "Reply with just 'API test successful'.",
          messages: [
            {
              role: 'user',
              content: "Say 'API test successful' and nothing else."
            }
          ]
        })
      });
      
      // Procesăm răspunsul
      if (response.ok) {
        const responseData = await response.json();
        const apiResponse = responseData.content?.[0]?.text || "No content";
        
        console.log("generate-course - Claude API test successful:", apiResponse);
        
        return new Response(
          JSON.stringify({
            status: "ok",
            timestamp: now,
            message: "Claude API connection successful",
            apiKeyConfigured: true,
            apiKeyMasked: maskedKey,
            apiResponse
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const errorText = await response.text();
        console.error("generate-course - Claude API error:", response.status, errorText);
        
        return new Response(
          JSON.stringify({
            status: "error",
            timestamp: now,
            message: `Claude API error: ${response.status}`,
            apiKeyConfigured: true,
            apiKeyMasked: maskedKey,
            error: errorText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error: any) {
      console.error("generate-course - Error testing Claude API:", error);
      
      return new Response(
        JSON.stringify({
          status: "error",
          timestamp: now,
          message: `Error testing Claude API: ${error.message}`,
          apiKeyConfigured: true,
          apiKeyMasked: maskedKey,
          error: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Endpoint pentru verificare variabile de mediu
  if (lastSegment === 'check-env') {
    console.log("generate-course - Handling check-env endpoint");
    
    const envStatus = {
      CLAUDE_API_KEY: apiKey ? "configured" : "missing",
      CLAUDE_API_KEY_LENGTH: apiKey ? apiKey.length : 0,
      CLAUDE_API_KEY_MASKED: apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : null
    };
    
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: now,
        environment: envStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Endpoint pentru diagnostic complet
  if (lastSegment === 'full-diagnosis') {
    console.log("generate-course - Handling full-diagnosis endpoint");
    
    try {
      // Diagnostic pentru API Claude
      let claudeApiStatus = "untested";
      let claudeApiDetails = null;
      let claudeApiTestResponse = null;
      
      if (apiKey) {
        try {
          console.log("generate-course - Testing Claude API for diagnosis");
          
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              model: 'claude-3-sonnet-20240229',
              max_tokens: 20,
              temperature: 0.1,
              system: "Reply with just 'API diagnostic test successful'.",
              messages: [
                {
                  role: 'user',
                  content: "Say 'API diagnostic test successful' and nothing else."
                }
              ]
            })
          });
          
          if (response.ok) {
            const responseData = await response.json();
            claudeApiTestResponse = responseData;
            claudeApiStatus = "working";
            claudeApiDetails = {
              responseStatus: response.status,
              model: responseData.model,
              messageId: responseData.id,
              content: responseData.content?.[0]?.text,
              inputTokens: responseData.usage?.input_tokens,
              outputTokens: responseData.usage?.output_tokens
            };
          } else {
            const errorText = await response.text();
            claudeApiStatus = "error";
            claudeApiDetails = {
              responseStatus: response.status,
              error: errorText
            };
          }
        } catch (error: any) {
          claudeApiStatus = "exception";
          claudeApiDetails = {
            message: error.message,
            name: error.name
          };
        }
      } else {
        claudeApiStatus = "missing_key";
      }
      
      // Diagnostic pentru JobStore
      const jobStoreSize = jobStore.size;
      const jobStoreKeys = Array.from(jobStore.keys());
      const jobStoreDetails = jobStoreKeys.map(key => {
        const job = jobStore.get(key);
        return {
          id: job?.id,
          status: job?.status,
          createdAt: job?.createdAt,
          updatedAt: job?.updatedAt,
          milestone: job?.milestone,
          progressPercent: job?.progressPercent
        };
      });
      
      // Request information
      const requestInfo = {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        authHeader: req.headers.get('Authorization') || req.headers.get('authorization') || 'No Authorization header',
        apiKeyHeader: req.headers.get('apikey') || req.headers.get('Apikey') || 'No apikey header',
        anonKeyHeader: req.headers.get('anon-key') || req.headers.get('Anon-Key') || 'No anon-key header',
        clientInfo: req.headers.get('x-client-info') || 'No client info',
        origin: req.headers.get('origin') || 'No origin header'
      };
      
      // Construim rezultatul diagnosticării
      const diagnosisResult = {
        timestamp: now,
        environment: {
          CLAUDE_API_KEY: apiKey ? "configured" : "missing",
          CLAUDE_API_KEY_LENGTH: apiKey ? apiKey.length : 0,
          CLAUDE_API_KEY_MASKED: apiKey ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : null
        },
        claudeApi: {
          status: claudeApiStatus,
          details: claudeApiDetails
        },
        jobStore: {
          size: jobStoreSize,
          keys: jobStoreKeys,
          jobs: jobStoreDetails
        },
        request: requestInfo,
        runtime: {
          denoVersion: Deno.version.deno,
          v8Version: Deno.version.v8,
          tsVersion: Deno.version.typescript
        }
      };
      
      return new Response(
        JSON.stringify(diagnosisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error("generate-course - Error running full diagnosis:", error);
      
      return new Response(
        JSON.stringify({
          status: "error",
          timestamp: now,
          message: `Error running diagnosis: ${error.message}`,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  }
  
  // Endpoint public pentru informații de diagnosticare (acces public)
  if (lastSegment === 'public-debug') {
    console.log("generate-course - Handling public-debug endpoint");
    
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || 'No Authorization header';
    const apiKeyHeader = req.headers.get('apikey') || req.headers.get('Apikey') || 'No apikey header';
    const anonKeyHeader = req.headers.get('anon-key') || req.headers.get('Anon-Key') || 'No anon-key header';
    
    return new Response(
      JSON.stringify({
        timestamp: now,
        environment: {
          CLAUDE_API_KEY: apiKey ? "configured" : "missing"
        },
        request: {
          authHeader: authHeader.substring(0, 20) + '...',
          apiKeyHeader: apiKeyHeader.substring(0, 20) + '...',
          anonKeyHeader: anonKeyHeader.substring(0, 20) + '...',
          origin: req.headers.get('origin') || 'No origin header'
        },
        jobStore: {
          size: jobStore.size
        },
        runtime: {
          denoVersion: Deno.version.deno
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Pentru celelalte cereri, preluăm datele din body
    
    // For non-test endpoints, we'll still check auth but be more lenient
    const hasAuth = req.headers.has('Authorization') || req.headers.has('authorization') || 
                    req.headers.has('apikey') || req.headers.has('Apikey') || 
                    req.headers.has('anon-key') || req.headers.has('Anon-Key');
                    
    if (!hasAuth) {
      console.log("generate-course - Auth headers not found for endpoint:", lastSegment);
      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
          status: "error",
          timestamp: now,
          requiredHeaders: ["Authorization", "apikey", "anon-key"],
          receivedHeaders: {
            authorization: authHeader,
            apikey: apiKeyHeader,
            anonKey: anonKeyHeader,
            origin: origin
          },
          note: "Please include either Authorization: Bearer YOUR_ANON_KEY or apikey: YOUR_ANON_KEY header"
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const bodyText = await req.text();
    let requestData;
    
    try {
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error("generate-course - Error parsing request body:", e);
      console.log("generate-course - Raw request body:", bodyText);
      
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Afișăm primele 200 caractere din body pentru diagnostic
    console.log(`generate-course - Request body preview (first 200 chars): ${bodyText.substring(0, 200)}`);
    
    // Procesăm în funcție de acțiunea specificată
    console.log(`Generate-course function received requestData: ${JSON.stringify(requestData)}`);
    
    if (requestData.action === 'start') {
      console.log("Processing 'start' action");
      const result = await startJob(requestData, jobStore, apiKey);
      
      const startTime = Date.now();
      const responseData = JSON.stringify(result);
      const processingTime = Date.now() - startTime;
      
      console.log(`generate-course - 'start' action processed in ${processingTime}ms with result:`, JSON.stringify(result));
      
      return new Response(
        responseData,
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (requestData.action === 'status') {
      console.log("Processing 'status' action");
      const result = await checkStatus(requestData, jobStore);
      
      const startTime = Date.now();
      const responseData = JSON.stringify(result);
      const processingTime = Date.now() - startTime;
      
      console.log(`generate-course - 'status' action processed in ${processingTime}ms with status: ${result.status}`);
      
      return new Response(
        responseData,
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error(`generate-course - Unknown action: ${requestData.action}`);
      return new Response(
        JSON.stringify({
          error: `Unknown action: ${requestData.action}`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error: any) {
    console.error("generate-course - Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        error: `Error processing request: ${error.message}`,
        details: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } finally {
    const processingTime = Date.now() - new Date(now).getTime();
    console.log(`generate-course - Request processed in ${processingTime}ms`);
  }
});
