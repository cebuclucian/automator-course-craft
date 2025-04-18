
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import CourseGenerator from '@/components/CourseGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ToneExplanations from '@/components/ToneExplanations';
import { useUserProfile } from '@/contexts/UserProfileContext';

const GeneratePage = () => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Verifică dacă utilizatorul este admin
  const isAdminUser = user && profile?.email === 'admin@automator.ro';

  useEffect(() => {
    // Always try to refresh the profile when accessing the generate page
    // to ensure we have the most up-to-date generation credits
    if (user) {
      refreshProfile();
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    // Check if user has reached the course generation limit based on subscription tier
    // Ignoră verificarea pentru contul admin
    if (user && profile && !isAdminUser) {
      const tier = profile.subscription?.tier || 'Free';
      const generationsLeft = profile.generationsLeft || 0;
      
      if (generationsLeft <= 0) {
        toast({
          title: language === 'ro' ? 'Limită atinsă' : 'Limit reached',
          description: language === 'ro'
            ? `Ai atins limita de generări pentru pachetul ${tier}. Pentru a genera mai multe cursuri, este necesar să alegi un pachet superior.`
            : `You've reached the limit of generations for the ${tier} package. To generate more courses, you need to choose a higher package.`,
          variant: 'default',
        });
        
        navigate('/packages');
      }
    }
  }, [user, profile, navigate, toast, language, isAdminUser]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ro' ? 'Generator de Materiale' : 'Materials Generator'}
        </h1>
        <ToneExplanations />
      </div>
      <CourseGenerator />
    </div>
  );
};

export default GeneratePage;
