
// Languages currently supported by Claude AI for course generation
export const supportedCourseLanguages = [
  { value: 'română', label: 'Română', code: 'ro' },
  { value: 'english', label: 'English', code: 'en' },
  // Temporarily hide other languages until full support is implemented
  // { value: 'français', label: 'Français', code: 'fr' },
  // { value: 'español', label: 'Español', code: 'es' },
  // { value: 'deutsch', label: 'Deutsch', code: 'de' }
] as const;

export type SupportedCourseLanguage = typeof supportedCourseLanguages[number]['value'];
