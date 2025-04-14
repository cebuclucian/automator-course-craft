
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import CourseGenerator from '@/components/CourseGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const GeneratePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    // Check if user is on free plan and already has a generated course
    if (user) {
      const isFreeUser = !user.subscription || user.subscription.tier === 'Free';
      const hasGeneratedCourse = user.generatedCourses && user.generatedCourses.length > 0;
      
      if (isFreeUser && hasGeneratedCourse) {
        toast({
          title: language === 'ro' ? 'Acces limitat' : 'Limited access',
          description: language === 'ro'
            ? 'Ai deja un material în versiunea Preview. Pentru a genera mai multe cursuri, este necesar să alegi un pachet plătit.'
            : 'You already have a material in Preview version. To generate more courses, you need to choose a paid package.',
          variant: 'default',
        });
        
        navigate('/packages');
      }
    }
  }, [user, navigate, toast, language]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {language === 'ro' ? 'Generator de Materiale' : 'Materials Generator'}
      </h1>
      <CourseGenerator />
    </div>
  );
};

export default GeneratePage;
