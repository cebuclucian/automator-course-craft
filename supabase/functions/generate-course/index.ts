
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

serve(async (req) => {
  // Măsurare timp de procesare cerere pentru debugging
  const requestStartTime = Date.now();
  console.log(`generate-course - Cerere primită la ${new Date().toISOString()}: ${req.method} ${new URL(req.url).pathname}`);
  
  // Gestionare cereri preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
