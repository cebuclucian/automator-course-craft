import React, { createContext, useContext, useState, useEffect } from 'react';

type SupportedLanguages = 'ro' | 'en';

interface LanguageContextType {
  language: SupportedLanguages;
  setLanguage: (lang: SupportedLanguages) => void;
  t: (key: string) => string;
}

// Simple translations for demo purposes
const translations: Record<SupportedLanguages, Record<string, string>> = {
  ro: {
    'nav.about': 'Despre',
    'nav.howItWorks': 'Cum funcționează',
    'nav.generate': 'Generare materiale',
    'nav.packages': 'Pachete',
    'nav.contact': 'Contact',
    'nav.register': 'Înregistrează-te',
    'nav.login': 'Autentificare',
    'nav.myAccount': 'Contul meu',
    'nav.logout': 'Ieșire',
    'hero.title': 'Generează materiale de curs personalizate cu AI',
    'hero.subtitle': 'Platforma care te ajută să creezi materiale de curs adaptate nevoilor tale',
    'hero.cta': 'Începe acum',
    'auth.loginRequired': 'Pentru a genera materiale, este necesar să ai un cont gratuit.',
    'auth.email': 'Email',
    'auth.password': 'Parolă',
    'auth.name': 'Nume',
    'auth.confirmPassword': 'Confirmă parola',
    'auth.loginButton': 'Autentificare',
    'auth.registerButton': 'Înregistrează-te',
    'auth.switchToLogin': 'Ai deja un cont? Autentifică-te',
    'auth.switchToRegister': 'Nu ai un cont? Înregistrează-te',
    'form.language': 'Limba materialului',
    'form.context': 'Context',
    'form.subject': 'Subiect curs',
    'form.level': 'Nivel',
    'form.audience': 'Public țintă',
    'form.duration': 'Durată',
    'form.tone': 'Ton',
    'form.submit': 'Generează materiale',
    'packages.title': 'Alege pachetul potrivit pentru tine',
    'packages.free': 'Gratuit',
    'packages.basic': 'Basic',
    'packages.pro': 'Pro',
    'packages.enterprise': 'Enterprise',
    'about.title': 'Despre Automator.ro',
    'how.title': 'Cum funcționează',
    'how.step1': 'Completează formularul',
    'how.step2': 'Personalizează materialul',
    'how.step3': 'Descarcă și utilizează',
    'contact.title': 'Contact',
    'materials.title': 'Materialele generate',
    'auth.signupWithGoogle': 'Înregistrare cu Google',
    'auth.continueWithGoogle': 'Continuă cu Google',
    'auth.continueWith': 'sau continuă cu',
  },
  en: {
    'nav.about': 'About',
    'nav.howItWorks': 'How It Works',
    'nav.generate': 'Generate Materials',
    'nav.packages': 'Packages',
    'nav.contact': 'Contact',
    'nav.register': 'Register',
    'nav.login': 'Login',
    'nav.myAccount': 'My Account',
    'nav.logout': 'Logout',
    'hero.title': 'Generate Customized Course Materials with AI',
    'hero.subtitle': 'The platform that helps you create course materials tailored to your needs',
    'hero.cta': 'Start Now',
    'auth.loginRequired': 'To generate materials, you need to have a free account.',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.loginButton': 'Login',
    'auth.registerButton': 'Register',
    'auth.switchToLogin': 'Already have an account? Login',
    'auth.switchToRegister': 'Don\'t have an account? Register',
    'form.language': 'Material Language',
    'form.context': 'Context',
    'form.subject': 'Course Subject',
    'form.level': 'Level',
    'form.audience': 'Target Audience',
    'form.duration': 'Duration',
    'form.tone': 'Tone',
    'form.submit': 'Generate Materials',
    'packages.title': 'Choose the Right Package for You',
    'packages.free': 'Free',
    'packages.basic': 'Basic',
    'packages.pro': 'Pro',
    'packages.enterprise': 'Enterprise',
    'about.title': 'About Automator.ro',
    'how.title': 'How It Works',
    'how.step1': 'Fill out the form',
    'how.step2': 'Customize your material',
    'how.step3': 'Download and use',
    'contact.title': 'Contact',
    'materials.title': 'Generated Materials',
    'auth.signupWithGoogle': 'Sign up with Google',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.continueWith': 'or continue with',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguages>(() => {
    const stored = localStorage.getItem('language');
    return (stored as SupportedLanguages) || 'ro';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: SupportedLanguages) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
