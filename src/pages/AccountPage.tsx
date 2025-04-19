
import React, { useEffect, useState, useCallback } from 'react';
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
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [isFixingData, setIsFixingData] = useState(false);
  const { toast } = useToast();
  
  // Add safety timeout to prevent infinite loading - redus la 3 secunde
  useEffect(() => {
    if (localLoading) {
      const safetyTimeout = setTimeout(() => {
        console.log("AccountPage - Safety timeout triggered, forcing loading state to complete");
        setLocalLoading(false);
      }, 3000); // 3 secunde maximum timeout
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [localLoading]);
  
  // Logging for debugging
  useEffect(() => {
    console.log("AccountPage - Initial render with:", {
      user: user ? {
        id: user.id,
        email: user.email,
        generatedCourses: user.generatedCourses ? 
          (Array.isArray(user.generatedCourses) ? user.generatedCourses.length : 'Not an array') : 
          'undefined'
      } : 'No user',
      authLoading,
      localLoading
    });
    
    // Debug localStorage data
    try {
      const automatorUser = localStorage.getItem('automatorUser');
      console.log("AccountPage - localStorage automatorUser exists:", !!automatorUser);
      if (automatorUser) {
        try {
          const parsed = JSON.parse(automatorUser);
          console.log("AccountPage - localStorage parsed user:", {
            id: parsed.id,
            email: parsed.email,
            generatedCoursesLength: parsed.generatedCourses ? 
              (Array.isArray(parsed.generatedCourses) ? parsed.generatedCourses.length : 'Not an array') : 
              'undefined'
          });
          
          // Check for data issues and fix them
          if (parsed.generatedCourses && !Array.isArray(parsed.generatedCourses)) {
            console.error("AccountPage - localStorage has corrupted generatedCourses, fixing...");
            setIsFixingData(true);
            
            // Fix corrupted data
            const fixedUser = {
              ...parsed,
              generatedCourses: [] // Reset to empty array
            };
            
            // Update storage
            localStorage.setItem('automatorUser', JSON.stringify(fixedUser));
            console.log("AccountPage - Fixed corrupted generatedCourses in localStorage");
            
            // Force refresh once fixed
            refreshUser().then(() => {
              setIsFixingData(false);
              console.log("AccountPage - User data refreshed after fixing corrupted data");
            }).catch(e => {
              console.error("AccountPage - Error refreshing user after fix:", e);
              setIsFixingData(false);
            });
          }
        } catch (e) {
          console.error("AccountPage - Error parsing localStorage:", e);
          
          // If we can't parse the data, it's corrupted - clear it
          localStorage.removeItem('automatorUser');
          console.log("AccountPage - Removed corrupted automatorUser from localStorage");
          
          // Force refresh
          refreshUser().catch(e => {
            console.error("AccountPage - Error refreshing after clearing localStorage:", e);
          });
        }
      }
    } catch (e) {
      console.error("AccountPage - Error accessing localStorage:", e);
    }
  }, [refreshUser]);
  
  // Modificat pentru a elimina loop-ul infinit - facem refresh doar o singură dată
  useEffect(() => {
    let isMounted = true;
    
    // Only try to load once at component mount
    const loadUserData = async () => {
      if (!isMounted) return;
      
      setLocalLoading(true);
      try {
        console.log("AccountPage - Attempting to refresh user data once on mount");
        
        // Verificăm dacă avem deja date în localStorage
        const existingUserData = localStorage.getItem('automatorUser');
        if (existingUserData) {
          try {
            const parsed = JSON.parse(existingUserData);
            if (parsed && parsed.id && parsed.email) {
              console.log("AccountPage - Using existing user data from localStorage");
              setLocalLoading(false);
              return; // Dacă avem date valide, nu mai facem refresh
            }
          } catch (e) {
            console.error("AccountPage - Error parsing existing user data:", e);
          }
        }
        
        // Doar dacă nu avem date în localStorage sau sunt invalide, facem refresh
        await refreshUser();
        console.log("AccountPage - Initial user refresh completed");
      } catch (error) {
        console.error("AccountPage - Error refreshing user data:", error);
        if (isMounted) {
          setLoadError(true);
        }
        toast({
          title: "Eroare",
          description: "Nu s-a putut actualiza informațiile contului.",
          variant: "destructive"
        });
      } finally {
        if (isMounted) {
          setLocalLoading(false);
        }
      }
    };
    
    // Call once at mount
    if (!authLoading && !isFixingData) {
      loadUserData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [refreshUser, authLoading, toast, isFixingData]);

  const handleRetry = useCallback(() => {
    console.log("AccountPage - Manual retry triggered");
    setLoadError(false);
    setLocalLoading(true);
    setLoadAttempts(0);
    
    // Implementare simplificată pentru retry - doar reîncărcăm pagina
    window.location.reload();
  }, []);
  
  // Show loading state - redus timpul de afișare
  if (authLoading || (localLoading && loadAttempts < 1) || isFixingData) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Contul meu</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Reîmprospătare
          </Button>
        </div>
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
  
  // Show error state with retry option
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
  
  // Redirect if no authenticated user
  if (!user) {
    console.log("AccountPage - No user found, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  // Safety check for user object
  if (!user.id) {
    console.error("AccountPage - User object is incomplete:", user);
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
  
  // Final safety check for generatedCourses
  if (!Array.isArray(user.generatedCourses)) {
    console.error("AccountPage - user.generatedCourses is not an array:", typeof user.generatedCourses);
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Datele despre materiale sunt în format invalid. Se va încerca repararea automată.
          </AlertDescription>
        </Alert>
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Repară și reîncarcă
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
