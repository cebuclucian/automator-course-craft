
import { jobStore } from "../index.ts";
import { mockCourseData } from "../helpers/mockData.ts";
import { v4 as uuidv4 } from "https://deno.land/std@0.167.0/uuid/mod.ts";

// Importăm processJob, dar nu apelăm direct funcția async pentru a evita timeout-ul Edge Function
import { processJob } from "../helpers/jobProcessor.ts";

export const handleStartJob = async (requestData: any, headers: Record<string, string>) => {
  try {
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
    
    console.log("StartJob - Procesare cerere cu formData:", JSON.stringify(formData));
    
    // Verificare Claude API Key
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    if (!CLAUDE_API_KEY) {
      console.error("StartJob - Claude API Key is not set");
      
      // Generăm date mock dacă nu avem cheie API
      console.log("StartJob - Generare date mock pentru formular:", JSON.stringify(formData));
      const mockData = mockCourseData(formData);
      const mockJobId = `mock-${Date.now()}-${uuidv4()}`;
      
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
    
    // Generare ID unic pentru job
    const jobId = `job-${Date.now()}-${uuidv4().substring(0, 8)}`;
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

      console.log(`StartJob - Prompt generat cu succes, lungime: ${prompt.length} caractere`);
    } catch (promptError) {
      console.error("StartJob - Eroare la generarea promptului:", promptError);
      prompt = `Generează un curs despre ${formData.subject || 'subiectul specificat'} pentru ${formData.audience || 'profesioniști'} în format markdown. Include plan de lecție, slide-uri, note pentru trainer și exerciții.`;
      console.log("StartJob - Am folosit prompt de rezervă:", prompt);
    }
    
    // Înregistrare job în store
    jobStore.set(jobId, {
      status: 'processing',
      formData,
      startedAt: new Date().toISOString()
    });
    
    console.log(`StartJob - Job înregistrat în store cu statusul "processing"`);
    
    try {
      // Inițiere procesare job în mod asincron folosind structura Edge Function
      EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
      console.log(`StartJob - Job ${jobId} a fost trimis pentru procesare asincronă`);
    } catch (asyncError) {
      console.error(`StartJob - Eroare la pornirea procesării asincrone pentru job ${jobId}:`, asyncError);
      
      // Încercăm metoda alternativă - procesare directă
      console.log(`StartJob - Încercare alternativă de procesare pentru job ${jobId}`);
      processJob(jobId, prompt, formData).catch(error => {
        console.error(`StartJob - Eroare și la procesarea directă pentru job ${jobId}:`, error);
        
        // Actualizare status job în caz de eroare
        jobStore.set(jobId, {
          status: 'error',
          formData,
          startedAt: (jobStore.get(jobId)?.startedAt || new Date().toISOString()),
          completedAt: new Date().toISOString(),
          error: error.message || "Eroare necunoscută la procesarea job-ului"
        });
      });
    }
    
    // Returnare răspuns imediat
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: 'processing',
        message: "Job înregistrat și procesat în background"
      }),
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("StartJob - Eroare:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Eroare la înregistrarea job-ului: ${error.message || 'Unknown error'}`
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
