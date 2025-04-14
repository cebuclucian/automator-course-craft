
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { login, register, isLoading, error } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      await login(email, password);
      if (!error) onClose();
    } else {
      if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
      }
      await register(email, password, name);
      if (!error) onClose();
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    // Clear the form when switching modes
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? t("auth.loginButton") : t("auth.registerButton")}
          </DialogTitle>
        </DialogHeader>
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
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Loading..."
                : mode === "login"
                ? t("auth.loginButton")
                : t("auth.registerButton")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={toggleMode}
              className="w-full"
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
