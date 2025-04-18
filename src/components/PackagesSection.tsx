
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from './AuthModal';

const PackagesSection = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingPackage, setProcessingPackage] = React.useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

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

  const currentPackages = language === 'ro' ? packages.ro : packages.en;

  const handlePackageSelect = async (packageName: string) => {
    if (!user) {
      setSelectedPackage(packageName);
      setIsAuthModalOpen(true);
      return;
    }

    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessingPackage(packageName);

    toast({
      title: language === 'ro' ? 'Se procesează' : 'Processing',
      description: language === 'ro' 
        ? 'Se creează sesiunea de plată...' 
        : 'Creating payment session...',
      variant: "default"
    });

    try {
      if (packageName === 'Gratuit' || packageName === 'Free') {
        toast({
          title: language === 'ro' ? 'Pachet gratuit' : 'Free package',
          description: language === 'ro' 
            ? 'Te-ai înregistrat pentru pachetul gratuit.' 
            : 'You have registered for the free package.',
          variant: "default"
        });
        setIsProcessing(false);
        setProcessingPackage('');
        return;
      }

      console.log("Calling create-checkout with packageName:", packageName);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          packageName,
          email: user.email,
          userId: user.id
        }
      });

      console.log("Response from create-checkout:", data, error);

      if (error) {
        console.error("Error from function:", error);
        throw error;
      }

      if (data && data.url) {
        console.log("Redirecting to URL:", data.url);
        
        window.location.replace(data.url);
        
        setTimeout(() => {
          console.log("Forcing navigation after timeout");
          window.location.href = data.url;
        }, 2000);
        
        return;
      } else if (data && data.free) {
        toast({
          title: language === 'ro' ? 'Pachet gratuit activat' : 'Free package activated',
          description: language === 'ro' 
            ? 'Pachetul gratuit a fost activat pentru contul tău.' 
            : 'Free package has been activated for your account.',
          variant: "default"
        });
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' 
          ? 'A apărut o eroare la crearea sesiunii de plată.' 
          : 'An error occurred while creating the payment session.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingPackage('');
    }
  };

  return (
    <section id="packages" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {language === 'ro' ? 'Alege pachetul potrivit pentru tine' : 'Choose the right package for you'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentPackages.map((pkg, index) => (
            <div 
              key={index}
              className={`border rounded-lg overflow-hidden transition-all duration-300 ${
                pkg.highlight 
                  ? 'border-blue-500 shadow-2xl scale-105' 
                  : 'border-gray-200 dark:border-gray-700 opacity-90 hover:opacity-100'
              }`}
            >
              {pkg.highlight && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                  {language === 'ro' ? 'Cel mai popular' : 'Most Popular'}
                </div>
              )}
              <div className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">{pkg.name}</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold text-blue-600">€{pkg.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">{pkg.period}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 min-h-[60px]">{pkg.description}</p>
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
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  variant={pkg.highlight ? 'default' : 'outline'}
                  onClick={() => handlePackageSelect(pkg.name)}
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
          ))}
        </div>
      </div>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => {
          setIsAuthModalOpen(false);
          setSelectedPackage(null);
        }}
        selectedPackage={selectedPackage}
        initialMode="register"
      />
    </section>
  );
};

export default PackagesSection;

