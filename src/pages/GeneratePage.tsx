
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import CourseGenerator from '@/components/CourseGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ToneExplanations from '@/components/ToneExplanations';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const GeneratePage = () => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Verifică dacă utilizatorul este admin
  const isAdminUser = user && profile?.email === 'admin@automator.ro';

  useEffect(() => {
    console.log("GeneratePage mounted, refreshing profile data");
    // Always try to refresh the profile when accessing the generate page
    // to ensure we have the most up-to-date generation credits
    async function loadProfileData() {
      setIsLoading(true);
      try {
        if (user) {
          console.log("User is authenticated, refreshing profile");
          await refreshProfile();
        } else {
          console.log("User not authenticated");
        }
      } catch (error) {
        console.error("Error refreshing profile:", error);
        setLoadingError(
          language === 'ro' 
            ? "Nu am putut încărca datele profilului. Vă rugăm să reîncărcați pagina."
            : "Could not load profile data. Please refresh the page."
        );
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfileData();
  }, [user, refreshProfile, language]);

  useEffect(() => {
    // Check if user has reached the course generation limit based on subscription tier
    // Ignoră verificarea pentru contul admin
    if (user && profile && !isAdminUser && !isLoading) {
      console.log("Checking generation limits for non-admin user");
      console.log("Current generations left:", profile.generationsLeft);
      console.log("Subscription tier:", profile.subscription?.tier);
      
      const tier = profile.subscription?.tier || 'Free';
      const generationsLeft = profile.generationsLeft || 0;
      
      if (generationsLeft <= 0) {
        console.log("User has no generations left, redirecting to packages page");
        toast({
          title: language === 'ro' ? 'Limită atinsă' : 'Limit reached',
          description: language === 'ro'
            ? `Ai atins limita de generări pentru pachetul ${tier}. Pentru a genera mai multe cursuri, este necesar să alegi un pachet superior.`
            : `You've reached the limit of generations for the ${tier} package. To generate more courses, you need to choose a higher package.`,
          variant: 'default',
        });
        
        navigate('/packages');
      }
    }
  }, [user, profile, navigate, toast, language, isAdminUser, isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CourseGenerator />
    </div>
  );
};

export default GeneratePage;
