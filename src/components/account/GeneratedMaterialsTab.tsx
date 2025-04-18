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
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [processingCourses, setProcessingCourses] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.generatedCourses?.length) return;
    
    const processingCoursesFound: Record<string, boolean> = {};
    const progressMap: Record<string, number> = {};
    
    user.generatedCourses.forEach(course => {
      if (course.status === 'processing' && course.jobId) {
        processingCoursesFound[course.id] = true;
        progressMap[course.id] = 10;
      }
    });
    
    setProcessingCourses(processingCoursesFound);
    setProgress(progressMap);
    
    if (Object.keys(processingCoursesFound).length > 0) {
      const checkStatuses = async () => {
        for (const courseId in processingCoursesFound) {
          const course = user.generatedCourses?.find(c => c.id === courseId);
          if (course?.jobId) {
            try {
              const statusResult = await checkCourseGenerationStatus(course.jobId);
              
              if (statusResult.status === 'completed') {
                processingCoursesFound[courseId] = false;
                progressMap[courseId] = 100;
                
                const updatedCourses = user.generatedCourses?.map(c => {
                  if (c.id === courseId) {
                    return {
                      ...c,
                      status: 'completed',
                      sections: statusResult.data?.sections || c.sections
                    };
                  }
                  return c;
                });
                
                const updatedUser = {
                  ...user,
                  generatedCourses: updatedCourses
                };
                
                localStorage.setItem('automatorUser', JSON.stringify(updatedUser));
                
                toast({
                  title: language === 'ro' ? 'Material finalizat!' : 'Material completed!',
                  description: language === 'ro'
                    ? `Materialul "${course.formData.subject}" a fost generat cu succes.`
                    : `The material "${course.formData.subject}" has been successfully generated.`,
                });
                
                await refreshUser();
              } else if (statusResult.status === 'processing') {
                progressMap[courseId] = Math.min(90, progressMap[courseId] + 10);
              } else if (statusResult.status === 'error') {
                processingCoursesFound[courseId] = false;
                progressMap[courseId] = 100;
                
                toast({
                  variant: 'destructive',
                  title: language === 'ro' ? 'Eroare' : 'Error',
                  description: language === 'ro'
                    ? `A apărut o eroare la generarea materialului: ${statusResult.error || 'Eroare necunoscută'}`
                    : `An error occurred while generating the material: ${statusResult.error || 'Unknown error'}`
                });
              }
            } catch (error) {
              console.error('Error checking course status:', error);
            }
          }
        }
        
        setProcessingCourses({...processingCoursesFound});
        setProgress({...progressMap});
      };
      
      checkStatuses();
      
      const intervalId = setInterval(checkStatuses, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, [user?.generatedCourses, refreshUser, toast, language]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleGenerateClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{language === 'ro' ? 'Materiale generate' : 'Generated materials'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Link to="/generate">
            <Button 
              onClick={handleGenerateClick} 
              disabled={loading}
            >
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

        {(!user.generatedCourses || user.generatedCourses.length === 0) ? (
          <Alert>
            <AlertDescription>
              {language === 'ro' ? 'Nu aveți materiale generate încă.' : 'You don\'t have any generated materials yet.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {user.generatedCourses.map((course: GeneratedCourse) => (
              <Card key={course.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{course.formData.subject}</h3>
                    <p className="text-sm text-gray-500">
                      {course.formData.level}, {course.formData.audience}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(course.createdAt).toLocaleDateString()}
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
                    <Link to={`/account/materials/${course.id}`}>
                      <Button variant="outline">
                        {language === 'ro' ? 'Vizualizează' : 'View'}
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneratedMaterialsTab;
