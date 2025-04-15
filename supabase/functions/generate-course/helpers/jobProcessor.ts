
import { jobStore } from "../index.ts";
import { mockCourseData } from "./mockData.ts";

// Process job in the background
export async function processJob(jobId, prompt, formData) {
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
