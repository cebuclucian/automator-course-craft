import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';

const HeroSection = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const handleCTA = () => {
    if (user) {
      navigate('/generate');
    } else {
      setIsAuthModalOpen(true);
    }
  };
  
  const handleAccountCTA = () => {
    if (user) {
      navigate('/account');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <section className="relative py-20 bg-gradient-to-br from-automator-50 via-automator-100 to-blue-100 dark:from-automator-950 dark:via-automator-900 dark:to-blue-900">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold mb-6 my-[18px] md:text-7xl">
          {language === 'ro' 
            ? (
              <>
                Ai de livrat un curs mâine? 
                <br />
                E gata acum!
              </>
            ) 
            : (
              <>
                Have a course to deliver tomorrow? 
                <br />
                It's ready now!
              </>
            )}
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-700 dark:text-gray-300">
          {language === 'ro' 
            ? 'Platforma care te ajută să creezi materiale pentru orice tip de curs adaptat nevoilor tale în câteva minute' 
            : 'The platform that helps you create materials for any type of course tailored to your needs in minutes'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleCTA} 
            size="lg" 
            className="bg-automator-600 hover:bg-automator-700 text-white"
          >
            {language === 'ro' ? 'Generează materiale' : 'Generate materials'}
          </Button>
          <Button 
            onClick={handleAccountCTA} 
            size="lg" 
            variant="outline"
          >
            {t('hero.cta')}
          </Button>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode="register" />
    </section>
  );
};

export default HeroSection;
