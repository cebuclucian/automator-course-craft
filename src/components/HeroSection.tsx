
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';

const HeroSection = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCTA = () => {
    if (user) {
      // Dacă utilizatorul este deja autentificat, îl ducem la pagina de cont
      navigate('/account');
    } else {
      // Dacă utilizatorul nu este autentificat, deschidem modalul de autentificare
      setIsAuthModalOpen(true);
    }
  };

  return (
    <section className="relative py-20 bg-gradient-to-br from-automator-50 via-automator-100 to-blue-100 dark:from-automator-950 dark:via-automator-900 dark:to-blue-900">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          {t('hero.title')}
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-700 dark:text-gray-300">
          {t('hero.subtitle')}
        </p>
        <Button 
          onClick={handleCTA} 
          size="lg" 
          className="bg-automator-600 hover:bg-automator-700 text-white"
        >
          {t('hero.cta')}
        </Button>
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode="register" 
      />
    </section>
  );
};

export default HeroSection;

