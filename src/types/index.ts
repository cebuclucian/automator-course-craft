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
  title: string;
  description: string;
  sections: CourseSection[];
}

export interface CourseSection {
  title: string;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  title: string;
  content: string;
}
