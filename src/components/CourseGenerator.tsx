
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseFormData, GenerationType } from '@/types';
import { generateCourse, checkCourseGenerationStatus } from '@/services/courseGeneration';
import { useUserProfile } from '@/contexts/UserProfileContext';
import CourseGeneratorForm from './course-generator/CourseGeneratorForm';
import CourseGeneratorAuth from './course-generator/CourseGeneratorAuth';
import ToneExplanations from './ToneExplanations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const CourseGenerator = () => {
  const { user, refreshUser } = useAuth();
  const { profile, decrementGenerationsLeft, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLongGenerationWarning, setShowLongGenerationWarning] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationTimeout, setGenerationTimeout] = useState<number | null>(null);

  // Debug user and profile state
  useEffect(() => {
    console.log("CourseGenerator - Rendered with user:", user?.id);
    console.log("CourseGenerator - Profile state:", {
      email: profile?.email,
      generationsLeft: profile?.generationsLeft,
      tier: profile?.subscription?.tier
    });
  }, [user, profile]);

  const [formData, setFormData] = useState<CourseFormData>(() => ({
    language: language === 'ro' ? 'română' : 'english',
    context: 'Corporativ',
    subject: '',
    level: 'Intermediar',
    audience: 'Profesioniști',
    duration: '1 zi',
    tone: 'Profesional',
  }));

  // Check if user is admin
  const isAdminUser = user && profile?.email === 'admin@automator.ro';
  if (isAdminUser) {
    console.log("CourseGenerator - Admin user detected, bypass generation limits");
  }

  useEffect(() => {
    const currentFormLang = formData.language;
    const shouldUpdateLang = 
      (language === 'ro' && currentFormLang !== 'română' && currentFormLang === 'english') || 
      (language !== 'ro' && currentFormLang !== 'english' && currentFormLang === 'română');
    
    if (shouldUpdateLang) {
      console.log('CourseGenerator - Updating form language based on UI language:', language === 'ro' ? 'română' : 'english');
      setFormData(prev => ({
        ...prev,
        language: language === 'ro' ? 'română' : 'english'
      }));
    }
  }, [language]);

  const cleanupTimers = useCallback(() => {
    console.log('CourseGenerator - Cleaning up timers');
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    if (generationTimeout) {
      clearTimeout(generationTimeout);
      setGenerationTimeout(null);
    }
  }, [pollingInterval, generationTimeout]);

  useEffect(() => {
    if (!generationJobId || pollingInterval) return;
    
    console.log('CourseGenerator - Setting up polling for job:', generationJobId);
    
    const timeout = window.setTimeout(() => {
      console.log('CourseGenerator - Generation timed out after 90 seconds');
      cleanupTimers();
      setLoading(false);
      setError(language === 'ro' 
        ? 'Timpul de generare a expirat. Vă rugăm să încercați din nou sau contactați suportul.' 
        : 'Generation time expired. Please try again or contact support.');
    }, 90000); // 90 seconds
    
    setGenerationTimeout(timeout);
    
    const interval = window.setInterval(async () => {
      try {
        console.log('CourseGenerator - Polling job status for:', generationJobId);
        const statusResponse = await checkCourseGenerationStatus(generationJobId);
        console.log('CourseGenerator - Job status response:', statusResponse);
        
        if (statusResponse.status === 'completed') {
          console.log('CourseGenerator - Job completed successfully!');
          cleanupTimers();
          setLoading(false);
          setGenerationProgress(100);
          setSuccess(
            language === 'ro'
              ? 'Material generat cu succes!'
              : 'Material successfully generated!'
          );
          
          toast({
            title: language === 'ro' ? 'Material generat cu succes!' : 'Material successfully generated!',
            description: language === 'ro' 
              ? 'Poți accesa materialul din contul tău.'
              : 'You can access the material from your account.',
            variant: 'default',
          });
          
          await refreshUser();
          
          setTimeout(() => {
            navigate('/account');
          }, 2000);
        } else if (statusResponse.status === 'error') {
          console.error('CourseGenerator - Job failed:', statusResponse.error);
          cleanupTimers();
          setLoading(false);
          setError(statusResponse.error || (language === 'ro' ? 'A apărut o eroare în timpul generării' : 'An error occurred during generation'));
        } else if (statusResponse.status === 'processing') {
          const elapsed = (Date.now() - new Date(statusResponse.startedAt || Date.now()).getTime()) / 1000;
          const estimatedProgress = Math.min(Math.round(elapsed / 90 * 100), 95);
          setGenerationProgress(estimatedProgress);
          console.log(`CourseGenerator - Job still processing. Estimated progress: ${estimatedProgress}%`);
        }
      } catch (error) {
        console.error('CourseGenerator - Error checking job status:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
    
    return () => cleanupTimers();
  }, [generationJobId, language, navigate, toast, cleanupTimers, refreshUser]);

  useEffect(() => {
    return () => cleanupTimers();
  }, [cleanupTimers]);

  const handleFormDataChange = (field: keyof CourseFormData, value: string) => {
    console.log(`CourseGenerator - Updating form field: ${field} = ${value}`);
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (field === 'duration') {
      const longDurations = ['2 zile', '3 zile', '4 zile', '5 zile'];
      setShowLongGenerationWarning(longDurations.includes(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("CourseGenerator - Form submit triggered");
    
    setError(null);
    setSuccess(null);
    setGenerationProgress(0);
    setGenerationJobId(null);
    
    cleanupTimers();
    
    // Debug generations left count
    const generationsLeft = isAdminUser ? 999 : (profile?.generationsLeft || 0);
    console.log("CourseGenerator - Generations left:", generationsLeft);
    console.log("CourseGenerator - Is admin user:", isAdminUser);
    
    if (!isAdminUser && (!profile || profile.generationsLeft <= 0)) {
      console.log("CourseGenerator - User has no generations left:", profile?.generationsLeft);
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
    
    let generationType: GenerationType = isAdminUser ? 'Complet' : 'Preview';
    if (user?.subscription && user.subscription.tier !== 'Free') {
      generationType = 'Complet';
    }
    
    setLoading(true);
    
    try {
      console.log("CourseGenerator - Starting course generation with form data:", formData);
      console.log("CourseGenerator - Generation type:", generationType);
      
      const fullFormData = { ...formData, generationType };
      console.log("CourseGenerator - Calling generateCourse service");
      
      const generatedCourse = await generateCourse(fullFormData);
      
      console.log("CourseGenerator - Course generation response received:", generatedCourse);
      
      if (generatedCourse) {
        const isProcessing = generatedCourse.status === 'processing';
        console.log("CourseGenerator - Job status:", generatedCourse.status);
        
        if (generatedCourse.jobId) {
          console.log("CourseGenerator - Setting job ID for polling:", generatedCourse.jobId);
          setGenerationJobId(generatedCourse.jobId);
        }
        
        if (!isAdminUser) {
          console.log("CourseGenerator - Decrementing generations left for non-admin user");
          const decrementSuccess = await decrementGenerationsLeft(user.id);
          
          if (decrementSuccess) {
            console.log("CourseGenerator - Successfully decremented generations count");
            await refreshProfile();
          } else {
            console.warn("CourseGenerator - Failed to decrement generations count");
          }
        } else {
          console.log("CourseGenerator - Admin user - skipping generation count decrement");
        }
        
        if (!isProcessing) {
          setLoading(false);
          setSuccess(
            language === 'ro' 
              ? 'Material generat cu succes!'
              : 'Material successfully generated!'
          );
          
          toast({
            title: language === 'ro' ? 'Material generat cu succes!' : 'Material successfully generated!',
            description: language === 'ro' 
              ? 'Poți accesa materialul din contul tău.'
              : 'You can access the material from your account.',
          });

          if (refreshUser) {
            await refreshUser();
          }

          setTimeout(() => {
            navigate('/account');
          }, 2000);
        } else {
          toast({
            title: language === 'ro' ? 'Generare în curs...' : 'Generation in progress...',
            description: language === 'ro' 
              ? 'Generarea materialelor de curs poate dura până la câteva minute pentru cursurile complexe. Vei fi notificat când procesul este finalizat.' 
              : 'Course material generation may take up to several minutes for complex courses. You will be notified when the process is complete.',
          });
        }
      }
    } catch (error: any) {
      console.error("CourseGenerator - Error in course generation:", error);
      setLoading(false);
      setError(error.message || "A apărut o eroare neașteptată în timpul generării materialelor");
      toast({
        title: language === 'ro' ? 'Eroare la generare' : 'Generation error',
        description: error.message || "A apărut o eroare neașteptată",
        variant: 'destructive'
      });
    }
  };

  if (!user) {
    return (
      <CourseGeneratorAuth 
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
      />
    );
  }

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
          {loading && generationJobId && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-center">
                {language === 'ro' ? 'Progres generare' : 'Generation progress'}
              </p>
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1 text-center">
                {language === 'ro' 
                  ? `Se generează materialul (${generationProgress}%)`
                  : `Generating material (${generationProgress}%)`}
              </p>
            </div>
          )}
          
          <CourseGeneratorForm 
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onSubmit={handleSubmit}
            loading={loading}
            showLongGenerationWarning={showLongGenerationWarning}
            generationsLeft={isAdminUser ? Infinity : (profile?.generationsLeft || 0)}
            isSubscriptionTierFree={!isAdminUser && (user.subscription?.tier === 'Free')}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGenerator;
