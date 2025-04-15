
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { toast } from '@/hooks/use-toast';

interface SettingsFormData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsTab = () => {
  const { profile, updateProfile } = useUserProfile();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SettingsFormData>({
    defaultValues: {
      email: profile?.email || '',
    }
  });

  const onSubmit = async (data: SettingsFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu coincid",
        variant: "destructive"
      });
      return;
    }

    try {
      // For now just update the email
      const success = await updateProfile({
        email: data.email,
      });

      if (success) {
        toast({
          title: "Succes",
          description: "Profilul a fost actualizat cu succes"
        });
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza profilul",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setări cont</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Parola curentă</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register('currentPassword')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Parolă nouă</Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmă parola nouă</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
            />
          </div>

          <Button type="submit">
            Salvează modificările
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
