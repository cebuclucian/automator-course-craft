import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supportedCourseLanguages } from '@/config/supportedCourseLanguages';
import { GeneratedCourse, CourseFormData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { checkCourseGenerationStatus } from '@/services/courseGeneration';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const GeneratedMaterialsTab = () => {
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [processingCourses, setProcessingCourses] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [pollingIntervals, setPollingIntervals] = useState<Record<string, NodeJS.Timeout>>({});
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userChecked, setUserChecked] = useState<boolean>(false);
  const [coursesData, setCoursesData] = useState<GeneratedCourse[]>([]);
  
  // Debugging logs
  useEffect(() => {
    console.log("GeneratedMaterialsTab - Component mounted with user:", 
      user ? {
        id: user.id,
        email: user.email,
        hasCoursesArray: Array.isArray(user.generatedCourses),
        coursesCount: Array.isArray(user.generatedCourses) ? user.generatedCourses.length : 'N/A'
      } : 'No user');
  }, [user]);

  // Initialize component with safety checks for user data
  useEffect(() => {
    const initializeComponentData = () => {
      console.log("GeneratedMaterialsTab - Initializing component data");
      
      try {
        if (!user) {
          console.log("GeneratedMaterialsTab - No user data available");
          setUserChecked(true);
          setCoursesData([]);
          return;
        }
        
        if (!user.generatedCourses) {
          console.log("GeneratedMaterialsTab - No generatedCourses array in user object");
          setCoursesData([]);
          setUserChecked(true);
          return;
        }
        
        if (!Array.isArray(user.generatedCourses)) {
          console.error("GeneratedMaterialsTab - generatedCourses is not an array:", user.generatedCourses);
          setErrorMessage("Datele despre cursuri sunt într-un format invalid. Reîncărcați pagina.");
          setHasError(true);
          setCoursesData([]);
          setUserChecked(true);
          refreshUser();
          return;
        }
        
        // Normalize and validate course data
        const validCourses: GeneratedCourse[] = user.generatedCourses
          .filter(course => course && typeof course === 'object' && course.id)
          .map(course => {
            // Create a properly typed default formData with all required fields
            const defaultFormData: CourseFormData = {
              subject: 'Curs fără titlu',
              level: 'Intermediar' as const,
              audience: 'Profesioniști' as const,
              duration: '1h' as const,
              language: 'română' as const,
              context: 'Corporativ' as const,
              tone: 'Profesional' as const
            };
            
            // Use the course's formData if it has all required fields, otherwise use default with overrides
            const formData: CourseFormData = 
              course.formData && 
              typeof course.formData === 'object' &&
              'language' in course.formData &&
              'context' in course.formData &&
              'tone' in course.formData
                ? course.formData as CourseFormData
                : {
                    ...defaultFormData,
                    ...(course.formData && typeof course.formData === 'object' 
                      ? {
                          subject: course.formData.subject || defaultFormData.subject,
                          level: (course.formData.level as any) || defaultFormData.level,
                          audience: (course.formData.audience as any) || defaultFormData.audience,
                          duration: (course.formData.duration as any) || defaultFormData.duration
                        } 
                      : {})
                  };
                  
            return {
              id: course.id,
              createdAt: course.createdAt || new Date(),
              expiresAt: course.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              formData,
              sections: Array.isArray(course.sections) ? course.sections : [],
              previewMode: course.previewMode ?? false,
              status: course.status || 'completed',
              jobId: course.jobId || course.id
            };
          });
          
        console.log(`GeneratedMaterialsTab - Processed ${validCourses.length} valid courses`);
        setCoursesData(validCourses);
        setUserChecked(true);
      } catch (error) {
        console.error("GeneratedMaterialsTab - Error initializing component:", error);
        setErrorMessage("A apărut o eroare la inițializarea componentei.");
        setHasError(true);
        setCoursesData([]);
        setUserChecked(true);
      }
    };
    
    initializeComponentData();
  }, [user, refreshUser]);

  // Polling logic for processing courses
  useEffect(() => {
    if (!userChecked || !coursesData.length) return;
    
    console.log("GeneratedMaterialsTab - Setting up polling for processing courses");
    
    // Cleanup existing intervals
    Object.values(pollingIntervals).forEach(intervalId => {
      clearInterval(intervalId);
    });
    
    const newProcessingCourses = {} as Record<string, boolean>;
    const newProgress = {} as Record<string, number>;
    const newIntervals = {} as Record<string, NodeJS.Timeout>;
    
    // Find processing courses
    const processingCoursesList = coursesData.filter(course => 
      course && course.status === 'processing' && course.jobId
    );
    
    console.log(`GeneratedMaterialsTab - Found ${processingCoursesList.length} processing courses`);
    
    // Set up polling for each processing course
    processingCoursesList.forEach(course => {
      if (course.jobId) {
        newProcessingCourses[course.id] = true;
        newProgress[course.id] = 10;
        
        const pollStatus = async () => {
          try {
            console.log(`GeneratedMaterialsTab - Checking status for course ${course.id}`);
            const status = await checkCourseGenerationStatus(course.jobId!);
            
            if (status.status === 'completed') {
              console.log(`GeneratedMaterialsTab - Course ${course.id} completed`);
              
              if (newIntervals[course.id]) {
                clearInterval(newIntervals[course.id]);
                delete newIntervals[course.id];
              }
              
              setProcessingCourses(prev => {
                const updated = {...prev};
                delete updated[course.id];
                return updated;
                });
                
                setProgress(prev => ({
                  ...prev,
                  [course.id]: 100
                }));
                
                toast({
                  title: "Material generat",
                  description: "Materialul a fost generat cu succes",
                });
                
                refreshUser();
                
              } else if (status.status === 'processing') {
                setProgress(prev => ({
                  ...prev,
                  [course.id]: Math.min(95, (prev[course.id] || 0) + 5)
                }));
              }
            } catch (error) {
              console.error(`GeneratedMaterialsTab - Error checking status for course ${course.id}:`, error);
            }
          };
          
          pollStatus();
          
          const intervalId = setInterval(pollStatus, 10000);
          newIntervals[course.id] = intervalId;
        }
      });
      
      setProcessingCourses(newProcessingCourses);
      setProgress(newProgress);
      setPollingIntervals(newIntervals);
      
      return () => {
        Object.values(newIntervals).forEach(intervalId => {
          clearInterval(intervalId);
        });
      };
    }, [userChecked, coursesData, refreshUser, toast]);

  const handleRefreshMaterials = useCallback(async () => {
    console.log("GeneratedMaterialsTab - Manual refresh triggered");
    setLoading(true);
    setErrorMessage(null);
    setHasError(false);
    
    try {
      Object.values(pollingIntervals).forEach(intervalId => {
        clearInterval(intervalId);
      });
      setPollingIntervals({});
      
      await refreshUser();
      console.log("GeneratedMaterialsTab - Manual refresh completed");
    } catch (error) {
      console.error("GeneratedMaterialsTab - Error refreshing materials:", error);
      setErrorMessage("Nu am putut reîmprospăta materialele. Încercați din nou.");
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [refreshUser, pollingIntervals]);
  
  if (hasError) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{language === 'ro' ? 'Materiale generate' : 'Generated materials'}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefreshMaterials} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {language === 'ro' ? 'Reîmprospătează' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Eroare</AlertTitle>
            <AlertDescription>{errorMessage || 'A apărut o eroare la încărcarea materialelor.'}</AlertDescription>
          </Alert>
          
          <Link to="/generate">
            <Button className="w-full">
              {language === 'ro' ? 'Generează material nou' : 'Generate new material'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!userChecked || loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{language === 'ro' ? 'Materiale generate' : 'Generated materials'}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === 'ro' ? 'Se încarcă materialele...' : 'Loading materials...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No materials case
  if (coursesData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{language === 'ro' ? 'Materiale generate' : 'Generated materials'}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefreshMaterials} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {language === 'ro' ? 'Reîmprospătează' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              {language === 'ro' ? 'Nu aveți materiale generate încă.' : 'You don\'t have any generated materials yet.'}
            </AlertDescription>
          </Alert>

          <div className="mb-6">
            <Link to="/generate">
              <Button className="w-full">
                {language === 'ro' ? 'Generează material nou' : 'Generate new material'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal state with materials
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{language === 'ro' ? 'Materiale generate' : 'Generated materials'}</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshMaterials} 
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {language === 'ro' ? 'Reîmprospătează' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Link to="/generate">
            <Button>
              {language === 'ro' ? 'Generează material nou' : 'Generate new material'}
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <Link to="/account/materials" className="block w-full">
            <Button variant="secondary" className="w-full mb-4">
              {language === 'ro' ? 'Vezi toate materialele' : 'View all materials'}
            </Button>
          </Link>
          
          {coursesData.slice(0, 3).map((course) => (
            <Card key={course.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{course.formData?.subject || 'Curs fără titlu'}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Data necunoscută'}
                  </p>
                </div>
                
                {processingCourses[course.id] ? (
                  <div className="w-52">
                    <p className="text-sm mb-1">
                      {language === 'ro' ? 'Generare în curs...' : 'Generation in progress...'}
                    </p>
                    <Progress value={progress[course.id] || 0} className="h-2" />
                  </div>
                ) : (
                  <div>
                    <Link to={`/account/materials/${course.id}`}>
                      <Button variant="outline" size="sm">
                        {language === 'ro' ? 'Vizualizează' : 'View'}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          ))}
          
          {coursesData.length > 3 && (
            <div className="text-center pt-2">
              <Link to="/account/materials">
                <Button variant="link">
                  {language === 'ro' 
                    ? `+ ${coursesData.length - 3} mai multe materiale` 
                    : `+ ${coursesData.length - 3} more materials`}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneratedMaterialsTab;
