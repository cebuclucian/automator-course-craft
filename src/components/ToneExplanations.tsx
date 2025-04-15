
import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

const ToneExplanations = () => {
  const { language } = useLanguage();

  const tones = {
    ro: [
      {
        title: 'Socratic',
        description: 'Combină explicațiile clare cu întrebări deschise care provoacă gândirea critică.',
        bullets: [
          'După fiecare informație-cheie, adaugă o întrebare relevantă pentru reflecție.',
          'Nu transforma întregul text într-o succesiune de întrebări.',
          'Ghidează, nu impune concluzii.'
        ],
        example: 'Feedback-ul constructiv presupune claritate, empatie și intenție de sprijin. Cum crezi că s-ar schimba o conversație dacă am începe prin a cere acordul persoanei pentru a oferi feedback?',
        avoid: '„Ce este feedback-ul? Cum îl oferi? Ce zici de ton?" – fără context sau explicație.'
      },
      {
        title: 'Energizant',
        description: 'Folosește un limbaj dinamic, pozitiv și motivațional.',
        bullets: [
          'Încurajează implicarea și acțiunea prin formulări active.',
          'Folosește analogii scurte și expresii pline de energie.',
          'Menține claritatea ideilor.'
        ],
        example: 'Gândește-te la feedback ca la un instrument ninja—fără zgomot, dar cu impact maxim atunci când e folosit corect!',
        avoid: '„O să înveți niște chestii SUPER TARI azi!!" – exagerări fără substanță.'
      },
      {
        title: 'Haios',
        description: 'Adaugă umor subtil, jocuri de cuvinte și comparații creative.',
        bullets: [
          'Menține tonul relaxat și prietenos.',
          'Umorul trebuie să sprijine ideea, nu să distragă.',
          'Nu folosi sarcasm sau glume controversate.'
        ],
        example: 'Feedback-ul pasiv-agresiv e ca o prăjitură cu ardei iute în mijloc. La început pare dulce, dar apoi începi să regreți că ai gustat.',
        avoid: '„Feedback? E momentul în care plângi pe interior și zâmbești pe exterior." – umor nepotrivit.'
      },
      {
        title: 'Profesional',
        description: 'Folosește un limbaj clar, formal și sobru.',
        bullets: [
          'Pune accent pe acuratețea termenilor și structura logică a ideilor.',
          'Evită formulările informale sau glumele.',
          'Este potrivit pentru contexte corporative sau academice.'
        ],
        example: 'Feedback-ul constructiv reprezintă o practică de comunicare esențială, cu scopul de a îmbunătăți performanța individuală și colaborarea în cadrul echipei.',
        avoid: '„Transmisiunea verbală a observațiilor de ordin comportamental în context profesional trebuie să fie reglementată procedural..." – prea rigid și greoi.'
      }
    ],
    en: [
      {
        title: 'Socratic',
        description: 'Combine clear explanations with open-ended questions that spark critical thinking.',
        bullets: [
          'After each key idea, insert a relevant reflective question.',
          'Do not turn the entire content into a sequence of questions.',
          'Guide the learner toward insights without giving all the answers upfront.'
        ],
        example: 'Constructive feedback relies on clarity, empathy, and positive intent. How might a conversation change if we start by asking for permission to offer feedback?',
        avoid: '"What is feedback? How do you give it? What about tone?" – too vague, lacks context or explanation.'
      },
      {
        title: 'Energizing',
        description: 'Use dynamic, positive, and action-oriented language.',
        bullets: [
          'Encourage involvement and motivation through active expressions.',
          'Include short analogies and high-energy phrasing.',
          'Keep ideas clear and focused.'
        ],
        example: 'Think of feedback as your ninja tool—silent, precise, and powerful when used right!',
        avoid: "\"You're gonna learn some REALLY AWESOME stuff today!!\" – overly excited without substance."
      },
      {
        title: 'Humorous',
        description: 'Add subtle humor, creative metaphors, and playful language.',
        bullets: [
          'Keep a friendly, relaxed tone throughout.',
          'Humor must support the message, not distract from it.',
          'Avoid sarcasm, clichés, or culturally sensitive jokes.'
        ],
        example: 'Passive-aggressive feedback is like a cupcake with chili inside. Sweet at first… then it hits you.',
        avoid: '"Feedback? That\'s when you smile on the outside and cry on the inside." – inappropriate or negative humor.'
      },
      {
        title: 'Professional',
        description: 'Use clear, formal, and structured language.',
        bullets: [
          'Focus on accuracy, clarity, and logical progression.',
          'Avoid informal expressions or humor.',
          'Ideal for corporate or academic settings.'
        ],
        example: 'Constructive feedback is a key communication practice aimed at improving individual performance and team collaboration.',
        avoid: '"The verbal transmission of behavioral observations must be procedurally regulated in professional settings..." – too stiff, hard to understand.'
      }
    ]
  };

  const currentTones = language === 'ro' ? tones.ro : tones.en;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="h-5 w-5" />
          <span className="sr-only">
            {language === 'ro' ? 'Informații despre tonuri' : 'Tone information'}
          </span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-[520px] p-6" align="start">
        <div className="space-y-4">
          <h3 className="font-medium leading-none">
            {language === 'ro' ? 'Tonuri disponibile' : 'Available Tones'}
          </h3>
          <div className="space-y-4">
            {currentTones.map((tone) => (
              <div key={tone.title} className="space-y-2">
                <h4 className="font-medium text-sm">{tone.title}</h4>
                <p className="text-sm text-muted-foreground">{tone.description}</p>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  {tone.bullets.map((bullet, index) => (
                    <li key={index} className="text-muted-foreground">{bullet}</li>
                  ))}
                </ul>
                <div className="text-sm bg-muted p-2 rounded">
                  <p className="font-medium mb-1">
                    {language === 'ro' ? 'Exemplu:' : 'Example:'}
                  </p>
                  <p className="italic text-muted-foreground">{tone.example}</p>
                </div>
                <div className="text-sm bg-destructive/10 p-2 rounded">
                  <p className="font-medium mb-1 text-destructive">
                    {language === 'ro' ? 'De evitat:' : 'Avoid:'}
                  </p>
                  <p className="italic text-destructive/90">{tone.avoid}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ToneExplanations;
