
import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface PackageFeature {
  text: string;
}

interface PackageProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  button: string;
  highlight: boolean;
  isProcessing: boolean;
  processingPackage: string;
  onSelect: (packageName: string) => void;
}

const PackageCard = ({
  name,
  price,
  period,
  description,
  features,
  button,
  highlight,
  isProcessing,
  processingPackage,
  onSelect,
}: PackageProps) => {
  const { language } = useLanguage();

  return (
    <div 
      className={`border rounded-lg overflow-hidden ${
        highlight 
          ? 'border-automator-500 shadow-lg dark:border-automator-400' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {highlight && (
        <div className="bg-automator-500 text-white text-center py-2 text-sm font-medium dark:bg-automator-600">
          {language === 'ro' ? 'Cel mai popular' : 'Most Popular'}
        </div>
      )}
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <div className="flex items-end mb-4">
          <span className="text-4xl font-bold">€{price}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">{period}</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
        <ul className="mb-8 space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className={`w-full ${
            highlight 
              ? 'bg-automator-500 hover:bg-automator-600 text-white dark:bg-automator-600' 
              : ''
          }`}
          variant={highlight ? 'default' : 'outline'}
          onClick={() => onSelect(name)}
          disabled={isProcessing}
        >
          {isProcessing && processingPackage === name ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === 'ro' ? 'Se procesează...' : 'Processing...'}
            </span>
          ) : (
            button
          )}
        </Button>
      </div>
    </div>
  );
};

export default PackageCard;
