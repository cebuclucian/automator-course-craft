
// Helper function to generate more detailed mock trainer guide based on course parameters
export function generateDetailedTrainerGuide(formData, multiplier = 1) {
  let baseGuide = `## Ghid complet pentru trainer

### Introducere:
Acest curs este conceput pentru a fi interactiv și practic, concentrându-se pe ${formData.subject} la un nivel ${formData.level.toLowerCase()}, adaptat pentru ${formData.audience.toLowerCase()}.

### Metodologie:
Utilizați o combinație de prezentări, discuții și exerciții practice. Tonul general al cursului ar trebui să fie ${formData.tone.toLowerCase()}, creând o atmosferă propice învățării în context ${formData.context.toLowerCase()}.

### Sugestii de facilitare:
1. Începeți cu un exercițiu de spargere a gheții relevant pentru subiect
2. Încurajați participarea activă prin întrebări și provocări
3. Utilizați exemple relevante pentru domeniul profesional al participanților
4. Alternați între prezentări teoretice și aplicații practice
5. Oferiți feedback constructiv și încurajator`;

  // For longer courses, add more detailed guidance
  if (multiplier > 1) {
    baseGuide += `\n\n### Planificare pe zile:
**Ziua 1:**
- Focus pe introducere și concepte fundamentale
- Accent pe crearea unei baze solide de cunoaștere
- Încheiați cu o activitate de sinteză

**Ziua 2:**
- Revizuire rapidă a conceptelor din ziua precedentă
- Aprofundare prin aplicații practice
- Introducerea elementelor de complexitate medie

**Ziua 3:**
- Consolidarea cunoștințelor prin studii de caz
- Abordarea aspectelor avansate ale subiectului
- Exerciții de aplicare în situații reale`;

    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseGuide += `\n\n**Ziua 4:**
- Workshop aplicativ pe proiecte reale
- Coaching individual și în grup
- Prezentări ale participanților`;
    }

    if (formData.duration === '5 zile') {
      baseGuide += `\n\n**Ziua 5:**
- Masterclass cu focus pe integrare și aplicare avansată
- Sesiune de Q&A extinsă
- Plan de acțiune post-curs și resurse suplimentare`;
    }

    baseGuide += `\n\n### Gestionarea dinamicii de grup:
- Identificați și valorificați expertiza participanților
- Gestionați personalitățile dominante prin tehnici de facilitare structurate
- Încurajați participanții mai rezervați prin activități în grupuri mici
- Adaptați ritmul în funcție de feedback-ul și energia grupului`;
  }
  
  return baseGuide;
}
