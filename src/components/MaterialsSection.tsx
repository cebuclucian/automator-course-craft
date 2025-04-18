import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
const MaterialsSection = () => {
  const {
    language
  } = useLanguage();
  const materials = {
    ro: [{
      id: 'lesson-plan',
      title: 'Plan de lecție',
      description: 'Structură detaliată a cursului, cu obiective, durată și resurse necesare.',
      content: 'Planurile de lecție includ obiective de învățare clare, activități structurate pe intervale de timp, strategii de predare și resurse necesare. Un instrument esențial pentru organizarea eficientă a cursului și pentru a asigura atingerea tuturor obiectivelor educaționale.'
    }, {
      id: 'slides',
      title: 'Slide-uri prezentare',
      description: 'Prezentări profesionale cu design modern, grafice și puncte cheie.',
      content: 'Slide-urile de prezentare generate automat au un design profesional, imagini sugestive, diagrame clare și puncte cheie bine evidențiate. Perfecte pentru a susține prezentarea trainerului și pentru a menține atenția cursanților. Formatul .pptx permite editarea ulterioară și adaptarea la brandingul organizației.'
    }, {
      id: 'trainer-notes',
      title: 'Note trainer',
      description: 'Instrucțiuni detaliate pentru trainer, cu sugestii de livrare și răspunsuri la întrebări frecvente.',
      content: 'Notele pentru trainer oferă sugestii de livrare pentru fiecare secțiune a cursului, tehnici de facilitare a discuțiilor, răspunsuri la întrebări potențiale și strategii pentru adaptarea materialului la diferite audiențe. Un ghid complet pentru o livrare de succes.'
    }, {
      id: 'exercises',
      title: 'Exerciții',
      description: 'Activități practice individuale și de grup, relevante pentru subiect.',
      content: 'Exercițiile practice includ activități individuale, în perechi și de grup, scenarii relevante pentru domeniul de activitate și aplicații practice ale conceptelor teoretice. Fiecare exercițiu are obiective clare și un ghid de facilitare pentru trainer.'
    }],
    en: [{
      id: 'lesson-plan',
      title: 'Lesson Plan',
      description: 'Detailed course structure with objectives, duration, and required resources.',
      content: 'Lesson plans include clear learning objectives, time-structured activities, teaching strategies, and necessary resources. An essential tool for efficient course organization and ensuring all educational objectives are met.'
    }, {
      id: 'slides',
      title: 'Presentation Slides',
      description: 'Professional presentations with modern design, graphics, and key points.',
      content: 'Automatically generated presentation slides have a professional design, suggestive images, clear diagrams, and well-highlighted key points. Perfect for supporting the trainer\'s presentation and maintaining participant attention. The .pptx format allows for subsequent editing and adaptation to the organization\'s branding.'
    }, {
      id: 'trainer-notes',
      title: 'Trainer Notes',
      description: 'Detailed instructions for the trainer, with delivery suggestions and answers to frequently asked questions.',
      content: 'Trainer notes provide delivery suggestions for each section of the course, techniques for facilitating discussions, answers to potential questions, and strategies for adapting the material to different audiences. A complete guide for successful delivery.'
    }, {
      id: 'exercises',
      title: 'Exercises',
      description: 'Practical individual and group activities, relevant to the subject.',
      content: 'Practical exercises include individual, pair, and group activities, scenarios relevant to the field of activity, and practical applications of theoretical concepts. Each exercise has clear objectives and a facilitation guide for the trainer.'
    }]
  };
  const currentMaterials = language === 'ro' ? materials.ro : materials.en;
  return <section id="materials" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {language === 'ro' ? 'Materialele generate' : 'Generated Materials'}
        </h2>
        
        <Tabs defaultValue="lesson-plan" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
            {currentMaterials.map(material => <TabsTrigger key={material.id} value={material.id}>
                {material.title}
              </TabsTrigger>)}
          </TabsList>
          
          {currentMaterials.map(material => <TabsContent key={material.id} value={material.id}>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">{material.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{material.description}</p>
                    <p>{material.content}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>)}
        </Tabs>
      </div>
    </section>;
};
export default MaterialsSection;