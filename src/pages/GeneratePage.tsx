
import React from 'react';
import CourseGenerator from '@/components/CourseGenerator';

const GeneratePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Generator de Materiale</h1>
      <CourseGenerator />
    </div>
  );
};

export default GeneratePage;
