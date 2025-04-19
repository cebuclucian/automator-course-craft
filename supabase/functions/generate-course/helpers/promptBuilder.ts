import { CourseFormData } from "../types.ts";

export function buildPrompt(formData: CourseFormData): string {
  // Template string from the brief
  let promptTemplate = `# Sistem pentru generarea automată a materialelor de curs fizic și academic

## Configurare inițială
- Limba: {{LIMBA}} (Română/Engleză)
- Subiect curs: {{SUBIECT}} 
- Nivel: {{NIVEL}} (Începător/Intermediar/Avansat)
- Public țintă: {{PUBLICUL_TINTA}} (Elevi/Studenți/Profesori/Profesioniști/Manageri)
- Durată: {{DURATA}} (1 oră/2 ore/4 ore/8 ore/2 zile/3 zile/4 zile/5 zile)
- Ton: {{TON}} (Socratic/Energizant/Haios/Profesional)
- Context: {{CONTEXT}} (Corporativ/Academic)
- Tip generare: {{TIP_GENERARE}} (CAMP ASCUNS: Preview/Complet)

Ți se cere să generezi trei tipuri de materiale:

1. Plan și obiective
   - Obiective de învățare - liste cu 5-10 obiective specifice, măsurabile
   - Structura cursului - o listă cu titluri de module și o scurtă descriere

2. Materiale trainer
   - Ghid trainer - detalii despre cum să fie livrat cursul
   - Note de prezentare - ce să spună trainerul pentru fiecare slide

3. Materiale suport
   - Handout-uri - materiale tipărite pentru participanți
   - Exerciții - activități practice pentru consolidarea cunoștințelor

IMPORTANT: Răspunde DOAR cu un obiect JSON care conține cele trei secțiuni de mai sus, fiecare cu propriile categorii. Nu include text explicativ sau markdown în afara structurii JSON. Structura JSON trebuie să respecte formatul următor:

{
  "sections": [
    {
      "title": "Plan și obiective",
      "content": "Descriere generală a planului",
      "categories": [
        {
          "name": "Obiective de învățare",
          "content": "Text detaliat cu obiectivele"
        },
        {
          "name": "Structura cursului",
          "content": "Text detaliat cu structura"
        }
      ]
    },
    {
      "title": "Materiale trainer",
      "content": "Descriere generală a materialelor pentru trainer",
      "categories": [
        {
          "name": "Ghid trainer",
          "content": "Text detaliat pentru ghid"
        },
        {
          "name": "Note de prezentare",
          "content": "Text detaliat cu notele"
        }
      ]
    },
    {
      "title": "Materiale suport",
      "content": "Descriere generală a materialelor suport",
      "categories": [
        {
          "name": "Handout-uri",
          "content": "Text detaliat pentru handout-uri"
        },
        {
          "name": "Exerciții",
          "content": "Text detaliat cu exerciții"
        }
      ]
    }
  ],
  "metadata": {
    "subject": "{{SUBIECT}}",
    "level": "{{NIVEL}}",
    "audience": "{{PUBLICUL_TINTA}}",
    "duration": "{{DURATA}}",
    "createdAt": "CURRENT_DATE",
    "expiresAt": "EXPIRY_DATE"
  }
}

# Instrucțiuni pentru tonul de redactare / Writing Tone Instructions

## Ton: Socratic / Tone: Socratic
**RO:**  
Combină explicații clare cu întrebări deschise care provoacă gândirea critică. După fiecare idee importantă, adaugă o întrebare pentru reflecție. Nu transforma tot conținutul într-o succesiune de întrebări. Ghidează cursantul spre descoperire, fără a oferi toate răspunsurile direct.

**EN:**  
Combine clear explanations with open-ended questions that spark critical thinking. After each key idea, insert a reflective question. Do not turn the entire content into a sequence of questions. Guide the learner toward insights without giving all the answers upfront.

## Ton: Energizant / Tone: Energizing
**RO:**  
Folosește un limbaj pozitiv, activ și motivant. Încurajează implicarea prin expresii dinamice. Adaugă analogii scurte și menține ideile clare.

**EN:**  
Use dynamic, positive, and action-oriented language. Encourage involvement and motivation through active expressions. Include short analogies and keep ideas clear.

## Ton: Haios / Tone: Humorous
**RO:**  
Adaugă umor subtil și creativ, cu comparații inteligente. Păstrează un ton relaxat și prietenos. Umorul trebuie să susțină ideea, nu să distragă.

**EN:**  
Add subtle humor, creative metaphors, and playful language. Keep a friendly, relaxed tone. Humor must support the message, not distract from it.

## Ton: Profesional / Tone: Professional
**RO:**  
Folosește un limbaj clar, formal și structurat. Concentrează-te pe acuratețea ideilor și evită exprimările informale sau glumele.

**EN:**  
Use clear, formal, and structured language. Focus on accuracy and logical flow. Avoid informal expressions or humor.`;

  // Replace variables in template
  promptTemplate = promptTemplate
    .replace(/{{LIMBA}}/g, formData.language)
    .replace(/{{SUBIECT}}/g, formData.subject)
    .replace(/{{NIVEL}}/g, formData.level)
    .replace(/{{PUBLICUL_TINTA}}/g, formData.audience)
    .replace(/{{DURATA}}/g, formData.duration)
    .replace(/{{TON}}/g, formData.tone)
    .replace(/{{CONTEXT}}/g, formData.context)
    .replace(/{{TIP_GENERARE}}/g, formData.generationType || 'Preview')
    .replace(/CURRENT_DATE/g, new Date().toISOString())
    .replace(/EXPIRY_DATE/g, new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString());

  return promptTemplate;
}
