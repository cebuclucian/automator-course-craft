
import { jobStore } from "../index.ts";
import { buildPrompt } from "./promptBuilder.ts";
import { mockCourseData } from "./mockData.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

// Funcție pentru procesarea unui job de generare curs
export async function processJob(jobId: string, prompt: string, formData: any) {
  console.log(`JobProcessor: Începere procesare job ${jobId}`);
  console.log(`JobProcessor: CLAUDE_API_KEY este ${CLAUDE_API_KEY ? 'configurat' : 'lipsă'}`);
  
  if (!jobStore.has(jobId)) {
    console.error(`JobProcessor: Job-ul ${jobId} nu există în store`);
    return;
  }

  try {
    console.log(`JobProcessor: Trimitere request către API Claude pentru job ${jobId}`);
    console.log(`JobProcessor: Prompt length: ${prompt.length} caractere`);
    
    // Verificare cheie API
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key lipsește din variabilele de mediu");
    }

    // Verificare job existent
    const job = jobStore.get(jobId);
    if (!job) {
      throw new Error(`Job-ul ${jobId} nu mai există în store`);
    }

    console.log(`JobProcessor: Apel API Claude pentru job ${jobId}...`);

    // Apelare API Anthropic/Claude pentru generarea conținutului
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 16000,
        temperature: 0.7,
        system: "Ești un expert în design de cursuri și training. Vei genera materiale de curs complete bazate pe informațiile furnizate.",
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    console.log(`JobProcessor: Response status de la Claude API: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`JobProcessor: Eroare API Claude: ${response.status} - ${errorText}`);
      throw new Error(`Eroare API Claude: ${response.status}`);
    }

    // Procesare răspuns
    const result = await response.json();
    console.log(`JobProcessor: Răspuns primit de la Claude, conține date: ${!!result}`);
    console.log(`JobProcessor: Content length: ${result.content?.length || 0}`);
    
    if (!result || !result.content || result.content.length === 0) {
      throw new Error("Răspuns gol sau invalid de la API");
    }

    // Extragere conținut din răspunsul Claude
    const content = result.content[0].text;
    console.log(`JobProcessor: Conținut extras, lungime: ${content?.length || 0}`);
    
    // Parsare conținut pentru a extrage secțiunile necesare
    const sections = parseContentToSections(content, formData);
    console.log(`JobProcessor: Secțiuni extrase: ${sections.length}`);

    // Actualizare job în store
    jobStore.set(jobId, {
      ...job,
      status: 'completed',
      data: {
        ...job.data,
        sections: sections
      },
      completedAt: new Date().toISOString()
    });

    console.log(`JobProcessor: Job ${jobId} finalizat cu succes, ${sections.length} secțiuni generate`);
  } catch (error) {
    console.error(`JobProcessor: Eroare în procesarea job-ului ${jobId}:`, error);
    
    // În caz de eroare, asigură-te că jobul primește un status de eroare
    // dar menține datele mock pentru a nu afișa un ecran gol utilizatorului
    if (jobStore.has(jobId)) {
      const job = jobStore.get(jobId);
      
      // Dacă job-ul există dar nu are secțiuni în data, adaugă secțiuni mock
      let updatedData = job.data;
      if (!updatedData || !updatedData.sections || updatedData.sections.length === 0) {
        updatedData = mockCourseData(formData);
      }
      
      jobStore.set(jobId, {
        ...job,
        status: 'error',
        error: error.message || 'Eroare necunoscută în procesarea job-ului',
        data: updatedData,
        completedAt: new Date().toISOString()
      });
      console.log(`JobProcessor: Job ${jobId} marcat ca error, dar cu date mock furnizate`);
    }
  }
}

// Funcție pentru parsarea răspunsului Claude în secțiuni structurate
function parseContentToSections(content: string, formData: any) {
  console.log(`ParseContent: Începere parsare conținut, lungime: ${content.length}`);
  
  try {
    // Verifică dacă conținutul include secțiuni JSON
    if (content.includes('```json')) {
      console.log(`ParseContent: Detectat format JSON în răspuns`);
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          console.log(`ParseContent: JSON parsat cu succes, secțiuni: ${jsonData.sections?.length || 0}`);
          
          if (jsonData.sections && Array.isArray(jsonData.sections)) {
            return jsonData.sections;
          }
        } catch (jsonError) {
          console.error(`ParseContent: Eroare parsare JSON:`, jsonError);
        }
      }
    }
    
    // Dacă nu găsim JSON sau parsarea eșuează, încercăm să extragem secțiunile manual
    console.log(`ParseContent: Încercare extragere manuală a secțiunilor`);
    
    // Identifică secțiunile principale folosind delimitatori (ex: ## Plan de lecție, ## Slide-uri, etc)
    const lessonPlanMatch = content.match(/(?:##\s*Plan de lecție|##\s*Lesson Plan)([\s\S]*?)(?=##|$)/i);
    const slidesMatch = content.match(/(?:##\s*Slide-uri|##\s*Prezentare|##\s*Slides)([\s\S]*?)(?=##|$)/i);
    const notesMatch = content.match(/(?:##\s*Note pentru trainer|##\s*Trainer Notes)([\s\S]*?)(?=##|$)/i);
    const exercisesMatch = content.match(/(?:##\s*Exerciții|##\s*Exercises)([\s\S]*?)(?=##|$)/i);
    
    const sections = [];
    
    if (lessonPlanMatch && lessonPlanMatch[1]) {
      sections.push({
        type: 'lesson-plan',
        title: formData.language === 'română' ? 'Plan de lecție' : 'Lesson Plan',
        content: `# ${formData.subject} - ${formData.language === 'română' ? 'Plan de lecție' : 'Lesson Plan'}\n\n${lessonPlanMatch[1].trim()}`
      });
    }
    
    if (slidesMatch && slidesMatch[1]) {
      sections.push({
        type: 'slides',
        title: formData.language === 'română' ? 'Slide-uri prezentare' : 'Presentation Slides',
        content: `# ${formData.subject} - ${formData.language === 'română' ? 'Slide-uri prezentare' : 'Presentation Slides'}\n\n${slidesMatch[1].trim()}`
      });
    }
    
    if (notesMatch && notesMatch[1]) {
      sections.push({
        type: 'trainer-notes',
        title: formData.language === 'română' ? 'Note pentru trainer' : 'Trainer Notes',
        content: `# ${formData.subject} - ${formData.language === 'română' ? 'Note pentru trainer' : 'Trainer Notes'}\n\n${notesMatch[1].trim()}`
      });
    }
    
    if (exercisesMatch && exercisesMatch[1]) {
      sections.push({
        type: 'exercises',
        title: formData.language === 'română' ? 'Exerciții' : 'Exercises',
        content: `# ${formData.subject} - ${formData.language === 'română' ? 'Exerciții' : 'Exercises'}\n\n${exercisesMatch[1].trim()}`
      });
    }
    
    console.log(`ParseContent: Extrase manual ${sections.length} secțiuni`);
    
    // Dacă tot nu avem secțiuni, folosim conținutul integral ca plan de lecție
    if (sections.length === 0) {
      console.log(`ParseContent: Nu s-au putut extrage secțiuni, folosim conținutul integral`);
      sections.push({
        type: 'lesson-plan',
        title: formData.language === 'română' ? 'Plan de lecție' : 'Lesson Plan',
        content: `# ${formData.subject} - ${formData.language === 'română' ? 'Material generat' : 'Generated Material'}\n\n${content.trim()}`
      });
    }
    
    return sections;
    
  } catch (error) {
    console.error(`ParseContent: Eroare la parsarea conținutului:`, error);
    
    // Returnează cel puțin o secțiune pentru a evita erorile UI
    return [{
      type: 'lesson-plan',
      title: formData.language === 'română' ? 'Plan de lecție' : 'Lesson Plan',
      content: `# ${formData.subject}\n\n${formData.language === 'română' ? 'Nu s-a putut genera conținut structurat.' : 'Could not generate structured content.'}`
    }];
  }
}
