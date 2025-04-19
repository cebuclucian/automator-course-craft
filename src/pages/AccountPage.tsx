
import React, { useEffect, useState } from 'react';
import AccountDashboard from '@/components/AccountDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const AccountPage = () => {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();
  
  // Load user data only once when the account page initially loads
  useEffect(() => {
    let isMounted = true;
    let loadTimeout;
    
    const loadUserData = async () => {
      if (!isMounted) return;
      
      setLocalLoading(true);
      try {
        // Setăm un timeout de siguranță pentru a evita blocarea UI-ului
        loadTimeout = setTimeout(() => {
          if (isMounted && localLoading) {
            setLocalLoading(false);
            setLoadError(true);
            console.warn("⚠️ Timeout la încărcarea datelor utilizatorului");
          }
        }, 10000); // 10 secunde timeout maxim
        
        // Fetch fresh user data when the account page loads
        const success = await refreshUser();
        console.log("User data refreshed on account page load, success:", success);
        
        if (user) {
          // Log detailed information about user state
          console.log("Current user data after refresh:", {
            id: user.id,
            email: user.email,
            subscription: user.subscription,
            generationsLeft: user.generationsLeft,
            coursesCount: user.generatedCourses?.length || 0
          });
          
          // Debug the user's generated courses
          if (user.generatedCourses) {
            console.log(`User has ${user.generatedCourses.length} generated courses`);
            user.generatedCourses.forEach((course, index) => {
              console.log(`Course ${index + 1}:`, {
                id: course.id,
                subject: course.formData?.subject,
                createdAt: course.createdAt,
                status: course.status
              });
            });
          } else {
            console.log("User has no generated courses or generatedCourses array is undefined");
          }
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
        setLoadError(true);
        toast({
          title: "Eroare",
          description: "Nu s-a putut actualiza informațiile contului.",
          variant: "destructive"
        });
      } finally {
        if (isMounted) {
          clearTimeout(loadTimeout);
          setLocalLoading(false);
        }
      }
    };
    
    // Only refresh if we're not already loading
    if (!authLoading) {
      loadUserData();
    } else {
      setLocalLoading(false);
    }
    
    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
    };
  }, [refreshUser, authLoading, toast]);

  const handleRetry = () => {
    setLoadError(false);
    setLocalLoading(true);
    window.location.reload();
  };
  
  // Arată loading state
  if (authLoading || localLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  // Arată stare de eroare cu posibilitatea de retry
  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Nu s-au putut încărca informațiile contului. Vă rugăm să încercați din nou.
          </AlertDescription>
        </Alert>
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reîncarcă pagina
        </Button>
      </div>
    );
  }
  
  // Redirecționează dacă nu există utilizator autentificat
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Adăugăm o verificare de siguranță pentru obiectul user
  if (!user.subscription || !user.id) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Datele utilizatorului sunt incomplete. Vă rugăm să vă deconectați și să vă autentificați din nou.
          </AlertDescription>
        </Alert>
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reîncarcă pagina
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <AccountDashboard />
    </div>
  );
};

export default AccountPage;
