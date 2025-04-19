
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GenerationProgressProps {
  generationProgress: number;
  milestone: string | null;
  error: string | null;
  statusMessage: string | null;
  jobId: string | null;
  debugInfo?: any;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  generationProgress,
  milestone,
  error,
  statusMessage,
  jobId,
  debugInfo
}) => {
  const { language } = useLanguage();

  const getMilestoneDescription = (milestone: string) => {
    switch (milestone) {
      case 'job_created':
        return language === 'ro' ? 'Job creat, se inițiază procesarea' : 'Job created, initiating processing';
      case 'processing_started':
        return language === 'ro' ? 'Procesare pornită' : 'Processing started';
      case 'api_call_started':
        return language === 'ro' ? 'Apel către API Claude în curs' : 'Claude API call in progress';
      case 'api_call_complete':
        return language === 'ro' ? 'Răspuns API primit, se procesează' : 'API response received, processing';
      case 'processing_content':
        return language === 'ro' ? 'Se procesează conținutul' : 'Processing content';
      case 'generating_materials':
        return language === 'ro' ? 'Se generează materialele' : 'Generating materials';
      case 'saving_materials':
        return language === 'ro' ? 'Se salvează materialele' : 'Saving materials';
      case 'finalizing':
        return language === 'ro' ? 'Se finalizează generarea' : 'Finalizing generation';
      case 'completed':
        return language === 'ro' ? 'Generare finalizată cu succes' : 'Generation completed successfully';
      default:
        return milestone;
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{language === 'ro' ? 'Eroare' : 'Error'}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{error}</p>
          {jobId && (
            <p className="text-xs text-muted-foreground">
              Job ID: {jobId}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!jobId) return null;

  return (
    <div className="space-y-4 mb-6 border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {language === 'ro' ? 'Progres generare' : 'Generation progress'}
        </h4>
        {generationProgress === 100 ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        )}
      </div>
      
      <div className="space-y-2">
        <Progress value={generationProgress} className="h-2" />
        <p className="text-sm font-medium">
          {statusMessage || (language === 'ro' 
            ? `Progres: ${generationProgress}%`
            : `Progress: ${generationProgress}%`)}
        </p>
      </div>
      
      <div className="space-y-1 text-xs">
        {milestone && (
          <div className="flex items-center">
            <span className={`h-2 w-2 rounded-full mr-2 ${
              generationProgress === 100 ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
            }`}></span>
            <p className="font-medium">
              {getMilestoneDescription(milestone)}
            </p>
          </div>
        )}
        
        {jobId && (
          <p className="text-muted-foreground mt-1">
            Job ID: {jobId}
          </p>
        )}
      </div>
    </div>
  );
};

export default GenerationProgress;
