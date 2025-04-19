
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GenerationProgressProps {
  generationProgress: number;
  milestone: string | null;
  error: string | null;
  statusMessage: string | null;
  jobId: string | null;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  generationProgress,
  milestone,
  error,
  statusMessage,
  jobId
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
      case 'api_response_received':
        return language === 'ro' ? 'Răspuns API primit, se procesează' : 'API response received, processing';
      case 'processing_content':
        return language === 'ro' ? 'Se procesează conținutul' : 'Processing content';
      default:
        return milestone;
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{language === 'ro' ? 'Eroare' : 'Error'}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!jobId) return null;

  return (
    <div className="space-y-4 mb-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {language === 'ro' ? 'Progres generare' : 'Generation progress'}
        </p>
        <Progress value={generationProgress} className="h-2" />
      </div>
      
      <div className="space-y-1 text-sm">
        <p className="font-medium">
          {statusMessage || (language === 'ro' 
            ? `Progres: ${generationProgress}%`
            : `Progress: ${generationProgress}%`)}
        </p>
        
        {milestone && (
          <p className="text-muted-foreground text-xs">
            {getMilestoneDescription(milestone)}
          </p>
        )}
        
        {jobId && (
          <p className="text-xs text-muted-foreground">
            Job ID: {jobId}
          </p>
        )}
      </div>
    </div>
  );
};

export default GenerationProgress;
