
import { User } from "@/types";
import { useToast } from "./use-toast";

export const useGenerationsLimit = () => {
  const { toast } = useToast();

  const canGenerate = (user: User | null): boolean => {
    if (!user) return false;

    // Check if subscription is active and not expired
    const isSubscriptionValid = user.subscription?.active && 
      new Date(user.subscription.expiresAt) > new Date();

    // Check if user has generations left
    const hasGenerationsLeft = (user.generationsLeft || 0) > 0;

    // Check if last generation was in the current month
    const lastGeneration = user.lastGenerationDate ? new Date(user.lastGenerationDate) : null;
    const currentDate = new Date();
    const isSameMonth = lastGeneration && 
      lastGeneration.getMonth() === currentDate.getMonth() &&
      lastGeneration.getFullYear() === currentDate.getFullYear();

    if (!isSubscriptionValid) {
      toast({
        title: "Abonament expirat",
        description: "Vă rugăm să reînnoiți abonamentul pentru a continua.",
        variant: "destructive"
      });
      return false;
    }

    if (!hasGenerationsLeft) {
      toast({
        title: "Limită atinsă",
        description: "Ați atins limita de generări pentru această lună.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  return { canGenerate };
};
