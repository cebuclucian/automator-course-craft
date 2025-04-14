
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PackagesSection = () => {
  const { language } = useLanguage();

  const packages = {
    ro: [
      {
        name: 'Gratuit',
        price: '0',
        period: '',
        description: 'Pentru cei care vor să încerce platforma',
        features: [
          'Materiale în format preview (2 pagini)',
          'Acces la toate tipurile de materiale',
          'Disponibil 72 de ore',
        ],
        button: 'Înregistrează-te',
        highlight: false
      },
      {
        name: 'Basic',
        price: '19',
        period: '/lună',
        description: 'Pentru profesori și traineri individuali',
        features: [
          'Materiale complete',
          'Maxim 3 cursuri complete/lună',
          'Export în format .docx și .pptx',
          'Disponibil 72 de ore',
          'Suport prin email'
        ],
        button: 'Alege Basic',
        highlight: true
      },
      {
        name: 'Pro',
        price: '49',
        period: '/lună',
        description: 'Pentru companii mici și departamente de training',
        features: [
          'Materiale complete',
          'Maxim 10 cursuri complete/lună',
          'Export în toate formatele',
          'Disponibil 72 de ore',
          'Suport prioritar',
        ],
        button: 'Alege Pro',
        highlight: false
      },
      {
        name: 'Enterprise',
        price: '129',
        period: '/lună',
        description: 'Pentru companii mari și instituții educaționale',
        features: [
          'Materiale complete',
          'Maxim 30 cursuri complete/lună',
          'Export în toate formatele',
          'Disponibil 72 de ore',
          'Suport dedicat',
          'Customizare materiale cu logo și brand',
          'API pentru integrare',
        ],
        button: 'Contactează-ne',
        highlight: false
      }
    ],
    en: [
      {
        name: 'Free',
        price: '0',
        period: '',
        description: 'For those who want to try the platform',
        features: [
          'Preview format materials (2 pages)',
          'Access to all types of materials',
          'Available for 72 hours',
        ],
        button: 'Register',
        highlight: false
      },
      {
        name: 'Basic',
        price: '19',
        period: '/month',
        description: 'For individual teachers and trainers',
        features: [
          'Complete materials',
          'Maximum 3 complete courses/month',
          'Export in .docx and .pptx format',
          'Available for 72 hours',
          'Email support'
        ],
        button: 'Choose Basic',
        highlight: true
      },
      {
        name: 'Pro',
        price: '49',
        period: '/month',
        description: 'For small companies and training departments',
        features: [
          'Complete materials',
          'Maximum 10 complete courses/month',
          'Export in all formats',
          'Available for 72 hours',
          'Priority support',
        ],
        button: 'Choose Pro',
        highlight: false
      },
      {
        name: 'Enterprise',
        price: '129',
        period: '/month',
        description: 'For large companies and educational institutions',
        features: [
          'Complete materials',
          'Maximum 30 complete courses/month',
          'Export in all formats',
          'Available for 72 hours',
          'Dedicated support',
          'Customize materials with logo and brand',
          'API for integration',
        ],
        button: 'Contact Us',
        highlight: false
      }
    ]
  };

  const currentPackages = language === 'ro' ? packages.ro : packages.en;

  return (
    <section id="packages" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{language === 'ro' ? 'Alege pachetul potrivit pentru tine' : 'Choose the right package for you'}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentPackages.map((pkg, index) => (
            <div 
              key={index}
              className={`border rounded-lg overflow-hidden ${
                pkg.highlight 
                  ? 'border-automator-500 shadow-lg dark:border-automator-400' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {pkg.highlight && (
                <div className="bg-automator-500 text-white text-center py-2 text-sm font-medium dark:bg-automator-600">
                  {language === 'ro' ? 'Cel mai popular' : 'Most Popular'}
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold">€{pkg.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">{pkg.period}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{pkg.description}</p>
                <ul className="mb-8 space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    pkg.highlight 
                      ? 'bg-automator-500 hover:bg-automator-600 text-white dark:bg-automator-600' 
                      : ''
                  }`}
                  variant={pkg.highlight ? 'default' : 'outline'}
                >
                  {pkg.button}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
