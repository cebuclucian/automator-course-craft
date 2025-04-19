
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { checkCourseGenerationStatus } from '@/services/courseGeneration';
import { GeneratedCourse } from '@/types';
import { useToast } from '@/hooks/use-toast';

const GeneratedMaterialsTab = () => {
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [processingCourses, setProcessingCourses] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [pollingIntervals, setPollingIntervals] = useState<Record<string, number>>({});
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userChecked, setUserChecked] = useState<boolean>(false);
  const [coursesData, setCoursesData] = useState<GeneratedCourse[]>([]);
  
  // Log the user object and courses for debugging
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
        // No user, nothing to do yet
        if (!user) {
          console.log("GeneratedMaterialsTab - No user data available, waiting for user");
          setUserChecked(true);
          return;
        }
        
        // Check for generatedCourses array
        if (!user.generatedCourses) {
          console.log("GeneratedMaterialsTab - No generatedCourses array in user object");
          setCoursesData([]);
          setUserChecked(true);
          return;
        }
        
        // Check if generatedCourses is actually an array
        if (!Array.isArray(user.generatedCourses)) {
          console.error("GeneratedMaterialsTab - generatedCourses is not an array:", user.generatedCourses);
          setErrorMessage("Datele despre cursuri sunt într-un format invalid. Reîncărcați pagina.");
          setHasError(true);
          setCoursesData([]);
          setUserChecked(true);
          
          // Try to fix the data by refreshing
          console.log("GeneratedMaterialsTab - Attempting to fix invalid courses data by refreshing user");
          refreshUser();
          return;
        }
        
        // If array is valid but empty, that's fine
        if (user.generatedCourses.length === 0) {
          console.log("GeneratedMaterialsTab - User has no generated courses");
          setCoursesData([]);
          setUserChecked(true);
          return;
        }
        
        // Log some stats about the courses
        console.log(`GeneratedMaterialsTab - Found ${user.generatedCourses.length} generated courses`);
        
        // Filter out any invalid courses (missing required fields)
        const validCourses = user.generatedCourses
          .filter(course => course && typeof course === 'object' && course.id)
          .map(course => {
            // Ensure each course has the required fields
            return {
              id: course.id,
              formData: course.formData || { 
                subject: 'Curs fără titlu', 
                level: 'Nivel necunoscut', 
                audience: 'Public necunoscut',
                duration: 'Durată necunoscută'
              },
              sections: Array.isArray(course.sections) ? course.sections : [],
              status: course.status || 'completed',
              jobId: course.jobId || null,
              createdAt: course.createdAt || new Date().toISOString()
            };
          });
          
        console.log(`GeneratedMaterialsTab - Processed ${validCourses.length} valid courses`);
        
        // Set the filtered courses
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

  // Check for processing courses and set up polling if needed
  useEffect(() => {
    // Skip if data isn't ready yet
    if (!userChecked || !coursesData.length) return;
    
    console.log("GeneratedMaterialsTab - Checking for processing courses");
    
    // Clean up existing intervals first
    Object.values(pollingIntervals).forEach(intervalId => {
      clearInterval(intervalId);
    });
    
    const newProcessingCourses = {};
    const newProgress = {};
    const newIntervals = {};
    
    // Find processing courses
    const processingCoursesList = coursesData.filter(course => 
      course && course.status === 'processing' && course.jobId
    );
    
    console.log(`GeneratedMaterialsTab - Found ${processingCoursesList.length} processing courses`);
    
    // Set up polling for each processing course
    processingCoursesList.forEach(course => {
      if (course.jobId) {
        newProcessingCourses[course.id] = true;
        newProgress[course.id] = 10; // Start with some progress
        
        // Create polling function
        const pollStatus = async () => {
          try {
            console.log(`GeneratedMaterialsTab - Checking status for course ${course.id}`);
            const status = await checkCourseGenerationStatus(course.jobId);
            
            if (status.status === 'completed') {
              console.log(`GeneratedMaterialsTab - Course ${course.id} completed`);
              
              // Clear polling
              if (newIntervals[course.id]) {
                clearInterval(newIntervals[course.id]);
                delete newIntervals[course.id];
              }
              
              // Update state
              setProcessingCourses(prev => {
                const updated = {...prev};
                delete updated[course.id];
                return updated;
              });
              
              setProgress(prev => ({
                ...prev,
                [course.id]: 100
              }));
              
              // Notify success
              toast({
                title: "Material generat",
                description: "Materialul a fost generat cu succes",
              });
              
              // Refresh user data
              refreshUser();
              
            } else if (status.status === 'processing') {
              // Update progress
              setProgress(prev => ({
                ...prev,
                [course.id]: Math.min(95, (prev[course.id] || 0) + 5)
              }));
            } else if (status.status === 'error') {
              console.error(`GeneratedMaterialsTab - Error generating course ${course.id}:`, status.error);
              
              // Clear polling
              if (newIntervals[course.id]) {
                clearInterval(newIntervals[course.id]);
                delete newIntervals[course.id];
              }
              
              // Update state
              setProcessingCourses(prev => {
                const updated = {...prev};
                delete updated[course.id];
                return updated;
              });
              
              // Notify error
              toast({
                variant: "destructive",
                title: "Eroare",
                description: status.error || "A apărut o eroare la generarea materialului",
              });
            }
          } catch (error) {
            console.error(`GeneratedMaterialsTab - Error checking status for course ${course.id}:`, error);
          }
        };
        
        // Run once immediately
        pollStatus();
        
        // Set up interval
        const intervalId = window.setInterval(pollStatus, 10000);
        newIntervals[course.id] = intervalId;
      }
    });
    
    // Update state
    setProcessingCourses(newProcessingCourses);
    setProgress(newProgress);
    setPollingIntervals(newIntervals);
    
    // Clean up on unmount
    return () => {
      Object.values(newIntervals).forEach(intervalId => {
        clearInterval(intervalId);
      });
    };
  }, [userChecked, coursesData, refreshUser, toast, pollingIntervals]);

  // Handle refresh of materials
  const handleRefreshMaterials = useCallback(async () => {
    console.log("GeneratedMaterialsTab - Manual refresh triggered");
    setLoading(true);
    setErrorMessage(null);
    setHasError(false);
    
    try {
      // Clean up any polling
      Object.values(pollingIntervals).forEach(intervalId => {
        clearInterval(intervalId);
      });
      setPollingIntervals({});
      
      // Refresh user data
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
  
  // Handle component error state
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

  // Handle loading state
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
