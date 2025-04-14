
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.email === 'admin@automator.ro') {
        try {
          const { data, error } = await supabase
            .from('subscribers')
            .select('*')
            .eq('email', 'admin@automator.ro');
          
          setSubscriptionStatus({ data, error });
        } catch (err) {
          console.error("Error checking subscription:", err);
        }
      }
    };
    
    checkSubscription();
  }, [user]);

  const isAdmin = user?.email === 'admin@automator.ro';

  const createAdminProSubscription = async () => {
    if (!isAdmin) return;
    
    setIsCreatingProSubscription(true);
    try {
      console.log("Calling create-admin-pro-subscription edge function...");
      
      // Call the edge function with authentication
      const { data, error } = await supabase.functions.invoke('create-admin-pro-subscription', {
        method: 'POST',
      });

      // Store the response for debugging
      setLastResponse({ data, error });

      if (error) {
        throw new Error(`Eroare la crearea abonamentului: ${error.message}`);
      }

      console.log("Edge function response:", data);

      toast({
        title: "Abonament creat cu succes",
        description: "Abonamentul Pro a fost creat pentru contul de administrator.",
      });
      
      // Check subscription status after creating
      const { data: newStatus, error: statusError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', 'admin@automator.ro');
      
      setSubscriptionStatus({ data: newStatus, error: statusError });
      
      // Show dialog with details
      setShowDialog(true);
      
      // Refresh user data to show updated subscription
      await refreshUser();
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
        {/* User Information Card */}
        <div className="w-full md:w-64">
          <Card>
            <CardHeader>
              <CardTitle>Informații utilizator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nume</p>
                <p className="font-medium">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tip abonament</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user?.subscription?.tier || 'Free'}</p>
                  {user?.subscription?.active && (
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                      Activ
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiră</p>
                <p className="font-medium">{formatDate(user?.subscription?.expiresAt)}</p>
              </div>

              {/* Admin Pro Subscription Button */}
              {isAdmin && (
                <div className="mt-6 pt-4 border-t">
                  <Button 
                    onClick={createAdminProSubscription} 
                    disabled={isCreatingProSubscription}
                    className="w-full"
                  >
                    {isCreatingProSubscription ? "Se creează..." : "Creează abonament Pro Admin"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Acest buton este disponibil doar pentru contul de administrator.
                  </p>
                  
                  {lastResponse && (
                    <div className="mt-2 p-2 bg-muted text-xs rounded overflow-auto max-h-40">
                      <p className="font-semibold">Ultimul răspuns:</p>
                      <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
                    </div>
                  )}
                  
                  {subscriptionStatus && (
                    <div className="mt-2 p-2 bg-muted text-xs rounded overflow-auto max-h-40">
                      <p className="font-semibold">Status abonament în baza de date:</p>
                      <pre>{JSON.stringify(subscriptionStatus, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="generated">
            <TabsList className="mb-4">
              <TabsTrigger value="generated">Materiale generate</TabsTrigger>
              <TabsTrigger value="subscription">Abonament</TabsTrigger>
              <TabsTrigger value="settings">Setări</TabsTrigger>
            </TabsList>

            <TabsContent value="generated" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Materiale generate</CardTitle>
                  <CardDescription>
                    Vedeți și descărcați materialele generate anterior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.generatedCourses?.length ? (
                    <div className="space-y-4">
                      {user.generatedCourses.map((course) => (
                        <Card key={course.id}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-base">{course.formData.subject}</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2 text-sm">
                            <p>Generat: {new Date(course.createdAt).toLocaleDateString()}</p>
                            <p>Nivel: {course.formData.level}</p>
                          </CardContent>
                          <CardFooter className="py-2 flex justify-between">
                            <Button variant="outline" size="sm">
                              Vezi
                            </Button>
                            <Button variant="outline" size="sm">
                              Descarcă
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nu aveți materiale generate încă.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
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
                      {user?.subscription?.tier !== 'Free' && (
                        <Badge className="bg-green-100 text-green-800">Activ</Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      <p>Expiră: {formatDate(user?.subscription?.expiresAt)}</p>
                      <p>Generări disponibile: {user?.generationsLeft ?? 0}</p>
                    </div>
                  </div>

                  {/* Upgrade buttons will go here */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Setări cont</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Setările contului vor fi disponibile în curând.</p>
                </CardContent>
              </Card>
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
