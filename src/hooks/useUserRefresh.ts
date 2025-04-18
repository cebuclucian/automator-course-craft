
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
            
            // Ensure all date objects are properly converted from strings
            generatedCourses = parsedUser.generatedCourses.map((course: any) => ({
              ...course,
              createdAt: new Date(course.createdAt),
              expiresAt: new Date(course.expiresAt),
              // Ensure sections are preserved
              sections: course.sections || []
            }));
            
            console.log("useUserRefresh: Parsed courses with dates:", generatedCourses.length);
          }
        } catch (e) {
          console.error("useUserRefresh: Error parsing stored user data:", e);
          generatedCourses = [];
        }
      }
      
      // Build the updated user object
      const updatedUser = {
        id: sessionData.session.user.id,
        email: subscriberData.email || sessionData.session.user.email,
        name: sessionData.session.user.user_metadata?.name || subscriberData.email?.split('@')[0],
        subscription: {
          tier: subscriberData.subscription_tier || 'Free',
          expiresAt: subscriberData.subscription_end ? new Date(subscriberData.subscription_end) : new Date(),
          active: !!subscriberData.subscribed
        },
        generationsLeft: subscriberData.generations_left || 0,
        generatedCourses: generatedCourses,
        googleAuth: sessionData.session.user.app_metadata?.provider === 'google',
        lastGenerationDate: subscriberData.last_generation_date ? new Date(subscriberData.last_generation_date) : null
      };
      
      // Log the courses before storing
      console.log("useUserRefresh: Generated courses before storing:", 
        generatedCourses.map(c => ({ id: c.id, subject: c.formData?.subject })));
      
      // Update localStorage with proper date objects
      localStorage.setItem('automatorUser', JSON.stringify({
        ...updatedUser,
        generatedCourses: generatedCourses.map(course => ({
          ...course,
          createdAt: course.createdAt.toISOString(),
          expiresAt: course.expiresAt.toISOString()
        }))
      }));
      
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
