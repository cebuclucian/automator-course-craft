
import React, { useEffect, useState, useCallback } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0); // Pentru forțarea rerendering
  
  // Reîmprospătare date utilizator când pagina se încarcă pentru a ne asigura că avem cele mai recente materiale generate
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("MaterialsPage - Reîmprospătare date utilizator...");
      
      if (refreshUser) {
        const success = await refreshUser();
        console.log("MaterialsPage - Succes reîmprospătare date utilizator:", success);
        
        if (!success) {
          toast({
            title: language === 'ro' ? 'Eroare' : 'Error',
            description: language === 'ro' 
              ? 'Nu am putut încărca datele actualizate. Încercați din nou.'
              : 'Could not load updated data. Please try again.',
            variant: 'destructive',
          });
        } else {
          console.log("MaterialsPage - Date utilizator după reîmprospătare:", user);
          console.log("MaterialsPage - Număr cursuri generate:", user?.generatedCourses?.length || 0);
        }
      }
    } catch (error) {
      console.error("MaterialsPage - Eroare reîmprospătare date:", error);
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
  }, [refreshUser, toast, language, user?.id]);
  
  useEffect(() => {
    console.log("MaterialsPage - Date inițiale utilizator:", user);
    loadData();
    
    // Ascultare pentru evenimente de reîmprospătare a utilizatorului
    const handleUserRefreshed = () => {
      console.log("MaterialsPage - Eveniment reîmprospătare utilizator primit");
      setRefreshKey(prev => prev + 1); // Forțare rerendering
    };
    
    window.addEventListener('user-refreshed', handleUserRefreshed);
    window.addEventListener('storage', (e) => {
      if (e.key === 'automatorUser') {
        console.log("MaterialsPage - Eveniment storage detectat pentru automatorUser");
        setRefreshKey(prev => prev + 1);
      }
    });
    
    return () => {
      window.removeEventListener('user-refreshed', handleUserRefreshed);
      window.removeEventListener('storage', handleUserRefreshed);
    };
  }, [loadData]);
  
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
          setRefreshKey(prev => prev + 1); // Forțare rerendering
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
      console.error("Eroare în timpul reîmprospătării:", error);
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
  
  // Informații debug despre cursuri
  useEffect(() => {
    if (user?.generatedCourses?.length) {
      console.log("MaterialsPage - Cursuri găsite:", user.generatedCourses.length);
      user.generatedCourses.forEach((course, index) => {
        console.log(`MaterialsPage - Curs ${index + 1}:`, {
          id: course.id,
          subject: course.formData?.subject,
          status: course.status,
          createdAt: course.createdAt,
          secțiuniCount: course.sections?.length
        });
      });
    } else {
      console.log("MaterialsPage - Niciun curs găsit pentru utilizator");
    }
  }, [user?.generatedCourses, refreshKey]); // refreshKey forțează reexecutarea acestui efect
  
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
        <GeneratedMaterialList key={refreshKey} />
      )}
    </div>
  );
};

export default MaterialsPage;
