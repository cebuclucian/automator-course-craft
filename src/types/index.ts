export interface User {
  id: string;
  email: string;
  name?: string;
  subscription?: Subscription;
  generationsLeft?: number;
  generatedCourses?: GeneratedCourse[];
  googleAuth?: boolean; // Added the googleAuth property
}

export interface Subscription {
  tier: 'Free' | 'Basic' | 'Pro' | 'Enterprise';
  expiresAt: Date;
  active: boolean;
}

export type GenerationType = 'Preview' | 'Complet';

export interface CourseFormData {
  language: SupportedCourseLanguage;
  context: 'Corporativ' | 'Academic';
  subject: string;
  level: 'Începător' | 'Intermediar' | 'Avansat';
  audience: 'Elevi' | 'Studenți' | 'Profesori' | 'Profesioniști' | 'Manageri';
  duration: '1h' | '2h' | '4h' | '1 zi' | '2 zile' | '3 zile' | '4 zile' | '5 zile';
  tone: 'Socratic' | 'Energizant' | 'Haios' | 'Profesional';
  generationType?: GenerationType;
}

export interface CourseSection {
  title: string;
  content: string;
  categories: CourseCategory[];
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
