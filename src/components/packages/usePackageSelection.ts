
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePackageSelection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPackage, setProcessingPackage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePackageSelect = async (packageName: string) => {
    if (!user) {
      toast({
        title: language === 'ro' ? 'Autentificare necesară' : 'Authentication required',
        description: language === 'ro' 
          ? 'Trebuie să fii autentificat pentru a alege un pachet.' 
          : 'You need to be logged in to select a package.',
        variant: "default"
      });
      navigate('/account');
      return;
    }

    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessingPackage(packageName);

    toast({
      title: language === 'ro' ? 'Se procesează' : 'Processing',
      description: language === 'ro' 
        ? 'Se creează sesiunea de plată...' 
        : 'Creating payment session...',
      variant: "default"
    });

    try {
      if (packageName === 'Gratuit' || packageName === 'Free') {
        toast({
          title: language === 'ro' ? 'Pachet gratuit' : 'Free package',
          description: language === 'ro' 
            ? 'Te-ai înregistrat pentru pachetul gratuit.' 
            : 'You have registered for the free package.',
          variant: "default"
        });
        setIsProcessing(false);
        setProcessingPackage('');
        return;
      }

      console.log("Calling create-checkout with packageName:", packageName);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          packageName,
          email: user.email,
          userId: user.id
        }
      });

      console.log("Response from create-checkout:", data, error);

      if (error) {
        console.error("Error from function:", error);
        throw error;
      }

      if (data && data.url) {
        console.log("Showing redirect dialog with URL:", data.url);
        setRedirectUrl(data.url);
        setShowRedirectDialog(true);
        return;
      } else if (data && data.free) {
        toast({
          title: language === 'ro' ? 'Pachet gratuit activat' : 'Free package activated',
          description: language === 'ro' 
            ? 'Pachetul gratuit a fost activat pentru contul tău.' 
            : 'Free package has been activated for your account.',
          variant: "default"
        });
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' 
          ? 'A apărut o eroare la crearea sesiunii de plată. Încearcă din nou.' 
          : 'An error occurred while creating the payment session. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingPackage('');
    }
  };

  return {
    isProcessing,
    processingPackage,
    redirectUrl,
    showRedirectDialog,
    setShowRedirectDialog,
    handlePackageSelect
  };
};
