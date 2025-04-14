
import React from 'react';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import MaterialsSection from '@/components/MaterialsSection';
import PackagesSection from '@/components/PackagesSection';
import ContactSection from '@/components/ContactSection';

const HomePage = () => {
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
