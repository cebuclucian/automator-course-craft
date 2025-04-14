
import { useLanguage } from '@/contexts/LanguageContext';

export interface Package {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  button: string;
  highlight: boolean;
}

export const usePackageData = () => {
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
          'Documente editabile',
          'Disponibil 72 de ore',
          'Suport prin email'
        ],
        button: 'Alege Basic',
        highlight: false
      },
      {
        name: 'Pro',
        price: '49',
        period: '/lună',
        description: 'Pentru companii mici și departamente de training',
        features: [
          'Materiale complete',
          'Maxim 10 cursuri complete/lună',
          'Documente editabile',
          'Disponibil 72 de ore',
          'Suport prin email',
        ],
        button: 'Alege Pro',
        highlight: true
      },
      {
        name: 'Enterprise',
        price: '129',
        period: '/lună',
        description: 'Pentru companii mari și instituții educaționale',
        features: [
          'Materiale complete',
          'Maxim 30 cursuri complete/lună',
          'Documente editabile',
          'Disponibil 72 de ore',
          'Suport prin email',
        ],
        button: 'Alege Enterprise',
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
          'Editable documents',
          'Available for 72 hours',
          'Email support'
        ],
        button: 'Choose Basic',
        highlight: false
      },
      {
        name: 'Pro',
        price: '49',
        period: '/month',
        description: 'For small companies and training departments',
        features: [
          'Complete materials',
          'Maximum 10 complete courses/month',
          'Editable documents',
          'Available for 72 hours',
          'Email support',
        ],
        button: 'Choose Pro',
        highlight: true
      },
      {
        name: 'Enterprise',
        price: '129',
        period: '/month',
        description: 'For large companies and educational institutions',
        features: [
          'Complete materials',
          'Maximum 30 complete courses/month',
          'Editable documents',
          'Available for 72 hours',
          'Email support',
        ],
        button: 'Choose Enterprise',
        highlight: false
      }
    ]
  };

  return {
    packages: language === 'ro' ? packages.ro : packages.en
  };
};
