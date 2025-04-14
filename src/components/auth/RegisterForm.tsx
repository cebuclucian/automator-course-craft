
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RegisterFormProps {
  onSubmit: (email: string, password: string, name: string) => Promise<void>;
  error: string | null;
  isSubmitting: boolean;
}

const RegisterForm = ({ onSubmit, error, isSubmitting }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Parolele nu coincid!");
      return;
    }
    setPasswordError(null);
    await onSubmit(email, password, name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {(error || passwordError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || passwordError}</AlertDescription>
        </Alert>
      )}

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">{t("auth.name")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

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

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Se înregistrează...
          </span>
        ) : (
          t("auth.registerButton")
        )}
      </Button>
    </form>
  );
};

export default RegisterForm;
