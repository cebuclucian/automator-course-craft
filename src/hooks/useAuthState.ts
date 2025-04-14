
import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { User as AppUser } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const useAuthState = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");
        setSession(currentSession);
        if (currentSession?.user) {
          const mappedUser: AppUser = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.email?.split('@')[0] || '',
            subscription: {
              tier: 'Free',
              expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
              active: true
            },
            generationsLeft: 0,
            generatedCourses: []
          };
          setUser(mappedUser);
        } else {
          setUser(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Session exists" : "No session");
      setSession(currentSession);
      if (currentSession?.user) {
        const mappedUser: AppUser = {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          name: currentSession.user.email?.split('@')[0] || '',
          subscription: {
            tier: 'Free',
            expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            active: true
          },
          generationsLeft: 0,
          generatedCourses: []
        };
        setUser(mappedUser);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, isLoading, setUser };
};
