
import React from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserInfoCardProps {
  user: User | null;
  isAdmin: boolean;
  isCreatingProSubscription: boolean;
  lastResponse: any;
  subscriptionStatus: any;
  onCreateAdminProSubscription: () => void;
  formatDate: (date: Date | string | undefined) => string;
}

const UserInfoCard = ({
  user,
  isAdmin,
  isCreatingProSubscription,
  lastResponse,
  subscriptionStatus,
  onCreateAdminProSubscription,
  formatDate,
}: UserInfoCardProps) => {
  return (
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

        {isAdmin && (
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={onCreateAdminProSubscription} 
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
  );
};

export default UserInfoCard;
