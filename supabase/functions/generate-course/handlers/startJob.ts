
import { jobStore } from "../index.ts";
import { mockCourseData } from "../helpers/mockData.ts";

// Implementăm generarea UUID folosind API-ul nativ crypto
const generateUUID = () => crypto.randomUUID();

// Importăm processJob, dar nu apelăm direct funcția async pentru a evita timeout-ul Edge Function
import { processJob } from "../helpers/jobProcessor.ts";

export const handleStartJob = async (requestData: any, headers: Record<string, string>) => {
  try {
    console.log("StartJob - Începere procesare cerere:", new Date().toISOString());
    console.log("StartJob - Request data preview:", JSON.stringify(requestData).substring(0, 300));
    
    // Verificare date formular
    const formData = requestData.formData;
    
    if (!formData) {
      console.error("StartJob - Missing formData in request");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Datele formularului lipsesc"
        }),
        {
          status: 400,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Diagnostic informații client
    const clientInfo = formData.clientInfo || requestData.clientInfo;
    if (clientInfo) {
      console.log("StartJob - Client info:", JSON.stringify(clientInfo));
    }
    
    console.log("StartJob - Procesare cerere cu formData:", JSON.stringify({
      subject: formData.subject,
      level: formData.level,
      audience: formData.audience,
      duration: formData.duration,
      language: formData.language,
      tone: formData.tone,
      context: formData.context
    }));
    
    // Verificare Claude API Key
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    console.log("StartJob - CLAUDE_API_KEY este configurată:", !!CLAUDE_API_KEY);
    console.log("StartJob - CLAUDE_API_KEY primele 4 caractere:", CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0, 4) : "NULL");
    
    if (!CLAUDE_API_KEY) {
      console.error("StartJob - Claude API Key is not set");
      
      // Generăm date mock dacă nu avem cheie API
      console.log("StartJob - Generare date mock pentru formular:", JSON.stringify(formData));
      const mockData = mockCourseData(formData);
      const mockJobId = `mock-${Date.now()}-${generateUUID()}`;
      
      jobStore.set(mockJobId, {
        status: 'completed',
        formData,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: mockData
      });
      
      console.log(`StartJob - Job mock creat cu ID: ${mockJobId}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          jobId: mockJobId,
          status: 'completed',
          message: "Date generate în mod mock (cheia API Claude lipsește)"
        }),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Generare ID unic pentru job folosind metoda crypto.randomUUID()
    const jobId = `job-${Date.now()}-${generateUUID().substring(0, 8)}`;
    console.log(`StartJob - Job ID generat: ${jobId}`);
    
    // Construire prompt pentru API Claude
    let prompt = '';
    try {
      // Construim promptul din datele formularului
      prompt = `# Cerere generare materiale curs
      
Subiect: ${formData.subject || 'Necunoscut'}
Nivel: ${formData.level || 'Intermediar'}
Audiență: ${formData.audience || 'Profesioniști'}
Durată: ${formData.duration || '1 zi'}
Context: ${formData.context || 'Corporativ'}
Ton: ${formData.tone || 'Profesional'}

Vreau să generezi materiale complete pentru un curs despre ${formData.subject}, adaptate pentru o audiență de ${formData.audience} de nivel ${formData.level}. Cursul va dura ${formData.duration} și va fi prezentat într-un context ${formData.context}.

Te rog să incluzi următoarele secțiuni, toate în format Markdown:

## Plan de lecție
Crează un plan detaliat pentru curs, care să includă:
- Obiective de învățare
- Structura cursului pe sesiuni/module
- Conceptele cheie care vor fi acoperite
- Activități sugerate pentru fiecare modul

## Slide-uri
Crează slide-uri de prezentare pentru curs, care să includă:
- O structură logică cu introducere, cuprins, conținut și concluzii
- Puncte cheie pentru fiecare concept important
- Diagrame sau ilustrații sugerate (descrise textual)
- Note pentru prezentator

## Note pentru trainer
Oferă note detaliate pentru trainer, incluzând:
- Sfaturi de prezentare
- Întrebări anticipate și răspunsuri
- Puncte de discuție pentru a stimula participarea
- Strategii pentru gestionarea dinamicii grupului

## Exerciții
Crează exerciții practice relevante pentru temă:
- Proiecte individuale sau de grup
- Studii de caz
- Activități practice
- Exerciții de evaluare

Important: Formatează toate secțiunile cu markdown, folosind titluri, subtitluri, liste și evidențieri unde este necesar. Conținutul trebuie să fie ${formData.language === 'română' ? 'în limba română' : 'in English'}.`;

      // Măsurăm dimensiunea promptului pentru diagnosticare
      const promptSize = new Blob([prompt]).size;
      console.log(`StartJob - Prompt generat cu succes, lungime: ${prompt.length} caractere, ${promptSize} bytes`);
      console.log(`StartJob - Primele 100 caractere din prompt: ${prompt.substring(0, 100)}`);
      console.log(`StartJob - Ultimele 100 caractere din prompt: ${prompt.substring(prompt.length - 100)}`);
    } catch (promptError) {
      console.error("StartJob - Eroare la generarea promptului:", promptError);
      prompt = `Generează un curs despre ${formData.subject || 'subiectul specificat'} pentru ${formData.audience || 'profesioniști'} în format markdown. Include plan de lecție, slide-uri, note pentru trainer și exerciții.`;
      console.log("StartJob - Am folosit prompt de rezervă:", prompt);
    }
    
    // Înregistrare job în store cu milestone pentru a urmări progresul în detaliu
    jobStore.set(jobId, {
      status: 'processing',
      formData,
      startedAt: new Date().toISOString(),
      milestone: 'job_created',
      lastUpdated: new Date().toISOString(),
      sections: [], // Inițializăm un array gol pentru secțiuni
      processedSections: 0, // Numărul de secțiuni procesate
      totalSections: 0, // Va fi actualizat în timpul procesării
      diagnosticInfo: {
        clientInfo,
        promptLength: prompt.length,
        requestTimestamp: new Date().toISOString(),
      }
    });
    
    console.log(`StartJob - Job înregistrat în store cu statusul "processing", milestone: job_created`);
    
    try {
      // DIAGNOSTIC: Verificăm dacă EdgeRuntime și waitUntil sunt disponibile
      const hasEdgeRuntime = typeof EdgeRuntime !== 'undefined';
      const hasWaitUntil = hasEdgeRuntime && typeof EdgeRuntime.waitUntil === 'function';
      
      console.log(`StartJob - EdgeRuntime disponibil: ${hasEdgeRuntime}, waitUntil disponibil: ${hasWaitUntil}`);
      
      // Actualizăm milestone-ul pentru a indica începerea procesării
      const job = jobStore.get(jobId);
      if (job) {
        jobStore.set(jobId, {
          ...job,
          milestone: 'processing_started',
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Metodă de executare asincronă adaptată în funcție de disponibilitatea API-urilor
      if (hasWaitUntil) {
        // Metoda preferată: EdgeRuntime.waitUntil
        console.log(`StartJob - Începere procesare asincronă pentru job ${jobId} folosind EdgeRuntime.waitUntil()`);
        
        EdgeRuntime.waitUntil((async () => {
          try {
            console.log(`StartJob [Background] - Procesare job ${jobId} începută în background la ${new Date().toISOString()}`);
            // Actualizăm milestone-ul pentru a indica API call
            const job = jobStore.get(jobId);
            if (job) {
              jobStore.set(jobId, {
                ...job,
                milestone: 'api_call_started',
                lastUpdated: new Date().toISOString()
              });
            }
            
            await processJob(jobId, prompt, formData);
            console.log(`StartJob [Background] - Procesare job ${jobId} finalizată cu succes în background la ${new Date().toISOString()}`);
          } catch (backgroundError) {
            console.error(`StartJob [Background] - Eroare în procesarea background pentru job ${jobId}:`, backgroundError);
            
            // Actualizare status job în caz de eroare
            const job = jobStore.get(jobId);
            if (job) {
              jobStore.set(jobId, {
                ...job,
                status: 'error',
                milestone: 'error_during_processing',
                error: backgroundError.message || "Eroare necunoscută în procesarea background",
                errorDetails: {
                  message: backgroundError.message,
                  stack: backgroundError.stack,
                  timestamp: new Date().toISOString()
                },
                completedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              });
              
              console.error(`StartJob [Background] - Job ${jobId} marcat cu eroare. Detalii: ${JSON.stringify({
                message: backgroundError.message,
                stack: backgroundError.stack?.substring(0, 200)
              })}`);
            }
          }
        })());
        
        console.log(`StartJob - Job ${jobId} trimis pentru procesare asincronă cu EdgeRuntime.waitUntil`);
      } else {
        // Alternativă: executare detașată folosind setTimeout 0ms
        console.log(`StartJob - Începere procesare asincronă pentru job ${jobId} folosind setTimeout (EdgeRuntime.waitUntil nu este disponibil)`);
        
        setTimeout(async () => {
          try {
            console.log(`StartJob [Background] - Procesare job ${jobId} începută în background alternativ la ${new Date().toISOString()}`);
            
            // Actualizăm milestone-ul pentru a indica API call
            const job = jobStore.get(jobId);
            if (job) {
              jobStore.set(jobId, {
                ...job,
                milestone: 'api_call_started_alt',
                lastUpdated: new Date().toISOString()
              });
            }
            
            await processJob(jobId, prompt, formData);
            console.log(`StartJob [Background] - Procesare job ${jobId} finalizată cu succes în background alternativ la ${new Date().toISOString()}`);
          } catch (backgroundError) {
            console.error(`StartJob [Background] - Eroare în procesarea background alternativ pentru job ${jobId}:`, backgroundError);
            
            // Actualizare status job în caz de eroare
            const job = jobStore.get(jobId);
            if (job) {
              jobStore.set(jobId, {
                ...job,
                status: 'error',
                milestone: 'error_during_processing_alt',
                error: backgroundError.message || "Eroare necunoscută în procesarea background alternativ",
                errorDetails: {
                  message: backgroundError.message,
                  stack: backgroundError.stack,
                  timestamp: new Date().toISOString()
                },
                completedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              });
            }
          }
        }, 0);
        
        console.log(`StartJob - Job ${jobId} trimis pentru procesare asincronă cu setTimeout`);
      }
    } catch (asyncError) {
      console.error(`StartJob - Eroare la pornirea procesării asincrone pentru job ${jobId}:`, asyncError);
      
      // Încercăm metoda alternativă cu setTimeout, fără a aștepta rezultatul
      console.log(`StartJob - Încercare alternativă de procesare pentru job ${jobId} după eroarea:`, asyncError.message);
      
      setTimeout(async () => {
        try {
          console.log(`StartJob [Emergency] - Procesare job ${jobId} începută în mod emergency la ${new Date().toISOString()}`);
          
          // Actualizăm milestone-ul pentru a indica Emergency API call
          const job = jobStore.get(jobId);
          if (job) {
            jobStore.set(jobId, {
              ...job,
              milestone: 'api_call_started_emergency',
              lastUpdated: new Date().toISOString()
            });
          }
          
          await processJob(jobId, prompt, formData);
          console.log(`StartJob [Emergency] - Procesare job ${jobId} finalizată cu succes în mod emergency la ${new Date().toISOString()}`);
        } catch (error) {
          console.error(`StartJob [Emergency] - Eroare în procesarea emergency pentru job ${jobId}:`, error);
          
          // Actualizare status job în caz de eroare
          const job = jobStore.get(jobId);
          if (job) {
            jobStore.set(jobId, {
              ...job,
              status: 'error',
              milestone: 'error_during_processing_emergency',
              error: error.message || "Eroare necunoscută la procesarea job-ului",
              errorDetails: {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
              },
              completedAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            });
          }
        }
      }, 0);
      
      console.log(`StartJob - Job ${jobId} trimis pentru procesare asincronă după eroare`);
    }
    
    // Returnare răspuns imediat
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: 'processing',
        milestone: 'job_created',
        message: "Job înregistrat și procesat în background",
        diagnosticInfo: {
          timestamp: new Date().toISOString(),
          promptLength: prompt.length,
          clientInfo: clientInfo ? {
            userAgent: clientInfo.userAgent ? clientInfo.userAgent.substring(0, 50) + "..." : "N/A",
            screenSize: clientInfo.screenWidth && clientInfo.screenHeight ? 
              `${clientInfo.screenWidth}x${clientInfo.screenHeight}` : "N/A"
          } : "N/A"
        }
      }),
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("StartJob - Eroare generală:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Eroare la înregistrarea job-ului: ${error.message || 'Unknown error'}`,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
