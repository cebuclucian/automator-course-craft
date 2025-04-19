
import { jobStore } from "../index.ts";
import { mockCourseData } from "./mockData.ts";
import { buildPrompt } from "./promptBuilder.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const JOB_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const SECTION_PATTERN = /\[ÎNCEPUT_SECȚIUNE: (.*?)\]([\s\S]*?)\[SFÂRȘIT_SECȚIUNE: \1\]/g;
const CATEGORY_PATTERN = /\[ÎNCEPUT_CATEGORIE: (.*?)\]([\s\S]*?)\[SFÂRȘIT_CATEGORIE: \1\]/g;

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

// Funcție pentru extragerea secțiunilor și categoriilor din textul generat
const extractSectionsAndCategories = (content: string) => {
  const sections = [];
  const categories = [];
  let match;

  // Extragem secțiunile principale
  while ((match = SECTION_PATTERN.exec(content)) !== null) {
    const sectionName = match[1].trim();
    const sectionContent = match[2].trim();
    
    sections.push({
      title: sectionName,
      content: sectionContent,
      type: sectionName.toLowerCase().replace(/\s+/g, '-')
    });
  }

  // Resetăm indexul pentru a căuta din nou în text
  CATEGORY_PATTERN.lastIndex = 0;
  
  // Extragem categoriile pentru "Contul meu"
  while ((match = CATEGORY_PATTERN.exec(content)) !== null) {
    const categoryName = match[1].trim();
    const categoryContent = match[2].trim();
    
    categories.push({
      title: categoryName,
      content: categoryContent,
      type: categoryName.toLowerCase().replace(/\s+/g, '-')
    });
  }

  return { sections, categories };
};

