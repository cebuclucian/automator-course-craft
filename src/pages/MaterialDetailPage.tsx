import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react';
import { GeneratedCourse } from '@/types';
import { Badge } from '@/components/ui/badge';

const MaterialDetailPage = () => {
  const { id: materialId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [material, setMaterial] = useState<GeneratedCourse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user?.generatedCourses) return;
    
    const foundMaterial = user.generatedCourses.find(course => course.id === materialId);
    
    if (foundMaterial) {
      console.log('Material found:', foundMaterial);
      setMaterial(foundMaterial);
    } else {
      console.error('Material not found for ID:', materialId);
      toast({
        variant: 'destructive',
        title: language === 'ro' ? 'Material negăsit' : 'Material not found',
        description: language === 'ro' 
          ? 'Materialul solicitat nu există sau nu aveți permisiunea de a-l accesa.'
          : 'The requested material does not exist or you don\'t have permission to access it.',
      });
    }
    
    setLoading(false);
  }, [materialId, user, language, toast]);

  const handleDownload = (materialType: string) => {
    console.log('Downloading material type:', materialType);
    toast({
      title: language === 'ro' ? 'Descărcare inițiată' : 'Download started',
      description: language === 'ro' 
        ? `Se descarcă "${materialType}"...` 
        : `Downloading "${materialType}"...`
    });
  };

  const handlePrint = (materialType: string) => {
    console.log('Printing material type:', materialType);
    toast({
      title: language === 'ro' ? 'Pregătire printare' : 'Preparing to print',
      description: language === 'ro' 
        ? `Se pregătește "${materialType}" pentru printare...` 
        : `Preparing "${materialType}" for printing...`
    });
    
    // În implementarea reală, aici ar putea fi logica de printare
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate('/account')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'ro' ? 'Înapoi la cont' : 'Back to account'}
        </Button>
        <Alert className="mt-6">
          <AlertDescription>
            {language === 'ro' 
              ? 'Materialul solicitat nu a putut fi găsit.' 
              : 'The requested material could not be found.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const materialTypes = [
    { id: 'lesson-plan', title: language === 'ro' ? 'Plan de lecție' : 'Lesson plan' },
    { id: 'slides', title: language === 'ro' ? 'Slide-uri prezentare' : 'Presentation slides' },
    { id: 'trainer-notes', title: language === 'ro' ? 'Note trainer' : 'Trainer notes' },
    { id: 'exercises', title: language === 'ro' ? 'Exerciții' : 'Exercises' },
  ];

  // Funcție pentru a găsi secțiunea potrivită în materialele generate
  const getMaterialContent = (materialType: string) => {
    if (!material.sections || material.sections.length === 0) {
      return language === 'ro' 
        ? 'Conținutul pentru acest material nu este disponibil.'
        : 'Content for this material is not available.';
    }
    
    // Safely access the type property with optional chaining
    const section = material.sections.find(s => s && s.type === materialType);
    return section?.content || (
      language === 'ro' 
        ? 'Conținutul pentru acest material nu este disponibil.'
        : 'Content for this material is not available.'
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="outline" onClick={() => navigate('/account')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'ro' ? 'Înapoi' : 'Back'}
            </Button>
            <h1 className="text-2xl font-bold">{material.formData.subject}</h1>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline">{material.formData.level}</Badge>
          <Badge variant="outline">{material.formData.audience}</Badge>
          <Badge>{material.formData.duration}</Badge>
          <Badge variant="secondary">{material.formData.language}</Badge>
          <p className="text-sm text-gray-500 ml-2">
            {language === 'ro' ? 'Generat pe:' : 'Generated on:'} {new Date(material.createdAt).toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ro' ? 'Materiale generate' : 'Generated Materials'}</CardTitle>
            <CardDescription>
              {language === 'ro' 
                ? 'Selectați tipul de material pentru a-l vizualiza, descărca sau printa.' 
                : 'Select the material type to view, download, or print it.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lesson-plan" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
                {materialTypes.map(type => (
                  <TabsTrigger key={type.id} value={type.id}>
                    {type.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {materialTypes.map(type => (
                <TabsContent key={type.id} value={type.id}>
                  <div className="flex justify-end space-x-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(type.title)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {language === 'ro' ? 'Descarcă' : 'Download'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrint(type.title)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      {language === 'ro' ? 'Printează' : 'Print'}
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-6 bg-white dark:bg-gray-950">
                    <div className="prose dark:prose-invert max-w-none">
                      <h2 className="mb-4">{type.title}</h2>
                      <div className="whitespace-pre-wrap">
                        {getMaterialContent(type.id)}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaterialDetailPage;
