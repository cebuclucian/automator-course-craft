
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { Package } from '@/types/packages';

interface PackageCardProps {
  pkg: Package;
  onSelect: (packageName: string) => void;
  isProcessing: boolean;
  processingPackage: string;
  language: string;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  pkg, 
  onSelect, 
  isProcessing, 
  processingPackage, 
  language 
}) => {
  return (
    <div 
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
          onClick={() => onSelect(pkg.name)}
          disabled={isProcessing}
        >
          {isProcessing && processingPackage === pkg.name ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === 'ro' ? 'Se procesează...' : 'Processing...'}
            </span>
          ) : (
            pkg.button
          )}
        </Button>
      </div>
    </div>
  );
};

export default PackageCard;
