
import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface StripeRedirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectUrl: string;
}

const StripeRedirectDialog = ({ open, onOpenChange, redirectUrl }: StripeRedirectDialogProps) => {
  const { language } = useLanguage();
  
  // Log when dialog opens with URL for debugging
  useEffect(() => {
    if (open && redirectUrl) {
      console.log("Redirecting to URL:", redirectUrl);
    }
  }, [open, redirectUrl]);
  
  // Show warning toast if URL is missing
  useEffect(() => {
    if (open && !redirectUrl) {
      toast({
        title: language === 'ro' ? 'Eroare de redirecționare' : 'Redirection error',
        description: language === 'ro' 
          ? 'URL-ul de redirecționare lipsește. Vă rugăm să încercați din nou.' 
          : 'Redirect URL is missing. Please try again.',
        variant: "destructive"
      });
      onOpenChange(false);
    }
  }, [open, redirectUrl, language, onOpenChange]);
  
  const handleRedirect = () => {
    if (redirectUrl) {
      try {
        // Try opening in current tab
        window.location.href = redirectUrl;
        
        setTimeout(() => {
          // If we're still here after 1 second, show a toast
          toast({
            title: language === 'ro' ? 'Redirecționare în curs' : 'Redirection in progress',
            description: language === 'ro' 
              ? 'Dacă nu sunteți redirecționat automat, încercați să deschideți un tab nou.' 
              : 'If you are not redirected automatically, try opening a new tab.',
            variant: "default"
          });
        }, 1000);
      } catch (error) {
        console.error("Redirect error:", error);
        toast({
          title: language === 'ro' ? 'Eroare de redirecționare' : 'Redirection error',
          description: language === 'ro' 
            ? 'A apărut o eroare la redirecționare. Încercați să deschideți link-ul într-un tab nou.' 
            : 'An error occurred during redirection. Try opening the link in a new tab.',
          variant: "destructive"
        });
      }
    }
    onOpenChange(false);
  };
  
  const handleOpenNewTab = () => {
    if (redirectUrl) {
      try {
        // Open in new tab
        const newTab = window.open(redirectUrl, '_blank');
        
        if (!newTab) {
          // If popup blockers prevented opening
          toast({
            title: language === 'ro' ? 'Pop-up blocat' : 'Pop-up blocked',
            description: language === 'ro' 
              ? 'Browserul a blocat deschiderea unui nou tab. Verificați setările browser-ului sau încercați butonul de continuare.' 
              : 'Your browser blocked opening a new tab. Check browser settings or try the continue button.',
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("New tab open error:", error);
        toast({
          title: language === 'ro' ? 'Eroare la deschiderea tab-ului' : 'Tab opening error',
          description: language === 'ro' 
            ? 'Nu s-a putut deschide un tab nou. Încercați butonul de continuare.' 
            : 'Could not open a new tab. Try the continue button.',
          variant: "destructive"
        });
      }
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

          {!redirectUrl && (
            <div className="flex items-center p-3 bg-amber-100 dark:bg-amber-900 rounded border border-amber-300 dark:border-amber-700 mt-2">
              <AlertTriangle className="text-amber-500 mr-2 h-5 w-5 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {language === 'ro'
                  ? 'Link de redirecționare lipsă. Vă rugăm să încercați din nou procesul de plată.'
                  : 'Missing redirect link. Please try the payment process again.'}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline" 
            onClick={handleOpenNewTab}
            className="flex items-center justify-center gap-2"
            disabled={!redirectUrl}
          >
            <ExternalLink size={16} />
            {language === 'ro' ? 'Deschide în tab nou' : 'Open in new tab'}
          </Button>
          
          <Button
            type="button" 
            onClick={handleRedirect}
            className="flex items-center gap-2"
            disabled={!redirectUrl}
          >
            {language === 'ro' ? 'Continuă la plată' : 'Continue to payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripeRedirectDialog;
