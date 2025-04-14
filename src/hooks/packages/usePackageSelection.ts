
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export const usePackageSelection = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPackage, setProcessingPackage] = useState('');
  
  const handlePackageSelect = async (packageName: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
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

    // Prevent multiple clicks
    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessingPackage(packageName);

    // Show loading state
    toast({
      title: language === 'ro' ? 'Se procesează' : 'Processing',
      description: language === 'ro' 
        ? 'Se creează sesiunea de plată...' 
        : 'Creating payment session...',
      variant: "default"
    });

    try {
      // If it's a free package, just show a message
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
      
      // Call Supabase Edge function to create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { packageName }
      });

      console.log("Response from create-checkout:", data, error);

      if (error) {
        console.error("Error from function:", error);
        throw error;
      }

      if (data && data.url) {
        console.log("Redirecting to URL:", data.url);
        
        // Critical fix: Use direct browser navigation
        window.location.href = data.url;
        
        // Add a final safety timeout to force navigation after 2 seconds
        setTimeout(() => {
          console.log("Forcing navigation after timeout");
          window.location.href = data.url;
        }, 2000);
        
        return; // This prevents the isProcessing state from being updated unnecessarily
      } else if (data && data.free) {
        // Handle free package
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
          ? 'A apărut o eroare la crearea sesiunii de plată.' 
          : 'An error occurred while creating the payment session.',
        variant: "destructive"
      });
    } finally {
      // Only update isProcessing if we haven't redirected
      setIsProcessing(false);
      setProcessingPackage('');
    }
  };

  return {
    isProcessing,
    processingPackage,
    handlePackageSelect,
  };
};

export default usePackageSelection;
