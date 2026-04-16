import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Search, Trophy, Calendar, Eye, Users, RefreshCw, Flame, CheckCircle2, ListTodo } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { projectId } from '../utils/supabase/info';

export function StudentsList({ students, onSelectStudent, classes, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [studentsWithData, setStudentsWithData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch streak and task data for all students
  useEffect(() => {
    const fetchStudentData = async () => {
      // Use studentsWithData if already populated to avoid flickering, 
      // but only if it matches current students length (simple heuristic)
      if (studentsWithData.length === students.length && students.length > 0) {
        return;
      }

      setIsLoading(true);
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setStudentsWithData(students);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all student tasks in a single batch request if possible, 
        // but since we have a per-student endpoint, we'll keep the logic but optimize
        const studentsWithEnhancedData = await Promise.all(
          students.map(async (student) => {
            try {
              // Parallelize per-student fetches
              const [streakResponse, tasksResponse] = await Promise.all([
                fetch(
                  `/make-server-2fad19e1/teacher/student-streak/${student.email}`,
                  { headers: { 'Authorization': `Bearer ${accessToken}` } }
                ),
                fetch(
                  `/make-server-2fad19e1/teacher/student-tasks/${student.email}`,
                  { headers: { 'Authorization': `Bearer ${accessToken}` } }
                )
              ]);

              let streakData = { currentStreak: 0, longestStreak: 0, dates: [] };
              if (streakResponse.ok) {
                const result = await streakResponse.json();
                streakData = result.streakData || streakData;
              }

              let taskData = { completedCount: 0, totalCount: 0 };
              if (tasksResponse.ok) {
                const result = await tasksResponse.json();
                const tasks = result.tasks || [];
                taskData = {
                  completedCount: tasks.filter(t => t.completed || t.grade != null).length,
                  totalCount: tasks.length
                };
              }

              return { ...student, streakData, taskData };
            } catch (error) {
              return {
                ...student,
                streakData: { currentStreak: 0, longestStreak: 0, dates: [] },
                taskData: { completedCount: 0, totalCount: 0 }
              };
            }
          })
        );

        setStudentsWithData(studentsWithEnhancedData);
      } catch (error) {
        setStudentsWithData(students);
      } finally {
        setIsLoading(false);
      }
    };

    if (students && students.length > 0) {
      fetchStudentData();
    } else {
      setStudentsWithData([]);
    }
  }, [students]);

  const filteredStudents = studentsWithData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.rollNumber && student.rollNumber.toString().includes(searchTerm))
  );

  // Separate portal students from manually added
  const portalStudents = filteredStudents.filter(s => s.isRegistered);
  const manualStudents = filteredStudents.filter(s => !s.isRegistered);

  // Group students by class
  const studentsByClass = filteredStudents.reduce((acc, student) => {
    const className = student.className || 'Not Assigned';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {});

  const classNames = Object.keys(studentsByClass).sort();

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-500' : 'bg-gray-400';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-500';
    if (progress >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderStudentGrid = (studentsToRender) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {studentsToRender.map((student) => (
        <Card key={student.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="ring-2 ring-purple-200">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                      {student.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(student.status)} shadow-sm`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base truncate">{student.name}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  {student.rollNumber && (
                    <p className="text-xs text-muted-foreground">Roll #: {student.rollNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Streak and Task Stats */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-gradient-to-br from-gray-50 to-white rounded-lg border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Streak</span>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {student.streakData?.currentStreak || 0}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">Tasks</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {student.taskData?.completedCount || 0}/{student.taskData?.totalCount || 0}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                  <Trophy className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium">Level {student.currentLevel}</span>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                {student.totalPoints} EXP
              </Badge>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span className={getProgressColor(student.gameProgress)}>
                  {student.gameProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    student.gameProgress >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    student.gameProgress >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                    'bg-gradient-to-r from-red-400 to-pink-500'
                  }`}
                  style={{ width: `${student.gameProgress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Average Grade</span>
              <span className="font-semibold">{student.averageGrade}%</span>
            </div>

            <div className="pt-2 border-t">
              {student.isRegistered ? (
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-xs">
                    Portal Student
                  </Badge>
                  {student.isAssigned ? (
                    <Badge variant="outline" className="text-xs">
                      {student.className}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">
                      Not Assigned
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="text-xs mb-2">
                  {student.className}
                </Badge>
              )}
              {student.registeredAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {new Date(student.registeredAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <Button 
              onClick={() => onSelectStudent(student)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
            >
              <Eye className="w-4 h-4 mr-2" />
              {student.isRegistered && !student.isAssigned ? 'Assign to Class' : 'View Profile'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Students</h2>
            <p className="text-muted-foreground">
              Students registered through the student portal
            </p>
          </div>
          <div className="flex items-center gap-4">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            )}
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {students.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Students</div>
            </div>
          </div>
        </div>
        
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredStudents.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assigned</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredStudents.filter(s => s.isAssigned).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Not Assigned</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredStudents.filter(s => !s.isAssigned).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full mb-6" style={{ gridTemplateColumns: `repeat(${Math.min(classNames.length + 1, 5)}, 1fr)` }}>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            All ({filteredStudents.length})
          </TabsTrigger>
          {classNames.slice(0, 4).map((className) => (
            <TabsTrigger key={className} value={className} className="flex items-center gap-1 text-xs">
              {className.length > 20 ? className.substring(0, 17) + '...' : className} ({studentsByClass[className].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          {filteredStudents.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Students Found</h3>
                <p className="text-muted-foreground mb-4">
                  {students.length === 0 
                    ? "Students who register through the student portal will appear here."
                    : "No students match your search criteria"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            renderStudentGrid(filteredStudents)
          )}
        </TabsContent>

        {classNames.map((className) => (
          <TabsContent key={className} value={className}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{className}</h3>
              <p className="text-sm text-muted-foreground">
                {studentsByClass[className].length} student{studentsByClass[className].length !== 1 ? 's' : ''} in this class
              </p>
            </div>
            {renderStudentGrid(studentsByClass[className])}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}