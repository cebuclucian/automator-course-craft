
// Helper function to generate more detailed mock presentation notes based on course parameters
export function generateDetailedPresentationNotes(formData, multiplier = 1) {
  let baseNotes = `## Note de prezentare complete

### Introducere (30 min)
**Slide 1: Titlu**
- Prezentați-vă și stabiliți credibilitatea în raport cu subiectul
- Începeți cu o întrebare provocatoare pentru a capta atenția: "Ce v-ar ajuta cel mai mult să învățați despre ${formData.subject}?"
- Adresați așteptările participanților

**Slide 2: Agenda**
- Prezentați pe scurt structura zilei și ce vor învăța participanții
- Explicați metodologia și cum se leagă activitățile de obiectivele de învățare
- Stabiliți regulile de bază pentru interacțiune

**Slide 3: Concepte cheie**
- Explicați conceptele fundamentale cu exemple concrete relevante pentru ${formData.audience}
- Utilizați analogii accesibile pentru a ilustra ideile complexe
- Conectați teoria cu practica prin întrebări de reflecție`;

  // For more complex courses, add more presentation notes
  if (multiplier > 1) {
    baseNotes += `\n\n### Modulul principal (2 ore)
**Slide 4-6: Fundamentele teoretice**
- Prezentați modelul conceptual în pași secvențiali, clarificând fiecare element
- Folosiți reprezentări vizuale pentru a ilustra conexiunile dintre concepte
- Adresați întrebări de verificare: "Cum s-ar aplica acest principiu în contextul dvs.?"

**Slide 7-10: Aplicații practice**
- Ghidați analiza studiilor de caz relevante pentru ${formData.context}
- Facilitați discuțiile în grupuri mici pentru aplicarea conceptelor
- Centralizați concluziile și subliniați aspectele importante

**Slide 11-15: Strategii avansate**
- Introduceți tehnicile specializate cu exemple de succes
- Demonstrați aplicația pas cu pas a unei metode complexe
- Oferiți oportunități pentru participanți de a testa abordările prezentate`;

    if (formData.duration.includes('zile') && parseInt(formData.duration) > 2) {
      baseNotes += `\n\n### Sesiuni de aprofundare (zilele următoare)
**Slide 16-20: Integrare cu practici existente**
- Facilitați un exercițiu de analiză a practicilor actuale din organizațiile participanților
- Ghidați identificarea oportunităților de implementare a noilor concepte
- Ajutați participanții să dezvolte un plan de acțiune personalizat

**Slide 21-25: Provocări și soluții**
- Moderați o analiză a obstacolelor comune în implementare
- Facilitați un exercițiu de rezolvare de probleme în grupuri mici
- Oferiți strategii testate pentru depășirea provocărilor identificate`;
    }
  }
  
  return baseNotes;
}
