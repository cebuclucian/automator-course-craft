
import { jobStore } from "../index.ts";
import { corsHeaders } from "../cors.ts";
import { buildPrompt } from "../helpers/promptBuilder.ts";
import { processJob } from "../helpers/jobProcessor.ts";
import { mockCourseData } from "../helpers/mockData.ts";

// Handler pentru pornirea unui job nou
export async function handleStartJob(requestData, corsHeaders) {
  console.log("CRITICAL: startJob handler apelat cu datele:", JSON.stringify(requestData));
  
  const { formData } = requestData;
  
  // Verificare existență formData
  if (!formData) {
    console.error("CRITICAL: Date formular lipsă în cerere");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Datele formularului lipsesc" 
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
    // Log configurare API key
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    console.log(`CRITICAL: Claude API Key configurat: ${CLAUDE_API_KEY ? 'Da' : 'Nu'}`);
    
    // Generare ID job unic
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Construire prompt - aici este utilizată limba
    const prompt = buildPrompt(formData);
    
    console.log(`CRITICAL: Pornire job ${jobId} pentru subiect: ${formData.subject}, durată: ${formData.duration}, limbă: ${formData.language}`);
    console.log(`CRITICAL: Lungime prompt job ${jobId}: ${prompt.length} caractere`);
    
    // Creare date mock cu secțiuni adecvate pentru răspuns imediat
    const mockData = mockCourseData(formData);
    
    // Asigurare că mockData are secțiuni adecvate
    if (!mockData.sections || mockData.sections.length === 0) {
      mockData.sections = [
        { 
          type: 'lesson-plan', 
          title: 'Plan de lecție',
          content: `# Plan de lecție: ${formData.subject}\n\n## Obiective\n- Înțelegerea conceptelor de bază\n- Dezvoltarea abilităților practice\n- Aplicarea cunoștințelor în scenarii reale`
        },
        { 
          type: 'slides', 
          title: 'Slide-uri prezentare',
          content: `# Prezentare: ${formData.subject}\n\n## Slide 1: Introducere\n- Despre acest curs\n- Importanța subiectului\n- Ce vom învăța`
        },
        { 
          type: 'trainer-notes', 
          title: 'Note pentru trainer',
          content: `# Note pentru trainer: ${formData.subject}\n\n## Pregătire\n- Asigurați-vă că toate materialele sunt disponibile\n- Verificați echipamentele\n\n## Sfaturi de livrare\n- Începeți cu o activitate de spargere a gheții\n- Folosiți exemple relevante pentru audiență`
        },
        { 
          type: 'exercises', 
          title: 'Exerciții',
          content: `# Exerciții: ${formData.subject}\n\n## Exercițiul 1: Aplicare practică\n**Timp**: 15 minute\n**Materiale**: Fișe de lucru\n\n**Instrucțiuni**:\n1. Împărțiți participanții în grupuri de 3-4 persoane\n2. Distribuiți fișele de lucru\n3. Acordați 10 minute pentru rezolvare\n4. Facilitați o discuție de 5 minute despre soluții`
        }
      ];
    }
    
    // Stocare job cu stare inițială și date mock
    jobStore.set(jobId, {
      status: 'processing',
      formData,
      data: mockData,
      startedAt: new Date().toISOString(),
      initialDataReturned: true
    });
    
    // Log număr de job-uri active și ID-urile lor pentru debugging
    console.log(`CRITICAL: Job-uri active curente: ${jobStore.size}`);
    console.log(`CRITICAL: Chei job în store: ${[...jobStore.keys()].join(', ')}`);

    // CRITICAL FIX: Verificăm explicit dacă Edge Runtime există înainte de a încerca să folosim waitUntil
    const hasEdgeRuntime = typeof EdgeRuntime !== 'undefined';
    console.log(`CRITICAL: Edge Runtime disponibil: ${hasEdgeRuntime}`);
    
    // Utilizează waitUntil pentru a gestiona job-ul asincron
    try {
      console.log(`CRITICAL: Încercare pornire procesare în fundal pentru job ${jobId}`);
      
      if (hasEdgeRuntime) {
        EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
        console.log(`CRITICAL: Procesare în fundal începută pentru job ${jobId} folosind EdgeRuntime.waitUntil`);
      } else {
        // Fallback dacă EdgeRuntime nu este disponibil
        console.log(`CRITICAL: EdgeRuntime nu este disponibil, pornire procesJob direct`);
        // Pornim jobul dar nu așteptăm rezultatul - va rula în background
        processJob(jobId, prompt, formData).catch(err => 
          console.error(`CRITICAL: Eroare în procesarea job-ului ${jobId} în fundal:`, err)
        );
      }
    } catch (error) {
      console.error(`CRITICAL: Eroare pornire procesare în fundal pentru job ${jobId}:`, error);
      // CRITICAL FIX: Pornim procesarea job-ului direct, chiar dacă waitUntil eșuează
      console.log(`CRITICAL: Încercare pornire directă processJob după eșuarea waitUntil`);
      processJob(jobId, prompt, formData).catch(err => 
        console.error(`CRITICAL: Eroare în procesarea directă a job-ului ${jobId}:`, err)
      );
    }
    
    // Returnare imediată cu ID job și date mock
    console.log(`CRITICAL: Job ${jobId} returnează date mock imediate cu ${mockData.sections?.length || 0} secțiuni`);
    
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        data: mockData,
        status: "processing",
        message: "Job pornit cu succes și va continua procesarea în fundal"
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("CRITICAL: Eroare în handler startJob:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Eroare internă de server" 
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
