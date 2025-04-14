
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, Copy, ExternalLink, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StripeRedirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectUrl: string;
}

const StripeRedirectDialog = ({ open, onOpenChange, redirectUrl }: StripeRedirectDialogProps) => {
  const [redirecting, setRedirecting] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Handle auto-redirect logic
  useEffect(() => {
    if (open && redirectUrl) {
      setRedirecting(true);
      setRedirectFailed(false);
      setCountdown(10);

      // Show toast notification about redirect
      toast({
        title: "Redirecționare către Stripe",
        description: "Vei fi redirecționat către pagina de plată Stripe în câteva secunde...",
        variant: "default"
      });
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Attempt redirect after delay
      const redirectTimeout = setTimeout(() => {
        try {
          console.log("Redirecting to:", redirectUrl);
          
          // Try to open in current tab
          window.location.href = redirectUrl;
          
          // If we're still here after 5 seconds, mark as failed
          const backupTimeout = setTimeout(() => {
            console.log("Redirect might have failed, showing manual options");
            setRedirectFailed(true);
            setRedirecting(false);
          }, 5000);
          
          return () => clearTimeout(backupTimeout);
        } catch (error) {
          console.error("Redirect error:", error);
          setRedirectFailed(true);
          setRedirecting(false);
        } finally {
          clearInterval(countdownInterval);
        }
      }, 3000);
      
      return () => {
        clearTimeout(redirectTimeout);
        clearInterval(countdownInterval);
      };
    }
  }, [open, redirectUrl]);
  
  // Handle countdown reaching zero
  useEffect(() => {
    if (countdown === 0 && !redirectFailed) {
      handleManualRedirect();
    }
  }, [countdown, redirectFailed]);

  const handleManualRedirect = () => {
    try {
      window.open(redirectUrl, '_blank');
      toast({
        title: "Pagină nouă deschisă",
        description: "Am deschis pagina de plată într-o fereastră nouă.",
        variant: "default"
      });
    } catch (error) {
      console.error("Manual redirect error:", error);
      setRedirectFailed(true);
      toast({
        title: "Redirecționare eșuată",
        description: "Te rugăm să folosești butonul 'Copiază link' și să deschizi link-ul manual.",
        variant: "destructive"
      });
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(redirectUrl);
      setCopied(true);
      toast({
        title: "Link copiat",
        description: "Link-ul a fost copiat în clipboard.",
        variant: "default"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        title: "Eroare la copiere",
        description: "Nu am putut copia link-ul. Te rugăm să încerci din nou.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redirecționare către pagina de plată</DialogTitle>
          <DialogDescription>
            {redirecting ? (
              <span>Vei fi redirecționat automat în {countdown} secunde...</span>
            ) : redirectFailed ? (
              <span>Redirecționarea automată a eșuat. Te rugăm să folosești una din opțiunile de mai jos.</span>
            ) : (
              <span>Te redirecționăm către pagina de plată Stripe pentru a finaliza comanda.</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          {redirectFailed && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-amber-800 dark:text-amber-300 text-sm">
                Redirecționarea automată nu a funcționat. Acest lucru se poate întâmpla din cauza setărilor browserului sau a blocării pop-up-urilor.
              </p>
            </div>
          )}
          
          {redirecting ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-automator-500" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleManualRedirect}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Deschide pagina de plată
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> 
                    Link copiat
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiază link
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex justify-center text-xs text-gray-500 dark:text-gray-400">
          Vei finaliza plata prin platforma securizată Stripe
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripeRedirectDialog;
