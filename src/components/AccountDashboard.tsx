
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import GeneratedMaterialsTab from './account/GeneratedMaterialsTab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';
import { Subscription } from '@/types';

// Type guard to check if subscription is a paid subscription
function isPaidSubscription(
  sub: Subscription | { tier: "Free"; active: false }
): sub is Subscription {
  return sub.tier !== "Free";
}

const AccountDashboard = () => {
  const { user, refreshUser } = useAuth();

  // Log user data for debugging
  console.log("Props in AccountDashboard", { user });

  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ro-RO');
    } catch (e) {
      console.error("Eroare formatare dată:", e);
      return 'N/A';
    }
  };

  // Verifică dacă obiectul user este complet invalidat
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

  // Asigură-te că avem un obiect subscription chiar dacă e gol
  const subscription = user.subscription || { tier: 'Free', active: false };
  
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Contul meu</h1>
      
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
              <Button onClick={() => refreshUser()} className="w-full mt-4 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualizează datele
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
