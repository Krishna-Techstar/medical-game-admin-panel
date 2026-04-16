import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, UserPlus, UserMinus, Trophy, Star, Flame, CheckCircle2, ListTodo } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

export function AssignStudent({ student, classes, onBack, onAssignSuccess, accessToken }) {
  const [selectedClassId, setSelectedClassId] = useState(student.classId || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, dates: [] });
  const [taskData, setTaskData] = useState({ completedCount: 0, totalCount: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch streak and task data
  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch streak data
        const streakResponse = await fetch(
          `/make-server-2fad19e1/teacher/student-streak/${student.email}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (streakResponse.ok) {
          const result = await streakResponse.json();
          setStreakData(result.streakData || { currentStreak: 0, longestStreak: 0, dates: [] });
        }

        // Fetch task data
        const tasksResponse = await fetch(
          `/make-server-2fad19e1/teacher/student-tasks/${student.email}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (tasksResponse.ok) {
          const result = await tasksResponse.json();
          const tasks = result.tasks || [];
          setTaskData({
            completedCount: tasks.filter(t => t.completed).length,
            totalCount: tasks.length
          });
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (student && student.email && accessToken) {
      fetchStudentData();
    }
  }, [student, accessToken]);

  const handleAssignToClass = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class');
      return;
    }

    setIsAssigning(true);
    try {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      
      const response = await fetch(`/make-server-2fad19e1/teacher/assign-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          studentId: student.id,
          studentEmail: student.email,
          classId: selectedClassId,
          className: selectedClass.name
        })
      });

      if (response.ok) {
        toast.success(`${student.name} assigned to ${selectedClass.name}`);
        if (onAssignSuccess) {
          onAssignSuccess();
        }
        onBack();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign student');
      }
    } catch (error) {
      console.error('Error assigning student:', error);
      toast.error('Failed to assign student');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setIsAssigning(true);
    try {
      const response = await fetch(`/make-server-2fad19e1/teacher/unassign-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          studentId: student.id
        })
      });

      if (response.ok) {
        toast.success(`${student.name} unassigned from class`);
        if (onAssignSuccess) {
          onAssignSuccess();
        }
        onBack();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to unassign student');
      }
    } catch (error) {
      console.error('Error unassigning student:', error);
      toast.error('Failed to unassign student');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>

        <h1 className="text-2xl font-bold mb-2">Assign Student to Class</h1>
        <p className="text-muted-foreground">
          Manage class assignment for portal-registered student
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Student Info Card */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 ring-2 ring-purple-200">
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white text-lg">
                  {student.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{student.name}</h3>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                    Portal User
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Level</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{student.currentLevel}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">EXP</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{student.totalPoints}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-sm font-medium">Avg Grade</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{student.averageGrade}%</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Current Streak</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{streakData.currentStreak}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Longest Streak</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{streakData.longestStreak}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ListTodo className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Tasks</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{taskData.completedCount}/{taskData.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Assignment Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Class Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.isAssigned && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Currently Assigned To:
                </p>
                <p className="text-lg font-semibold text-blue-700">
                  {student.className}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No classes available. Create a class first.
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAssignToClass}
                disabled={isAssigning || !selectedClassId || classes.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {student.isAssigned ? 'Update Assignment' : 'Assign to Class'}
              </Button>

              {student.isAssigned && (
                <Button
                  onClick={handleUnassign}
                  disabled={isAssigning}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unassign
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}