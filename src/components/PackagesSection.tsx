
import React from 'react';
import PackageCard from './packages/PackageCard';
import { usePackageData } from './packages/usePackageData';
import { usePackageSelection } from './packages/usePackageSelection';
import { useLanguage } from '@/contexts/LanguageContext';
import StripeRedirectDialog from './StripeRedirectDialog';

const PackagesSection = () => {
  const { language } = useLanguage();
  const { packages } = usePackageData();
  const {
    isProcessing,
    processingPackage,
    redirectUrl,
    showRedirectDialog,
    setShowRedirectDialog,
    handlePackageSelect
  } = usePackageSelection();

  return (
    <section id="packages" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {language === 'ro' ? 'Alege pachetul potrivit pentru tine' : 'Choose the right package for you'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {packages.map((pkg, index) => (
            <PackageCard
              key={index}
              {...pkg}
              isProcessing={isProcessing}
              processingPackage={processingPackage}
              onSelect={handlePackageSelect}
            />
          ))}
        </div>
      </div>
      
      <StripeRedirectDialog
        open={showRedirectDialog}
        onOpenChange={setShowRedirectDialog}
        redirectUrl={redirectUrl}
      />
    </section>
  );
};

export default PackagesSection;
