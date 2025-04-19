import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';
import { Subscription } from '@/types';
import GeneratedMaterialsTab from './account/GeneratedMaterialsTab';

// Type guard to check if subscription is a paid subscription
function isPaidSubscription(
  sub: Subscription | { tier: "Free"; active: false }
): sub is Subscription {
  return sub.tier !== "Free";
}

const AccountDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFix, setHasAttemptedFix] = useState(false);

  // Log user data for debugging
  useEffect(() => {
    console.log("AccountDashboard - Mounting with user:", user ? {
      email: user.email,
      subscription: user.subscription,
      generatedCourses: user.generatedCourses 
        ? Array.isArray(user.generatedCourses) 
          ? `Array with ${user.generatedCourses.length} courses` 
          : `Invalid courses: ${typeof user.generatedCourses}`
        : 'undefined'
    } : 'null');

    // Check localStorage data
    try {
      const automatorUser = localStorage.getItem('automatorUser');
      console.log("AccountDashboard - localStorage has automatorUser:", !!automatorUser);
      
      if (automatorUser) {
        try {
          const parsed = JSON.parse(automatorUser);
          console.log("AccountDashboard - parsed courses format:", 
            parsed.generatedCourses 
              ? Array.isArray(parsed.generatedCourses) 
                ? `Array with ${parsed.generatedCourses.length} items` 
                : `Invalid: ${typeof parsed.generatedCourses}`
              : 'undefined');
        } catch (e) {
          console.error("AccountDashboard - Error parsing localStorage:", e);
        }
      }
    } catch (e) {
      console.error("AccountDashboard - Error accessing localStorage:", e);
    }
  }, [user]);

  // Auto-fix corrupted data if detected
  useEffect(() => {
    if (!user || hasAttemptedFix) return;

    // Check for corrupted data
    const hasCorruptedData = 
      !user.generatedCourses || 
      !Array.isArray(user.generatedCourses);
    
    if (hasCorruptedData) {
      console.log("AccountDashboard - Corrupted data detected, attempting auto-fix");
      
      try {
        // Try to fix user data
        const fixedUser = {
          ...user,
          generatedCourses: Array.isArray(user.generatedCourses) ? user.generatedCourses : []
        };
        
        // Update localStorage with fixed user data
        localStorage.setItem('automatorUser', JSON.stringify(fixedUser));
        console.log("AccountDashboard - Fixed user data in localStorage");
        
        // Refresh user to get the fixed data
        refreshUser();
      } catch (e) {
        console.error("AccountDashboard - Error fixing corrupted data:", e);
      }
      
      setHasAttemptedFix(true);
    }
  }, [user, hasAttemptedFix, refreshUser]);

  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ro-RO');
    } catch (e) {
      console.error("AccountDashboard - Eroare formatare dată:", e);
      return 'N/A';
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("AccountDashboard - Manual refresh triggered");
      await refreshUser();
      console.log("AccountDashboard - Manual refresh completed successfully");
    } catch (e) {
      console.error("AccountDashboard - Error during manual refresh:", e);
      setError("Nu s-au putut actualiza datele. Vă rugăm să reîncărcați pagina.");
    } finally {
      setLoading(false);
    }
  };

  // If user is completely invalid
  if (!user) {
    console.error("AccountDashboard - user object is null or undefined");
    return (
      <div className="container mx-auto px-4 py-10">
        <Alert>
          <AlertDescription>
            Nu s-au putut încărca datele utilizatorului. Vă rugăm să reîncărcați pagina.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reîncărcați pagina
        </Button>
      </div>
    );
  }

  // Ensure subscription exists, even if empty
  const subscription = user.subscription || { tier: 'Free', active: false };

  // Safe guard for generatedCourses
  const hasGeneratedCourses = Boolean(
    user.generatedCourses && 
    Array.isArray(user.generatedCourses) && 
    user.generatedCourses.length > 0
  );

  console.log("AccountDashboard - Rendering with:", {
    hasUser: !!user,
    subscriptionTier: subscription.tier,
    hasGeneratedCourses,
    coursesCount: hasGeneratedCourses ? user.generatedCourses.length : 0
  });
  
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Contul meu</h1>
      
      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64">
          <Card>
            <CardHeader>
              <CardTitle>Informații utilizator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nume</p>
                <p className="font-medium">{user.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tip abonament</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{subscription.tier || 'Free'}</p>
                  {subscription.active && (
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                      Activ
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiră</p>
                <p className="font-medium">
                  {isPaidSubscription(subscription) 
                    ? formatDate(subscription.expiresAt)
                    : "Fără dată de expirare (plan gratuit)"}
                </p>
              </div>
              <Button 
                onClick={handleRefresh} 
                disabled={loading}
                className="w-full mt-4 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Actualizare...' : 'Actualizează datele'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <GeneratedMaterialsTab />
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;
