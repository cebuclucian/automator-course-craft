
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseFormData, GenerationType } from '@/types';
import { generateCourse } from '@/services/courseGeneration';
import { useUserProfile } from '@/contexts/UserProfileContext';
import CourseGeneratorForm from './course-generator/CourseGeneratorForm';
import CourseGeneratorAuth from './course-generator/CourseGeneratorAuth';
import ToneExplanations from './ToneExplanations';

const CourseGenerator = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLongGenerationWarning, setShowLongGenerationWarning] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    language: language === 'ro' ? 'română' : 'english',
    context: 'Corporativ',
    subject: '',
    level: 'Intermediar',
    audience: 'Profesioniști',
    duration: '1 zi',
    tone: 'Profesional',
  });

  // Verifică dacă utilizatorul este admin
  const isAdminUser = user && profile?.email === 'admin@automator.ro';

  if (!user) {
    return (
      <CourseGeneratorAuth 
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
      />
    );
  }

  const handleFormDataChange = (field: keyof CourseFormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (field === 'duration') {
      const longDurations = ['2 zile', '3 zile', '4 zile', '5 zile'];
      setShowLongGenerationWarning(longDurations.includes(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Contul admin nu are restricții
    if (!isAdminUser && (!profile || profile.generationsLeft <= 0)) {
      toast({
        title: language === 'ro' ? 'Limită atinsă' : 'Limit reached',
        description: language === 'ro' 
          ? 'Nu mai aveți generări disponibile pentru acest abonament. Pentru a genera mai multe cursuri, alegeți un pachet superior.' 
          : 'You have no more available generations for this subscription. To generate more courses, choose a higher package.',
        variant: 'default',
      });
      
      navigate('/packages');
      return;
    }
    
    // Pentru admin, generăm întotdeauna versiunea completă
    let generationType: GenerationType = isAdminUser ? 'Complet' : 'Preview';
    if (user.subscription && user.subscription.tier !== 'Free') {
      generationType = 'Complet';
    }
    
    setLoading(true);
    
    try {
      const fullFormData = { ...formData, generationType };
      const generatedCourse = await generateCourse(fullFormData);
      
      if (generatedCourse) {
        const isProcessing = generatedCourse.status === 'processing';
        
        toast({
          title: language === 'ro' 
            ? isProcessing ? 'Generare în curs...' : 'Material generat cu succes!' 
            : isProcessing ? 'Generation in progress...' : 'Material successfully generated!',
          description: language === 'ro' 
            ? isProcessing 
              ? 'Generarea materialelor de curs poate dura până la câteva minute pentru cursurile complexe. Vei fi notificat când procesul este finalizat.' 
              : 'Poți accesa materialul din contul tău.'
            : isProcessing
              ? 'Course material generation may take up to several minutes for complex courses. You will be notified when the process is complete.'
              : 'You can access the material from your account.',
        });

        navigate('/account');
      }
    } catch (error) {
      console.error("Error in course generation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ro' ? 'Generator de Materiale' : 'Materials Generator'}
        </h1>
        <ToneExplanations />
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            {language === 'ro' ? 'Generator de materiale' : 'Materials Generator'}
          </CardTitle>
          <CardDescription>
            {language === 'ro' 
              ? 'Completează formularul pentru a genera materiale de curs personalizate.'
              : 'Fill out the form to generate customized course materials.'}
          </CardDescription>
          {isAdminUser && (
            <div className="mt-2 bg-blue-50 dark:bg-blue-950 p-2 rounded text-blue-700 dark:text-blue-300 text-sm">
              {language === 'ro' 
                ? 'Cont administrator detectat - Generări nelimitate, versiune completă'
                : 'Admin account detected - Unlimited generations, full version'}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <CourseGeneratorForm 
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onSubmit={handleSubmit}
            loading={loading}
            showLongGenerationWarning={showLongGenerationWarning}
            generationsLeft={isAdminUser ? Infinity : profile?.generationsLeft}
            isSubscriptionTierFree={!isAdminUser && user.subscription?.tier === 'Free'}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGenerator;
