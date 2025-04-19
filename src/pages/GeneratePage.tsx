
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import CourseGenerator from '@/components/CourseGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bug, ExternalLink } from 'lucide-react';
import { testEdgeFunctionConnection, testClaudeAPI } from '@/services/courseGeneration';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

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
  const [debugInfo, setDebugInfo] = useState<{ [key: string]: any }>({});
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugEndpoints, setDebugEndpoints] = useState<{
    connectionUrl: string;
    claudeUrl: string;
  }>({
    connectionUrl: `https://ittzxpynkyzcrytyudlt.supabase.co/functions/v1/generate-course/test-connection`,
    claudeUrl: `https://ittzxpynkyzcrytyudlt.supabase.co/functions/v1/generate-course/test-claude`
  });
  const [rawResponse, setRawResponse] = useState<string | null>(null);

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
    setRawResponse(null);
    
    try {
      // Test connection endpoint
      console.log("Testare endpoint connect");
      console.log("URL endpoint test connection:", debugEndpoints.connectionUrl);
      
      // Direct fetch for connection test
      try {
        const directResponse = await fetch(debugEndpoints.connectionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const responseText = await directResponse.text();
        console.log("Răspuns direct connection test (status):", directResponse.status);
        console.log("Răspuns direct connection test (body):", responseText);
        
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch (e) {
          parsedResponse = { text: responseText };
        }
        
        setRawResponse(responseText);
        
        setDebugInfo(prev => ({ 
          ...prev, 
          connectionTest: {
            success: directResponse.ok,
            status: directResponse.status,
            data: parsedResponse,
            timestamp: new Date().toISOString(),
            url: debugEndpoints.connectionUrl
          }
        }));
      } catch (directError) {
        console.error("Eroare fetch direct:", directError);
        setDebugInfo(prev => ({ 
          ...prev, 
          connectionTest: {
            success: false,
            error: directError.message || "Eroare la fetch direct",
            timestamp: new Date().toISOString(),
            url: debugEndpoints.connectionUrl
          }
        }));
      }
      
      // Test standard method
      try {
        const connectionResponse = await testEdgeFunctionConnection();
        console.log("Răspuns test conexiune (standard):", connectionResponse);
        
        setDebugInfo(prev => ({
          ...prev,
          standardConnectionTest: {
            success: true,
            data: connectionResponse,
            timestamp: new Date().toISOString()
          }
        }));
      } catch (standardError) {
        console.error("Eroare test standard:", standardError);
        setDebugInfo(prev => ({
          ...prev,
          standardConnectionTest: {
            success: false,
            error: standardError.message || "Eroare necunoscută",
            timestamp: new Date().toISOString()
          }
        }));
      }

      // Test Claude API
      console.log("Testare endpoint Claude");
      console.log("URL endpoint test Claude:", debugEndpoints.claudeUrl);
      setDebugInfo(prev => ({ ...prev, status: "Testare API Claude..." }));
      
      // Direct fetch for Claude API test
      try {
        const directClaudeResponse = await fetch(debugEndpoints.claudeUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const claudeResponseText = await directClaudeResponse.text();
        console.log("Răspuns direct Claude test (status):", directClaudeResponse.status);
        console.log("Răspuns direct Claude test (body):", claudeResponseText);
        
        let parsedClaudeResponse;
        try {
          parsedClaudeResponse = JSON.parse(claudeResponseText);
        } catch (e) {
          parsedClaudeResponse = { text: claudeResponseText };
        }
        
        setDebugInfo(prev => ({
          ...prev,
          claudeDirectTest: {
            success: directClaudeResponse.ok,
            status: directClaudeResponse.status,
            data: parsedClaudeResponse,
            timestamp: new Date().toISOString(),
            url: debugEndpoints.claudeUrl
          }
        }));
        
        // Show API key info (masked) if available
        if (parsedClaudeResponse && parsedClaudeResponse.apiKeyMasked) {
          setDebugInfo(prev => ({
            ...prev,
            apiKeyStatus: "API key configurată",
            apiKeyMasked: parsedClaudeResponse.apiKeyMasked
          }));
        }
      } catch (directClaudeError) {
        console.error("Eroare fetch direct Claude:", directClaudeError);
        setDebugInfo(prev => ({
          ...prev,
          claudeDirectTest: {
            success: false,
            error: directClaudeError.message || "Eroare la fetch direct",
            timestamp: new Date().toISOString(),
            url: debugEndpoints.claudeUrl
          }
        }));
      }
      
      // Standard method
      try {
        const claudeResponse = await testClaudeAPI();
        console.log("Răspuns test Claude (standard):", claudeResponse);
        
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
            apiKeyStatus: "API key configurată",
            apiKeyMasked: claudeResponse.apiKeyMasked || "Nu este disponibil"
          }));
        } else {
          setDebugInfo(prev => ({ 
            ...prev, 
            apiKeyStatus: "API key lipsă"
          }));
        }
      } catch (claudeError) {
        console.error("Eroare test Claude (standard):", claudeError);
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
      
      // Test if CLAUDE_API_KEY exists in the Edge Function
      try {
        setDebugInfo(prev => ({ ...prev, status: "Verificare variabile de mediu Edge Function..." }));
        
        const { data: envCheckResponse, error: envCheckError } = await supabase.functions.invoke('generate-course', {
          body: { action: 'check-env' }
        });
        
        if (envCheckError) {
          console.error("Eroare verificare variabile de mediu:", envCheckError);
          setDebugInfo(prev => ({
            ...prev,
            envCheck: {
              success: false,
              error: envCheckError.message || "Eroare la verificarea variabilelor de mediu",
              timestamp: new Date().toISOString()
            }
          }));
        } else {
          console.log("Răspuns verificare variabile de mediu:", envCheckResponse);
          setDebugInfo(prev => ({
            ...prev,
            envCheck: {
              success: true,
              data: envCheckResponse,
              timestamp: new Date().toISOString()
            }
          }));
        }
      } catch (envCheckError) {
        console.error("Eroare verificare variabile de mediu:", envCheckError);
        setDebugInfo(prev => ({
          ...prev,
          envCheck: {
            success: false,
            error: envCheckError.message || "Eroare la verificarea variabilelor de mediu",
            timestamp: new Date().toISOString()
          }
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
      setDebugInfo(prev => ({
        ...prev,
        status: "Teste finalizate"
      }));
    }
  };
  
  // Open URL in new tab
  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                      <span>Connection Test (Direct Fetch):</span>
                      {debugInfo.connectionTest?.url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openInNewTab(debugInfo.connectionTest.url)}
                          className="h-5 w-5 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </h4>
                    {debugInfo.connectionTest ? (
                      <div className={`text-xs ${debugInfo.connectionTest.success ? 'text-green-600' : 'text-red-600'}`}>
                        <p>
                          {debugInfo.connectionTest.success ? 'Success!' : 'Failed:'} 
                          {debugInfo.connectionTest.status && ` (Status: ${debugInfo.connectionTest.status})`}
                        </p>
                        {debugInfo.connectionTest.error && (
                          <p className="mt-1 text-red-600">Error: {debugInfo.connectionTest.error}</p>
                        )}
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-36">
                          {JSON.stringify(debugInfo.connectionTest.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-xs">Not tested yet</p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Connection Test (Standard Method):</h4>
                    {debugInfo.standardConnectionTest ? (
                      <div className={`text-xs ${debugInfo.standardConnectionTest.success ? 'text-green-600' : 'text-red-600'}`}>
                        <p>{debugInfo.standardConnectionTest.success ? 'Success!' : 'Failed:'}</p>
                        {debugInfo.standardConnectionTest.error && (
                          <p className="mt-1 text-red-600">Error: {debugInfo.standardConnectionTest.error}</p>
                        )}
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-36">
                          {JSON.stringify(debugInfo.standardConnectionTest.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-xs">Not tested yet</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                      <span>Claude API Test (Direct Fetch):</span>
                      {debugInfo.claudeDirectTest?.url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openInNewTab(debugInfo.claudeDirectTest.url)}
                          className="h-5 w-5 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </h4>
                    {debugInfo.claudeDirectTest ? (
                      <div className={`text-xs ${debugInfo.claudeDirectTest.success ? 'text-green-600' : 'text-red-600'}`}>
                        <p>
                          {debugInfo.claudeDirectTest.success ? 'Success!' : 'Failed:'} 
                          {debugInfo.claudeDirectTest.status && ` (Status: ${debugInfo.claudeDirectTest.status})`}
                        </p>
                        {debugInfo.claudeDirectTest.error && (
                          <p className="mt-1 text-red-600">Error: {debugInfo.claudeDirectTest.error}</p>
                        )}
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-36">
                          {JSON.stringify(debugInfo.claudeDirectTest.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-xs">Not tested yet</p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Claude API Test (Standard Method):</h4>
                    {debugInfo.claudeTest ? (
                      <div className={`text-xs ${debugInfo.claudeTest.success ? 'text-green-600' : 'text-red-600'}`}>
                        <p>{debugInfo.claudeTest.success ? 'Success!' : 'Failed:'}</p>
                        {debugInfo.claudeTest.error && (
                          <p className="mt-1 text-red-600">Error: {debugInfo.claudeTest.error}</p>
                        )}
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-36">
                          {JSON.stringify(debugInfo.claudeTest.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-xs">Not tested yet</p>
                    )}
                  </div>
                </div>
                
                {debugInfo.envCheck && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Environment Variables Check:</h4>
                    <div className={`text-xs ${debugInfo.envCheck.success ? 'text-green-600' : 'text-red-600'}`}>
                      <p>{debugInfo.envCheck.success ? 'Success!' : 'Failed:'}</p>
                      {debugInfo.envCheck.error && (
                        <p className="mt-1 text-red-600">Error: {debugInfo.envCheck.error}</p>
                      )}
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-36">
                        {JSON.stringify(debugInfo.envCheck.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {rawResponse && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Raw Response:</h4>
                    <pre className="whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-36">
                      {rawResponse}
                    </pre>
                  </div>
                )}
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">API Endpoints:</h4>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center justify-between">
                      <span><strong>Connection Test:</strong> {debugEndpoints.connectionUrl}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openInNewTab(debugEndpoints.connectionUrl)}
                        className="h-5 w-5 p-0 ml-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span><strong>Claude API Test:</strong> {debugEndpoints.claudeUrl}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openInNewTab(debugEndpoints.claudeUrl)}
                        className="h-5 w-5 p-0 ml-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">System Info:</h4>
                  <ul className="text-xs space-y-1">
                    <li><strong>API Key Status:</strong> {debugInfo.apiKeyStatus || 'Necunoscut'}</li>
                    {debugInfo.apiKeyMasked && (
                      <li><strong>API Key (masked):</strong> {debugInfo.apiKeyMasked}</li>
                    )}
                    <li><strong>User:</strong> {user?.email || 'Not authenticated'}</li>
                    <li><strong>Admin:</strong> {isAdminUser ? 'Yes' : 'No'}</li>
                    <li><strong>Project ID:</strong> ittzxpynkyzcrytyudlt</li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowDebugDialog(false)}>
                  {language === 'ro' ? 'Închide' : 'Close'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default GeneratePage;
