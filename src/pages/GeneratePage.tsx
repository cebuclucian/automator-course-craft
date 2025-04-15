
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import CourseGenerator from '@/components/CourseGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ToneExplanations from '@/components/ToneExplanations';

const GeneratePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    // Check if user has reached the course generation limit based on subscription tier
    if (user) {
      const tier = user.subscription?.tier || 'Free';
      const generatedCoursesCount = user.generatedCourses?.length || 0;
      
      let maxCourses = 0;
      let limitReached = false;
      
      // Set max courses based on subscription tier
      switch (tier) {
        case 'Free':
          maxCourses = 1;
          limitReached = generatedCoursesCount >= maxCourses;
          break;
        case 'Basic':
          maxCourses = 3;
          limitReached = generatedCoursesCount >= maxCourses;
          break;
        case 'Pro':
          maxCourses = 10;
          limitReached = generatedCoursesCount >= maxCourses;
          break;
        case 'Enterprise':
          maxCourses = 30;
          limitReached = generatedCoursesCount >= maxCourses;
          break;
      }
      
      if (limitReached) {
        toast({
          title: language === 'ro' ? 'Limită atinsă' : 'Limit reached',
          description: language === 'ro'
            ? `Ai atins limita de ${maxCourses} materiale pentru pachetul ${tier}. Pentru a genera mai multe cursuri, este necesar să alegi un pachet superior.`
            : `You've reached the limit of ${maxCourses} materials for the ${tier} package. To generate more courses, you need to choose a higher package.`,
          variant: 'default',
        });
        
        navigate('/packages');
      }
    }
  }, [user, navigate, toast, language]);

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
