
import React from 'react';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionTabProps {
  user: User | null;
  formatDate: (date: Date | string | undefined) => string;
}

const SubscriptionTab = ({ user, formatDate }: SubscriptionTabProps) => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      toast({
        title: language === 'ro' ? 'Se procesează' : 'Processing',
        description: language === 'ro' 
          ? 'Se creează sesiunea de gestionare...' 
          : 'Creating management session...',
      });

      console.log("Calling customer-portal");
      
      if (!user?.email) {
        throw new Error('User email is missing');
      }
      
      // Pass email directly to avoid authentication issues
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        method: 'POST',
        body: { email: user.email }
      });

      console.log("Response from customer-portal:", data, error);

      if (error) {
        console.error("Error from function:", error);
        throw error;
      }

      if (data && data.url) {
        console.log("Redirecting to URL:", data.url);
        
        // Use window.location.replace for more reliable redirection
        window.location.replace(data.url);
        
        // Add a final safety timeout to force navigation after 2 seconds
        setTimeout(() => {
          console.log("Forcing navigation after timeout");
          window.location.href = data.url;
        }, 2000);
        
        return; // Prevent state update
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' 
          ? 'A apărut o eroare la crearea sesiunii de gestionare.' 
          : 'An error occurred while creating the management session.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToPackages = () => {
    // Folosim navigate pentru a naviga către pagina de pachete
    navigate('/packages');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonamentul meu</CardTitle>
        <CardDescription>
          Vedeți și gestionați detaliile abonamentului
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="font-semibold text-lg">{user?.subscription?.tier || 'Free'}</p>
              <p className="text-sm text-muted-foreground">
                {user?.subscription?.active ? 'Abonament activ' : 'Inactiv'}
              </p>
            </div>
            {user?.subscription?.tier !== 'Free' && user?.subscription?.active && (
              <Badge className="bg-green-100 text-green-800">Activ</Badge>
            )}
          </div>
          <div className="text-sm">
            <p>Expiră: {formatDate(user?.subscription?.expiresAt)}</p>
            <p>Generări disponibile: {user?.generationsLeft ?? 0}</p>
          </div>
        </div>
        
        <div className="mt-6">
          {user?.subscription?.tier !== 'Free' && user?.subscription?.active ? (
            <Button 
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ro' ? 'Se procesează...' : 'Processing...'}
                </>
              ) : (
                'Gestionează abonamentul'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleGoToPackages}
              className="w-full"
            >
              Alege un abonament
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionTab;
