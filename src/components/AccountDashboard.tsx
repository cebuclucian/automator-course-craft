
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import GeneratedMaterialsTab from './account/GeneratedMaterialsTab';

const AccountDashboard = () => {
  const { user } = useAuth();

  const formatDate = (dateString: Date | string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

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
