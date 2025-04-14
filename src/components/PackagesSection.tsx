
import React from 'react';
import PackageCard from '@/components/packages/PackageCard';
import { useLanguage } from '@/contexts/LanguageContext';
import usePackageData from '@/hooks/packages/usePackageData';
import usePackageSelection from '@/hooks/packages/usePackageSelection';

const PackagesSection = () => {
  const { language } = useLanguage();
  const { currentPackages } = usePackageData();
  const { isProcessing, processingPackage, handlePackageSelect } = usePackageSelection();

  return (
    <section id="packages" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {language === 'ro' ? 'Alege pachetul potrivit pentru tine' : 'Choose the right package for you'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentPackages.map((pkg, index) => (
            <PackageCard
              key={index}
              pkg={pkg}
              onSelect={handlePackageSelect}
              isProcessing={isProcessing}
              processingPackage={processingPackage}
              language={language}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
