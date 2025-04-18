
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface CourseGeneratorAuthProps {
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
}

const CourseGeneratorAuth: React.FC<CourseGeneratorAuthProps> = ({
  isAuthModalOpen,
  setIsAuthModalOpen,
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{t('auth.loginRequired')}</CardTitle>
          <CardDescription>
            {language === 'ro' 
              ? 'Creează un cont gratuit sau autentifică-te pentru a accesa generatorul de materiale.'
              : 'Create a free account or log in to access the materials generator.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => setIsAuthModalOpen(true)} className="flex-1">
              {language === 'ro' ? 'Autentificare / Înregistrare' : 'Login / Register'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode="register" 
      />
    </div>
  );
};

export default CourseGeneratorAuth;
