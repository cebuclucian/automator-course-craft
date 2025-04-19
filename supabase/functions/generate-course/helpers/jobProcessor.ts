import { jobStore } from "../index.ts";
import { mockCourseData } from "./mockData.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const JOB_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 ore

export async function processJob(jobId: string, prompt: string, formData: any) {
  console.log(`JobProcessor: Starting processing job ${jobId}`);
  
  // Verificare existență job în store
  if (!jobStore.has(jobId)) {
    console.error(`JobProcessor: Job ${jobId} nu există în store`);
    return;
  }

  try {
    // Verificare și management job expirat
    const job = jobStore.get(jobId);
    const currentTime = Date.now();
    const jobCreatedTime = new Date(job.startedAt).getTime();
    
    if (currentTime - jobCreatedTime > JOB_EXPIRATION_TIME) {
      console.warn(`JobProcessor: Job ${jobId} a expirat`);
      jobStore.delete(jobId);
      return;
    }

    console.log(`JobProcessor: CLAUDE_API_KEY is ${CLAUDE_API_KEY ? 'configured' : 'missing'}`);
  
    if (!jobStore.has(jobId)) {
      console.error(`JobProcessor: Job ${jobId} doesn't exist in store`);
      return;
    }

    try {
      console.log(`JobProcessor: Sending request to Claude API for job ${jobId}`);
      console.log(`JobProcessor: Prompt length: ${prompt.length} characters`);
      
      // Verificare cheie API
      if (!CLAUDE_API_KEY) {
        throw new Error("Claude API key is missing from environment variables");
      }

      // Verificare dacă job-ul mai există
      const job = jobStore.get(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} no longer exists in store`);
      }

      console.log(`JobProcessor: Calling Claude API for job ${jobId}...`);
      
      // Jurnalizare detalii cerere API
      console.log(`JobProcessor: Request to API with model: claude-3-sonnet-20240229, temperature: 0.7, max_tokens: 16000`);
      console.log(`JobProcessor: System prompt: "Expert in course design and training"`);
      
      // Implementare strategie de reîncercare pentru apelul API
      let response = null;
      let result = null;
      let retries = 0;
      
      while (retries <= MAX_RETRIES) {
        try {
          // Apelare API Claude cu versiunea corectă și formatul actualizat
          response = await fetch('https://api.anthropic.com/v1/messages', {
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

          console.log(`JobProcessor: Response status from Claude API: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`JobProcessor: Claude API Error: ${response.status} - ${errorText}`);
            
            if (retries < MAX_RETRIES) {
              retries++;
              console.log(`JobProcessor: Retrying API call (${retries}/${MAX_RETRIES}) after ${RETRY_DELAY_MS}ms delay...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              continue;
            }
            
            throw new Error(`Claude API Error: ${response.status}`);
          }

          // Procesare răspuns
          result = await response.json();
          console.log(`JobProcessor: Response received from Claude, contains data: ${!!result}`);
          
          if (!result || !result.content || result.content.length === 0) {
            if (retries < MAX_RETRIES) {
              retries++;
              console.log(`JobProcessor: Empty response, retrying (${retries}/${MAX_RETRIES})...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              continue;
            }
            throw new Error("Empty or invalid response from API");
          }
          
          // Am primit un răspuns valid, ieșim din bucla de reîncercări
          break;
        } catch (apiError) {
          console.error(`JobProcessor: API error on try ${retries}:`, apiError);
          if (retries < MAX_RETRIES) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          } else {
            throw apiError; // Reîncercările au eșuat, propagăm eroarea
          }
        }
      }

      // Extragere conținut din răspunsul Claude
      const content = result.content[0].text;
      console.log(`JobProcessor: Content extracted, length: ${content?.length || 0}`);
      console.log(`JobProcessor: First 100 chars of response: ${content?.substring(0, 100)}...`);
      
      // Procesare conținut pentru extragerea secțiunilor necesare
      const sections = parseContentToSections(content, formData);
      console.log(`JobProcessor: Sections extracted: ${sections.length}`);
      
      // Jurnalizare titluri secțiuni pentru debugging
      sections.forEach((section, index) => {
        console.log(`JobProcessor: Section ${index + 1}: ${section.type} - ${section.title}`);
      });

      // Pregătire rezultat final
      const finalResult = {
        sections: sections
      };
      console.log("JobProcessor: Final parsed result to be saved:", JSON.stringify(finalResult));

      // Actualizare job în store
      jobStore.set(jobId, {
        ...job,
        status: 'completed',
        data: finalResult,
        completedAt: new Date().toISOString()
      });

      console.log(`JobProcessor: Job ${jobId} completed successfully, ${sections.length} sections generated`);
    } catch (error) {
      console.error(`JobProcessor: Error processing job ${jobId}:`, error);
      
      // În caz de eroare, asigurăm că job-ul primește un status de eroare
      // dar păstrăm datele mock pentru a evita afișarea unui ecran gol utilizatorului
      if (jobStore.has(jobId)) {
        const job = jobStore.get(jobId);
        
        // Dacă job-ul există dar nu are secțiuni în date, adăugăm secțiuni mock
        let updatedData = job.data;
        if (!updatedData || !updatedData.sections || updatedData.sections.length === 0) {
          updatedData = mockCourseData(formData);
        }
        
        jobStore.set(jobId, {
          ...job,
          status: 'error',
          error: error.message || 'Unknown error processing job',
          data: updatedData,
          completedAt: new Date().toISOString()
        });
        console.log(`JobProcessor: Job ${jobId} marked as error, but with mock data provided`);
      }
    }
  } catch (error) {
    console.error(`JobProcessor: Eroare procesare job ${jobId}:`, error);
    
    // Management erori îmbunătățit
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      status: 'error',
      error: error.message || 'Eroare necunoscută',
      completedAt: new Date().toISOString()
    });
  }
}

