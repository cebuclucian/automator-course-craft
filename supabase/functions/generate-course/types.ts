
export type GenerationType = 'Complet' | 'Preview';

export interface CourseFormData {
  language: string;
  context: string;
  subject: string;
  level: string;
  audience: string;
  duration: string;
  tone: string;
  generationType?: GenerationType;
  clientInfo?: {
    userAgent?: string;
    language?: string;
    screenWidth?: number;
    screenHeight?: number;
    timestamp?: string;
    url?: string;
    submitCount?: number;
  };
}

export interface GeneratedCourse {
  id: string;
  title?: string;
  description?: string;
  sections: CourseSection[];
  formData: CourseFormData;
  createdAt: string | Date;
  expiresAt?: string | Date;
  jobId?: string;
  status?: 'processing' | 'completed' | 'error';
  previewMode?: boolean;
}

export interface CourseSection {
  title: string;
  content?: string;
  type?: string;
  lessons?: CourseLesson[];
  categories?: CourseCategory[];
}

export interface CourseLesson {
  title: string;
  content: string;
}

export interface CourseCategory {
  title: string;
  content: string;
  type?: string;
}
