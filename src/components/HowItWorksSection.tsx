import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClipboardCheck, Settings, Download } from 'lucide-react';

const HowItWorksSection = () => {
  const { t, language } = useLanguage();

  const steps = {
    ro: [
      {
        icon: <ClipboardCheck className="h-12 w-12 text-automator-600" />,
        title: 'Completează formularul',
        description: 'Definește limba, subiectul, nivelul, publicul țintă și durata cursului. Adaugă preferințele tale de ton și context (corporativ sau academic).'
      },
      {
        icon: <Settings className="h-12 w-12 text-automator-600" />,
        title: 'AI generează materialul',
        description: 'Algoritmul nostru de inteligență artificială bazat pe Claude AI creează materialele adaptate specificațiilor tale.'
      },
      {
        icon: <Download className="h-12 w-12 text-automator-600" />,
        title: 'Descarcă și utilizează',
        description: 'Primești acces instant la materialele tale. Descarcă-le în format .docx și .pptx gata de utilizare sau editare ulterioară.'
      }
    ],
    en: [
      {
        icon: <ClipboardCheck className="h-12 w-12 text-automator-600" />,
        title: 'Fill out the form',
        description: 'Define the language, subject, level, target audience, and course duration. Add your preferences for tone and context (corporate or academic).'
      },
      {
        icon: <Settings className="h-12 w-12 text-automator-600" />,
        title: 'AI generates the material',
        description: 'Our artificial intelligence algorithm based on Claude AI creates materials adapted to your specifications.'
      },
      {
        icon: <Download className="h-12 w-12 text-automator-600" />,
        title: 'Download and use',
        description: 'Get instant access to your materials. Download them in ready-to-use .docx and .pptx format or edit them further.'
      }
    ]
  };

  const currentSteps = language === 'ro' ? steps.ro : steps.en;

  return (
    <section id="how-it-works" className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{t('how.title')}</h2>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {currentSteps.map((step, index) => (
            <div key={index} className="flex-1 bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md text-center animate-fade-in hover:shadow-lg transition-all duration-300">
              <div className="flex justify-center mb-4 transform hover:scale-110 transition-transform duration-200">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
              <div className="mt-6 flex justify-center">
                <span className="bg-automator-100 dark:bg-automator-900 text-automator-800 dark:text-automator-200 text-xl font-bold h-10 w-10 rounded-full flex items-center justify-center transform hover:rotate-12 transition-transform duration-200">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
