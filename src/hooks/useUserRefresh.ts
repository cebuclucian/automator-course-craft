
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedCourse } from '@/types';

export const useUserRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Obținere sesiune curentă
      const { data: sessionData } = await supabase.auth.getSession();
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
            generatedCourses = parsedUser.generatedCourses.map((course: any) => {
              // Verificare și convertire date invalide
              let createdAt = course.createdAt;
              let expiresAt = course.expiresAt;
              
              // Asigură-te că createdAt este un string ISO valid
              try {
                if (!createdAt || new Date(createdAt).toString() === 'Invalid Date') {
                  createdAt = new Date().toISOString();
                } else if (typeof createdAt !== 'string') {
                  createdAt = new Date(createdAt).toISOString();
                }
              } catch (e) {
                console.warn("useUserRefresh: createdAt invalid, resetare:", course.id);
                createdAt = new Date().toISOString();
              }
              
              // Asigură-te că expiresAt este un string ISO valid
              try {
                if (!expiresAt || new Date(expiresAt).toString() === 'Invalid Date') {
                  expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                } else if (typeof expiresAt !== 'string') {
                  expiresAt = new Date(expiresAt).toISOString();
                }
              } catch (e) {
                console.warn("useUserRefresh: expiresAt invalid, resetare:", course.id);
                expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              }
              
              // Cursa normalizat
              const normalizedCourse = {
                ...course,
                id: course.id || `course-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                createdAt: createdAt,
                expiresAt: expiresAt,
                sections: course.sections || [],
                status: course.status || 'completed',
                jobId: course.jobId || course.id
              };
              
              return normalizedCourse;
            });
            
            // Filtrare cursuri corupte
            generatedCourses = generatedCourses.filter(course => 
              course && course.formData && course.formData.subject && 
              course.sections && Array.isArray(course.sections));
            
            console.log("useUserRefresh: Cursuri normalizate cu date corecte:", generatedCourses.length);
          }
        } catch (e) {
          console.error("useUserRefresh: Eroare parsare date utilizator stocate:", e);
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
      localStorage.setItem('automatorUser', JSON.stringify(updatedUser));
      
      console.log("useUserRefresh: Date utilizator actualizate și stocate:", {
        id: updatedUser.id,
        email: updatedUser.email,
        coursesCount: updatedUser.generatedCourses.length,
        subscription: updatedUser.subscription
      });
      
      // Declanșare eveniment pentru informarea tuturor componentelor despre actualizarea datelor
      window.dispatchEvent(new Event('user-refreshed'));
      
      return true;
    } catch (error) {
      console.error("useUserRefresh: Eroare reîmprospătare date utilizator:", error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
  return { refreshUser, isRefreshing };
};
