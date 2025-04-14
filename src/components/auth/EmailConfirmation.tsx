
import React from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EmailConfirmationProps {
  email: string;
  onClose: () => void;
}

const EmailConfirmation = ({ email, onClose }: EmailConfirmationProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Verifică-ți email-ul</DialogTitle>
        <DialogDescription>
          Am trimis un link de confirmare la adresa {email}. Te rugăm să verifici inbox-ul și să confirmi adresa pentru a continua.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center pt-4">
        <Button onClick={onClose}>Închide</Button>
      </div>
    </>
  );
};

export default EmailConfirmation;
