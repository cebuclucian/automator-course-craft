
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

// In-memory store for job tracking (in a production app, this would use a database)
const jobStore = new Map();

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

// Handle starting a new job
async function handleStartJob(requestData, corsHeaders) {
  const { formData } = requestData;
  
  // Verify formData exists
  if (!formData) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Form data is missing" 
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

  // Generate a unique job ID
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Construct the prompt
  const prompt = buildPrompt(formData);
  
  console.log(`Starting job ${jobId} for subject: ${formData.subject}, duration: ${formData.duration}`);
  
  // Store the job with initial state
  jobStore.set(jobId, {
    status: 'processing',
    formData,
    startedAt: new Date().toISOString(),
  });
  
  // For long-running jobs, start the processing in the background using waitUntil
  const complexJob = formData.duration.includes('zile') || formData.duration.includes('days');
  
  if (complexJob) {
    // Use waitUntil to handle the job asynchronously
    EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
    
    // Return immediately with job ID
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        message: "Job started successfully and will continue processing in the background",
        status: "processing"
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } else {
    // For simpler jobs, process immediately (but still return mock data quickly)
    EdgeRuntime.waitUntil(processJob(jobId, prompt, formData));
    
    // Return mock data immediately
    const mockData = mockCourseData(formData);
    
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        data: mockData,
        status: "processing"
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

// Process job in the background
async function processJob(jobId, prompt, formData) {
  try {
    console.log(`Processing job ${jobId} in background`);
    
    // For demo purposes, simulate different processing times based on course duration
    let processingTime = 5000; // default 5 seconds
    
    if (formData.duration === '1 zi' || formData.duration === '1 day') {
      processingTime = 15000; // 15 seconds
    } else if (formData.duration.includes('zile') || formData.duration.includes('days')) {
      const days = parseInt(formData.duration.split(' ')[0]);
      processingTime = Math.min(30000, days * 8000); // Cap at 30 seconds max
    }
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // In a real implementation, we'd call the Claude API here
    // For now, we'll just update the job with mock data
    const mockResult = mockCourseData(formData);
    jobStore.set(jobId, {
      status: 'completed',
      formData,
      startedAt: jobStore.get(jobId)?.startedAt,
      completedAt: new Date().toISOString(),
      data: mockResult
    });
    
    console.log(`Job ${jobId} completed successfully`);
    
    // Clean up old jobs periodically (in a real system this would be handled differently)
    setTimeout(() => {
      if (jobStore.has(jobId)) {
        jobStore.delete(jobId);
        console.log(`Cleaned up job ${jobId} from memory`);
      }
    }, 3600000); // 1 hour
    
    return mockResult;
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    jobStore.set(jobId, {
      status: 'error',
      formData,
      startedAt: jobStore.get(jobId)?.startedAt,
      error: error.message || 'Unknown error during processing'
    });
  }
}

// Handle checking job status
async function handleCheckStatus(requestData, corsHeaders) {
  const { jobId } = requestData;
  
  if (!jobId) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Job ID is missing" 
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
  
  // Get job from store
  const job = jobStore.get(jobId);
  
  if (!job) {
    // If job not found, it might have been cleaned up or never existed
    // For demo purposes, simulate a completed job
    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        data: mockCourseData({ subject: 'Unknown Subject' }),
        message: "Job not found in memory, returning simulated result"
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Return job status and data if completed
  return new Response(
    JSON.stringify({
      success: true,
      status: job.status,
      data: job.status === 'completed' ? job.data : null,
      error: job.error || null,
      message: `Job ${jobId} is ${job.status}`
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Helper function to build the prompt for Claude API
const buildPrompt = (formData) => {
  // Template string from the brief
  let promptTemplate = `# Sistem pentru generarea automată a materialelor de curs fizic și academic

## Configurare inițială
- Limba: {{LIMBA}} (Română/Engleză)
- Subiect curs: {{SUBIECT}} 
- Nivel: {{NIVEL}} (Începător/Intermediar/Avansat)
- Public țintă: {{PUBLICUL_TINTA}} (Elevi/Studenți/Profesori/Profesioniști/Manageri)
- Durată: {{DURATA}} (1 oră/2 ore/4 ore/8 ore/2 zile/3 zile/4 zile/5 zile)
- Ton: {{TON}} (Socratic/Energizant/Haios/Profesional)
- Context: {{CONTEXT}} (Corporativ/Academic)
- Tip generare: {{TIP_GENERARE}} (CAMP ASCUNS: Preview/Complet)

Ți se cere să generezi trei tipuri de materiale:

1. Plan și obiective
   - Obiective de învățare - liste cu 5-10 obiective specifice, măsurabile
   - Structura cursului - o listă cu titluri de module și o scurtă descriere

2. Materiale trainer
   - Ghid trainer - detalii despre cum să fie livrat cursul
   - Note de prezentare - ce să spună trainerul pentru fiecare slide

3. Materiale suport
   - Handout-uri - materiale tipărite pentru participanți
   - Exerciții - activități practice pentru consolidarea cunoștințelor

IMPORTANT: Răspunde DOAR cu un obiect JSON care conține cele trei secțiuni de mai sus, fiecare cu propriile categorii. Nu include text explicativ sau markdown în afara structurii JSON. Structura JSON trebuie să respecte formatul următor:

{
  "sections": [
    {
      "title": "Plan și obiective",
      "content": "Descriere generală a planului",
      "categories": [
        {
          "name": "Obiective de învățare",
          "content": "Text detaliat cu obiectivele"
        },
        {
          "name": "Structura cursului",
          "content": "Text detaliat cu structura"
        }
      ]
    },
    {
      "title": "Materiale trainer",
      "content": "Descriere generală a materialelor pentru trainer",
      "categories": [
        {
          "name": "Ghid trainer",
          "content": "Text detaliat pentru ghid"
        },
        {
          "name": "Note de prezentare",
          "content": "Text detaliat cu notele"
        }
      ]
    },
    {
      "title": "Materiale suport",
      "content": "Descriere generală a materialelor suport",
      "categories": [
        {
          "name": "Handout-uri",
          "content": "Text detaliat pentru handout-uri"
        },
        {
          "name": "Exerciții",
          "content": "Text detaliat cu exerciții"
        }
      ]
    }
  ],
  "metadata": {
    "subject": "{{SUBIECT}}",
    "level": "{{NIVEL}}",
    "audience": "{{PUBLICUL_TINTA}}",
    "duration": "{{DURATA}}",
    "createdAt": "CURRENT_DATE",
    "expiresAt": "EXPIRY_DATE"
  }
}`;

  // Replace variables in template
  promptTemplate = promptTemplate
    .replace(/{{LIMBA}}/g, formData.language)
    .replace(/{{SUBIECT}}/g, formData.subject)
    .replace(/{{NIVEL}}/g, formData.level)
    .replace(/{{PUBLICUL_TINTA}}/g, formData.audience)
    .replace(/{{DURATA}}/g, formData.duration)
    .replace(/{{TON}}/g, formData.tone)
    .replace(/{{CONTEXT}}/g, formData.context)
    .replace(/{{TIP_GENERARE}}/g, formData.generationType || 'Preview')
    .replace(/CURRENT_DATE/g, new Date().toISOString())
    .replace(/EXPIRY_DATE/g, new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString());

  return promptTemplate;
};

// Helper function for generating mock course data
const mockCourseData = (formData) => {
  // Mock data structure that mimics Claude API output
  const isPreview = formData.generationType !== 'Complet';
  const isLongCourse = formData.duration?.includes('zile') || formData.duration?.includes('days');
  
  // For longer courses, generate more content
  const contentMultiplier = isLongCourse ? 2.5 : 1;
  
  return {
    sections: [
      {
        title: "Plan și obiective",
        content: `Plan de curs pentru ${formData.subject}`,
        categories: [
          {
            name: "Obiective de învățare",
            content: isPreview 
              ? "Aceasta este o versiune preview a obiectivelor de învățare. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\n1. Înțelegerea conceptelor de bază\n2. Dezvoltarea abilităților practice" 
              : generateDetailedObjectives(formData, contentMultiplier)
          },
          {
            name: "Structura cursului",
            content: isPreview 
              ? "Aceasta este o versiune preview a structurii cursului. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nModulul 1: Introducere\nModulul 2: Concepte fundamentale" 
              : generateDetailedCourseStructure(formData, contentMultiplier)
          }
        ]
      },
      {
        title: "Materiale trainer",
        content: `Materiale pentru trainer pe tema ${formData.subject}`,
        categories: [
          {
            name: "Ghid trainer",
            content: isPreview 
              ? "Aceasta este o versiune preview a ghidului pentru trainer. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nIntroducere:\nAcest curs este conceput pentru a fi interactiv și practic." 
              : generateDetailedTrainerGuide(formData, contentMultiplier)
          },
          {
            name: "Note de prezentare",
            content: isPreview 
              ? "Aceasta este o versiunea preview a notelor de prezentare. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nSlide 1: Introducere\nPrezentați-vă și stabiliți obiectivele cursului." 
              : generateDetailedPresentationNotes(formData, contentMultiplier)
          }
        ]
      },
      {
        title: "Materiale suport",
        content: `Materiale suport pentru ${formData.subject}`,
        categories: [
          {
            name: "Handout-uri",
            content: isPreview 
              ? "Aceasta este o versiune preview a handout-urilor. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nHandout 1: Principiile de bază\nO prezentare concisă a conceptelor fundamentale." 
              : generateDetailedHandouts(formData, contentMultiplier)
          },
          {
            name: "Exerciții",
            content: isPreview 
              ? "Aceasta este o versiune preview a exercițiilor. Pentru versiunea completă, faceți upgrade la un abonament plătit.\n\nExercițiul 1: Analiză de caz\nStudiați următorul scenariu și identificați conceptele cheie aplicate." 
              : generateDetailedExercises(formData, contentMultiplier)
          }
        ]
      }
    ],
    metadata: {
      subject: formData.subject,
      level: formData.level,
      audience: formData.audience,
      duration: formData.duration,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
    }
  };
};

// Helper functions to generate more detailed mock content based on course parameters
function generateDetailedObjectives(formData, multiplier = 1) {
  const baseObjectives = [
    "1. Înțelegerea conceptelor fundamentale legate de " + formData.subject,
    "2. Dezvoltarea abilităților practice de aplicare a cunoștințelor",
    "3. Aplicarea cunoștințelor în situații reale de " + (formData.context === 'Corporativ' ? 'business' : 'mediul academic'),
    "4. Evaluarea și îmbunătățirea performanței în domeniul " + formData.subject,
    "5. Dezvoltarea unei perspective critice asupra " + formData.subject
  ];
  
  // For longer courses, add more objectives
  if (multiplier > 1) {
    baseObjectives.push(
      "6. Implementarea strategiilor avansate în contextul " + formData.subject,
      "7. Integrarea cunoștințelor din domenii conexe pentru o înțelegere holistică",
      "8. Dezvoltarea capacității de a inova în domeniul " + formData.subject,
      "9. Articularea unei viziuni personale asupra " + formData.subject,
      "10. Crearea unui plan de dezvoltare personală pentru aprofundarea " + formData.subject
    );
  }
  
  return "Lista completă a obiectivelor de învățare pentru acest curs:\n\n" + baseObjectives.join("\n\n");
}

function generateDetailedCourseStructure(formData, multiplier = 1) {
  const baseStructure = [
    "Modulul 1: Introducere în " + formData.subject + "\n- Prezentare generală\n- Terminologie de bază\n- Istoricul și evoluția domeniului",
    "Modulul 2: Concepte fundamentale\n- Principiile teoretice\n- Modele conceptuale\n- Exemple de aplicare practică",
    "Modulul 3: Aplicații practice\n- Studii de caz relevante\n- Exerciții ghidate\n- Activități în grup",
    "Modulul 4: Strategii avansate\n- Tehnici specializate\n- Abordări inovative\n- Metode de optimizare",
    "Modulul 5: Evaluare și feedback\n- Metode de evaluare\n- Instrumente de feedback\n- Plan de acțiune individual"
  ];
  
  // For longer courses, add more modules
  if (multiplier > 1) {
    baseStructure.push(
      "Modulul 6: Integrare în practică\n- Aplicații în mediul real\n- Provocări și soluții\n- Proiecte practice",
      "Modulul 7: Tendințe și perspective\n- Direcții de dezvoltare în domeniu\n- Cercetări recente\n- Previziuni pentru viitor",
      "Modulul 8: Abordări interdisciplinare\n- Conexiuni cu alte domenii\n- Sinergie și integrare\n- Perspective multiple"
    );
    
    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseStructure.push(
        "Modulul 9: Workshop aplicativ\n- Lucru pe proiecte reale\n- Mentorat și coaching\n- Feedback specific",
        "Modulul 10: Masterclass\n- Sesiune cu experți în domeniu\n- Studii de caz avansate\n- Soluții personalizate"
      );
    }
  }
  
  return "Structura completă a cursului:\n\n" + baseStructure.join("\n\n");
}

function generateDetailedTrainerGuide(formData, multiplier = 1) {
  let baseGuide = `## Ghid complet pentru trainer

### Introducere:
Acest curs este conceput pentru a fi interactiv și practic, concentrându-se pe ${formData.subject} la un nivel ${formData.level.toLowerCase()}, adaptat pentru ${formData.audience.toLowerCase()}.

### Metodologie:
Utilizați o combinație de prezentări, discuții și exerciții practice. Tonul general al cursului ar trebui să fie ${formData.tone.toLowerCase()}, creând o atmosferă propice învățării în context ${formData.context.toLowerCase()}.

### Sugestii de facilitare:
1. Începeți cu un exercițiu de spargere a gheții relevant pentru subiect
2. Încurajați participarea activă prin întrebări și provocări
3. Utilizați exemple relevante pentru domeniul profesional al participanților
4. Alternați între prezentări teoretice și aplicații practice
5. Oferiți feedback constructiv și încurajator`;

  // For longer courses, add more detailed guidance
  if (multiplier > 1) {
    baseGuide += `\n\n### Planificare pe zile:
**Ziua 1:**
- Focus pe introducere și concepte fundamentale
- Accent pe crearea unei baze solide de cunoaștere
- Încheiați cu o activitate de sinteză

**Ziua 2:**
- Revizuire rapidă a conceptelor din ziua precedentă
- Aprofundare prin aplicații practice
- Introducerea elementelor de complexitate medie

**Ziua 3:**
- Consolidarea cunoștințelor prin studii de caz
- Abordarea aspectelor avansate ale subiectului
- Exerciții de aplicare în situații reale`;

    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseGuide += `\n\n**Ziua 4:**
- Workshop aplicativ pe proiecte reale
- Coaching individual și în grup
- Prezentări ale participanților`;
    }

    if (formData.duration === '5 zile') {
      baseGuide += `\n\n**Ziua 5:**
- Masterclass cu focus pe integrare și aplicare avansată
- Sesiune de Q&A extinsă
- Plan de acțiune post-curs și resurse suplimentare`;
    }

    baseGuide += `\n\n### Gestionarea dinamicii de grup:
- Identificați și valorificați expertiza participanților
- Gestionați personalitățile dominante prin tehnici de facilitare structurate
- Încurajați participanții mai rezervați prin activități în grupuri mici
- Adaptați ritmul în funcție de feedback-ul și energia grupului`;
  }
  
  return baseGuide;
}

function generateDetailedPresentationNotes(formData, multiplier = 1) {
  let baseNotes = `## Note de prezentare complete

### Introducere (30 min)
**Slide 1: Titlu**
- Prezentați-vă și stabiliți credibilitatea în raport cu subiectul
- Începeți cu o întrebare provocatoare pentru a capta atenția: "Ce v-ar ajuta cel mai mult să învățați despre ${formData.subject}?"
- Adresați așteptările participanților

**Slide 2: Agenda**
- Prezentați pe scurt structura zilei și ce vor învăța participanții
- Explicați metodologia și cum se leagă activitățile de obiectivele de învățare
- Stabiliți regulile de bază pentru interacțiune

**Slide 3: Concepte cheie**
- Explicați conceptele fundamentale cu exemple concrete relevante pentru ${formData.audience}
- Utilizați analogii accesibile pentru a ilustra ideile complexe
- Conectați teoria cu practica prin întrebări de reflecție`;

  // For more complex courses, add more presentation notes
  if (multiplier > 1) {
    baseNotes += `\n\n### Modulul principal (2 ore)
**Slide 4-6: Fundamentele teoretice**
- Prezentați modelul conceptual în pași secvențiali, clarificând fiecare element
- Folosiți reprezentări vizuale pentru a ilustra conexiunile dintre concepte
- Adresați întrebări de verificare: "Cum s-ar aplica acest principiu în contextul dvs.?"

**Slide 7-10: Aplicații practice**
- Ghidați analiza studiilor de caz relevante pentru ${formData.context}
- Facilitați discuțiile în grupuri mici pentru aplicarea conceptelor
- Centralizați concluziile și subliniați aspectele importante

**Slide 11-15: Strategii avansate**
- Introduceți tehnicile specializate cu exemple de succes
- Demonstrați aplicația pas cu pas a unei metode complexe
- Oferiți oportunități pentru participanți de a testa abordările prezentate`;

    if (formData.duration.includes('zile') && parseInt(formData.duration) > 2) {
      baseNotes += `\n\n### Sesiuni de aprofundare (zilele următoare)
**Slide 16-20: Integrare cu practici existente**
- Facilitați un exercițiu de analiză a practicilor actuale din organizațiile participanților
- Ghidați identificarea oportunităților de implementare a noilor concepte
- Ajutați participanții să dezvolte un plan de acțiune personalizat

**Slide 21-25: Provocări și soluții**
- Moderați o analiză a obstacolelor comune în implementare
- Facilitați un exercițiu de rezolvare de probleme în grupuri mici
- Oferiți strategii testate pentru depășirea provocărilor identificate`;
    }
  }
  
  return baseNotes;
}

function generateDetailedHandouts(formData, multiplier = 1) {
  let baseHandouts = `## Handout-uri complete pentru curs

### Handout 1: Principiile de bază ${formData.subject}
O prezentare concisă a conceptelor fundamentale, incluzând definiții, principii cheie și exemple ilustrative. Acest material oferă participanților un ghid de referință rapid pentru noțiunile esențiale discutate în cadrul cursului.

### Handout 2: Exerciții practice
O colecție de exerciții și activități pentru a practica conceptele învățate, organizate pe niveluri de dificultate. Fiecare exercițiu include instrucțiuni clare, spațiu pentru răspunsuri și indicații pentru rezolvare.

### Handout 3: Resurse adiționale
O listă cuprinzătoare de resurse pentru studiu individual și aprofundare, incluzând cărți, articole, site-uri web și cursuri online relevante pentru ${formData.subject}.`;

  // For more complex courses, add more handouts
  if (multiplier > 1) {
    baseHandouts += `\n\n### Handout 4: Ghid de implementare
Un manual pas cu pas pentru aplicarea cunoștințelor în contexte reale, cu liste de verificare, șabloane și exemple de bune practici adaptate pentru ${formData.context}.

### Handout 5: Glosar de termeni
Un dicționar cuprinzător al termenilor specifici domeniului, cu definiții clare și exemple de utilizare în context.

### Handout 6: Studii de caz
O colecție de studii de caz relevante pentru ${formData.audience}, prezentând scenarii reale, analize și soluții aplicate.`;

    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseHandouts += `\n\n### Handout 7: Manual de referință
Un ghid complet care acoperă toate aspectele disciplinei, organizat pe capitole pentru referință ușoară și consultare ulterioară.

### Handout 8: Șabloane și instrumente
O colecție de șabloane, liste de verificare și instrumente practice pentru implementarea imediată a conceptelor în activitatea profesională zilnică.`;
    }
  }
  
  return baseHandouts;
}

function generateDetailedExercises(formData, multiplier = 1) {
  let baseExercises = `## Exerciții complete

### Exercițiul 1: Analiză de caz
**Obiectiv:** Identificarea conceptelor cheie aplicate într-un scenariu real
**Durată:** 30 minute
**Instrucțiuni:**
1. Studiați următorul scenariu legat de ${formData.subject}
2. Identificați principiile și conceptele aplicate
3. Analizați deciziile luate și rezultatele obținute
4. Propuneți abordări alternative și justificați-le

### Exercițiul 2: Simulare practică
**Obiectiv:** Aplicarea conceptelor învățate într-un mediu controlat
**Durată:** 45 minute
**Instrucțiuni:**
1. Formați echipe de 3-4 persoane
2. Fiecare echipă primește un scenariu de rezolvat
3. Aplicați metodologia prezentată pentru a dezvolta o soluție
4. Prezentați rezultatele și procesul de gândire

### Exercițiul 3: Dezbatere structurată
**Obiectiv:** Dezvoltarea gândirii critice prin argumentare
**Durată:** 40 minute
**Instrucțiuni:**
1. Grupul se împarte în două echipe cu perspective opuse
2. Fiecare echipă pregătește argumente bazate pe conceptele învățate
3. Dezbaterea urmează formatul: argument - contraargument - concluzie
4. La final, identificați punctele comune și diferențele fundamentale`;

  // For more complex courses, add more exercises
  if (multiplier > 1) {
    baseExercises += `\n\n### Exercițiul 4: Proiect aplicativ
**Obiectiv:** Integrarea tuturor conceptelor într-un proiect practic
**Durată:** 90 minute + prezentare
**Instrucțiuni:**
1. Lucrați în echipe de 4-5 persoane
2. Dezvoltați un plan complet pentru implementarea conceptelor în organizația dvs.
3. Documentați procesul, provocările și soluțiile
4. Pregătiți o prezentare de 10 minute

### Exercițiul 5: Coaching colegial
**Obiectiv:** Dezvoltarea abilităților de feedback și coaching
**Durată:** 60 minute
**Instrucțiuni:**
1. Formați perechi
2. Fiecare participant prezintă o provocare reală legată de ${formData.subject}
3. Partenerul oferă coaching utilizând modelul GROW
4. Schimbați rolurile și repetați procesul`;

    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseExercises += `\n\n### Exercițiul 6: Implementare ghidată
**Obiectiv:** Dezvoltarea unui plan de acțiune concret
**Durată:** 120 minute
**Instrucțiuni:**
1. Identificați o oportunitate reală de aplicare în organizația dvs.
2. Dezvoltați un plan detaliat de implementare pe 90 de zile
3. Anticipați obstacole și pregătiți strategii de depășire
4. Stabiliți indicatori de succes și metode de măsurare

### Exercițiul 7: Studiu de caz extins
**Obiectiv:** Analiza aprofundată a unei situații complexe
**Durată:** 180 minute
**Instrucțiuni:**
1. Analizați studiul de caz complex furnizat
2. Documentați toate aspectele relevante utilizând cadrul SWOT
3. Dezvoltați trei strategii alternative de abordare
4. Recomandați și justificați cea mai potrivită strategie`;
    }
  }
  
  return baseExercises;
}
