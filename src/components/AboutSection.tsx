import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const AboutSection = () => {
  const { t, language } = useLanguage();

  const content = {
    ro: {
      title: 'Despre Automator.ro',
      description: 'Automator.ro este o platformă dedicată trainerilor și educatorilor, care permite generarea automată și personalizată de materiale de curs folosind tehnologia AI avansată.',
      features: [
        {
          title: 'Economisești timp',
          description: 'Generează materiale complete de curs în câteva minute, în loc de zile sau săptămâni.'
        },
        {
          title: 'Materiale personalizate',
          description: 'Adaptează conținutul în funcție de subiect, nivel, public țintă și durată.'
        },
        {
          title: 'Format profesional',
          description: 'Obține documente și prezentări gata de utilizat în format editabil.'
        },
        {
          title: 'Materiale diverse',
          description: 'De la planuri de lecție la exerciții interactive și evaluări.'
        }
      ]
    },
    en: {
      title: 'About Automator.ro',
      description: 'Automator.ro is a platform dedicated to trainers and educators, which enables the automatic and personalized generation of course materials using advanced AI technology.',
      features: [
        {
          title: 'Save Time',
          description: 'Generate complete course materials in minutes instead of days or weeks.'
        },
        {
          title: 'Customized Materials',
          description: 'Adapt content based on subject, level, target audience, and duration.'
        },
        {
          title: 'Professional Format',
          description: 'Get ready-to-use documents and presentations in editable format.'
        },
        {
          title: 'Diverse Materials',
          description: 'From lesson plans to interactive exercises and assessments.'
        }
      ]
    }
  };

  const currentContent = language === 'ro' ? content.ro : content.en;

  return (
    <section id="about" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{currentContent.title}</h2>
        <p className="text-lg text-center mb-12 max-w-3xl mx-auto">
          {currentContent.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentContent.features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
            >
              <h3 className="text-xl font-semibold mb-3 text-automator-700 dark:text-automator-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