// Funcție pentru procesarea răspunsului Claude în secțiuni structurate
function parseContentToSections(content: string, formData: any) {
  console.log(`ParseContent: Starting to parse content, length: ${content.length}`);
  
  try {
    // Verificare dacă conținutul include secțiuni JSON
    if (content.includes('```json')) {
      console.log(`ParseContent: Detected JSON format in response`);
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          console.log(`ParseContent: JSON parsed successfully, sections: ${jsonData.sections?.length || 0}`);
          
          if (jsonData.sections && Array.isArray(jsonData.sections)) {
            return jsonData.sections;
          }
        } catch (jsonError) {
          console.error(`ParseContent: Error parsing JSON:`, jsonError);
        }
      }
    }
    
    // Dacă nu găsim JSON sau interpretarea eșuează, încercăm extragerea secțiunilor manual
    console.log(`ParseContent: Attempting to extract sections manually`);
    
    // Identificare secțiuni principale folosind delimitatori (ex., ## Plan de lecție, ## Slide-uri etc)
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
    
    console.log(`ParseContent: Manually extracted ${sections.length} sections`);
    
    // Dacă tot nu avem secțiuni, folosim întregul conținut ca plan de lecție
    if (sections.length === 0) {
      console.log(`ParseContent: No sections could be extracted, using entire content`);
      sections.push({
        type: 'lesson-plan',
        title: formData.language === 'română' ? 'Plan de lecție' : 'Lesson Plan',
        content: `# ${formData.subject} - ${formData.language === 'română' ? 'Material generat' : 'Generated Material'}\n\n${content.trim()}`
      });
    }
    
    return sections;
    
  } catch (error) {
    console.error(`ParseContent: Error parsing content:`, error);
    
    // Returnăm cel puțin o secțiune pentru a evita erorile în interfața utilizator
    return [{
      type: 'lesson-plan',
      title: formData.language === 'română' ? 'Plan de lecție' : 'Lesson Plan',
      content: `# ${formData.subject}\n\n${formData.language === 'română' ? 'Nu s-a putut genera conținut structurat.' : 'Could not generate structured content.'}`
    }];
  }
}
