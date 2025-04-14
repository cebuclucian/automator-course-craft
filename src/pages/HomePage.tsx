
import React, { useEffect, useState } from 'react';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import MaterialsSection from '@/components/MaterialsSection';
import PackagesSection from '@/components/PackagesSection';
import ContactSection from '@/components/ContactSection';
import { useToast } from '@/hooks/use-toast';

const HomePage = () => {
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Error monitoring for HomePage
  useEffect(() => {
    try {
      console.log('[HomePage] Component mounted successfully');
      
      // Check if all required components are available
      if (!HeroSection || !AboutSection || !HowItWorksSection || 
          !MaterialsSection || !PackagesSection || !ContactSection) {
        console.error('[HomePage] One or more required components are missing');
        setHasError(true);
      }

      // Error handling for unhandled rejections and errors
      const handleError = (event: ErrorEvent) => {
        console.error('[HomePage] Unhandled error:', event.error);
        setHasError(true);
        toast({
          title: "Eroare de aplicație",
          description: "A apărut o eroare. Vă rugăm să reîncărcați pagina.",
          variant: "destructive",
        });
      };

      window.addEventListener('error', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
        console.log('[HomePage] Component unmounted');
      };
    } catch (error) {
      console.error('[HomePage] Error in initialization:', error);
      setHasError(true);
    }
  }, [toast]);

  // If there's an error, show a minimal error message
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">A apărut o eroare</h2>
          <p className="mb-4">Ne pare rău pentru inconvenient. Vă rugăm să reîncărcați pagina.</p>
          <button 
            className="px-4 py-2 bg-automator-500 text-white rounded hover:bg-automator-600"
            onClick={() => window.location.reload()}
          >
            Reîncarcă pagina
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <MaterialsSection />
      <PackagesSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;
