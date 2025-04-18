import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedCourse } from '@/types';

export const useUserRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log("useUserRefresh: No active session found");
        return false;
      }
      
      console.log("useUserRefresh: Session found, refreshing user data");
      
      // Get subscriber data from database
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .single();
        
      if (subscriberError) {
        console.error("useUserRefresh: Error fetching subscriber data:", subscriberError);
        return false;
      }
      
      console.log("useUserRefresh: Subscriber data fetched:", subscriberData);
      
      // Get stored courses from localStorage
      let generatedCourses: GeneratedCourse[] = [];
      const automatorUser = localStorage.getItem('automatorUser');
      
      if (automatorUser) {
        try {
          const parsedUser = JSON.parse(automatorUser);
          if (parsedUser.generatedCourses && Array.isArray(parsedUser.generatedCourses)) {
            console.log("useUserRefresh: Found stored courses in localStorage:", parsedUser.generatedCourses.length);
            
            // Ensure all courses are properly normalized
            generatedCourses = parsedUser.generatedCourses.map((course: any) => {
              // Make sure dates are properly handled
              const normalizedCourse = {
                ...course,
                // If createdAt is already an ISO string, keep it; otherwise convert it
                createdAt: typeof course.createdAt === 'string' ? course.createdAt : new Date().toISOString(),
                // If expiresAt is already an ISO string, keep it; otherwise compute a new expiry date
                expiresAt: typeof course.expiresAt === 'string' ? course.expiresAt : 
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                // Ensure sections are preserved
                sections: course.sections || [],
                // Ensure status is set
                status: course.status || 'completed',
              };
              
              return normalizedCourse;
            });
            
            console.log("useUserRefresh: Normalized courses with proper dates:", generatedCourses.length);
          }
        } catch (e) {
          console.error("useUserRefresh: Error parsing stored user data:", e);
          generatedCourses = [];
        }
      }
      
      // Build the updated user object with proper date handling
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
      
      // Log the courses before storing
      console.log("useUserRefresh: Generated courses before storing:", 
        generatedCourses.map(c => ({ id: c.id, subject: c.formData?.subject, status: c.status })));
      
      // Update localStorage with consistent date format
      localStorage.setItem('automatorUser', JSON.stringify(updatedUser));
      
      console.log("useUserRefresh: User data updated and stored:", {
        id: updatedUser.id,
        email: updatedUser.email,
        coursesCount: updatedUser.generatedCourses.length,
        subscription: updatedUser.subscription
      });
      
      return true;
    } catch (error) {
      console.error("useUserRefresh: Error refreshing user data:", error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
  return { refreshUser, isRefreshing };
};
