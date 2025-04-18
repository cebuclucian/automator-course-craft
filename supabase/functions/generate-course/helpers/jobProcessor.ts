
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
    
    // Update job status to indicate processing has started
    jobStore.set(jobId, {
      ...jobStore.get(jobId),
      processingStarted: new Date().toISOString(),
      status: 'processing',
    });
    
    // Simulate processing
    console.log(`[${jobId}] Starting processing simulation`);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    console.log(`[${jobId}] Processing simulation completed`);
    
    // In a real implementation, we'd call the Claude API here
    // For now, we'll just update the job with mock data
    const mockResult = mockCourseData(formData);
    
    // Ensure the job still exists in the store (it might have been deleted)
    if (!jobStore.has(jobId)) {
      console.log(`[${jobId}] Job no longer exists in store, creating a new entry`);
      jobStore.set(jobId, {
        status: 'completed',
        formData,
        startedAt: new Date().toISOString(),
        processingStarted: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: mockResult
      });
    } else {
      // Update existing job
      jobStore.set(jobId, {
        status: 'completed',
        formData,
        startedAt: jobStore.get(jobId)?.startedAt || new Date().toISOString(),
        processingStarted: jobStore.get(jobId)?.processingStarted || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        data: mockResult
      });
    }
    
    console.log(`[${jobId}] Job completed successfully, data size: ${JSON.stringify(mockResult).length} bytes`);
    
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
    if (jobStore.has(jobId)) {
      jobStore.set(jobId, {
        status: 'error',
        formData,
        startedAt: jobStore.get(jobId)?.startedAt || new Date().toISOString(),
        processingStarted: jobStore.get(jobId)?.processingStarted || new Date().toISOString(),
        error: error.message || 'Unknown error during processing',
        errorTimestamp: new Date().toISOString()
      });
    }
    
    throw error;
  }
}
