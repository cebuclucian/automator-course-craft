
// Helper function to generate more detailed mock exercises based on course parameters
export function generateDetailedExercises(formData, multiplier = 1) {
  let baseExercises = `## Exerciții complete

### Exercițiul 1: Analiză de caz
**Obiectiv:** Identificarea conceptelor cheie aplicate într-un scenariu real
**Durată:** 30 minute
**Instrucțiuni:**
1. Studiați următorul scenariu legat de ${formData.subject}
2. Identificați principiile și conceptele aplicate
3. Analizați deciziile luate și rezultatele obținute
4. Propuneți abordări alternative și justificați-le

### Exercițiul 2: Simulare practică
**Obiectiv:** Aplicarea conceptelor învățate într-un mediu controlat
**Durată:** 45 minute
**Instrucțiuni:**
1. Formați echipe de 3-4 persoane
2. Fiecare echipă primește un scenariu de rezolvat
3. Aplicați metodologia prezentată pentru a dezvolta o soluție
4. Prezentați rezultatele și procesul de gândire

### Exercițiul 3: Dezbatere structurată
**Obiectiv:** Dezvoltarea gândirii critice prin argumentare
**Durată:** 40 minute
**Instrucțiuni:**
1. Grupul se împarte în două echipe cu perspective opuse
2. Fiecare echipă pregătește argumente bazate pe conceptele învățate
3. Dezbaterea urmează formatul: argument - contraargument - concluzie
4. La final, identificați punctele comune și diferențele fundamentale`;

  // For more complex courses, add more exercises
  if (multiplier > 1) {
    baseExercises += `\n\n### Exercițiul 4: Proiect aplicativ
**Obiectiv:** Integrarea tuturor conceptelor într-un proiect practic
**Durată:** 90 minute + prezentare
**Instrucțiuni:**
1. Lucrați în echipe de 4-5 persoane
2. Dezvoltați un plan complet pentru implementarea conceptelor în organizația dvs.
3. Documentați procesul, provocările și soluțiile
4. Pregătiți o prezentare de 10 minute

### Exercițiul 5: Coaching colegial
**Obiectiv:** Dezvoltarea abilităților de feedback și coaching
**Durată:** 60 minute
**Instrucțiuni:**
1. Formați perechi
2. Fiecare participant prezintă o provocare reală legată de ${formData.subject}
3. Partenerul oferă coaching utilizând modelul GROW
4. Schimbați rolurile și repetați procesul`;

    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseExercises += `\n\n### Exercițiul 6: Implementare ghidată
**Obiectiv:** Dezvoltarea unui plan de acțiune concret
**Durată:** 120 minute
**Instrucțiuni:**
1. Identificați o oportunitate reală de aplicare în organizația dvs.
2. Dezvoltați un plan detaliat de implementare pe 90 de zile
3. Anticipați obstacole și pregătiți strategii de depășire
4. Stabiliți indicatori de succes și metode de măsurare

### Exercițiul 7: Studiu de caz extins
**Obiectiv:** Analiza aprofundată a unei situații complexe
**Durată:** 180 minute
**Instrucțiuni:**
1. Analizați studiul de caz complex furnizat
2. Documentați toate aspectele relevante utilizând cadrul SWOT
3. Dezvoltați trei strategii alternative de abordare
4. Recomandați și justificați cea mai potrivită strategie`;
    }
  }
  
  return baseExercises;
}
