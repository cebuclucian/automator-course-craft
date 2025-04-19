import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseFormData, GenerationType } from '@/types';
import { 
  generateCourse, 
  checkCourseGenerationStatus, 
  testEdgeFunctionConnection,
  testClaudeAPI,
  runFullDiagnosis 
} from '@/services/courseGeneration';
import { useUserProfile } from '@/contexts/UserProfileContext';
import CourseGeneratorForm from './course-generator/CourseGeneratorForm';
import CourseGeneratorAuth from './course-generator/CourseGeneratorAuth';
import ToneExplanations from './ToneExplanations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Info, RefreshCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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
  const [generationStatusMessage, setGenerationStatusMessage] = useState<string | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [pollingErrorCount, setPollingErrorCount] = useState(0);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [showDiagnosticButton, setShowDiagnosticButton] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const formSubmitCount = useRef(0);
  const [milestone, setMilestone] = useState<string | null>(null);

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
  }, [language, formData.language]);

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
    const safetyTimeout = setTimeout(() => {
      if (loading && generationJobId) {
        console.log('CourseGenerator - Safety timeout triggered after 120 seconds, forcing completion');
        cleanupTimers();
        setLoading(false);
        setGenerationProgress(100);
        
        toast({
          title: language === 'ro' ? 'Procesare finalizată' : 'Processing completed',
          description: language === 'ro' 
            ? 'Generarea a durat mai mult decât de obicei. Verificați materialele în contul dvs.' 
            : 'Generation took longer than usual. Check materials in your account.',
        });
        
        setTimeout(() => {
          navigate('/account');
        }, 2000);
      }
    }, 120000);
    
    return () => clearTimeout(safetyTimeout);
  }, [loading, generationJobId, cleanupTimers, toast, navigate, language]);

  const checkApiConnection = async () => {
    try {
      console.log('CourseGenerator - Verificare conexiune API Claude');
      
      const clientInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      console.log('CourseGenerator - Informații client:', clientInfo);
      
      const { data: response, error } = await supabase.functions.invoke('generate-course', {
        body: { 
          action: 'test-connection',
          clientInfo
        }
      });
      
      console.log('CourseGenerator - Răspuns conexiune API:', response);
      
      if (error) {
        console.error('CourseGenerator - Eroare la verificarea conexiunii API:', error);
        setTechnicalDetails(JSON.stringify({
          error,
          timestamp: new Date().toISOString(),
          clientInfo
        }, null, 2));
        return false;
      }
      
      if (response && response.status === 'ok') {
        console.log('CourseGenerator - Conexiune API funcțională');
        return true;
      } else {
        console.error('CourseGenerator - Conexiune API eșuată');
        setTechnicalDetails(JSON.stringify({
          response, 
          timestamp: new Date().toISOString(),
          clientInfo
        }, null, 2));
        return false;
      }
    } catch (error) {
      console.error('CourseGenerator - Eroare verificare conexiune API:', error);
      setTechnicalDetails(JSON.stringify({
        error: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, null, 2));
      return false;
    }
  };

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
      
      setShowDiagnosticButton(true);
    }, 90000);
    
    setGenerationTimeout(timeout);
    
    const interval = window.setInterval(async () => {
      try {
        console.log('CourseGenerator - Polling job status for:', generationJobId);
        
        const statusResponse = await checkCourseGenerationStatus(generationJobId);
        console.log('CourseGenerator - Job status response:', statusResponse);
        
        if (statusResponse.milestone && statusResponse.milestone !== milestone) {
          setMilestone(statusResponse.milestone);
          console.log('CourseGenerator - Milestone actualizat:', statusResponse.milestone);
        }
        
        if (statusResponse.statusMessage) {
          setGenerationStatusMessage(statusResponse.statusMessage);
        }
        
        if (statusResponse.status === 'completed') {
          console.log('CourseGenerator - Job completed successfully!');
          cleanupTimers();
          setLoading(false);
          setGenerationProgress(100);
          setGenerationStatusMessage(language === 'ro' 
            ? 'Material generat cu succes!' 
            : 'Material successfully generated!');
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
          setGenerationStatusMessage(language === 'ro'
            ? `Eroare: ${statusResponse.error || 'Necunoscută'}`
            : `Error: ${statusResponse.error || 'Unknown'}`);
          
          if (statusResponse.errorDetails) {
            setTechnicalDetails(JSON.stringify(statusResponse.errorDetails, null, 2));
          }
          
          setShowDiagnosticButton(true);
        } else if (statusResponse.status === 'processing') {
          setGenerationProgress(statusResponse.progressPercent || 0);
          
          if (statusResponse.jobBlocked) {
            setGenerationStatusMessage(
              language === 'ro'
                ? `${statusResponse.statusMessage || 'Se procesează'} (posibil blocat - fără actualizări recente)`
                : `${statusResponse.statusMessage || 'Processing'} (possibly stuck - no recent updates)`
            );
          } else {
            setGenerationStatusMessage(statusResponse.statusMessage);
          }
          
          console.log(`CourseGenerator - Job still processing. Progress: ${statusResponse.progressPercent}%, Status: ${statusResponse.statusMessage}`);
        } else if (statusResponse.status === 'not_found') {
          console.error('CourseGenerator - Job not found in store');
          cleanupTimers();
          setLoading(false);
          setError(language === 'ro' 
            ? 'Job-ul de generare nu a fost găsit. Este posibil să fi expirat sau să nu fi fost creat corect.' 
            : 'Generation job not found. It may have expired or not been created correctly.');
          setGenerationStatusMessage(language === 'ro'
            ? 'Job-ul de generare nu a fost găsit'
            : 'Generation job not found');
          
          setShowDiagnosticButton(true);
        }
      } catch (error: any) {
        console.error('CourseGenerator - Error checking job status:', error);
        
        setTechnicalDetails(JSON.stringify({
          errorMessage: error.message,
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        setPollingErrorCount(prev => prev + 1);
        if (pollingErrorCount >= 3) {
          console.log('CourseGenerator - Too many polling errors, stopping polling');
          cleanupTimers();
          setLoading(false);
          setError(language === 'ro' 
            ? 'Nu s-a putut verifica statusul generării. Verificați materialele în contul dvs.' 
            : 'Could not check generation status. Please check materials in your account.');
          setGenerationStatusMessage(language === 'ro'
            ? 'Eroare verificare status'
            : 'Status check error');
          
          setShowDiagnosticButton(true);
        }
      }
    }, 3000);
    
    setPollingInterval(interval);
    
    return () => cleanupTimers();
  }, [generationJobId, language, navigate, toast, cleanupTimers, refreshUser, pollingErrorCount, milestone]);

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

  const runDiagnostics = async () => {
    try {
      setIsDiagnosticRunning(true);
      setTechnicalDetails(null);
      setError(null);
      
      console.log("CourseGenerator - Rulare diagnosticare completă");
      
      const diagnosticResults = await runFullDiagnosis();
      console.log("CourseGenerator - Rezultate diagnoză:", diagnosticResults);
      
      setDiagnosticResults(diagnosticResults);
      setTechnicalDetails(JSON.stringify(diagnosticResults, null, 2));
      setShowTechnicalDetails(true);
      
      toast({
        title: language === 'ro' ? 'Diagnosticare finalizată' : 'Diagnostics completed',
        description: language === 'ro' 
          ? 'Rezultatele diagnosticării sunt disponibile în secțiunea tehnică.' 
          : 'Diagnostic results are available in the technical section.',
        variant: 'default',
      });
    } catch (error) {
      console.error("CourseGenerator - Eroare la diagnosticare:", error);
      setTechnicalDetails(JSON.stringify({
        error: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, null, 2));
      setShowTechnicalDetails(true);
      
      toast({
        title: language === 'ro' ? 'Eroare diagnoză' : 'Diagnostic error',
        description: error.message || (language === 'ro' ? 'A apărut o eroare în timpul diagnosticării' : 'An error occurred during diagnostics'),
        variant: 'destructive'
      });
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitCount = ++formSubmitCount.current;
    console.log(`CourseGenerator - Form submit #${submitCount} triggered`);
    
    setError(null);
    setSuccess(null);
    setGenerationProgress(0);
    setGenerationJobId(null);
    setPollingErrorCount(0);
    setTechnicalDetails(null);
    setShowTechnicalDetails(false);
    setShowDiagnosticButton(false);
    setMilestone(null);
    setGenerationStatusMessage(language === 'ro' ? 'Se inițiază generarea...' : 'Initializing generation...');
    
    cleanupTimers();
    
    const apiConnected = await checkApiConnection();
    if (!apiConnected) {
      setError(language === 'ro' 
        ? 'Nu s-a putut conecta la API. Verificați conexiunea și încercați din nou.' 
        : 'Could not connect to API. Check your connection and try again.');
      
      setShowDiagnosticButton(true);
      return;
    }
    
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
      console.log(`CourseGenerator - Starting course generation #${submitCount} with form data:`, formData);
      console.log(`CourseGenerator - Generation #${submitCount} type:`, generationType);
      
      const fullFormData = { ...formData, generationType };
      
      const clientInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        submitCount
      };
      fullFormData.clientInfo = clientInfo;
      
      console.log(`CourseGenerator - Calling generateCourse service for submit #${submitCount} with clientInfo:`, clientInfo);
      
      try {
        console.log(`CourseGenerator - Testing Claude API before generation #${submitCount}`);
        const { data: claudeTestResponse, error: claudeTestError } = await supabase.functions.invoke('generate-course', {
          body: { 
            action: 'test-claude',
            submitCount,
            clientTimestamp: new Date().toISOString(),
            clientInfo
          }
        });
        
        console.log(`CourseGenerator - Claude API test response for submit #${submitCount}:`, claudeTestResponse);
        
        if (claudeTestError) {
          console.error(`CourseGenerator - Claude API test error for submit #${submitCount}:`, claudeTestError);
          setTechnicalDetails(JSON.stringify({
            claudeTestError,
            timestamp: new Date().toISOString(),
            submitCount
          }, null, 2));
          throw new Error(language === 'ro' 
            ? 'API-ul Claude nu este disponibil în acest moment. Vă rugăm să încercați mai târziu.' 
            : 'Claude API is not available at the moment. Please try again later.');
        }
        
        if (!claudeTestResponse || !claudeTestResponse.success) {
          console.error(`CourseGenerator - Claude API test failed for submit #${submitCount}:`, claudeTestResponse);
          setTechnicalDetails(JSON.stringify({
            claudeTestResponse,
            timestamp: new Date().toISOString(),
            submitCount
          }, null, 2));
          throw new Error(language === 'ro' 
            ? 'Testul API Claude a eșuat. Detalii în secțiunea tehnică.' 
            : 'Claude API test failed. See technical section for details.');
        }
        
        console.log(`CourseGenerator - Claude API test passed for submit #${submitCount}, proceeding with generation`);
      } catch (claudeTestError) {
        console.error(`CourseGenerator - Error testing Claude API for submit #${submitCount}:`, claudeTestError);
        setLoading(false);
        setError(claudeTestError.message || (language === 'ro' 
          ? 'Nu s-a putut verifica disponibilitatea API Claude.' 
          : 'Could not verify Claude API availability.'));
        
        setShowDiagnosticButton(true);
        return;
      }
      
      console.log(`CourseGenerator - Sending final generation request for submit #${submitCount}`);
      
      const generatedCourse = await generateCourse(fullFormData);
      
      console.log(`CourseGenerator - Course generation #${submitCount} response received:`, generatedCourse);
      
      if (generatedCourse) {
        const isProcessing = generatedCourse.status === 'processing';
        console.log(`CourseGenerator - Job #${submitCount} status:`, generatedCourse.status);
        
        if (generatedCourse.jobId) {
          console.log(`CourseGenerator - Setting job ID for polling (submit #${submitCount}):`, generatedCourse.jobId);
          setGenerationJobId(generatedCourse.jobId);
          
          if (generatedCourse.milestone) {
            setMilestone(generatedCourse.milestone);
          }
        }
        
        if (!isAdminUser) {
          console.log(`CourseGenerator - Decrementing generations left for non-admin user (submit #${submitCount})`);
          const decrementSuccess = await decrementGenerationsLeft(user.id);
          
          if (decrementSuccess) {
            console.log(`CourseGenerator - Successfully decremented generations count (submit #${submitCount})`);
            await refreshProfile();
          } else {
            console.warn(`CourseGenerator - Failed to decrement generations count (submit #${submitCount})`);
          }
        } else {
          console.log(`CourseGenerator - Admin user - skipping generation count decrement (submit #${submitCount})`);
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
      console.error(`CourseGenerator - Error in course generation (submit #${submitCount}):`, error);
      setLoading(false);
      setError(error.message || (language === 'ro' ? "A apărut o eroare neașteptată în timpul generării materialelor" : "An unexpected error occurred during material generation"));
      
      setTechnicalDetails(JSON.stringify({
        errorMessage: error.message,
        errorDetails: error.details || null,
        errorResponse: error.response || null,
        timestamp: new Date().toISOString(),
        submitCount
      }, null, 2));
      
      toast({
        title: language === 'ro' ? 'Eroare la generare' : 'Generation error',
        description: error.message || (language === 'ro' ? "A apărut o eroare neașteptată" : "An unexpected error occurred"),
        variant: 'destructive'
      });
      
      setShowDiagnosticButton(true);
    }
  };

  const toggleTechnicalDetails = () => {
    setShowTechnicalDetails(prev => !prev);
  };
  
  const handleRetry = () => {
    setError(null);
    setTechnicalDetails(null);
    setShowTechnicalDetails(false);
    setShowDiagnosticButton(false);
    handleSubmit(new Event('submit') as any);
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
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleRetry} className="flex items-center gap-1">
                {language === 'ro' ? 'Încearcă din nou' : 'Try again'}
              </Button>
              
              {showDiagnosticButton && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runDiagnostics} 
                  disabled={isDiagnosticRunning}
                  className="flex items-center gap-1"
                >
                  <RefreshCcw className={`h-3 w-3 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
                  {language === 'ro' ? 'Rulează diagnostic' : 'Run diagnostics'}
                </Button>
              )}
              
              {technicalDetails && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleTechnicalDetails} 
                  className="flex items-center gap-1"
                >
                  <Info className="h-3 w-3" />
                  {showTechnicalDetails 
                    ? (language === 'ro' ? 'Ascunde detalii tehnice' : 'Hide technical details')
                    : (language === 'ro' ? 'Arată detalii tehnice' : 'Show technical details')
                  }
                </Button>
              )}
            </div>
            
            {showTechnicalDetails && technicalDetails && (
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-60">
                {technicalDetails}
              </pre>
            )}
          </AlertDescription>
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
            generationsLeft={isAdminUser ? Infinity : (profile?.generationsLeft || 0)}
            isSubscriptionTierFree={!isAdminUser && (user.subscription?.tier === 'Free')}
            jobId={generationJobId}
            generationProgress={generationProgress}
            milestone={milestone}
            error={error}
            statusMessage={generationStatusMessage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGenerator;
