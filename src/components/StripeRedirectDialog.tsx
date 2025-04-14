
import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight, RefreshCw, Clipboard, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface StripeRedirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectUrl: string;
}

const StripeRedirectDialog = ({ open, onOpenChange, redirectUrl }: StripeRedirectDialogProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(5);
  const [isAttemptingRedirect, setIsAttemptingRedirect] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (open && redirectUrl && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (open && redirectUrl && countdown === 0 && !isAttemptingRedirect) {
      handleRedirect();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, countdown, redirectUrl, isAttemptingRedirect]);
  
  useEffect(() => {
    if (open) {
      setCountdown(5);
      setIsAttemptingRedirect(false);
      setCopied(false);
    }
  }, [open]);
  
  const handleRedirect = () => {
    if (redirectUrl) {
      setIsAttemptingRedirect(true);
      
      console.info("Redirecting to URL:", redirectUrl);
      
      // Try to open in current tab
      try {
        window.location.href = redirectUrl;
        
        // If we're still here after 1.5 seconds, the redirect didn't happen
        setTimeout(() => {
          console.info("Still here after redirect attempt");
          toast({
            title: language === 'ro' ? "Redirectare blocată" : "Redirect blocked",
            description: language === 'ro' 
              ? "Încercați să deschideți în tab nou sau copiați link-ul" 
              : "Try opening in a new tab or copying the link",
            variant: "warning"
          });
        }, 1500);
      } catch (error) {
        console.error("Redirect error:", error);
        toast({
          title: language === 'ro' ? "Eroare la redirectare" : "Redirect error",
          description: language === 'ro' 
            ? "Vă rugăm să încercați una dintre opțiunile alternative" 
            : "Please try one of the alternative options",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleOpenNewTab = () => {
    if (redirectUrl) {
      try {
        const newWindow = window.open(redirectUrl, '_blank');
        
        if (newWindow) {
          console.info("Opened in new tab successfully");
          toast({
            title: language === 'ro' ? "Deschis în tab nou" : "Opened in new tab",
            description: language === 'ro' 
              ? "Verificați noul tab deschis pentru a continua" 
              : "Check the new tab to continue",
          });
          onOpenChange(false);
        } else {
          console.warn("Failed to open in new tab - popup might be blocked");
          toast({
            title: language === 'ro' ? "Pop-up blocat" : "Popup blocked",
            description: language === 'ro' 
              ? "Vă rugăm să permiteți pop-up-urile sau să copiați link-ul" 
              : "Please allow popups or copy the link instead",
            variant: "warning"
          });
        }
      } catch (error) {
        console.error("New tab error:", error);
      }
    }
  };
  
  const handleManualCopy = () => {
    if (redirectUrl) {
      navigator.clipboard.writeText(redirectUrl)
        .then(() => {
          setCopied(true);
          toast({
            title: language === 'ro' ? "Link copiat" : "Link copied",
            description: language === 'ro' 
              ? "Link-ul de plată a fost copiat în clipboard" 
              : "Payment link has been copied to clipboard",
          });
          
          // Reset copied state after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy URL: ', err);
          toast({
            title: language === 'ro' ? "Eroare la copiere" : "Copy error",
            description: language === 'ro' 
              ? "Nu s-a putut copia link-ul" 
              : "Failed to copy the link",
            variant: "destructive"
          });
        });
    }
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
          {countdown > 0 && (
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {language === 'ro'
                  ? `Redirecționare automată în ${countdown} secunde...` 
                  : `Automatic redirect in ${countdown} seconds...`}
              </p>
              <RefreshCw className="animate-spin mx-auto mt-2 h-5 w-5 text-muted-foreground" />
            </div>
          )}
          
          <p className="text-sm text-muted-foreground pt-2">
            {language === 'ro'
              ? 'Dacă redirecționarea nu funcționează automat, alege una dintre opțiunile de mai jos:'
              : 'If the redirection doesn\'t work automatically, choose one of the options below:'}
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 bg-secondary/30 p-3 rounded-md">
          <p className="text-xs text-muted-foreground">
            {language === 'ro'
              ? 'În mediul de dezvoltare Lovable, redirecționările automate pot fi blocate. Încearcă una dintre opțiunile alternative:'
              : 'In the Lovable development environment, automatic redirections may be blocked. Try one of the alternative options:'}
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
            variant="outline"
            onClick={handleManualCopy}
            className="flex items-center justify-center gap-2"
          >
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
            {language === 'ro' ? 'Copiază link' : 'Copy link'}
          </Button>
          
          <Button
            type="button" 
            onClick={handleRedirect}
            className="flex items-center gap-2"
          >
            {language === 'ro' ? 'Continuă la plată' : 'Continue to payment'}
            <ArrowRight size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripeRedirectDialog;
