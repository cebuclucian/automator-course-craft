
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailConfirmationProps {
  email: string;
  onClose: () => void;
}

const EmailConfirmation = ({ email, onClose }: EmailConfirmationProps) => {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      toast({
        title: "Email trimis cu succes",
        description: "Verifică-ți căsuța de email pentru noul link de confirmare.",
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut trimite emailul. Încearcă din nou.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Verifică-ți email-ul</DialogTitle>
        <DialogDescription className="space-y-4">
          <p>Am trimis un link de confirmare la adresa {email}. Te rugăm să verifici inbox-ul și să confirmi adresa pentru a continua.</p>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Nu ai primit emailul? {' '}
            <Button 
              variant="link" 
              className="px-0 text-primary h-auto"
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Trimite din nou
                </>
              )}
            </Button>
          </div>
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center pt-4">
        <Button onClick={onClose}>Închide</Button>
      </div>
    </>
  );
};

export default EmailConfirmation;
