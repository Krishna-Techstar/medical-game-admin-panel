import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ArrowLeft, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { dentalClasses, getClassesByYear } from '../utils/dentalClasses';

export function AddStudent({ onBack, classes, onAddStudent }) {
  const classesByYear = getClassesByYear();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    classId: '',
    subjects: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.classId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedClass = dentalClasses.find(c => c.id === formData.classId);
    
    const newStudent = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      classId: formData.classId,
      className: selectedClass?.name || '',
      avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      currentLevel: 1,
      totalPoints: 0,
      gameProgress: 0,
      lastActive: 'Just joined',
      status: 'active',
      subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [selectedClass?.subject || ''],
      averageGrade: 0,
      notes: formData.notes
    };

    onAddStudent(newStudent);
    toast.success('Student added successfully!');
    setFormData({
      name: '',
      email: '',
      classId: '',
      subjects: '',
      notes: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button 
          onClick={onBack}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
        
        <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-medium">Add New Dental Student</h1>
              <p className="text-white/90">Create a new dental student profile and assign to a class</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter student's full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="student@school.edu"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={formData.classId} onValueChange={(value) => handleInputChange('classId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {Object.entries(classesByYear).map(([year, yearClasses]) => (
                    <React.Fragment key={year}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                        {year}
                      </div>
                      {yearClasses.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.subject}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select the appropriate dental college class and year
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects">Subjects (comma-separated)</Label>
              <Input
                id="subjects"
                value={formData.subjects}
                onChange={(e) => handleInputChange('subjects', e.target.value)}
                placeholder="Oral Pathology, Periodontology, Endodontics"
              />
              <p className="text-sm text-muted-foreground">
                Enter dental subjects separated by commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about the dental student (clinical requirements, special accommodations, etc.)..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}