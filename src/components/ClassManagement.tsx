import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Users, BookOpen, Plus, Eye, Trash2 } from 'lucide-react';

export function ClassManagement({ classes, onAddClass, onViewClass, onDeleteClass, students = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate real-time student count for each class
  const getStudentCount = (classId) => {
    return students.filter(student => student.classId === classId).length;
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classItem.subject && classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getGradeColor = (grade) => {
    const gradeNumber = parseInt(grade);
    if (gradeNumber <= 5) return 'bg-gradient-to-r from-green-400 to-emerald-500';
    if (gradeNumber <= 8) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (gradeNumber <= 10) return 'bg-gradient-to-r from-purple-400 to-purple-500';
    return 'bg-gradient-to-r from-orange-400 to-red-500';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-medium">Class Management</h2>
            <p className="text-muted-foreground">Manage your classes and their details</p>
          </div>
          <Button 
            onClick={onAddClass}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Class
          </Button>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{classItem.name}</CardTitle>
                  <Badge className={`${getGradeColor(classItem.grade)} text-white border-0 mb-2`}>
                    {classItem.grade}
                  </Badge>
                  {classItem.subject && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      <span>{classItem.subject}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">{getStudentCount(classItem.id)} Students</span>
                </div>
                {classItem.capacity && (
                  <Badge variant="outline" className="text-xs">
                    Capacity: {classItem.capacity}
                  </Badge>
                )}
              </div>

              {classItem.description && (
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {classItem.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => onViewClass(classItem)}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Class
                </Button>
                <Button 
                  onClick={() => onDeleteClass(classItem.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Classes Found</h3>
          <p className="text-muted-foreground mb-4">
            {classes.length === 0 
              ? "Get started by creating your first class" 
              : "No classes match your search criteria"
            }
          </p>
          {classes.length === 0 && (
            <Button 
              onClick={onAddClass}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Class
            </Button>
          )}
        </div>
      )}
    </div>
  );
}