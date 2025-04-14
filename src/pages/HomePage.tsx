
import React, { useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import MaterialsSection from '@/components/MaterialsSection';
import PackagesSection from '@/components/PackagesSection';
import ContactSection from '@/components/ContactSection';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const HomePage = () => {
  const { language } = useLanguage();

  // Diagnostics on page load
  useEffect(() => {
    try {
      console.log('HomePage loaded successfully');
      
      // Check if critical contexts are available
      if (!document.querySelector('body')) {
        console.error('Critical DOM elements missing');
      }
      
      // Log browser and environment info for debugging
      console.log('Browser info:', {
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        cookiesEnabled: navigator.cookieEnabled
      });
      
      // Check for localStorage errors
      try {
        localStorage.setItem('diagnostic_test', 'test');
        localStorage.removeItem('diagnostic_test');
      } catch (storageError) {
        console.error('LocalStorage error:', storageError);
        toast({
          title: language === 'ro' ? 'Avertisment' : 'Warning',
          description: language === 'ro'
            ? 'Setările de confidențialitate ale browserului pot afecta funcționarea site-ului.'
            : 'Browser privacy settings may affect site functionality.',
          variant: "default"
        });
      }
    } catch (error) {
      console.error('HomePage diagnostics error:', error);
    }
  }, [language]);

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
