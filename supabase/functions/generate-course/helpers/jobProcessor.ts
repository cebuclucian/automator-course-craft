
import { jobStore } from "../index.ts";
import { mockCourseData } from "./mockData.ts";

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

// Function to process a course generation job
export async function processJob(jobId: string, prompt: string, formData: any) {
  console.log(`JobProcessor: Starting processing job ${jobId}`);
  console.log(`JobProcessor: CLAUDE_API_KEY is ${CLAUDE_API_KEY ? 'configured' : 'missing'}`);
  
  if (!jobStore.has(jobId)) {
    console.error(`JobProcessor: Job ${jobId} doesn't exist in store`);
    return;
  }

  try {
    console.log(`JobProcessor: Sending request to Claude API for job ${jobId}`);
    console.log(`JobProcessor: Prompt length: ${prompt.length} characters`);
    
    // Check API key
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key is missing from environment variables");
    }

    // Check if job still exists
    const job = jobStore.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} no longer exists in store`);
    }

    console.log(`JobProcessor: Calling Claude API for job ${jobId}...`);

    // CRITICAL: Log the API request details
    console.log(`JobProcessor: Request to API with model: claude-3-sonnet-20240229, temperature: 0.7, max_tokens: 16000`);
    console.log(`JobProcessor: System prompt: "Expert in course design and training"`);
    console.log(`JobProcessor: First 100 chars of prompt: ${prompt.substring(0, 100)}...`);

    // Call Anthropic/Claude API to generate content
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

    console.log(`JobProcessor: Response status from Claude API: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`JobProcessor: Claude API Error: ${response.status} - ${errorText}`);
      throw new Error(`Claude API Error: ${response.status}`);
    }

    // Process response
    const result = await response.json();
    console.log(`JobProcessor: Response received from Claude, contains data: ${!!result}`);
    console.log(`JobProcessor: Content length: ${result.content?.length || 0}`);
    
    if (!result || !result.content || result.content.length === 0) {
      throw new Error("Empty or invalid response from API");
    }

    // Extract content from Claude response
    const content = result.content[0].text;
    console.log(`JobProcessor: Content extracted, length: ${content?.length || 0}`);
    console.log(`JobProcessor: First 100 chars of response: ${content?.substring(0, 100)}...`);
    
    // Parse content to extract needed sections
    const sections = parseContentToSections(content, formData);
    console.log(`JobProcessor: Sections extracted: ${sections.length}`);
    
    // Log each section title for debugging
    sections.forEach((section, index) => {
      console.log(`JobProcessor: Section ${index + 1}: ${section.type} - ${section.title}`);
    });

    // Prepare the final result
    const finalResult = {
      sections: sections
    };
    console.log("JobProcessor: Final parsed result to be saved:", JSON.stringify(finalResult));

    // Update job in store
    jobStore.set(jobId, {
      ...job,
      status: 'completed',
      data: finalResult,
      completedAt: new Date().toISOString()
    });

    console.log(`JobProcessor: Job ${jobId} completed successfully, ${sections.length} sections generated`);
  } catch (error) {
    console.error(`JobProcessor: Error processing job ${jobId}:`, error);
    
    // In case of error, ensure the job gets an error status
    // but keep the mock data to avoid showing an empty screen to the user
    if (jobStore.has(jobId)) {
      const job = jobStore.get(jobId);
      
      // If job exists but has no sections in data, add mock sections
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
}

// Function to parse Claude response into structured sections
function parseContentToSections(content: string, formData: any) {
  console.log(`ParseContent: Starting to parse content, length: ${content.length}`);
  
  try {
    // Check if content includes JSON sections
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
    
    // If we don't find JSON or parsing fails, try to extract sections manually
    console.log(`ParseContent: Attempting to extract sections manually`);
    
    // Identify main sections using delimiters (e.g., ## Lesson Plan, ## Slides, etc)
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
    
    // If we still have no sections, use the entire content as a lesson plan
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
    
    // Return at least one section to avoid UI errors
    return [{
      type: 'lesson-plan',
      title: formData.language === 'română' ? 'Plan de lecție' : 'Lesson Plan',
      content: `# ${formData.subject}\n\n${formData.language === 'română' ? 'Nu s-a putut genera conținut structurat.' : 'Could not generate structured content.'}`
    }];
  }
}
