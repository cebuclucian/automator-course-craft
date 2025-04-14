
import React from 'react';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubscriptionTabProps {
  user: User | null;
  formatDate: (date: Date | string | undefined) => string;
}

const SubscriptionTab = ({ user, formatDate }: SubscriptionTabProps) => {
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
            {user?.subscription?.tier !== 'Free' && (
              <Badge className="bg-green-100 text-green-800">Activ</Badge>
            )}
          </div>
          <div className="text-sm">
            <p>Expiră: {formatDate(user?.subscription?.expiresAt)}</p>
            <p>Generări disponibile: {user?.generationsLeft ?? 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionTab;
