
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const { login, register, loginWithGoogle, isLoading, error } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // Reset state when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setRegistrationError(null);
      setEmailConfirmationRequired(false);
    }
  }, [isOpen, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRegistrationError(null);
    setEmailConfirmationRequired(false);
    
    try {
      if (mode === "login") {
        const success = await login(email, password);
        if (success) onClose();
      } else {
        if (password !== confirmPassword) {
          setRegistrationError("Parolele nu coincid!");
          setIsSubmitting(false);
          return;
        }
        
        console.log("Attempting registration with:", { email, name });
        const result = await register(email, password, name);
        console.log("Registration result:", result);
        
        if (result) {
          if ('emailConfirmationRequired' in result && result.emailConfirmationRequired) {
            setEmailConfirmationRequired(true);
          } else {
            onClose();
          }
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setRegistrationError(error instanceof Error ? error.message : "Eroare la autentificare");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
      // Nu închidem modalul aici, deoarece redirecționarea va fi gestionată de Supabase
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setRegistrationError(null);
    setEmailConfirmationRequired(false);
  };

  // If email confirmation is required, show a different UI
  if (emailConfirmationRequired) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verifică-ți email-ul</DialogTitle>
            <DialogDescription>
              Am trimis un link de confirmare la adresa {email}. Te rugăm să verifici inbox-ul și să confirmi adresa pentru a continua.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={onClose}>Închide</Button>
          </div>
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
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se procesează...
              </span>
            ) : mode === "login" 
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
        
        {(error || registrationError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || registrationError}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {mode === "register" && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === "register"}
              />
            </div>
          )}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {mode === "register" && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={mode === "register"}
              />
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Se autentifică..." : "Se înregistrează..."}
                </span>
              ) : mode === "login"
                ? t("auth.loginButton")
                : t("auth.registerButton")}
            </Button>
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
