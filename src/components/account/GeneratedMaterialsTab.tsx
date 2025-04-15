
import React from 'react';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GeneratedMaterialsTabProps {
  user: User | null;
}

const GeneratedMaterialsTab = ({ user }: GeneratedMaterialsTabProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Materiale generate</CardTitle>
          <CardDescription>
            Vedeți și descărcați materialele generate anterior
          </CardDescription>
        </div>
        <Button 
          onClick={() => navigate('/generate')}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Generează curs
        </Button>
      </CardHeader>
      <CardContent>
        {user?.generatedCourses?.length ? (
          <div className="space-y-4">
            {user.generatedCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{course.formData.subject}</CardTitle>
                </CardHeader>
                <CardContent className="py-2 text-sm">
                  <p>Generat: {new Date(course.createdAt).toLocaleDateString()}</p>
                  <p>Nivel: {course.formData.level}</p>
                </CardContent>
                <CardFooter className="py-2 flex justify-between">
                  <Button variant="outline" size="sm">
                    Vezi
                  </Button>
                  <Button variant="outline" size="sm">
                    Descarcă
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nu aveți materiale generate încă.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneratedMaterialsTab;
