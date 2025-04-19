import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { handleStartJob } from "./handlers/startJob.ts";
import { handleCheckStatus } from "./handlers/checkStatus.ts";
import { mockCourseData } from "./helpers/mockData.ts";

// Obtinere sigură a cheii API Claude din variabilele de mediu
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

// Verifică și logheaza disponibilitatea API key pentru debugging
console.log(`generate-course - CLAUDE_API_KEY este ${CLAUDE_API_KEY ? 'configurată' : 'lipsă'}`);

// Store în memorie pentru urmărirea job-urilor (într-o aplicație de producție, ar utiliza o bază de date)
export const jobStore = new Map();

// Curățare periodică a job-urilor vechi (pentru a preveni scurgerile de memorie)
const cleanupInterval = setInterval(() => {
  // Găsim job-urile mai vechi de 24 ore
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
    console.log(`Cleanup - ${removedCount} job-uri vechi eliminate din store`);
  }
}, 60 * 60 * 1000); // Rulează la fiecare oră

// Oprire curățare când funcția este închisă
addEventListener('beforeunload', (ev) => {
  console.log('Edge function shutting down, reason:', ev.detail?.reason);
  clearInterval(cleanupInterval);
});

// Endpoint de test pentru verificarea conectivității - acum îmbunătățit pentru debugging
async function handleTestConnection(req) {
  console.log("generate-course - Handle test-connection request");
  const url = new URL(req.url);
  console.log("generate-course - Request URL:", url.toString());
  console.log("generate-course - Path:", url.pathname);
  
  // Verificare dacă este o cerere pentru endpoint-ul public specific
  const isTestConnectionEndpoint = url.pathname.endsWith('/test-connection');
  console.log("generate-course - Is test connection endpoint:", isTestConnectionEndpoint);
  
  // Returnare informații detaliate pentru debugging
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      timestamp: Date.now(),
      apiKeyConfigured: !!CLAUDE_API_KEY,
      jobStoreSize: jobStore.size,
      requestUrl: url.toString(),
      endpoint: "test-connection",
      message: 'Edge Function is running correctly'
    }), 
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  );
}

