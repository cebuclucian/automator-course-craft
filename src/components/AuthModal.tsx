import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LoginForm from "./auth/LoginForm";
import RegisterForm from "./auth/RegisterForm";
import EmailConfirmation from "./auth/EmailConfirmation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const { login, register, loginWithGoogle, error } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRegistrationError(null);
      setEmailConfirmationRequired(false);
    }
  }, [isOpen, mode]);

  const handleLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const success = await login(email, password);
      if (success) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    setIsSubmitting(true);
    setRegistrationError(null);
    setEmail(email);
    
    try {
      const result = await register(email, password, name);
      if (result !== null && result !== false) {
        if (typeof result === 'object' && 'emailConfirmationRequired' in result) {
          setEmailConfirmationRequired(true);
        } else if (result === true) {
          onClose();
        }
      }
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : "Eroare la înregistrare");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setRegistrationError(null);
    setEmailConfirmationRequired(false);
  };

  if (emailConfirmationRequired) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <EmailConfirmation email={email} onClose={onClose} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? t("auth.loginButton") : t("auth.registerButton")}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" 
              ? "Introduceți datele pentru a vă autentifica" 
              : "Completați formularul pentru a crea un cont nou"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chrome">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="21.17" y1="8" x2="12" y2="8"/>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
            </svg>
            {mode === "login" 
              ? t("auth.continueWithGoogle") 
              : t("auth.signupWithGoogle")}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground px-2">
              {t("auth.continueWith")}
            </span>
            <Separator className="flex-1" />
          </div>
        </div>

        {mode === "login" ? (
          <LoginForm
            onSubmit={handleLogin}
            error={error}
            isSubmitting={isSubmitting}
          />
        ) : (
          <RegisterForm
            onSubmit={handleRegister}
            error={registrationError || error}
            isSubmitting={isSubmitting}
          />
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={toggleMode}
          className="w-full"
          disabled={isSubmitting}
        >
          {mode === "login"
            ? t("auth.switchToRegister")
            : t("auth.switchToLogin")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
