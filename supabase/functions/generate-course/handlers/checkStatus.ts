
import { JobStore } from "../helpers/jobProcessor.ts";
import { Job } from "../index.ts";

interface StatusCheckResult {
  status: string;
  jobId: string;
  progressPercent: number;
  error?: string;
  errorDetails?: any;
  statusMessage?: string;
  milestone?: string;
  data?: any;
  partialData?: any;
  jobBlocked?: boolean;
}

export async function checkStatus(
  requestData: any,
  jobStore: JobStore
): Promise<StatusCheckResult> {
  try {
    console.log("CheckStatus - Request primit la", new Date().toISOString(), "pentru jobId:", requestData.jobId);
    console.log("CheckStatus - Verificare status pentru job:", requestData.jobId);
    
    // Diagnostic - verificare dimensiune JobStore
    console.log("CheckStatus - JobStore size:", jobStore.size);
    if (jobStore.size === 0) {
      console.log("CheckStatus - JobStore keys: ");
    } else {
      console.log("CheckStatus - JobStore keys:", Array.from(jobStore.keys()).join(", "));
    }
    
    const job = jobStore.get(requestData.jobId);
    
    if (!job) {
      console.error(`CheckStatus - Job ${requestData.jobId} nu există în store`);
      
      return {
        status: "not_found",
        jobId: requestData.jobId,
        progressPercent: 0,
        error: `Job-ul cu ID-ul ${requestData.jobId} nu a fost găsit. Acesta fie nu a fost creat, fie a expirat.`
      };
    }
    
    console.log(`CheckStatus - Job ${requestData.jobId} găsit cu statusul:`, job.status);
    
    // Verificare dacă job-ul pare blocat (nu a fost actualizat în ultimele 30 de secunde)
    const now = new Date();
    const lastUpdate = new Date(job.updatedAt);
    const secondsSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;
    const jobBlocked = job.status === 'processing' && secondsSinceUpdate > 30;
    
    if (jobBlocked) {
      console.log(`CheckStatus - Job ${requestData.jobId} posibil blocat - ultima actualizare acum ${secondsSinceUpdate.toFixed(1)} secunde`);
    }
    
    // Returnăm statusul curent
    const result: StatusCheckResult = {
      status: job.status,
      jobId: job.id,
      progressPercent: job.progressPercent,
      statusMessage: job.statusMessage,
      milestone: job.milestone,
      data: job.data,
      jobBlocked
    };
    
    // Adăugăm detalii despre eroare, dacă există
    if (job.error) {
      result.error = job.error;
      result.errorDetails = job.errorDetails;
    }
    
    // Pentru datele parțiale
    if (job.partialData) {
      result.partialData = job.partialData;
    }
    
    return result;
    
  } catch (error: any) {
    console.error("CheckStatus - Eroare la verificarea status-ului:", error);
    
    return {
      status: "error",
      jobId: requestData.jobId || "unknown",
      progressPercent: 0,
      error: `Eroare la verificarea status-ului: ${error.message || "Eroare necunoscută"}`,
      errorDetails: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    };
  }
}
