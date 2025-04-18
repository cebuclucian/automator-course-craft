
import { jobStore } from "../index.ts";
import { mockCourseData } from "./mockData.ts";

// Process job in the background
export async function processJob(jobId, prompt, formData) {
  try {
    console.log(`[${jobId}] Processing job in background`);
    console.log(`[${jobId}] Form data:`, JSON.stringify(formData));
    console.log(`[${jobId}] Prompt length: ${prompt.length} characters`);
    
    // For demo purposes, simulate different processing times based on course duration
    let processingTime = 5000; // default 5 seconds
    
    if (formData.duration === '1 zi' || formData.duration === '1 day') {
      processingTime = 15000; // 15 seconds
    } else if (formData.duration.includes('zile') || formData.duration.includes('days')) {
      const days = parseInt(formData.duration.split(' ')[0]);
      processingTime = Math.min(30000, days * 8000); // Cap at 30 seconds max
    }
    
    console.log(`[${jobId}] Simulated processing time: ${processingTime}ms`);
    
    // Update job status to indicate processing has started and ensure it's saved in the store
    const existingJob = jobStore.get(jobId) || {};
    jobStore.set(jobId, {
      ...existingJob,
      processingStarted: new Date().toISOString(),
      status: 'processing',
      formData, // Save formData in case it wasn't saved before
    });
    
    // Log the current job store size for debugging
    console.log(`[${jobId}] Current job store size: ${jobStore.size}`);
    console.log(`[${jobId}] Job keys in store: ${[...jobStore.keys()].join(', ')}`);
    
    // Simulate processing
    console.log(`[${jobId}] Starting processing simulation`);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    console.log(`[${jobId}] Processing simulation completed`);
    
    // In a real implementation, we'd call the Claude API here
    // For now, we'll just update the job with mock data
    const mockResult = mockCourseData(formData);
    
    // Asigurăm-ne că mockResult are secțiunile necesare
    if (!mockResult.sections || mockResult.sections.length === 0) {
      mockResult.sections = [
        { 
          type: 'lesson-plan', 
          content: `# Plan de lecție: ${formData.subject}\n\n## Obiective\n- Înțelegerea conceptelor de bază\n- Dezvoltarea abilităților practice\n- Aplicarea cunoștințelor în scenarii reale`
        },
        { 
          type: 'slides', 
          content: `# Prezentare: ${formData.subject}\n\n## Slide 1: Introducere\n- Despre acest curs\n- Importanța subiectului\n- Ce vom învăța`
        },
        { 
          type: 'trainer-notes', 
          content: `# Note pentru trainer: ${formData.subject}\n\n## Pregătire\n- Asigurați-vă că toate materialele sunt disponibile\n- Verificați echipamentele\n\n## Sfaturi de livrare\n- Începeți cu o activitate de spargere a gheții\n- Folosiți exemple relevante pentru audiență`
        },
        { 
          type: 'exercises', 
          content: `# Exerciții: ${formData.subject}\n\n## Exercițiul 1: Aplicare practică\n**Timp**: 15 minute\n**Materiale**: Fișe de lucru\n\n**Instrucțiuni**:\n1. Împărțiți participanții în grupuri de 3-4 persoane\n2. Distribuiți fișele de lucru\n3. Acordați 10 minute pentru rezolvare\n4. Facilitați o discuție de 5 minute despre soluții`
        }
      ];
    }
    
    // Double-check the job still exists in the store before updating
    if (!jobStore.has(jobId)) {
      console.log(`[${jobId}] Warning: Job no longer exists in store after processing, recreating it`);
    }
    
    // Update existing job or create a new one
    const updatedJob = {
      status: 'completed',
      formData,
      startedAt: existingJob?.startedAt || new Date().toISOString(),
      processingStarted: existingJob?.processingStarted || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      data: mockResult
    };
    
    // Save the updated job
    jobStore.set(jobId, updatedJob);
    
    // Log the successful update
    console.log(`[${jobId}] Job completed successfully, data sections: ${mockResult.sections.length}`);
    console.log(`[${jobId}] Current job store size after completion: ${jobStore.size}`);
    
    // Clean up old jobs periodically (in a real system this would be handled differently)
    setTimeout(() => {
      if (jobStore.has(jobId)) {
        jobStore.delete(jobId);
        console.log(`[${jobId}] Cleaned up job from memory after 1 hour`);
      }
    }, 3600000); // 1 hour
    
    return mockResult;
  } catch (error) {
    console.error(`[${jobId}] Error processing job:`, error);
    
    // Make sure to update the job status even in case of error
    const existingJob = jobStore.get(jobId) || {};
    jobStore.set(jobId, {
      status: 'error',
      formData,
      startedAt: existingJob?.startedAt || new Date().toISOString(),
      processingStarted: existingJob?.processingStarted || new Date().toISOString(),
      error: error.message || 'Unknown error during processing',
      errorTimestamp: new Date().toISOString()
    });
    
    throw error;
  }
}
