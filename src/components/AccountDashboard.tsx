import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseCategory, CourseSection, GeneratedCourse } from '@/types';
import { Download, Clock, AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AccountDashboard = () => {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedCourse, setSelectedCourse] = useState<GeneratedCourse | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ tier: '', maxCourses: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [hasGeneratingCourse, setHasGeneratingCourse] = useState(false);

  useEffect(() => {
    if (user?.generatedCourses && user.generatedCourses.length > 0) {
      if (!selectedCourse || !user.generatedCourses.find(c => c.id === selectedCourse.id)) {
        setSelectedCourse(user.generatedCourses[0]);
      }
    } else {
      setSelectedCourse(null);
    }
  }, [user?.generatedCourses]);

  useEffect(() => {
    if (!user?.generatedCourses || user.generatedCourses.length === 0) return;
    
    const generatingCourse = user.generatedCourses.find(course => 
      !course.sections || course.sections.length === 0
    );
    
    setHasGeneratingCourse(!!generatingCourse);
    
    if (generatingCourse) {
      console.log("Setting up refresh interval for generating course:", generatingCourse.id);
      
      const checkInterval = setInterval(async () => {
        console.log("Checking for updates on generating courses...");
        await refreshUser();
        
        const storedUser = localStorage.getItem("automatorUser");
        if (!storedUser) return;
        
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.generatedCourses) return;
        
        const updatedGeneratingCourse = parsedUser.generatedCourses.find(
          (c: GeneratedCourse) => c.id === generatingCourse.id
        );
        
        if (updatedGeneratingCourse?.sections && updatedGeneratingCourse.sections.length > 0) {
          clearInterval(checkInterval);
          
          await refreshUser();
          
          setHasGeneratingCourse(false);
          
          if (selectedCourse?.id === updatedGeneratingCourse.id) {
            setSelectedCourse(updatedGeneratingCourse);
          }
          
          toast({
            title: language === 'ro' ? "Materiale generate!" : "Materials generated!",
            description: language === 'ro' 
              ? "Materialele tale sunt gata pentru vizualizare"
              : "Your materials are ready to view",
            variant: "default",
          });
        }
      }, 5000);
      
      return () => clearInterval(checkInterval);
    }
  }, [user?.generatedCourses, refreshUser, selectedCourse?.id, language, toast]);

  if (!user) {
    navigate('/');
    return null;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
    
    toast({
      title: language === 'ro' ? "Actualizat" : "Updated",
      description: language === 'ro' 
        ? "Date actualizate cu succes" 
        : "Data refreshed successfully",
      variant: "default",
    });
  };

  const handleCreateNew = () => {
    const tier = user.subscription?.tier || 'Free';
    const generatedCoursesCount = user.generatedCourses?.length || 0;
    
    let maxCourses = 0;
    let limitReached = false;
    
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
      setLimitInfo({ tier, maxCourses });
      setShowLimitDialog(true);
    } else {
      navigate('/generate');
    }
  };

  const calculateTimeLeft = (expiresAt: Date): string => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const hoursLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft <= 0) {
      return language === 'ro' ? 'Expirat' : 'Expired';
    }
    
    return language === 'ro' 
      ? `Expiră în ${hoursLeft} ore` 
      : `Expires in ${hoursLeft} hours`;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{user.name || user.email.split('@')[0]}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  {user.subscription?.tier || 'Free'}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {user.subscription?.active 
                    ? (language === 'ro' ? 'Activ' : 'Active') 
                    : (language === 'ro' ? 'Inactiv' : 'Inactive')}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateNew}
              className="flex-1 flex items-center justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {language === 'ro' ? 'Generează' : 'Generate'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || authLoading}
              className="p-2"
              title={language === 'ro' ? 'Actualizează' : 'Refresh'}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {language === 'ro' ? 'Cursuri generate' : 'Generated courses'}
              </CardTitle>
              <CardDescription>
                {language === 'ro'
                  ? 'Materialele tale expiră după 72 de ore'
                  : 'Your materials expire after 72 hours'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {authLoading ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="p-3">
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))
              ) : user.generatedCourses && user.generatedCourses.length > 0 ? (
                user.generatedCourses.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`p-3 rounded-md cursor-pointer ${
                      selectedCourse?.id === course.id 
                        ? 'bg-automator-100 dark:bg-automator-900' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium truncate">
                      {course.formData.subject || 'Untitled Course'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {calculateTimeLeft(course.expiresAt)}
                    </div>
                    {course.previewMode && (
                      <Badge variant="outline" className="mt-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
                        Preview
                      </Badge>
                    )}
                    {(!course.sections || course.sections.length === 0) && (
                      <div className="mt-2">
                        <Progress value={75} className="h-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {language === 'ro' ? 'Se generează...' : 'Generating...'}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="text-gray-500 dark:text-gray-400">
                    {language === 'ro' 
                      ? 'Nu ai generat încă niciun curs' 
                      : 'You haven\'t generated any courses yet'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-1">
          {authLoading ? (
            <Card className="min-h-[600px]">
              <CardHeader className="pb-3 border-b">
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : selectedCourse ? (
            <Card className="min-h-[600px]">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedCourse.formData.subject}</CardTitle>
                    <CardDescription>
                      {language === 'ro' ? 'Generat pe ' : 'Generated on '} 
                      {new Date(selectedCourse.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    {selectedCourse.previewMode ? (
                      <Badge className="mr-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
                        Preview
                      </Badge>
                    ) : (
                      <Badge className="mr-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                        Complete
                      </Badge>
                    )}
                    <div className="text-sm flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {calculateTimeLeft(selectedCourse.expiresAt)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                  <div>
                    <div className="font-medium">
                      {language === 'ro' ? 'Nivel' : 'Level'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {selectedCourse.formData.level}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {language === 'ro' ? 'Audiență' : 'Audience'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {selectedCourse.formData.audience}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {language === 'ro' ? 'Durată' : 'Duration'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {selectedCourse.formData.duration}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {language === 'ro' ? 'Context' : 'Context'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {selectedCourse.formData.context}
                    </div>
                  </div>
                </div>
                
                {selectedCourse.previewMode && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 p-4 rounded-md mb-6">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                          {language === 'ro' ? 'Versiune Preview' : 'Preview Version'}
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          {language === 'ro' 
                            ? 'Aceasta este o versiune de previzualizare cu doar primele 2 pagini din fiecare tip de material. Pentru a accesa materialul complet, fă upgrade la un pachet plătit.' 
                            : 'This is a preview version with only the first 2 pages from each type of material. To access the full material, upgrade to a paid package.'}
                        </p>
                        <Button 
                          variant="outline"
                          className="mt-3 bg-yellow-200/50 hover:bg-yellow-200 text-yellow-800 border-yellow-300 dark:border-yellow-800 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-300"
                          onClick={() => navigate('/packages')}
                        >
                          {language === 'ro' ? 'Alege un pachet' : 'Choose a package'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {(!selectedCourse.sections || selectedCourse.sections.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative mb-3">
                        <div className="w-12 h-12 rounded-full border-4 border-t-primary border-x-gray-200 border-b-gray-200 animate-spin"></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {language === 'ro' 
                          ? 'Se procesează materialele...' 
                          : 'Processing materials...'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center mb-4">
                      {language === 'ro'
                        ? 'Generarea poate dura până la 2 minute. Pagina se va actualiza automat când materialele sunt gata.'
                        : 'Generation can take up to 2 minutes. The page will update automatically when materials are ready.'}
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue={selectedCourse.sections[0].title}>
                    <TabsList className="grid grid-cols-2 mb-6">
                      {selectedCourse.sections.map((section) => (
                        <TabsTrigger key={section.title} value={section.title}>
                          {section.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {selectedCourse.sections.map((section: CourseSection) => (
                      <TabsContent key={section.title} value={section.title}>
                        <div className="space-y-6">
                          {section.categories.map((category: CourseCategory) => (
                            <div key={category.name}>
                              <h3 className="text-lg font-medium mb-2">{category.name}</h3>
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                                <pre className="text-sm whitespace-pre-wrap font-sans">
                                  {category.content}
                                </pre>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  {language === 'ro' ? 'Descarcă' : 'Download'}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="min-h-[600px] flex flex-col items-center justify-center">
              <CardContent className="text-center py-20">
                <h3 className="text-xl font-medium mb-4">
                  {language === 'ro' 
                    ? 'Nu ai generat încă niciun curs' 
                    : 'You haven\'t generated any courses yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  {language === 'ro' 
                    ? 'Completează formularul de generare pentru a crea primul tău curs personalizat.' 
                    : 'Fill out the generation form to create your first customized course.'}
                </p>
                <Button onClick={handleCreateNew}>
                  {language === 'ro' ? 'Generează primul curs' : 'Generate your first course'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ro' 
                ? `Limită atinsă pentru pachetul ${limitInfo.tier}` 
                : `Limit reached for the ${limitInfo.tier} package`}
            </DialogTitle>
            <DialogDescription>
              {language === 'ro' 
                ? `Ai atins limita de ${limitInfo.maxCourses} materiale pentru pachetul ${limitInfo.tier}. Pentru a genera mai multe cursuri, este necesar să alegi un pachet superior.`
                : `You've reached the limit of ${limitInfo.maxCourses} materials for the ${limitInfo.tier} package. To generate more courses, you need to choose a higher package.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
              {language === 'ro' ? 'Înapoi' : 'Back'}
            </Button>
            <Button onClick={() => navigate('/packages')}>
              {language === 'ro' ? 'Vezi pachete disponibile' : 'See available packages'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountDashboard;
