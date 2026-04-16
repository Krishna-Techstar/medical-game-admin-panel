import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, School, Save, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { dentalClasses, getClassesByYear } from '../utils/dentalClasses';

export function AddClass({ onBack, onAddClass }) {
  const [selectedDentalClass, setSelectedDentalClass] = useState('');
  const [customCapacity, setCustomCapacity] = useState('');
  const classesByYear = getClassesByYear();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDentalClass) {
      toast.error('Please select a class');
      return;
    }

    const selectedClass = dentalClasses.find(c => c.id === selectedDentalClass);
    if (!selectedClass) {
      toast.error('Class not found');
      return;
    }

    const newClass = {
      id: selectedClass.id,
      name: selectedClass.name,
      grade: selectedClass.grade,
      subject: selectedClass.subject,
      description: selectedClass.description,
      capacity: customCapacity ? parseInt(customCapacity) : 30,
      studentCount: 0,
      createdAt: new Date().toISOString()
    };

    onAddClass(newClass);
    toast.success('Class added successfully!');
    setSelectedDentalClass('');
    setCustomCapacity('');
  };

  const selectedClassData = dentalClasses.find(c => c.id === selectedDentalClass);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button 
          onClick={onBack}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-medium">Add Dental College Class</h1>
              <p className="text-white/90">Select a class from the comprehensive dental curriculum</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            Class Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="class">Select Dental Class *</Label>
              <Select value={selectedDentalClass} onValueChange={setSelectedDentalClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dental class" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {Object.entries(classesByYear).map(([year, yearClasses]) => (
                    <React.Fragment key={year}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0">
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
                Choose from BDS (1st-5th Year) or MDS (1st-3rd Year) programs
              </p>
            </div>

            {selectedClassData && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Info className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">Selected Class Details</h4>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground min-w-[80px]">Class Name:</span>
                    <span className="font-medium">{selectedClassData.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground min-w-[80px]">Year:</span>
                    <span>{selectedClassData.grade}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground min-w-[80px]">Subject:</span>
                    <span>{selectedClassData.subject}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-muted-foreground">{selectedClassData.description}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="capacity">Class Capacity (Optional)</Label>
              <Input
                id="capacity"
                type="number"
                value={customCapacity}
                onChange={(e) => setCustomCapacity(e.target.value)}
                placeholder="Default: 30 students"
                min="1"
                max="60"
              />
              <p className="text-sm text-muted-foreground">
                Set the maximum number of students for this class
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
              disabled={!selectedDentalClass}
            >
              <Save className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
