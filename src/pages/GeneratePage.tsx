import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import CourseGenerator from '@/components/CourseGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bug } from 'lucide-react';
import { testEdgeFunctionConnection, testClaudeAPI } from '@/services/courseGeneration';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const GeneratePage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [hasAttemptedProfileLoad, setHasAttemptedProfileLoad] = useState(false);
  const [profileLoadComplete, setProfileLoadComplete] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Debugging state
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugInfo, setDebugInfo<{ [key: string]: any }>({})] = useState({});
  const [debugLoading, setDebugLoading] = useState(false);

  // Verifică dacă utilizatorul este admin
  const isAdminUser = user && profile?.email === 'admin@automator.ro';

  // Add safety timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        console.log("GeneratePage - Safety timeout triggered, forcing loading state to complete");
        setIsLoading(false);
        setProfileLoadComplete(true); // Force this to true to prevent being stuck
      }, 7000); // 7 second maximum timeout
      
      setLoadTimeout(safetyTimeout);
      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);

  useEffect(() => {
    console.log("GeneratePage mounted, user:", user?.id, "profile:", profile?.id);
    console.log("GeneratePage auth loading state:", authLoading);
    console.log("GeneratePage local loading state:", isLoading);
    
    // Adăugăm un flag pentru a preveni încărcările multiple ale profilului
    if (!hasAttemptedProfileLoad && !profileLoadComplete && !authLoading) {
      console.log("First profile load attempt");
      
      async function loadProfileData() {
        setIsLoading(true);
        try {
          if (user) {
            console.log("User is authenticated, refreshing profile");
            await refreshProfile();
            console.log("Profile refresh completed");
          } else {
            console.log("User not authenticated");
          }
          setHasAttemptedProfileLoad(true);
          setProfileLoadComplete(true);
        } catch (error) {
          console.error("Error refreshing profile:", error);
          setLoadingError(
            language === 'ro' 
              ? "Nu am putut încărca datele profilului. Vă rugăm să reîncărcați pagina."
              : "Could not load profile data. Please refresh the page."
          );
          setHasAttemptedProfileLoad(true);
        } finally {
          setIsLoading(false);
          if (loadTimeout) clearTimeout(loadTimeout);
        }
      }
      
      loadProfileData();
    }
  }, [user, refreshProfile, language, hasAttemptedProfileLoad, profileLoadComplete, profile, authLoading, loadTimeout]);

  useEffect(() => {
    // Verificăm limitele de generare doar după ce profilul a fost încărcat
    // și doar pentru utilizatorii neadmin
    if (user && profile && !isAdminUser && !isLoading && profileLoadComplete) {
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
  }, [user, profile, navigate, toast, language, isAdminUser, isLoading, profileLoadComplete]);

  // Add manual refresh ability for users
  const handleManualRefresh = () => {
    window.location.reload();
  };

  // Debugging functions
  const handleDebugConnection = async () => {
    setDebugLoading(true);
    setDebugInfo(prev => ({ ...prev, status: "Testare conexiune..." }));
    
    try {
      // Test connection endpoint
      console.log("Testare endpoint connect");
      const connectionResponse = await testEdgeFunctionConnection();
      console.log("Răspuns test conexiune:", connectionResponse);
      
      setDebugInfo(prev => ({ 
        ...prev, 
        connectionTest: {
          success: true,
          data: connectionResponse,
          timestamp: new Date().toISOString()
        }
      }));

      // Test Claude API
      console.log("Testare endpoint Claude");
      setDebugInfo(prev => ({ ...prev, status: "Testare API Claude..." }));
      
      try {
        const claudeResponse = await testClaudeAPI();
        console.log("Răspuns test Claude:", claudeResponse);
        
        setDebugInfo(prev => ({ 
          ...prev, 
          claudeTest: {
            success: true,
            data: claudeResponse,
            timestamp: new Date().toISOString()
          },
          status: "Teste finalizate"
        }));

        // Show API key info (masked)
        if (claudeResponse && claudeResponse.apiKeyConfigured) {
          setDebugInfo(prev => ({ 
            ...prev, 
            apiKeyStatus: "API key configurată"
          }));
        } else {
          setDebugInfo(prev => ({ 
            ...prev, 
            apiKeyStatus: "API key lipsă"
          }));
        }
      } catch (claudeError) {
        console.error("Eroare test Claude:", claudeError);
        setDebugInfo(prev => ({ 
          ...prev, 
          claudeTest: {
            success: false,
            error: claudeError.message || "Eroare necunoscută",
            timestamp: new Date().toISOString()
          },
          status: "Teste finalizate cu erori"
        }));
      }
    } catch (error) {
      console.error("Eroare test conexiune:", error);
      setDebugInfo(prev => ({ 
        ...prev, 
        connectionTest: {
          success: false,
          error: error.message || "Eroare necunoscută",
          timestamp: new Date().toISOString()
        },
        status: "Teste finalizate cu erori"
      }));
    } finally {
      setDebugLoading(false);
    }
  };

  if ((isLoading || authLoading) && !profileLoadComplete) {
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
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
        <Button onClick={handleManualRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {language === 'ro' ? 'Reîncarcă pagina' : 'Reload page'}
        </Button>
      </div>
    );
  }

  // If we still have no user after loading is complete, show a message
  if (!user && !isLoading && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-4">
          <AlertDescription>
            {language === 'ro' 
              ? 'Trebuie să te autentifici pentru a genera materiale.' 
              : 'You need to log in to generate materials.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')} className="flex items-center gap-2">
          {language === 'ro' ? 'Înapoi la pagina principală' : 'Back to home page'}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CourseGenerator />
      
      {/* Admin debugging tools */}
      {isAdminUser && (
        <div className="mt-6">
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebugDialog(true)}
              className="flex items-center gap-1 text-xs"
            >
              <Bug className="h-3 w-3" />
              {language === 'ro' ? 'Debugging' : 'Debugging'}
            </Button>
          </div>
          
          <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Debugging Edge Functions</DialogTitle>
                <DialogDescription>
                  Testați conectivitatea cu Edge Functions și API-ul Claude
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleDebugConnection} 
                    disabled={debugLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {debugLoading ? 'Testing...' : 'Test Connection & Claude API'}
                  </Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Status:</h4>
                  <p className="text-xs">{debugInfo.status || 'Not tested yet'}</p>
                </div>
                
                {debugInfo.connectionTest && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Connection Test:</h4>
                    {debugInfo.connectionTest.success ? (
                      <div className="text-xs text-green-600">
                        <p>Success!</p>
                        <pre className="mt-2 whitespace-pre-wrap">
                          {JSON.stringify(debugInfo.connectionTest.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600">
                        <p>Failed: {debugInfo.connectionTest.error}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {debugInfo.claudeTest && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Claude API Test:</h4>
                    {debugInfo.claudeTest.success ? (
                      <div className="text-xs text-green-600">
                        <p>Success!</p>
                        <pre className="mt-2 whitespace-pre-wrap max-h-40 overflow-auto">
                          {JSON.stringify(debugInfo.claudeTest.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600">
                        <p>Failed: {debugInfo.claudeTest.error}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">API Endpoints:</h4>
                  <ul className="text-xs space-y-1">
                    <li><strong>Connection Test:</strong> https://ittzxpynkyzcrytyudlt.supabase.co/functions/v1/generate-course/test-connection</li>
                    <li><strong>Claude API Test:</strong> https://ittzxpynkyzcrytyudlt.supabase.co/functions/v1/generate-course/test-claude</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">System Info:</h4>
                  <ul className="text-xs space-y-1">
                    <li><strong>API Key Status:</strong> {debugInfo.apiKeyStatus || 'Necunoscut'}</li>
                    <li><strong>User:</strong> {user?.email || 'Not authenticated'}</li>
                    <li><strong>Admin:</strong> {isAdminUser ? 'Yes' : 'No'}</li>
                    <li><strong>Project ID:</strong> ittzxpynkyzcrytyudlt</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default GeneratePage;
