
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, Printer, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { GeneratedCourse } from '@/types';
import { useToast } from '@/hooks/use-toast';

const GeneratedMaterialList = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  // Debug logging
  useEffect(() => {
    console.log("GeneratedMaterialList - Current user:", user);
    console.log("GeneratedMaterialList - Generated courses:", user?.generatedCourses);
  }, [user]);

  // Functions for actions on materials
  const handleDownload = (course: GeneratedCourse) => {
    console.log('Downloading material:', course.id);
    toast({
      title: language === 'ro' ? 'Descărcare inițiată' : 'Download started',
      description: language === 'ro' 
        ? 'Materialul se descarcă...' 
        : 'Material is downloading...'
    });
  };

  const handlePrint = (course: GeneratedCourse) => {
    console.log('Printing material:', course.id);
    toast({
      title: language === 'ro' ? 'Pregătire printare' : 'Preparing to print',
      description: language === 'ro' 
        ? 'Se pregătește materialul pentru printare...' 
        : 'Preparing material for printing...'
    });
  };

  if (!user) {
    console.log("GeneratedMaterialList - No user found");
    return <div>Loading...</div>;
  }

  // More detailed logging
  if (!user.generatedCourses) {
    console.log("GeneratedMaterialList - No generatedCourses array in user object");
  } else if (user.generatedCourses.length === 0) {
    console.log("GeneratedMaterialList - generatedCourses array is empty");
  } else {
    console.log(`GeneratedMaterialList - Found ${user.generatedCourses.length} courses`);
  }

  return (
    <div className="space-y-4">
      {(!user.generatedCourses || user.generatedCourses.length === 0) ? (
        <Alert>
          <AlertDescription>
            {language === 'ro' ? 'Nu aveți materiale generate încă.' : 'You don\'t have any generated materials yet.'}
          </AlertDescription>
        </Alert>
      ) : (
        user.generatedCourses.map((course: GeneratedCourse) => (
          <Card key={course.id} className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{course.formData.subject}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{course.formData.level}</Badge>
                    <Badge variant="outline">{course.formData.audience}</Badge>
                    <Badge>{course.formData.duration}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/account/materials/${course.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      {language === 'ro' ? 'Vizualizează' : 'View'}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(course)}>
                    <Download className="h-4 w-4 mr-1" />
                    {language === 'ro' ? 'Descarcă' : 'Download'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrint(course)}>
                    <Printer className="h-4 w-4 mr-1" />
                    {language === 'ro' ? 'Printează' : 'Print'}
                  </Button>
                </div>
              </div>

              {course.sections && course.sections.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">
                    {language === 'ro' ? 'Materiale disponibile:' : 'Available materials:'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {course.sections.map((section) => (
                      <Badge 
                        key={section.title || section.type} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-secondary/80"
                      >
                        <FileText className="h-3 w-3 mr-1" /> 
                        {section.type === 'lesson-plan' ? 
                          (language === 'ro' ? 'Plan de lecție' : 'Lesson plan') :
                         section.type === 'slides' ?
                          (language === 'ro' ? 'Slide-uri prezentare' : 'Presentation slides') :
                         section.type === 'trainer-notes' ?
                          (language === 'ro' ? 'Note trainer' : 'Trainer notes') :
                         section.type === 'exercises' ?
                          (language === 'ro' ? 'Exerciții' : 'Exercises') :
                          section.title || section.type || "Material"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default GeneratedMaterialList;