// Endpoint minimal îmbunătățit pentru testarea API Claude
async function handleTestClaude(req) {
  try {
    console.log("generate-course - Handle test-claude request");
    const url = new URL(req.url);
    console.log("generate-course - Request URL:", url.toString());
    console.log("generate-course - Path:", url.pathname);
    
    // Verificare dacă este o cerere pentru endpoint-ul public specific
    const isTestClaudeEndpoint = url.pathname.endsWith('/test-claude');
    console.log("generate-course - Is test Claude endpoint:", isTestClaudeEndpoint);
    
    if (!CLAUDE_API_KEY) {
      console.error("generate-course - Claude API key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "API Key Claude nu este configurată",
          endpoint: "test-claude",
          requestUrl: url.toString()
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
    
    console.log("generate-course - Testare conectare API Claude");
    
    // Prompt minimal pentru testare
    const prompt = "Salut! Acesta este un test de conectivitate. Te rog să răspunzi cu 'Test reușit!'";
    
    // Apelare directă API Claude cu prompt minimal
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
    
    // Verificare răspuns
    if (!response.ok) {
      const errorData = await response.text();
      console.error("generate-course - Eroare API Claude:", response.status, errorData);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `API Claude a returnat status ${response.status}`,
          details: errorData,
          endpoint: "test-claude",
          requestUrl: url.toString()
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
    
    const data = await response.json();
    console.log("generate-course - Răspuns API Claude primit");
    
    // Extrageți primele și ultimele 4 caractere din API key pentru verificare
    const apiKeyFirstFour = CLAUDE_API_KEY.substring(0, 4);
    const apiKeyLastFour = CLAUDE_API_KEY.substring(CLAUDE_API_KEY.length - 4);
    const maskedApiKey = `${apiKeyFirstFour}...${apiKeyLastFour}`;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Testare API Claude reușită",
        responseContent: data.content?.[0]?.text || "Răspuns gol",
        endpoint: "test-claude",
        requestUrl: url.toString(),
        apiKeyConfigured: true,
        apiKeyMasked: maskedApiKey
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("generate-course - Eroare în handleTestClaude:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Eroare la testarea API Claude: ${error.message || "Eroare necunoscută"}`,
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

serve(async (req) => {
  // Măsurare timp de procesare cerere pentru debugging
  const requestStartTime = Date.now();
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  console.log(`generate-course - Cerere primită la ${new Date().toISOString()}: ${req.method} ${pathname}`);
  console.log("generate-course - Headers:", JSON.stringify(Array.from(req.headers.entries())));
  
  // Gestionare cereri preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Îmbunătățire pentru detectarea endpoint-urilor de test
  // Verifică dacă calea URL conține test-connection sau test-claude
  const isTestConnection = pathname.includes('test-connection');
  const isTestClaude = pathname.includes('test-claude');
  
  console.log("generate-course - Verificare endpoint-uri de test:");
  console.log("  - isTestConnection:", isTestConnection);
  console.log("  - isTestClaude:", isTestClaude);
  
  // Rutare endpoint-uri de test
  if (isTestConnection) {
    console.log("generate-course - Handling test-connection request");
    return await handleTestConnection(req);
  }
  
  if (isTestClaude) {
    console.log("generate-course - Handling test-claude request");
    return await handleTestClaude(req);
  }

  try {
    // Verifică și configurează timeout pentru a preveni încheierea prematură
    const abortController = new AbortController();
    const signal = abortController.signal;
    const timeout = setTimeout(() => {
      console.error("Edge function timeout limit approaching, attempting to finalize processing");
      abortController.abort();
    }, 28000); // 28 secunde pentru a permite returnarea răspunsului înaintea timeout-ului de 30s al Edge Function
    
    // Verifică dacă cheia API Claude este configurată
    if (!CLAUDE_API_KEY) {
      console.warn("Cheia API Claude nu este setată! Se vor genera date mock.");
    }
    
    // Verifică dacă cererea conține date valide
    if (!req.body) {
      console.error("Corpul cererii este gol");
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Corpul cererii este gol" 
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

    // Parsare date cerere cu gestionarea timeout-ului
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Eroare la parsarea JSON din cerere:", parseError);
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Format invalid al cererii" 
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
    
    console.log("Generate-course funcția primită requestData:", JSON.stringify(requestData));
    
    // Verifică ce acțiune este solicitată
    const action = requestData.action || 'start';
    
    let response;
    
    // Procesare în funcție de acțiunea solicitată
    if (action === 'start') {
      console.log("Procesare acțiune 'start'");
      response = await handleStartJob(requestData, corsHeaders);
    } else if (action === 'status') {
      console.log("Procesare acțiune 'status'");
      response = await handleCheckStatus(requestData, corsHeaders);
    } else if (action === 'test-connection') {  // Adăugat pentru compatibilitate cu apelurile vechi
      console.log("Procesare acțiune 'test-connection'");
      response = await handleTestConnection(req);
    } else if (action === 'test-claude') {  // Adăugat pentru compatibilitate cu apelurile vechi
      console.log("Procesare acțiune 'test-claude'");
      response = await handleTestClaude(req);
    } else {
      console.error("Acțiune invalidă specificată:", action);
      response = new Response(
        JSON.stringify({ 
          success: false, 
          error: "Acțiune invalidă specificată" 
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
    
    // Curățare și jurnalizare metrici
    clearTimeout(timeout);
    const processingTime = Date.now() - requestStartTime;
    console.log(`generate-course - Cerere procesată în ${processingTime}ms cu status ${response.status}`);
    
    return response;
  } catch (error) {
    console.error('Eroare în funcția generate-course:', error);
    
    // Încercare backup de furnizare date mock în caz de eroare generală
    try {
      let requestData;
      try {
        requestData = await req.json();
      } catch (jsonError) {
        console.error("Nu am putut extrage date din cerere pentru fallback:", jsonError);
        requestData = { action: 'unknown' };
      }
      
      console.log("Încercare fallback pentru cererea:", JSON.stringify(requestData));
      
      if (requestData.action === 'status') {
        const jobId = requestData.jobId;
        if (jobId) {
          console.log(`Returnare status de eroare pentru job ${jobId}`);
          return new Response(
            JSON.stringify({
              success: true,
              status: 'error',
              error: "Eroare verificare status: " + (error.message || "Eroare necunoscută")
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
      
      // Încercare generare date mock pentru a oferi utilizatorului ceva
      const formData = requestData.formData || {};
      console.log("Generare date mock pentru formular:", formData);
      const mockData = mockCourseData(formData);
      
      // Asigurare că mockData are secțiuni
      if (!mockData.sections || mockData.sections.length === 0) {
        mockData.sections = [
          { 
            type: 'lesson-plan', 
            title: 'Plan de lecție',
            content: `# Plan de lecție de urgență\n\n## Obiective\n- Înțelegerea conceptelor de bază\n- Dezvoltarea abilităților practice`
          },
          { 
            type: 'slides', 
            title: 'Slide-uri prezentare',
            content: `# Prezentare de urgență\n\n## Introducere\n- Acest material a fost generat în modul de urgență`
          },
          { 
            type: 'trainer-notes', 
            title: 'Note pentru trainer',
            content: `# Note pentru trainer\n\n- Acest material a fost generat în regim de urgență`
          },
          { 
            type: 'exercises', 
            title: 'Exerciții',
            content: `# Exerciții\n\n## Exercițiul de urgență\nAplicați conceptele de bază`
          }
        ];
      }
      
      const mockJobId = 'fallback-' + Date.now();
      
      // Salvare job în store pentru verificări ulterioare
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
          note: "Generat utilizând sistemul de rezervă" 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (fallbackError) {
      console.error("Eroare și în mecanismul de rezervă:", fallbackError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Eroare la generarea cursului: " + (error.message || "Eroare necunoscută") 
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
