export const getMockData = (formData: any) => {
  // Log that we're using mock data
  console.log("Using MOCK data for initial display with form data:", formData);
  
  // Create mock sections with types
  const mockSections = [
    {
      title: 'Plan de lecție',
      content: `Plan de lecție mock pentru "${formData.subject || 'Curs'}"`,
      categories: [],
      type: 'lesson-plan'
    },
    {
      title: 'Slide-uri prezentare',
      content: `Slide-uri mock pentru "${formData.subject || 'Curs'}"`,
      categories: [],
      type: 'slides'
    },
    {
      title: 'Note trainer',
      content: `Note trainer mock pentru "${formData.subject || 'Curs'}"`,
      categories: [],
      type: 'trainer-notes'
    },
    {
      title: 'Exerciții',
      content: `Exerciții mock pentru "${formData.subject || 'Curs'}"`,
      categories: [],
      type: 'exercises'
    }
  ];
  
  return {
    subject: formData.subject || 'Curs nou',
    sections: mockSections
  };
};
