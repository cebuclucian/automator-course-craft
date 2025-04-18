
import { jobStore } from "../index.ts";
import { mockCourseData } from "./mockData.ts";

// Procesare job în fundal
export async function processJob(jobId, prompt, formData) {
  try {
    console.log(`[${jobId}] Procesare job în fundal`);
    console.log(`[${jobId}] Date formular:`, JSON.stringify(formData));
    console.log(`[${jobId}] Lungime prompt: ${prompt.length} caractere`);
    
    // Pentru scopuri demo, simulăm diferite timpuri de procesare bazate pe durata cursului
    let processingTime = 5000; // implicit 5 secunde
    
    if (formData.duration === '1 zi' || formData.duration === '1 day') {
      processingTime = 10000; // 10 secunde
    } else if (formData.duration.includes('zile') || formData.duration.includes('days')) {
      const days = parseInt(formData.duration.split(' ')[0]);
      processingTime = Math.min(15000, days * 5000); // Limită la 15 secunde maxim
    }
    
    console.log(`[${jobId}] Timp procesare simulat: ${processingTime}ms`);
    
    // Actualizare status job pentru a indica faptul că procesarea a început și asigurare că este salvat în store
    const existingJob = jobStore.get(jobId) || {};
    jobStore.set(jobId, {
      ...existingJob,
      processingStarted: new Date().toISOString(),
      status: 'processing',
      formData, // Salvare formData în caz că nu a fost salvat înainte
    });
    
    // Log dimensiune curentă job store pentru debugging
    console.log(`[${jobId}] Dimensiune curentă job store: ${jobStore.size}`);
    console.log(`[${jobId}] Chei job în store: ${[...jobStore.keys()].join(', ')}`);
    
    // Simulare procesare
    console.log(`[${jobId}] Începere simulare procesare`);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    console.log(`[${jobId}] Simulare procesare completată`);
    
    // Într-o implementare reală, am apela API-ul Claude aici
    // Pentru acum, vom actualiza doar job-ul cu date mock
    const mockResult = mockCourseData(formData);
    
    // Asigurăm-ne că mockResult are secțiunile necesare
    if (!mockResult.sections || mockResult.sections.length === 0) {
      mockResult.sections = [
        { 
          type: 'lesson-plan', 
          title: 'Plan de lecție',
          content: `# Plan de lecție: ${formData.subject}\n\n## Obiective\n- Înțelegerea conceptelor de bază\n- Dezvoltarea abilităților practice\n- Aplicarea cunoștințelor în scenarii reale`
        },
        { 
          type: 'slides', 
          title: 'Slide-uri prezentare',
          content: `# Prezentare: ${formData.subject}\n\n## Slide 1: Introducere\n- Despre acest curs\n- Importanța subiectului\n- Ce vom învăța`
        },
        { 
          type: 'trainer-notes', 
          title: 'Note pentru trainer',
          content: `# Note pentru trainer: ${formData.subject}\n\n## Pregătire\n- Asigurați-vă că toate materialele sunt disponibile\n- Verificați echipamentele\n\n## Sfaturi de livrare\n- Începeți cu o activitate de spargere a gheții\n- Folosiți exemple relevante pentru audiență`
        },
        { 
          type: 'exercises', 
          title: 'Exerciții',
          content: `# Exerciții: ${formData.subject}\n\n## Exercițiul 1: Aplicare practică\n**Timp**: 15 minute\n**Materiale**: Fișe de lucru\n\n**Instrucțiuni**:\n1. Împărțiți participanții în grupuri de 3-4 persoane\n2. Distribuiți fișele de lucru\n3. Acordați 10 minute pentru rezolvare\n4. Facilitați o discuție de 5 minute despre soluții`
        }
      ];
    }
    
    // Verificare dublă că job-ul încă există în store înainte de actualizare
    if (!jobStore.has(jobId)) {
      console.log(`[${jobId}] Avertisment: Job-ul nu mai există în store după procesare, recrearea lui`);
    }
    
    // Actualizare job existent sau creare unul nou
    const updatedJob = {
      status: 'completed',
      formData,
      startedAt: existingJob?.startedAt || new Date().toISOString(),
      processingStarted: existingJob?.processingStarted || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      data: mockResult
    };
    
    // Salvare job actualizat
    jobStore.set(jobId, updatedJob);
    
    // Log actualizare reușită
    console.log(`[${jobId}] Job finalizat cu succes, secțiuni date: ${mockResult.sections.length}`);
    console.log(`[${jobId}] Dimensiune curentă job store după finalizare: ${jobStore.size}`);
    
    // Curățare job-uri vechi periodic (într-un sistem real aceasta ar fi gestionată diferit)
    setTimeout(() => {
      if (jobStore.has(jobId)) {
        jobStore.delete(jobId);
        console.log(`[${jobId}] Job curățat din memorie după 1 oră`);
      }
    }, 3600000); // 1 oră
    
    return mockResult;
  } catch (error) {
    console.error(`[${jobId}] Eroare procesare job:`, error);
    
    // Ne asigurăm că actualizăm statusul job-ului chiar și în caz de eroare
    const existingJob = jobStore.get(jobId) || {};
    jobStore.set(jobId, {
      status: 'error',
      formData,
      startedAt: existingJob?.startedAt || new Date().toISOString(),
      processingStarted: existingJob?.processingStarted || new Date().toISOString(),
      error: error.message || 'Eroare necunoscută în timpul procesării',
      errorTimestamp: new Date().toISOString()
    });
    
    throw error;
  }
}
