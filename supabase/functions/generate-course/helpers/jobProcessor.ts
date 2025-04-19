import { jobStore } from "../index.ts";
import { mockCourseData } from "./mockData.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const JOB_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

const cleanupJobs = () => {
  console.log("JobProcessor: Starting job cleanup");
  const now = Date.now();
  let cleanedCount = 0;

  jobStore.forEach((job, jobId) => {
    if (!job.startedAt) {
      console.warn(`JobProcessor: Job ${jobId} has no startedAt timestamp`);
      return;
    }

    const jobAge = now - new Date(job.startedAt).getTime();
    if (jobAge > JOB_EXPIRATION_TIME) {
      console.log(`JobProcessor: Removing expired job ${jobId} (age: ${jobAge}ms)`);
      jobStore.delete(jobId);
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`JobProcessor: Cleaned up ${cleanedCount} expired jobs`);
  }
};

const cleanup = setInterval(cleanupJobs, CLEANUP_INTERVAL);

addEventListener('beforeunload', () => {
  clearInterval(cleanup);
});

export async function processJob(jobId: string, prompt: string, formData: any) {
  console.log(`JobProcessor: Starting processing job ${jobId}`);
  
  try {
    // Job existence and expiration check
    const job = jobStore.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in store`);
    }

    const currentTime = Date.now();
    const jobCreatedTime = new Date(job.startedAt).getTime();
    
    if (currentTime - jobCreatedTime > JOB_EXPIRATION_TIME) {
      console.warn(`JobProcessor: Job ${jobId} has expired`);
      jobStore.delete(jobId);
      throw new Error(`Job ${jobId} has expired`);
    }

    // API key validation
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key is missing from environment variables");
    }

    console.log(`JobProcessor: Calling Claude API for job ${jobId}`);
    
    // API call implementation with retries
    let response = null;
    let result = null;
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      try {
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
            system: "You are an expert in course design and training. You will generate complete course materials based on the provided information.",
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
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
            continue;
          }
          throw new Error(`Claude API Error: ${response.status}`);
        }

        result = await response.json();
        console.log(`JobProcessor: Response received from Claude for job ${jobId}`);
        
        if (!result || !result.content || result.content.length === 0) {
          if (retries < MAX_RETRIES) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
            continue;
          }
          throw new Error("Empty or invalid response from API");
        }
        
        break;
      } catch (apiError) {
        console.error(`JobProcessor: API error on try ${retries}:`, apiError);
        if (retries < MAX_RETRIES) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
        } else {
          throw apiError;
        }
      }
    }

    // Extract and process content
    const content = result.content[0].text;
    console.log(`JobProcessor: Content extracted for job ${jobId}, length: ${content?.length || 0}`);
    
    const sections = parseContentToSections(content, formData);
    console.log(`JobProcessor: ${sections.length} sections extracted for job ${jobId}`);

    // Update job with success status
    jobStore.set(jobId, {
      ...job,
      status: 'completed',
      data: { sections },
      completedAt: new Date().toISOString()
    });

    console.log(`JobProcessor: Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`JobProcessor: Error processing job ${jobId}:`, error);
    
    const job = jobStore.get(jobId);
    if (job) {
      // Provide mock data on error to avoid blank screens
      const mockData = mockCourseData(formData);
      jobStore.set(jobId, {
        ...job,
        status: 'error',
        error: error.message || 'Unknown error',
        data: mockData,
        completedAt: new Date().toISOString()
      });
    }
    
    throw error;
  }
}

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
