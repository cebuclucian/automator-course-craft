
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const CourseGenerator = () => {
  const { user } = useAuth();
  const { profile, decrementGenerationsLeft, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLongGenerationWarning, setShowLongGenerationWarning] = useState(false);
  
  // Inițializăm formData o singură dată la încărcarea componentei, nu în fiecare render
  const [formData, setFormData] = useState<CourseFormData>(() => ({
    language: language === 'ro' ? 'română' : 'english',
    context: 'Corporativ',
    subject: '',
    level: 'Intermediar',
    audience: 'Profesioniști',
    duration: '1 zi',
    tone: 'Profesional',
  }));

  // Verifică dacă utilizatorul este admin
  const isAdminUser = user && profile?.email === 'admin@automator.ro';

  // Actualizează doar limba formularului când se schimbă limba UI, dar doar dacă formData.language nu a fost deja personalizat
  useEffect(() => {
    const currentFormLang = formData.language;
    const shouldUpdateLang = 
      (language === 'ro' && currentFormLang !== 'română' && currentFormLang === 'english') || 
      (language !== 'ro' && currentFormLang !== 'english' && currentFormLang === 'română');
    
    if (shouldUpdateLang) {
      console.log('Actualizare limbă formular bazată pe limba UI:', language === 'ro' ? 'română' : 'english');
      setFormData(prev => ({
        ...prev,
        language: language === 'ro' ? 'română' : 'english'
      }));
    }
  }, [language]);

  if (!user) {
    return (
      <CourseGeneratorAuth 
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
      />
    );
  }

  const handleFormDataChange = (field: keyof CourseFormData, value: string) => {
    console.log(`Actualizare câmp formular: ${field} = ${value}`);
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (field === 'duration') {
      const longDurations = ['2 zile', '3 zile', '4 zile', '5 zile'];
      setShowLongGenerationWarning(longDurations.includes(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset any previous errors or success messages
    setError(null);
    setSuccess(null);
    
    // Contul admin nu are restricții
    if (!isAdminUser && (!profile || profile.generationsLeft <= 0)) {
      console.log("User has no generations left:", profile?.generationsLeft);
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
      console.log("Starting course generation with form data:", formData);
      console.log("Generation type:", generationType);
      
      const fullFormData = { ...formData, generationType };
      const generatedCourse = await generateCourse(fullFormData);
      
      console.log("Course generation completed successfully:", generatedCourse);
      
      if (generatedCourse) {
        const isProcessing = generatedCourse.status === 'processing';
        
        // Decrementăm doar dacă nu este admin
        if (!isAdminUser) {
          console.log("Decrementing generations left for non-admin user");
          const decrementSuccess = await decrementGenerationsLeft(user.id);
          
          if (decrementSuccess) {
            console.log("Successfully decremented generations count");
            await refreshProfile();
          } else {
            console.warn("Failed to decrement generations count");
          }
        } else {
          console.log("Admin user - skipping generation count decrement");
        }
        
        // Afișăm un mesaj de succes în interfață
        setSuccess(
          language === 'ro' 
            ? isProcessing 
              ? 'Generarea a început și poate dura până la câteva minute. Veți fi redirecționat când se finalizează.'
              : 'Material generat cu succes!'
            : isProcessing
              ? 'Generation has started and might take a few minutes. You will be redirected when it completes.'
              : 'Material successfully generated!'
        );
        
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

        // Redirecționăm doar dacă generarea este completă și nu în procesare
        if (!isProcessing) {
          setTimeout(() => {
            navigate('/account');
          }, 2000); // Delay redirect by 2 seconds to show success message
        } else {
          // Pentru procesări în curs, vom adăuga logică pentru verificare periodică
          console.log("Long-running job detected, will check status periodically");
          // Status checking logic would be implemented here or in a useEffect
        }
      }
    } catch (error: any) {
      console.error("Error in course generation:", error);
      setError(error.message || "A apărut o eroare neașteptată în timpul generării materialelor");
      toast({
        title: language === 'ro' ? 'Eroare la generare' : 'Generation error',
        description: error.message || "A apărut o eroare neașteptată",
        variant: 'destructive'
      });
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
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'ro' ? 'Eroare' : 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>{language === 'ro' ? 'Succes' : 'Success'}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
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
