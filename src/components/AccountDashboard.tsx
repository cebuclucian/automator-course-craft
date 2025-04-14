
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import UserInfoCard from './account/UserInfoCard';
import GeneratedMaterialsTab from './account/GeneratedMaterialsTab';
import SubscriptionTab from './account/SubscriptionTab';
import SettingsTab from './account/SettingsTab';

const AccountDashboard = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isCreatingProSubscription, setIsCreatingProSubscription] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  // Format date helper function
  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isAdmin = user?.email === 'admin@automator.ro';

  const createAdminProSubscription = async () => {
    if (!isAdmin) return;
    
    setIsCreatingProSubscription(true);
    try {
      console.log("Calling create-admin-pro-subscription edge function...");
      
      const { data, error } = await supabase.functions.invoke('create-admin-pro-subscription', {
        method: 'POST',
      });

      setLastResponse({ data, error });

      if (error) {
        throw new Error(`Eroare la crearea abonamentului: ${error.message}`);
      }

      console.log("Edge function response:", data);

      toast({
        title: "Abonament creat cu succes",
        description: "Abonamentul Pro a fost creat pentru contul de administrator.",
      });
      
      const { data: newStatus, error: statusError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', 'admin@automator.ro');
      
      setSubscriptionStatus({ data: newStatus, error: statusError });
      setShowDialog(true);
      
    } catch (err) {
      console.error('Error creating Pro subscription:', err);
      toast({
        title: "Eroare",
        description: err instanceof Error ? err.message : "A apărut o eroare la crearea abonamentului Pro.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingProSubscription(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Contul meu</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64">
          <UserInfoCard 
            user={user}
            isAdmin={isAdmin}
            isCreatingProSubscription={isCreatingProSubscription}
            lastResponse={lastResponse}
            subscriptionStatus={subscriptionStatus}
            onCreateAdminProSubscription={createAdminProSubscription}
            formatDate={formatDate}
          />
        </div>

        <div className="flex-1">
          <Tabs defaultValue="generated">
            <TabsList className="mb-4">
              <TabsTrigger value="generated">Materiale generate</TabsTrigger>
              <TabsTrigger value="subscription">Abonament</TabsTrigger>
              <TabsTrigger value="settings">Setări</TabsTrigger>
            </TabsList>

            <TabsContent value="generated">
              <GeneratedMaterialsTab user={user} />
            </TabsContent>

            <TabsContent value="subscription">
              <SubscriptionTab user={user} formatDate={formatDate} />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status abonament actualizat</DialogTitle>
            <DialogDescription>
              Abonamentul a fost creat/actualizat în baza de date. Reîmprospătăm informațiile contului...
            </DialogDescription>
          </DialogHeader>
          <div className="p-2 bg-muted text-xs rounded overflow-auto max-h-60">
            <p>Date abonament:</p>
            <pre>{JSON.stringify(subscriptionStatus, null, 2)}</pre>
          </div>
          <DialogFooter>
            <Button onClick={async () => { 
              await refreshUser();
              setShowDialog(false);
            }}>
              Reîmprospătează cont
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountDashboard;
