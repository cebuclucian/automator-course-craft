
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "./cors.ts";
import { handleStartJob } from "./handlers/startJob.ts";
import { handleCheckStatus } from "./handlers/checkStatus.ts";
import { mockCourseData } from "./helpers/mockData.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

// Store în memorie pentru urmărirea job-urilor (într-o aplicație de producție, ar utiliza o bază de date)
export const jobStore = new Map();

serve(async (req) => {
  // Gestionare cereri preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verifică dacă cheia API Claude este configurată
    if (!CLAUDE_API_KEY) {
      console.error("Cheia API Claude nu este setată!");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Cheia API Claude nu este configurată" 
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

    const requestData = await req.json();
    
    console.log("Generate-course funcția primită requestData:", JSON.stringify(requestData));
    
    // Verifică ce acțiune este solicitată
    const action = requestData.action || 'start';
    
    if (action === 'start') {
      console.log("Procesare acțiune 'start'");
      return handleStartJob(requestData, corsHeaders);
    } else if (action === 'status') {
      console.log("Procesare acțiune 'status'");
      return handleCheckStatus(requestData, corsHeaders);
    } else {
      console.error("Acțiune invalidă specificată:", action);
      return new Response(
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
  } catch (error) {
    console.error('Eroare în funcția generate-course:', error);
    
    // Încercăm să furnizăm date mock în caz de eroare generală
    try {
      const requestData = await req.json();
      
      console.log("Încercare fallback pentru cererea:", JSON.stringify(requestData));
      
      if (requestData.action === 'status') {
        const jobId = requestData.jobId;
        if (jobId) {
          console.log(`Returnare status de eroare pentru job ${jobId}`);
          return new Response(
            JSON.stringify({
              success: true,
              status: 'error',
              error: "Eroare verificare status: " + error.message
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
      
      console.log("Generare date mock pentru formular:", requestData.formData);
      const mockData = mockCourseData(requestData.formData || {});
      
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
        formData: requestData.formData || {},
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
          error: "Eroare la generarea cursului: " + error.message 
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
