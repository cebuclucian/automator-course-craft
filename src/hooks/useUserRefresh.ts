
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedCourse } from '@/types';
import { useToast } from './use-toast';

export const useUserRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Obținere sesiune curentă
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("useUserRefresh: Eroare la obținerea sesiunii:", sessionError);
        toast({
          title: "Eroare la autentificare",
          description: "Vă rugăm să vă autentificați din nou.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!sessionData?.session) {
        console.log("useUserRefresh: Nu s-a găsit o sesiune activă");
        return false;
      }
      
      console.log("useUserRefresh: Sesiune găsită, reîmprospătare date utilizator");
      
      // Obținere date abonat din baza de date
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .single();
        
      if (subscriberError) {
        console.error("useUserRefresh: Eroare la obținerea datelor abonatului:", subscriberError);
        return false;
      }
      
      console.log("useUserRefresh: Date abonat obținute:", subscriberData);
      
      // Obținere cursuri stocate din localStorage
      let generatedCourses: GeneratedCourse[] = [];
      const automatorUser = localStorage.getItem('automatorUser');
      
      if (automatorUser) {
        try {
          const parsedUser = JSON.parse(automatorUser);
          if (parsedUser.generatedCourses && Array.isArray(parsedUser.generatedCourses)) {
            console.log("useUserRefresh: Cursuri stocate găsite în localStorage:", parsedUser.generatedCourses.length);
            
            // Asigură-te că toate cursurile sunt normalizate corespunzător
            generatedCourses = parsedUser.generatedCourses
              .filter(course => course && typeof course === 'object') // Filtrare valori invalide
              .map((course: any) => {
                // Verificare și convertire date invalide
                let createdAt = course.createdAt || new Date().toISOString();
                let expiresAt = course.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                
                // Asigură-te că createdAt este un string ISO valid
                try {
                  if (typeof createdAt !== 'string' || new Date(createdAt).toString() === 'Invalid Date') {
                    createdAt = new Date().toISOString();
                  }
                } catch (e) {
                  console.warn("useUserRefresh: createdAt invalid, resetare:", course.id);
                  createdAt = new Date().toISOString();
                }
                
                // Asigură-te că expiresAt este un string ISO valid
                try {
                  if (typeof expiresAt !== 'string' || new Date(expiresAt).toString() === 'Invalid Date') {
                    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                  }
                } catch (e) {
                  console.warn("useUserRefresh: expiresAt invalid, resetare:", course.id);
                  expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                }
                
                // Asigură-te că formData este un obiect valid
                const formData = course.formData && typeof course.formData === 'object' 
                  ? course.formData 
                  : { subject: 'Curs necunoscut', level: 'Intermediar', audience: 'General', duration: '60 min' };
                
                // Asigură-te că sections este un array valid
                const sections = Array.isArray(course.sections) ? course.sections : [];
                
                // Curs normalizat
                return {
                  id: course.id || `course-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  createdAt,
                  expiresAt,
                  formData,
                  sections,
                  status: course.status || 'completed',
                  jobId: course.jobId || course.id || `job-${Date.now()}`
                };
              });
            
            // Filtrare cursuri corupte
            generatedCourses = generatedCourses.filter(course => 
              course && 
              course.formData && 
              course.formData.subject && 
              Array.isArray(course.sections));
            
            console.log("useUserRefresh: Cursuri normalizate cu date corecte:", generatedCourses.length);
          }
        } catch (e) {
          console.error("useUserRefresh: Eroare parsare date utilizator stocate:", e);
          toast({
            title: "Eroare",
            description: "A apărut o eroare la încărcarea datelor stocate",
            variant: "destructive"
          });
          generatedCourses = [];
        }
      }
      
      // Construire obiect utilizator actualizat cu gestionare adecvată a datelor
      const updatedUser = {
        id: sessionData.session.user.id,
        email: subscriberData.email || sessionData.session.user.email,
        name: sessionData.session.user.user_metadata?.name || subscriberData.email?.split('@')[0],
        subscription: {
          tier: subscriberData.subscription_tier || 'Free',
          expiresAt: subscriberData.subscription_end || new Date().toISOString(),
          active: !!subscriberData.subscribed
        },
        generationsLeft: subscriberData.generations_left || 0,
        generatedCourses: generatedCourses,
        googleAuth: sessionData.session.user.app_metadata?.provider === 'google',
        lastGenerationDate: subscriberData.last_generation_date || null
      };
      
      // Log cursurile înainte de stocare
      console.log("useUserRefresh: Cursuri generate înainte de stocare:", 
        generatedCourses.map(c => ({ 
          id: c.id, 
          subject: c.formData?.subject, 
          status: c.status,
          secțiuni: c.sections?.length || 0
        })));
      
      // Actualizare localStorage cu format dată consistent
      try {
        localStorage.setItem('automatorUser', JSON.stringify(updatedUser));
      } catch (storageError) {
        console.error("useUserRefresh: Eroare la salvarea în localStorage:", storageError);
        // În caz de eroare localStorage, nu oprim procesul - continuăm
      }
      
      console.log("useUserRefresh: Date utilizator actualizate și stocate:", {
        id: updatedUser.id,
        email: updatedUser.email,
        coursesCount: updatedUser.generatedCourses.length,
        subscription: updatedUser.subscription
      });
      
      // Declanșare eveniment pentru informarea tuturor componentelor despre actualizarea datelor
      try {
        window.dispatchEvent(new Event('user-refreshed'));
      } catch (eventError) {
        console.error("useUserRefresh: Eroare la declanșarea evenimentului:", eventError);
      }
      
      return true;
    } catch (error) {
      console.error("useUserRefresh: Eroare reîmprospătare date utilizator:", error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut actualiza informațiile contului",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);
  
  return { refreshUser, isRefreshing };
};
