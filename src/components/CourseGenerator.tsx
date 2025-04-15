
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CourseFormData, GenerationType } from '@/types';
import { Loader2 } from 'lucide-react';
import AuthModal from './AuthModal';
import { generateCourse } from '@/services/claude';
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from '@/contexts/UserProfileContext';

const CourseGenerator = () => {
  const { user, refreshUser } = useAuth();
  const { profile, refreshProfile, decrementGenerationsLeft } = useUserProfile();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    language: language === 'ro' ? 'română' : 'english',
    context: 'Corporativ',
    subject: '',
    level: 'Intermediar',
    audience: 'Profesioniști',
    duration: '1 zi',
    tone: 'Profesional',
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('auth.loginRequired')}</CardTitle>
            <CardDescription>
              {language === 'ro' 
                ? 'Creează un cont gratuit sau autentifică-te pentru a accesa generatorul de materiale.'
                : 'Create a free account or log in to access the materials generator.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setIsAuthModalOpen(true)} className="flex-1">
                {language === 'ro' ? 'Autentificare / Înregistrare' : 'Login / Register'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode="register" 
        />
      </div>
    );
  }

  const handleChange = (field: keyof CourseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificăm dacă utilizatorul are generări disponibile
    if (!profile || profile.generationsLeft <= 0) {
      toast({
        title: language === 'ro' ? 'Limită atinsă' : 'Limit reached',
        description: language === 'ro' 
          ? 'Nu mai aveți generări disponibile pentru acest abonament. Pentru a genera mai multe cursuri, alegeți un pachet superior.' 
          : 'You have no more available generations for this subscription. To generate more courses, choose a higher package.',
        variant: 'default',
      });
      
      navigate('/packages');
      return;
    }
    
    let generationType: GenerationType = 'Preview';
    if (user.subscription && user.subscription.tier !== 'Free') {
      generationType = 'Complet';
    }
    
    const fullFormData = {
      ...formData,
      generationType
    };
    
    setLoading(true);
    
    try {
      const generatedCourse = await generateCourse(fullFormData);
      
      if (user) {
        // Decrementăm numărul de generări disponibile DOAR dacă generarea a reușit
        if (profile) {
          await decrementGenerationsLeft(user.id);
        }
        
        const mockGeneratedCourse = {
          id: 'course-' + Date.now(),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
          formData: fullFormData,
          sections: generatedCourse.sections,
          previewMode: generationType === 'Preview'
        };
        
        const updatedUser = { 
          ...user,
          generatedCourses: [
            ...(user.generatedCourses || []),
            mockGeneratedCourse
          ]
        };
        
        localStorage.setItem('automatorUser', JSON.stringify(updatedUser));
        
        // Important: Await the refreshUser operation to ensure data is updated
        await refreshUser();
        // Reîmprospătăm și profilul pentru a avea datele cele mai recente
        await refreshProfile();
        
        toast({
          title: language === 'ro' ? 'Material generat cu succes!' : 'Material successfully generated!',
          description: language === 'ro' 
            ? 'Poți accesa materialul din contul tău.' 
            : 'You can access the material from your account.',
        });

        // Navigate after refreshUser and toast operations are complete
        navigate('/account');
      }
    } catch (error: any) {
      console.error("Error generating course:", error);
      toast({
        variant: 'destructive',
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' 
          ? `A apărut o eroare la generarea materialului: ${error.message}` 
          : `An error occurred while generating the material: ${error.message}`,
      });
      
      // Very important: don't decrement the available generations if there's an error
      // No need to add anything else here since we didn't decrement yet
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            {language === 'ro' ? 'Generator de materiale' : 'Materials Generator'}
          </CardTitle>
          <CardDescription>
            {language === 'ro' 
              ? 'Completează formularul pentru a genera materiale de curs personalizate.'
              : 'Fill out the form to generate customized course materials.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language">{t('form.language')}</Label>
              <Select 
                value={formData.language} 
                onValueChange={(value) => handleChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ro' ? 'Selectează limba' : 'Select language'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="română">Română</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="français">Français</SelectItem>
                  <SelectItem value="español">Español</SelectItem>
                  <SelectItem value="deutsch">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('form.context')}</Label>
              <RadioGroup 
                value={formData.context} 
                onValueChange={(value) => handleChange('context', value as 'Corporativ' | 'Academic')}
                className="flex flex-row space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Corporativ" id="corporativ" />
                  <Label htmlFor="corporativ">
                    {language === 'ro' ? 'Corporativ' : 'Corporate'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Academic" id="academic" />
                  <Label htmlFor="academic">
                    {language === 'ro' ? 'Academic' : 'Academic'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t('form.subject')}</Label>
              <Textarea 
                id="subject" 
                value={formData.subject} 
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder={language === 'ro' ? 'Exemplu: Comunicare eficientă în echipă' : 'Example: Effective team communication'}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="level">{t('form.level')}</Label>
                <Select 
                  value={formData.level} 
                  onValueChange={(value) => handleChange('level', value as 'Începător' | 'Intermediar' | 'Avansat')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Începător">
                      {language === 'ro' ? 'Începător' : 'Beginner'}
                    </SelectItem>
                    <SelectItem value="Intermediar">
                      {language === 'ro' ? 'Intermediar' : 'Intermediate'}
                    </SelectItem>
                    <SelectItem value="Avansat">
                      {language === 'ro' ? 'Avansat' : 'Advanced'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">{t('form.audience')}</Label>
                <Select 
                  value={formData.audience} 
                  onValueChange={(value) => handleChange('audience', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elevi">
                      {language === 'ro' ? 'Elevi' : 'Students (K-12)'}
                    </SelectItem>
                    <SelectItem value="Studenți">
                      {language === 'ro' ? 'Studenți' : 'University Students'}
                    </SelectItem>
                    <SelectItem value="Profesori">
                      {language === 'ro' ? 'Profesori' : 'Teachers'}
                    </SelectItem>
                    <SelectItem value="Profesioniști">
                      {language === 'ro' ? 'Profesioniști' : 'Professionals'}
                    </SelectItem>
                    <SelectItem value="Manageri">
                      {language === 'ro' ? 'Manageri' : 'Managers'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">{t('form.duration')}</Label>
                <Select 
                  value={formData.duration} 
                  onValueChange={(value) => handleChange('duration', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="2h">2h</SelectItem>
                    <SelectItem value="4h">4h</SelectItem>
                    <SelectItem value="1 zi">
                      {language === 'ro' ? '1 zi' : '1 day'}
                    </SelectItem>
                    <SelectItem value="2 zile">
                      {language === 'ro' ? '2 zile' : '2 days'}
                    </SelectItem>
                    <SelectItem value="3 zile">
                      {language === 'ro' ? '3 zile' : '3 days'}
                    </SelectItem>
                    <SelectItem value="4 zile">
                      {language === 'ro' ? '4 zile' : '4 days'}
                    </SelectItem>
                    <SelectItem value="5 zile">
                      {language === 'ro' ? '5 zile' : '5 days'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">{t('form.tone')}</Label>
                <Select 
                  value={formData.tone} 
                  onValueChange={(value) => handleChange('tone', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Socratic">Socratic</SelectItem>
                    <SelectItem value="Energizant">
                      {language === 'ro' ? 'Energizant' : 'Energizing'}
                    </SelectItem>
                    <SelectItem value="Haios">
                      {language === 'ro' ? 'Haios' : 'Humorous'}
                    </SelectItem>
                    <SelectItem value="Profesional">
                      {language === 'ro' ? 'Profesional' : 'Professional'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || (profile && profile.generationsLeft <= 0)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ro' ? 'Se generează...' : 'Generating...'}
                  </>
                ) : (
                  t('form.submit')
                )}
              </Button>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {profile && (
                  <p>
                    {language === 'ro' 
                      ? `Generări disponibile: ${profile.generationsLeft}` 
                      : `Available generations: ${profile.generationsLeft}`}
                  </p>
                )}
                
                {user.subscription?.tier === 'Free' && (
                  <p className="mt-1">
                    {language === 'ro' 
                      ? 'Cont gratuit - se va genera versiunea Preview cu primele 2 pagini din fiecare tip de material.' 
                      : 'Free account - the Preview version will be generated with the first 2 pages of each type of material.'}
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGenerator;
