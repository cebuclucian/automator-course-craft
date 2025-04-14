
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StripeRedirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectUrl: string;
}

const StripeRedirectDialog = ({ open, onOpenChange, redirectUrl }: StripeRedirectDialogProps) => {
  const { language } = useLanguage();
  
  const handleRedirect = () => {
    if (redirectUrl) {
      // Try opening in current tab
      window.location.href = redirectUrl;
    }
    onOpenChange(false);
  };
  
  const handleOpenNewTab = () => {
    if (redirectUrl) {
      // Open in new tab
      window.open(redirectUrl, '_blank');
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ro' ? 'Redirecționare către plată' : 'Redirecting to payment'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ro' 
              ? 'Vei fi redirecționat către pagina de plată Stripe pentru a finaliza abonamentul.' 
              : 'You will be redirected to the Stripe payment page to complete your subscription.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-2 mt-4">
          <p className="text-sm text-muted-foreground">
            {language === 'ro'
              ? 'Dacă redirecționarea nu funcționează automat, alege una dintre opțiunile de mai jos:'
              : 'If the redirection doesn\'t work automatically, choose one of the options below:'}
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline" 
            onClick={handleOpenNewTab}
            className="flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            {language === 'ro' ? 'Deschide în tab nou' : 'Open in new tab'}
          </Button>
          
          <Button
            type="button" 
            onClick={handleRedirect}
            className="flex items-center gap-2"
          >
            {language === 'ro' ? 'Continuă la plată' : 'Continue to payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripeRedirectDialog;
