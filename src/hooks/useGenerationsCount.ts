
import { useState } from "react";
import { decrementGenerations } from "@/services/generationsService";

export const useGenerationsCount = (initialCount: number = 0) => {
  const [count, setCount] = useState(initialCount);

  const decrement = async (userId: string): Promise<boolean> => {
    const success = await decrementGenerations(userId);
    if (success) {
      setCount(prev => Math.max(0, prev - 1));
    }
    return success;
  };

  return {
    count,
    decrement
  };
};
