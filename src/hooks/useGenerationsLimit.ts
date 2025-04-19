
import { User } from "@/types";
import { useToast } from "./use-toast";
import { getAvailableGenerations } from "@/services/generationsService";
import { useLanguage } from "@/contexts/LanguageContext";

export const useGenerationsLimit = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const getGenerationsMessage = (generationsLeft: number, tier: string): string => {
    const isRomanian = language === 'ro';
    
    if (generationsLeft <= 0) {
      return isRomanian
        ? `Ai atins limita de generări pentru pachetul ${tier}.`
        : `You've reached the generation limit for the ${tier} package.`;
    }
    
    return isRomanian
      ? `Mai ai ${generationsLeft} ${generationsLeft === 1 ? 'curs disponibil' : 'cursuri disponibile'}.`
      : `You have ${generationsLeft} ${generationsLeft === 1 ? 'course' : 'courses'} left.`;
  };
  
  const canGenerate = async (user: User | null): Promise<boolean> => {
    if (!user) return false;
    
    // Verifică dacă e-mailul este admin (bypass)
    if (user.email === 'admin@automator.ro') {
      return true;
    }

    // Verifică dacă abonamentul este activ și nu a expirat
    const isSubscriptionValid = user.subscription?.active && 
      new Date(user.subscription.expiresAt) > new Date();

    // Obține numărul actualizat de generări disponibile din baza de date
    const availableGenerations = await getAvailableGenerations(user.id);
    const hasGenerationsLeft = availableGenerations !== null && availableGenerations > 0;

    const isRomanian = language === 'ro';

    if (!isSubscriptionValid) {
      toast({
        title: isRomanian ? "Abonament expirat" : "Expired subscription",
        description: isRomanian
          ? "Vă rugăm să reînnoiți abonamentul pentru a continua."
          : "Please renew your subscription to continue.",
        variant: "destructive"
      });
      return false;
    }

    if (!hasGenerationsLeft) {
      toast({
        title: isRomanian ? "Limită atinsă" : "Limit reached",
        description: isRomanian
          ? `Ai atins limita de generări pentru pachetul ${user.subscription?.tier}.`
          : `You've reached the generation limit for the ${user.subscription?.tier} package.`,
        variant: "destructive"
      });
      return false;
    }

    // Notifică utilizatorul câte generări mai are disponibile
    if (availableGenerations !== null && availableGenerations > 0) {
      toast({
        title: isRomanian ? "Generare disponibilă" : "Generation available",
        description: getGenerationsMessage(availableGenerations, user.subscription?.tier || 'Free')
      });
    }

    return true;
  };

  return { canGenerate };
};

