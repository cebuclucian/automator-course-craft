import { SupportedCourseLanguage } from '@/config/supportedCourseLanguages';

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription?: Subscription;
  generationsLeft?: number;
  generatedCourses?: GeneratedCourse[];
  lastGenerationDate?: Date;
  googleAuth?: boolean;
}

export interface Subscription {
  tier: 'Free' | 'Basic' | 'Pro' | 'Enterprise';
  expiresAt: Date;
  active: boolean;
}

export type GenerationType = 'Preview' | 'Complet';

export interface CourseFormData {
  language: 'română' | 'english' | 'français' | 'deutsch' | 'español' | 'português' | '日本語' | 'italiano' | '中文' | 'русский' | 'العربية' | 'हिन्दी' | '한국어';
  context: string;
  subject: string;
  level: string;
  audience: string;
  duration: string;
  tone: 'Profesional' | 'Socratic' | 'Energizant' | 'Haios';
  generationType?: GenerationType;
  clientInfo?: {
    userAgent: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
    timestamp: string;
    url: string;
    submitCount?: number;
  };
}

export interface CourseSection {
  title: string;
  content: string;
  categories: CourseCategory[];
  type?: string; // Added type property as optional to maintain compatibility
}

export interface CourseCategory {
  name: string;
  content: string;
}

export interface GeneratedCourse {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  formData: CourseFormData;
  sections: CourseSection[];
  previewMode: boolean;
  status?: 'processing' | 'completed' | 'error';
  jobId?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>; // Added GitHub login method
  loginWithFacebook: () => Promise<boolean>; // Added Facebook login method
  logout: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<boolean>; 
}
