
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setări cont</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Setările contului vor fi disponibile în curând.</p>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
