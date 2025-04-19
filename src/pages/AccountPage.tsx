
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
  const { toast } = useToast();
  
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
        const parsed = JSON.parse(automatorUser);
        console.log("AccountPage - localStorage parsed user:", {
          id: parsed.id,
          email: parsed.email,
          generatedCoursesLength: parsed.generatedCourses ? 
            (Array.isArray(parsed.generatedCourses) ? parsed.generatedCourses.length : 'Not an array') : 
            'undefined'
        });
      }
    } catch (e) {
      console.error("AccountPage - Error parsing localStorage:", e);
    }
  }, [user, authLoading, localLoading]);
  
  // Load user data only once when the account page initially loads
  useEffect(() => {
    let isMounted = true;
    let loadTimeout;
    
    const loadUserData = async () => {
      if (!isMounted) return;
      
      setLocalLoading(true);
      try {
        // Set a safety timeout to avoid UI blocking
        loadTimeout = setTimeout(() => {
          if (isMounted && localLoading) {
            console.error("⚠️ AccountPage - Timeout loading user data after 10 seconds");
            setLocalLoading(false);
            setLoadError(true);
          }
        }, 10000); // 10 second maximum timeout
        
        // Fetch fresh user data when the account page loads
        console.log("AccountPage - Attempting to refresh user data, attempt:", loadAttempts + 1);
        const success = await refreshUser();
        
        if (isMounted) {
          if (success) {
            console.log("AccountPage - User data refresh successful");
            
            // Log detailed information about user state
            if (user) {
              console.log("AccountPage - Current user data:", {
                id: user.id,
                email: user.email,
                subscription: user.subscription || "No subscription data",
                generationsLeft: user.generationsLeft,
                coursesCount: user.generatedCourses?.length || 0,
                coursesArray: Array.isArray(user.generatedCourses)
              });
            } else {
              console.warn("AccountPage - User is null after successful refresh");
            }
          } else {
            console.error("AccountPage - User data refresh failed");
            setLoadError(true);
            
            // Try a few times before giving up
            if (loadAttempts < 2) {
              console.log("AccountPage - Scheduling retry attempt", loadAttempts + 1);
              setTimeout(() => {
                if (isMounted) {
                  setLoadAttempts(prev => prev + 1);
                }
              }, 3000);
            } else {
              toast({
                title: "Eroare",
                description: "Nu s-a putut actualiza informațiile contului după multiple încercări.",
                variant: "destructive"
              });
            }
          }
        }
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
          clearTimeout(loadTimeout);
          setLocalLoading(false);
        }
      }
    };
    
    // Only refresh if we're not already loading and if this isn't a retry that would exceed our max attempts
    if (!authLoading && (loadAttempts < 3)) {
      loadUserData();
    } else if (loadAttempts >= 3) {
      // If we've exceeded max retry attempts, show an error
      setLocalLoading(false);
      setLoadError(true);
    }
    
    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
    };
  }, [refreshUser, authLoading, toast, loadAttempts, user?.id]);

  const handleRetry = useCallback(() => {
    console.log("AccountPage - Manual retry triggered");
    setLoadError(false);
    setLocalLoading(true);
    setLoadAttempts(0);
    // Force full page reload to reset the app state
    window.location.reload();
  }, []);
  
  // Show loading state
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
  
  // Ensure user.generatedCourses is an array
  if (user.generatedCourses && !Array.isArray(user.generatedCourses)) {
    console.error("AccountPage - user.generatedCourses is not an array:", user.generatedCourses);
    const fixedUser = {
      ...user,
      generatedCourses: [] // Safe fallback
    };
    console.log("AccountPage - Fixed user with empty generatedCourses array");
    
    // Update localStorage with corrected user data
    try {
      localStorage.setItem('automatorUser', JSON.stringify(fixedUser));
    } catch (e) {
      console.error("AccountPage - Error updating localStorage with fixed user:", e);
    }
    
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Datele despre materialele generate sunt incorecte. Am încercat să reparăm automat. Vă rugăm să reîncărcați pagina.
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
