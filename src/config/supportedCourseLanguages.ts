
// Languages supported by Claude AI for course generation
export const supportedCourseLanguages = [
  { value: 'română', label: 'Română', code: 'ro' },
  { value: 'english', label: 'English', code: 'en' },
  { value: 'français', label: 'Français', code: 'fr' },
  { value: 'deutsch', label: 'Deutsch', code: 'de' },
  { value: 'español', label: 'Español', code: 'es' },
  { value: 'português', label: 'Português', code: 'pt' },
  { value: '日本語', label: '日本語 (Japanese)', code: 'ja' },
  { value: 'italiano', label: 'Italiano', code: 'it' },
  { value: '中文', label: '中文 (Mandarin)', code: 'zh' },
  { value: 'русский', label: 'Русский', code: 'ru' },
  { value: 'العربية', label: 'العربية (Arabic)', code: 'ar' },
  { value: 'हिन्दी', label: 'हिन्दी (Hindi)', code: 'hi' },
  { value: '한국어', label: '한국어 (Korean)', code: 'ko' }
] as const;

export type SupportedCourseLanguage = typeof supportedCourseLanguages[number]['value'];
