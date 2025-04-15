
// Helper function to generate more detailed mock course structure based on course parameters
export function generateDetailedCourseStructure(formData, multiplier = 1) {
  const baseStructure = [
    "Modulul 1: Introducere în " + formData.subject + "\n- Prezentare generală\n- Terminologie de bază\n- Istoricul și evoluția domeniului",
    "Modulul 2: Concepte fundamentale\n- Principiile teoretice\n- Modele conceptuale\n- Exemple de aplicare practică",
    "Modulul 3: Aplicații practice\n- Studii de caz relevante\n- Exerciții ghidate\n- Activități în grup",
    "Modulul 4: Strategii avansate\n- Tehnici specializate\n- Abordări inovative\n- Metode de optimizare",
    "Modulul 5: Evaluare și feedback\n- Metode de evaluare\n- Instrumente de feedback\n- Plan de acțiune individual"
  ];
  
  // For longer courses, add more modules
  if (multiplier > 1) {
    baseStructure.push(
      "Modulul 6: Integrare în practică\n- Aplicații în mediul real\n- Provocări și soluții\n- Proiecte practice",
      "Modulul 7: Tendințe și perspective\n- Direcții de dezvoltare în domeniu\n- Cercetări recente\n- Previziuni pentru viitor",
      "Modulul 8: Abordări interdisciplinare\n- Conexiuni cu alte domenii\n- Sinergie și integrare\n- Perspective multiple"
    );
    
    if (formData.duration === '4 zile' || formData.duration === '5 zile') {
      baseStructure.push(
        "Modulul 9: Workshop aplicativ\n- Lucru pe proiecte reale\n- Mentorat și coaching\n- Feedback specific",
        "Modulul 10: Masterclass\n- Sesiune cu experți în domeniu\n- Studii de caz avansate\n- Soluții personalizate"
      );
    }
  }
  
  return "Structura completă a cursului:\n\n" + baseStructure.join("\n\n");
}
