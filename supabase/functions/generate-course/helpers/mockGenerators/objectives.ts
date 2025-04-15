
// Helper function to generate more detailed mock objectives based on course parameters
export function generateDetailedObjectives(formData, multiplier = 1) {
  const baseObjectives = [
    "1. Înțelegerea conceptelor fundamentale legate de " + formData.subject,
    "2. Dezvoltarea abilităților practice de aplicare a cunoștințelor",
    "3. Aplicarea cunoștințelor în situații reale de " + (formData.context === 'Corporativ' ? 'business' : 'mediul academic'),
    "4. Evaluarea și îmbunătățirea performanței în domeniul " + formData.subject,
    "5. Dezvoltarea unei perspective critice asupra " + formData.subject
  ];
  
  // For longer courses, add more objectives
  if (multiplier > 1) {
    baseObjectives.push(
      "6. Implementarea strategiilor avansate în contextul " + formData.subject,
      "7. Integrarea cunoștințelor din domenii conexe pentru o înțelegere holistică",
      "8. Dezvoltarea capacității de a inova în domeniul " + formData.subject,
      "9. Articularea unei viziuni personale asupra " + formData.subject,
      "10. Crearea unui plan de dezvoltare personală pentru aprofundarea " + formData.subject
    );
  }
  
  return "Lista completă a obiectivelor de învățare pentru acest curs:\n\n" + baseObjectives.join("\n\n");
}
