
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import GeneratedMaterialList from '@/components/account/GeneratedMaterialList';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const MaterialsPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Refresh user data when the page loads to ensure we have the latest generated materials
  useEffect(() => {
    console.log("MaterialsPage - Initial user data:", user);
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("MaterialsPage - Refreshing user data...");
        
        if (refreshUser) {
          const success = await refreshUser();
          console.log("MaterialsPage - User data refresh success:", success);
          
          if (!success) {
            toast({
              title: language === 'ro' ? 'Eroare' : 'Error',
              description: language === 'ro' 
                ? 'Nu am putut încărca datele actualizate. Încercați din nou.'
                : 'Could not load updated data. Please try again.',
              variant: 'destructive',
            });
          } else {
            console.log("MaterialsPage - User data after refresh:", user);
            console.log("MaterialsPage - Generated courses count:", user?.generatedCourses?.length || 0);
          }
        }
      } catch (error) {
        console.error("MaterialsPage - Error refreshing data:", error);
        toast({
          title: language === 'ro' ? 'Eroare' : 'Error',
          description: language === 'ro'
            ? 'A apărut o eroare la încărcarea materialelor.'
            : 'An error occurred while loading materials.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [refreshUser, toast, language, user?.id]);
  
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (refreshUser) {
        const success = await refreshUser();
        if (success) {
          toast({
            title: language === 'ro' ? 'Actualizat' : 'Updated',
            description: language === 'ro' 
              ? 'Materialele au fost reîmprospătate cu succes.'
              : 'Materials refreshed successfully.',
          });
        } else {
          toast({
            title: language === 'ro' ? 'Eroare' : 'Error',
            description: language === 'ro' 
              ? 'Nu am putut actualiza materialele.'
              : 'Could not refresh materials.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error("Error during refresh:", error);
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' 
          ? 'A apărut o eroare la reîncărcarea materialelor.'
          : 'An error occurred while refreshing materials.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Debug info about courses
  useEffect(() => {
    if (user?.generatedCourses?.length) {
      console.log("MaterialsPage - Found courses:", user.generatedCourses.length);
      user.generatedCourses.forEach((course, index) => {
        console.log(`MaterialsPage - Course ${index + 1}:`, {
          id: course.id,
          subject: course.formData?.subject,
          status: course.status,
          createdAt: course.createdAt,
          sectionsCount: course.sections?.length
        });
      });
    } else {
      console.log("MaterialsPage - No courses found for user");
    }
  }, [user?.generatedCourses]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => navigate('/account')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ro' ? 'Înapoi' : 'Back'}
          </Button>
          <h1 className="text-2xl font-bold">
            {language === 'ro' ? 'Materiale generate' : 'Generated Materials'}
          </h1>
        </div>
        
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {language === 'ro' ? 'Reîmprospătează' : 'Refresh'}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <GeneratedMaterialList />
      )}
    </div>
  );
};

export default MaterialsPage;
