
import React from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, language } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.userInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('account.name')}</p>
          <p className="font-medium">{user?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t('account.email')}</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t('account.subscriptionType')}</p>
          <div className="flex items-center gap-2">
            <p className="font-medium">{user?.subscription?.tier || 'Free'}</p>
            {user?.subscription?.active && (
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                {t('account.active')}
              </Badge>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t('account.expires')}</p>
          <p className="font-medium">{formatDate(user?.subscription?.expiresAt)}</p>
        </div>

        {isAdmin && (
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={onCreateAdminProSubscription} 
              disabled={isCreatingProSubscription}
              className="w-full"
            >
              {isCreatingProSubscription ? t('account.creating') : t('account.createAdminPro')}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t('account.adminOnlyButton')}
            </p>
            
            {lastResponse && (
              <div className="mt-2 p-2 bg-muted text-xs rounded overflow-auto max-h-40">
                <p className="font-semibold">{t('account.lastResponse')}:</p>
                <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
              </div>
            )}
            
            {subscriptionStatus && (
              <div className="mt-2 p-2 bg-muted text-xs rounded overflow-auto max-h-40">
                <p className="font-semibold">{t('account.dbSubscriptionStatus')}:</p>
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

