import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Infinity as InfinityIcon } from 'lucide-react';
import { CourseFormData } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { supportedCourseLanguages } from '@/config/supportedCourseLanguages';
import GenerationProgress from './GenerationProgress';

interface CourseGeneratorFormProps {
  formData: CourseFormData;
  onFormDataChange: (field: keyof CourseFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  showLongGenerationWarning: boolean;
  generationsLeft?: number;
  isSubscriptionTierFree?: boolean;
  jobId?: string | null;
  generationProgress: number;
  milestone: string | null;
  error: string | null;
  statusMessage: string | null;
}

const CourseGeneratorForm: React.FC<CourseGeneratorFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  loading,
  showLongGenerationWarning,
  generationsLeft,
  isSubscriptionTierFree,
  jobId,
  generationProgress,
  milestone,
  error,
  statusMessage
}) => {
  const { t, language } = useLanguage();
  const hasUnlimitedGenerations = generationsLeft === Infinity;

  console.log("CourseGeneratorForm rendered with progress:", { 
    generationProgress, 
    milestone, 
    jobId,
    loading 
  });

  const handleDurationChange = (value: string) => {
    onFormDataChange('duration', value);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {(loading || jobId) && (
        <GenerationProgress
          generationProgress={generationProgress}
          milestone={milestone}
          error={error}
          statusMessage={statusMessage}
          jobId={jobId}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="language">{t('form.language')}</Label>
        <Select 
          value={formData.language} 
          onValueChange={(value) => onFormDataChange('language', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={language === 'ro' ? 'Selectează limba' : 'Select language'} />
          </SelectTrigger>
          <SelectContent>
            {supportedCourseLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('form.context')}</Label>
        <div className="flex flex-row space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="corporativ"
              value="Corporativ"
              checked={formData.context === 'Corporativ'}
              onChange={(e) => onFormDataChange('context', e.target.value)}
              className="radio"
            />
            <Label htmlFor="corporativ">
              {language === 'ro' ? 'Corporativ' : 'Corporate'}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="academic"
              value="Academic"
              checked={formData.context === 'Academic'}
              onChange={(e) => onFormDataChange('context', e.target.value)}
              className="radio"
            />
            <Label htmlFor="academic">
              {language === 'ro' ? 'Academic' : 'Academic'}
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">{t('form.subject')}</Label>
        <Textarea 
          id="subject" 
          value={formData.subject} 
          onChange={(e) => onFormDataChange('subject', e.target.value)}
          placeholder={language === 'ro' ? 'Exemplu: Comunicare eficientă în echipă' : 'Example: Effective team communication'}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="level">{t('form.level')}</Label>
          <Select 
            value={formData.level} 
            onValueChange={(value) => onFormDataChange('level', value as any)}
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
            onValueChange={(value) => onFormDataChange('audience', value as any)}
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
            onValueChange={handleDurationChange}
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
            onValueChange={(value) => onFormDataChange('tone', value as any)}
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

      {showLongGenerationWarning && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <AlertTitle className="text-amber-800 dark:text-amber-400">
            {language === 'ro' ? 'Atenție' : 'Warning'}
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {language === 'ro' 
              ? 'Generarea materialelor pentru cursuri de mai multe zile poate dura până la câteva minute. Vei fi notificat când procesul este finalizat.'
              : 'Generating materials for multi-day courses can take several minutes. You will be notified when the process is complete.'}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || (!hasUnlimitedGenerations && !generationsLeft)}
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
          {typeof generationsLeft === 'number' && (
            <p className="flex items-center">
              {language === 'ro' 
                ? `Generări disponibile: ${hasUnlimitedGenerations ? '' : generationsLeft}` 
                : `Available generations: ${hasUnlimitedGenerations ? '' : generationsLeft}`}
              
              {hasUnlimitedGenerations && (
                <InfinityIcon className="inline-block ml-1 h-4 w-4" />
              )}
            </p>
          )}
          
          {isSubscriptionTierFree && !hasUnlimitedGenerations && (
            <p className="mt-1">
              {language === 'ro' 
                ? 'Cont gratuit - se va genera versiunea Preview cu primele 2 pagini din fiecare tip de material.' 
                : 'Free account - the Preview version will be generated with the first 2 pages of each type of material.'}
            </p>
          )}
        </div>
      </div>
    </form>
  );
};

CourseGeneratorForm.displayName = 'CourseGeneratorForm';

export default CourseGeneratorForm;
