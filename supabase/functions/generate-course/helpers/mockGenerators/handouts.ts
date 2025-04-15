
// Helper function to generate more detailed mock handouts based on course parameters
export function generateDetailedHandouts(formData, multiplier = 1) {
  let baseHandouts = `## Handout-uri complete pentru curs

### Handout 1: Principiile de bază ${formData.subject}
O prezentare concisă a conceptelor fundamentale, incluzând definiții, principii cheie și exemple ilustrative. Acest material oferă participanților un ghid de referință rapid pentru noțiunile esențiale discutate în cadrul cursului.

### Handout 2: Exerciții practice
O colecție de exerciții și activități pentru a practica conceptele învățate, organizate pe niveluri de dificultate. Fiecare exercițiu include instrucțiuni clare, spațiu pentru răspunsuri și indicații pentru rezolvare.

### Handout 3: Resurse adiționale
O listă cuprinzătoare de resurse pentru studiu individual și aprofundare, incluzând cărți, articole, site-uri web și cursuri online relevante pentru ${formData.subject}.`;

  // For more complex courses, add more handouts
  if (multiplier > 1) {
    baseHandouts += `\n\n### Handout 4: Ghid de implementare
Un manual pas cu pas pentru aplicarea cunoștințelor în contexte reale, cu liste de verificare, șabloane și exemple de bune practici adaptate pentru ${formData.context}.

### Handout 5: Glosar de termeni
Un dicționar cuprinzător al termenilor specifici domeniului, cu definiții clare și exemple de utilizare în context.

### Handout 6: Studii de caz
O colecție de studii de caz relevante pentru ${formData.audience}, prezentând scenarii reale, analize și soluții aplicate.`;

    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseHandouts += `\n\n### Handout 7: Manual de referință
Un ghid complet care acoperă toate aspectele disciplinei, organizat pe capitole pentru referință ușoară și consultare ulterioară.

### Handout 8: Șabloane și instrumente
O colecție de șabloane, liste de verificare și instrumente practice pentru implementarea imediată a conceptelor în activitatea profesională zilnică.`;
    }
  }
  
  return baseHandouts;
}
