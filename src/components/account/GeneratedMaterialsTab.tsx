
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [hasCheckedStatuses, setHasCheckedStatuses] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Log the user object and courses for debugging
  useEffect(() => {
    if (user) {
      console.log("GeneratedMaterialsTab - Current user object:", {
        id: user.id,
        email: user.email,
        coursesCount: user.generatedCourses?.length || 0
      });
      
      if (user.generatedCourses?.length) {
        console.log("GeneratedMaterialsTab - First course:", 
          user.generatedCourses[0].formData?.subject);
      }
    } else {
      console.log("GeneratedMaterialsTab - No user data available");
    }
  }, [user]);
  
  // Effect to check processing courses and update their status
  useEffect(() => {
    // Skip if no courses or we've already checked
    if (!user?.generatedCourses?.length || hasCheckedStatuses) return;
    
    console.log("GeneratedMaterialsTab - Checking for processing courses, count:", user.generatedCourses.length);
    
    const newProcessingCourses: Record<string, boolean> = {};
    const newProgressMap: Record<string, number> = {};
    const newIntervals: Record<string, number> = {};
    
    // Clear any existing intervals first
    Object.values(pollingIntervals).forEach(interval => {
      clearInterval(interval);
    });
    
    if (!Array.isArray(user.generatedCourses)) {
      console.error("GeneratedMaterialsTab - user.generatedCourses is not an array");
      setError("Date materiale incorecte. Contactați administratorul.");
      return;
    }
    
    user.generatedCourses.forEach(course => {
      if (course && course.status === 'processing' && course.jobId) {
        console.log(`Course ${course.id} is still processing, setting up polling`);
        newProcessingCourses[course.id] = true;
        newProgressMap[course.id] = 10;
        
        // Set up polling for this course 
        const checkStatusForCourse = async () => {
          try {
            console.log(`Checking status for course ${course.id} with jobId ${course.jobId}`);
            const statusResult = await checkCourseGenerationStatus(course.jobId);
            console.log(`Status check for ${course.id} returned:`, statusResult);
            
            if (statusResult.status === 'completed') {
              console.log(`Course ${course.id} generation completed`);
              newProcessingCourses[course.id] = false;
              newProgressMap[course.id] = 100;
              
              // Clear this interval
              if (newIntervals[course.id]) {
                console.log(`Clearing interval for course ${course.id}`);
                clearInterval(newIntervals[course.id]);
                delete newIntervals[course.id];
              }
              
              // Update user data with completed course
              if (user.generatedCourses) {
                const updatedCourses = user.generatedCourses.map(c => {
                  if (c.id === course.id) {
                    return {
                      ...c,
                      status: 'completed',
                      sections: statusResult.data?.sections || c.sections || []
                    };
                  }
                  return c;
                });
                
                const updatedUser = {
                  ...user,
                  generatedCourses: updatedCourses
                };
                
                // Update localStorage
                try {
                  localStorage.setItem('automatorUser', JSON.stringify(updatedUser));
                  console.log(`Updated localStorage with completed course ${course.id}`);
                } catch (storageError) {
                  console.error("Error updating localStorage:", storageError);
                }
                
                // Notify the user
                toast({
                  title: language === 'ro' ? 'Material finalizat!' : 'Material completed!',
                  description: language === 'ro'
                    ? `Materialul "${course.formData?.subject || 'Curs'}" a fost generat cu succes.`
                    : `The material "${course.formData?.subject || 'Course'}" has been successfully generated.`,
                });
                
                // Refresh user data 
                refreshUser();
              }
              
              setProcessingCourses(prev => {
                const updated = {...prev};
                delete updated[course.id];
                return updated;
              });
              
            } else if (statusResult.status === 'processing') {
              console.log(`Course ${course.id} still processing, updating progress`);
              newProgressMap[course.id] = Math.min(95, (newProgressMap[course.id] || 0) + 5);
              setProgress(prev => ({
                ...prev,
                [course.id]: Math.min(95, (prev[course.id] || 0) + 5)
              }));
            } else if (statusResult.status === 'error') {
              console.error(`Course ${course.id} generation error:`, statusResult.error);
              newProcessingCourses[course.id] = false;
              
              // Clear this interval
              if (newIntervals[course.id]) {
                clearInterval(newIntervals[course.id]);
                delete newIntervals[course.id];
              }
              
              // Notify the user
              toast({
                variant: 'destructive',
                title: language === 'ro' ? 'Eroare' : 'Error',
                description: language === 'ro'
                  ? `A apărut o eroare la generarea materialului: ${statusResult.error || 'Eroare necunoscută'}`
                  : `An error occurred while generating the material: ${statusResult.error || 'Unknown error'}`
              });
              
              setProcessingCourses(prev => {
                const updated = {...prev};
                delete updated[course.id];
                return updated;
              });
            }
          } catch (error) {
            console.error(`Error checking status for course ${course.id}:`, error);
          }
        };
        
        // Run once immediately
        checkStatusForCourse();
        
        // Set up interval to check every 10 seconds - store the interval ID
        const intervalId = window.setInterval(checkStatusForCourse, 10000);
        newIntervals[course.id] = intervalId;
      }
    });
    
    // Update state
    setProcessingCourses(newProcessingCourses);
    setProgress(newProgressMap);
    setPollingIntervals(newIntervals);
    setHasCheckedStatuses(true);
    
    // Clean up intervals on unmount
    return () => {
      console.log("GeneratedMaterialsTab - Cleaning up polling intervals");
      Object.values(newIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [user?.generatedCourses, refreshUser, toast, language, hasCheckedStatuses, pollingIntervals]);

  // Handle case when no user is found
  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{language === 'ro' ? 'Materiale generate' : 'Generated materials'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {language === 'ro' ? 'Se încarcă...' : 'Loading...'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Function to refresh the materials manually
  const handleRefreshMaterials = async () => {
    setLoading(true);
    setHasCheckedStatuses(false);
    setError(null);
    
    // Clean up any existing intervals
    Object.values(pollingIntervals).forEach(interval => {
      clearInterval(interval);
    });
    setPollingIntervals({});
    
    try {
      await refreshUser();
      console.log("Materials refreshed");
    } catch (err) {
      console.error("Error refreshing materials:", err);
      setError(language === 'ro' ? 
        "Nu am putut reîmprospăta materialele. Încercați din nou." : 
        "Could not refresh materials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debug information
  console.log("User details for debugging:");
  console.log("- User ID:", user.id);
  console.log("- Email:", user.email);
  console.log("- Subscription tier:", user.subscription?.tier || 'Not set');
  console.log("- Generations left:", user.generationsLeft !== undefined ? user.generationsLeft : 'Not set');
  console.log("- Generated courses count:", user.generatedCourses?.length || 0);
  console.log("- Processing courses:", Object.keys(processingCourses).length);

  // Make sure generatedCourses is always an array
  const generatedCourses = Array.isArray(user.generatedCourses) ? user.generatedCourses : [];

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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ro' ? 'Se încarcă...' : 'Loading...'}
                </>
              ) : (
                language === 'ro' ? 'Generează curs nou' : 'Generate new course'
              )}
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(!generatedCourses || generatedCourses.length === 0) ? (
          <Alert>
            <AlertDescription>
              {language === 'ro' ? 'Nu aveți materiale generate încă.' : 'You don\'t have any generated materials yet.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Link to="/account/materials" className="block w-full">
              <Button variant="secondary" className="w-full mb-4">
                {language === 'ro' ? 'Vezi toate materialele' : 'View all materials'}
              </Button>
            </Link>
            
            {generatedCourses.slice(0, 3).map((course: GeneratedCourse) => (
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
            
            {generatedCourses.length > 3 && (
              <div className="text-center pt-2">
                <Link to="/account/materials">
                  <Button variant="link">
                    {language === 'ro' 
                      ? `+ ${generatedCourses.length - 3} mai multe materiale` 
                      : `+ ${generatedCourses.length - 3} more materials`}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneratedMaterialsTab;