export async function processJob(jobId: string, prompt: string, formData: any) {
  console.log(`JobProcessor: Starting processing job ${jobId} at ${new Date().toISOString()}`);
  
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
      jobStore.set(jobId, {
        ...job,
        status: 'error',
        error: `Job expired after ${JOB_EXPIRATION_TIME/1000/60} minutes`,
        completedAt: new Date().toISOString()
      });
      jobStore.delete(jobId);
      throw new Error(`Job ${jobId} has expired`);
    }

    // API key validation
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key is missing from environment variables");
    }

    // Update job status to indicate active processing
    jobStore.set(jobId, {
      ...job,
      status: 'processing',
      processingStartedAt: new Date().toISOString(),
      sections: [], // Inițializăm array-ul pentru secțiuni
      processedSections: 0,  // Inițializăm contor pentru secțiuni procesate
      totalSections: 12  // Număr fix de secțiuni conform promptului
    });

    console.log(`JobProcessor: Calling Claude API for job ${jobId}`);
    
    // API call implementation with retries
    let response = null;
    let result = null;
    let retries = 0;
    
    // Update job progress milestone
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      milestone: 'api_call_started',
      lastUpdated: new Date().toISOString()
    });
    
    while (retries <= MAX_RETRIES) {
      try {
        console.log(`JobProcessor: Attempt ${retries + 1} of ${MAX_RETRIES + 1} for job ${jobId}`);
        
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

        console.log(`JobProcessor: Response status from Claude API: ${response.status} for job ${jobId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`JobProcessor: Claude API Error for job ${jobId}: ${response.status} - ${errorText}`);
          
          // Update job with API error details
          jobStore.set(jobId, {
            ...jobStore.get(jobId),
            lastApiStatus: response.status,
            lastApiError: errorText,
            lastUpdated: new Date().toISOString()
          });
          
          if (retries < MAX_RETRIES) {
            retries++;
            const delay = RETRY_DELAY_MS * retries;
            console.log(`JobProcessor: Retrying job ${jobId} in ${delay}ms (attempt ${retries} of ${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Claude API Error: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        // Update job progress milestone
        jobStore.set(jobId, {
          ...jobStore.get(jobId),
          milestone: 'api_response_received',
          lastUpdated: new Date().toISOString()
        });

        result = await response.json();
        console.log(`JobProcessor: Response received from Claude for job ${jobId}`);
        
        if (!result || !result.content || result.content.length === 0) {
          console.error(`JobProcessor: Empty or invalid response from API for job ${jobId}:`, result);
          
          // Update job with empty response error
          jobStore.set(jobId, {
            ...jobStore.get(jobId),
            lastApiResponseEmpty: true,
            lastUpdated: new Date().toISOString()
          });
          
          if (retries < MAX_RETRIES) {
            retries++;
            const delay = RETRY_DELAY_MS * retries;
            console.log(`JobProcessor: Retrying job ${jobId} due to empty response in ${delay}ms (attempt ${retries} of ${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error("Empty or invalid response from API");
        }
        
        break;
      } catch (apiError) {
        console.error(`JobProcessor: API error on try ${retries} for job ${jobId}:`, apiError);
        
        // Update job with API error
        jobStore.set(jobId, {
          ...jobStore.get(jobId),
          lastApiError: apiError.message || "Unknown API error",
          lastUpdated: new Date().toISOString()
        });
        
        if (retries < MAX_RETRIES) {
          retries++;
          const delay = RETRY_DELAY_MS * retries;
          console.log(`JobProcessor: Retrying after API error for job ${jobId} in ${delay}ms (attempt ${retries} of ${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw apiError;
        }
      }
    }

    // Update job progress milestone
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      milestone: 'processing_content',
      lastUpdated: new Date().toISOString()
    });

    // Extract content
    const content = result.content[0].text;
    console.log(`JobProcessor: Content extracted for job ${jobId}, length: ${content?.length || 0}`);
    
    // Procesare asincronă secțiune cu secțiune
    try {
      // Extragem secțiunile și categoriile din conținut
      const { sections, categories } = extractSectionsAndCategories(content);
      console.log(`JobProcessor: Extracted ${sections.length} sections and ${categories.length} categories for job ${jobId}`);
      
      // Actualizăm numărul total de secțiuni găsite
      if (sections.length > 0) {
        jobStore.set(jobId, {
          ...jobStore.get(jobId),
          totalSections: sections.length
        });
      }

      // Procesare incrementală a secțiunilor (simulare)
      let processedCount = 0;
      const delay = 500; // Delay între actualizări pentru a simula procesarea incrementală
      
      // Folosim două arrays - unul pentru secțiuni deja procesate, altul pentru toate secțiunile
      const processedSections = [];
      const allSections = [];
      
      // Adăugăm categoriile la secțiuni
      if (categories.length > 0) {
        allSections.push({
          title: "Categorii pentru Contul Meu",
          type: "categories",
          categories // Stocăm categoriile ca sub-obiecte
        });
      }
      
      // Procesăm fiecare secțiune și o adăugăm incremental
      for (const section of sections) {
        // Simulăm procesarea secțiunii
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Adăugăm secțiunea curentă la cele procesate
        processedSections.push(section);
        allSections.push(section);
        processedCount++;
        
        // Actualizăm job-ul cu secțiunile procesate până acum
        jobStore.set(jobId, {
          ...jobStore.get(jobId),
          sections: [...processedSections], // Copiem array-ul pentru a evita referințele
          processedSections: processedCount,
          lastUpdated: new Date().toISOString()
        });
        
        console.log(`JobProcessor: Processed section ${processedCount}/${sections.length} for job ${jobId}: ${section.title}`);
      }
      
      // După procesarea tuturor secțiunilor, finalizăm job-ul
      jobStore.set(jobId, {
        ...jobStore.get(jobId),
        status: 'completed',
        data: { sections: allSections }, // Pentru compatibilitate cu format vechi
        sections: allSections, // Pentru noul format
        completedAt: new Date().toISOString(),
        milestone: 'completed',
        processedSections: processedCount,
        lastUpdated: new Date().toISOString()
      });
      
      console.log(`JobProcessor: Job ${jobId} completed successfully with ${processedCount} sections at ${new Date().toISOString()}`);
    } catch (processingError) {
      console.error(`JobProcessor: Error processing content for job ${jobId}:`, processingError);
      
      // Încercăm să facem fallback la metoda originală de procesare
      console.log(`JobProcessor: Attempting fallback processing for job ${jobId}`);
      
      // Creăm secțiuni simple bazate pe conținutul complet
      const simpleSections = [
        {
          title: "Material de curs",
          content: content,
          type: "complete-course"
        }
      ];
      
      jobStore.set(jobId, {
        ...jobStore.get(jobId),
        status: 'completed',
        data: { sections: simpleSections },
        sections: simpleSections,
        completedAt: new Date().toISOString(),
        milestone: 'completed',
        processedSections: 1,
        totalSections: 1,
        lastUpdated: new Date().toISOString(),
        processingError: processingError.message || "Eroare la procesarea conținutului"
      });
      
      console.log(`JobProcessor: Job ${jobId} completed with fallback processing at ${new Date().toISOString()}`);
    }
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
        data: mockData, // Always provide fallback data
        completedAt: new Date().toISOString(),
        milestone: 'error',
        lastUpdated: new Date().toISOString()
      });
      
      console.log(`JobProcessor: Job ${jobId} marked as error, fallback content provided`);
    }
    
    throw error;
  }
}
