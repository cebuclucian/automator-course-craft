import { JobStore } from "../helpers/jobProcessor.ts";
import { buildPrompt } from "../helpers/promptBuilder.ts";
import { generateMockStructureData, MockGenerationType } from "../helpers/mockGenerators/courseStructure.ts";
import { CourseFormData } from "../types.ts";
import { Job } from "../index.ts";

interface StartJobResult {
  success: boolean;
  status?: string;
  jobId?: string;
  error?: string;
  milestone?: string;
  errorDetails?: any;
}

export async function startJob(
  requestData: any,
  jobStore: JobStore,
  apiKey: string | undefined
): Promise<StartJobResult> {
  try {
    console.log("StartJob - Inițiere job nou de generare");
    
    // Validare date formular
    const formData = requestData.formData as CourseFormData;
    if (!formData || !formData.subject) {
      console.error("StartJob - Date formular incomplete");
      return {
        success: false,
        error: "Formular incomplet. Vă rugăm să completați toate câmpurile obligatorii."
      };
    }

    // Creăm un nou job
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    console.log(`StartJob - Creare job cu ID: ${jobId}`);

    // Generăm prompt-ul pentru Claude
    console.log("StartJob - Generare prompt pentru API Claude");
    const prompt = buildPrompt(formData);
    console.log(`StartJob - Lungime prompt: ${prompt.length} caractere`);
    console.log(`StartJob - Primele 150 caractere din prompt: ${prompt.substring(0, 150)}...`);
    
    // Setăm starea inițială a job-ului
    const newJob: Job = {
      id: jobId,
      status: "processing",
      formData: formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progressPercent: 5,
      milestone: "job_created",
      statusMessage: "Job creat, se inițiază procesarea"
    };
    
    console.log(`StartJob - Stocare job în JobStore`);
    jobStore.set(jobId, newJob);
    
    // Verificare API key pentru Claude
    if (!apiKey) {
      console.error("StartJob - API key Claude lipsește");
      newJob.status = "error";
      newJob.error = "API key pentru Claude lipsește. Contactați administratorul.";
      newJob.errorDetails = { missingApiKey: true };
      jobStore.set(jobId, newJob);
      
      return {
        success: false,
        status: "error",
        error: "API key pentru Claude lipsește. Contactați administratorul.",
        jobId
      };
    }
    
    // În mod normal aici am face o procesare asincronă, dar pentru acest exemplu
    // vom folosi setTimeout pentru a simula procesarea în background
    setTimeout(async () => {
      try {
        console.log(`StartJob - Începere procesare asincronă pentru jobId: ${jobId}`);
        
        // Actualizare stare job
        let job = jobStore.get(jobId);
        if (!job) {
          console.error(`StartJob - Job ${jobId} nu mai există în store`);
          return;
        }
        
        job.milestone = "processing_started";
        job.statusMessage = "Procesare pornită, se inițiază apel către API Claude";
        job.progressPercent = 10;
        job.updatedAt = new Date().toISOString();
        jobStore.set(jobId, job);
        
        // Apel către API Claude
        console.log(`StartJob - Inițiere apel API Claude pentru jobId: ${jobId}`);
        job.milestone = "api_call_started";
        job.statusMessage = "Apel API Claude în curs...";
        job.progressPercent = 20;
        job.updatedAt = new Date().toISOString();
        jobStore.set(jobId, job);
        
        try {
          // Simulăm apelul API Claude
          console.log(`StartJob - Simulare apel API Claude pentru jobId: ${jobId}`);
          console.log(`StartJob - Lungime prompt: ${prompt.length} caractere`);
          
          // Calculăm numărul aproximativ de token-uri (aprox. 4 caractere = 1 token)
          const estimatedTokens = Math.ceil(prompt.length / 4);
          console.log(`StartJob - Număr estimat de token-uri pentru prompt: ${estimatedTokens}`);
          
          // Verificare limită de token-uri pentru Claude-3 Sonnet
          const MAX_TOKENS_CLAUDE3_SONNET = 180000; // Limită de token-uri pentru Claude-3 Sonnet
          if (estimatedTokens > MAX_TOKENS_CLAUDE3_SONNET) {
            console.error(`StartJob - Prompt prea lung pentru Claude-3 Sonnet (${estimatedTokens} tokens)`);
            job.status = "error";
            job.error = `Prompt prea lung pentru procesare (${estimatedTokens} tokens, limită: ${MAX_TOKENS_CLAUDE3_SONNET})`;
            job.errorDetails = { tokenLimit: MAX_TOKENS_CLAUDE3_SONNET, estimatedTokens };
            jobStore.set(jobId, job);
            return;
          }
          
          // Aici ar trebui să fie apelul real către API-ul Claude
          // const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'anthropic-version': '2023-06-01',
          //     'x-api-key': apiKey
          //   },
          //   body: JSON.stringify({
          //     model: 'claude-3-sonnet-20240229',
          //     max_tokens: 100000,
          //     temperature: 0.5,
          //     system: "Ești un expert în crearea de materiale educaționale.",
          //     messages: [
          //       {
          //         role: 'user',
          //         content: prompt
          //       }
          //     ]
          //   })
          // });
          
          // Pentru testare, simulăm răspunsul API-ului
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Simulăm primirea răspunsului
          console.log(`StartJob - Răspuns API Claude primit pentru jobId: ${jobId}`);
          job.milestone = "api_call_complete";
          job.statusMessage = "Răspuns API primit, se procesează conținutul";
          job.progressPercent = 50;
          job.updatedAt = new Date().toISOString();
          jobStore.set(jobId, job);
          
          // Procesare răspuns API (simulat)
          console.log(`StartJob - Procesare răspuns API pentru jobId: ${jobId}`);
          job.milestone = "processing_content";
          job.statusMessage = "Se procesează conținutul generat";
          job.progressPercent = 70;
          job.updatedAt = new Date().toISOString();
          jobStore.set(jobId, job);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulăm generarea materialelor
          console.log(`StartJob - Generare materiale pentru jobId: ${jobId}`);
          job.milestone = "generating_materials";
          job.statusMessage = "Se generează materialele de curs";
          job.progressPercent = 80;
          job.updatedAt = new Date().toISOString();
          jobStore.set(jobId, job);
          
          // Simulăm date pentru testare
          const mockData = generateMockStructureData(formData.generationType as MockGenerationType || "Preview");
          job.data = mockData;
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Simulăm salvarea materialelor
          console.log(`StartJob - Salvare materiale pentru jobId: ${jobId}`);
          job.milestone = "saving_materials";
          job.statusMessage = "Se salvează materialele generate";
          job.progressPercent = 90;
          job.updatedAt = new Date().toISOString();
          jobStore.set(jobId, job);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Simulăm finalizarea cu succes
          console.log(`StartJob - Finalizare job ${jobId} cu succes`);
          job.milestone = "completed";
          job.status = "completed";
          job.statusMessage = "Generare finalizată cu succes";
          job.progressPercent = 100;
          job.updatedAt = new Date().toISOString();
          job.completedAt = new Date().toISOString();
          jobStore.set(jobId, job);
          
          // Logăm starea finală a job-ului
          console.log(`StartJob - Stare finală job ${jobId}:`, JSON.stringify({
            status: job.status,
            milestone: job.milestone,
            progressPercent: job.progressPercent
          }));
          
        } catch (apiError: any) {
          console.error(`StartJob - Eroare la apelul API Claude pentru jobId: ${jobId}:`, apiError);
          
          job.status = "error";
          job.error = `Eroare la apelul API Claude: ${apiError.message || "Eroare necunoscută"}`;
          job.errorDetails = {
            message: apiError.message,
            name: apiError.name,
            stack: apiError.stack,
            timestamp: new Date().toISOString()
          };
          jobStore.set(jobId, job);
        }
        
      } catch (asyncError: any) {
        console.error(`StartJob - Eroare în procesarea asincronă pentru jobId: ${jobId}:`, asyncError);
        
        const job = jobStore.get(jobId);
        if (job) {
          job.status = "error";
          job.error = `Eroare în procesarea asincronă: ${asyncError.message || "Eroare necunoscută"}`;
          job.errorDetails = {
            message: asyncError.message,
            name: asyncError.name,
            stack: asyncError.stack,
            timestamp: new Date().toISOString()
          };
          jobStore.set(jobId, job);
        }
      }
    }, 10); // Începem procesarea aproape imediat
    
    // Returnăm răspunsul inițial
    console.log(`StartJob - Returnare răspuns inițial pentru jobId: ${jobId}`);
    return {
      success: true,
      status: "processing",
      jobId: jobId,
      milestone: "job_created"
    };
    
  } catch (error: any) {
    console.error("StartJob - Eroare la inițierea job-ului:", error);
    
    return {
      success: false,
      error: `Eroare la inițierea job-ului: ${error.message || "Eroare necunoscută"}`,
      errorDetails: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    };
  }
}
