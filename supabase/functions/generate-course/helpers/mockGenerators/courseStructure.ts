import { CourseFormData } from "../../types.ts";

export type MockGenerationType = 'Preview' | 'Complet';

export function generateMockStructureData(type: MockGenerationType = 'Preview') {
  const isComplet = type === 'Complet';

  const sections = [
    {
      title: "Introducere",
      lessons: [
        { title: "Ce este [Subiectul]?", content: "O introducere în subiect." },
        { title: "Importanța [Subiectului]", content: "De ce este important să înveți despre asta." },
      ],
    },
    {
      title: "Bazele [Subiectului]",
      lessons: [
        { title: "Conceptul de bază 1", content: "Explicație detaliată." },
        { title: "Conceptul de bază 2", content: "Explicație detaliată." },
      ],
    },
    {
      title: "Aplicații Practice",
      lessons: [
        { title: "Aplicație 1", content: "Cum se aplică în viața reală." },
        { title: "Aplicație 2", content: "Cum se aplică în viața reală." },
      ],
    },
  ];

  if (isComplet) {
    sections.push(
      {
        title: "Nivel Intermediar",
        lessons: [
          { title: "Concept Avansat 1", content: "Explicație detaliată." },
          { title: "Concept Avansat 2", content: "Explicație detaliată." },
        ],
      },
      {
        title: "Studii de Caz",
        lessons: [
          { title: "Studiu de Caz 1", content: "Analiza unui caz real." },
          { title: "Studiu de Caz 2", content: "Analiza unui caz real." },
        ],
      },
      {
        title: "Concluzii și Resurse Suplimentare",
        lessons: [
          { title: "Concluzii", content: "Rezumatul cursului." },
          { title: "Resurse Suplimentare", content: "Linkuri și materiale utile." },
        ],
      }
    );
  }

  return {
    title: "[Mock] Curs despre [Subiectul]",
    description: "Un curs introductiv despre [Subiectul].",
    sections: sections,
  };
}
