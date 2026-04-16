import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ArrowLeft, Search, UserPlus, Trophy, Star, Target, Calendar, Flame, CheckCircle2 } from 'lucide-react';

export function RegisteredStudentsList({ students, onBack, onSelectStudent, accessToken, projectId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [studentsWithData, setStudentsWithData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch streak and task data for all students using optimized batch endpoint
  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      
      if (!accessToken || !projectId) {
        console.error('Missing accessToken or projectId');
        setStudentsWithData(students);
        setIsLoading(false);
        return;
      }

      if (students.length === 0) {
        setStudentsWithData([]);
        setIsLoading(false);
        return;
      }

      try {
        // OPTIMIZED: Fetch all student data in one API call
        const studentEmails = students.map(s => s.email);
        
        const response = await fetch(
          `/make-server-2fad19e1/teacher/students-batch-data`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentEmails })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const studentsData = result.studentsData || {};

          const studentsWithEnhancedData = students.map(student => ({
            ...student,
            streakData: studentsData[student.email]?.streakData || { currentStreak: 0, longestStreak: 0, dates: [] },
            taskData: studentsData[student.email]?.taskData || { completedCount: 0, totalCount: 0 }
          }));

          setStudentsWithData(studentsWithEnhancedData);
        } else {
          console.error('Failed to fetch batch student data');
          setStudentsWithData(students);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
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
  }, [students.length, accessToken, projectId]);

  const filteredStudents = studentsWithData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const assignedStudents = filteredStudents.filter(s => s.isAssigned);
  const unassignedStudents = filteredStudents.filter(s => !s.isAssigned);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Portal Students</h1>
            <p className="text-muted-foreground">
              Students who registered through the student portal
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {students.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                  <p className="text-sm text-muted-foreground mb-1">Total Portal Students</p>
                  <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assigned to Classes</p>
                  <p className="text-2xl font-bold text-green-600">{assignedStudents.length}</p>
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
                  <p className="text-2xl font-bold text-orange-600">{unassignedStudents.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Portal Students Yet</h3>
            <p className="text-muted-foreground mb-4">
              Students who register through the student portal will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Unassigned Students Section */}
          {unassignedStudents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                Unassigned Students ({unassignedStudents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unassignedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onSelect={() => onSelectStudent(student)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assigned Students Section */}
          {assignedStudents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Assigned Students ({assignedStudents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onSelect={() => onSelectStudent(student)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StudentCard({ student, onSelect }) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-purple-50 group"
      onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-12 h-12 ring-2 ring-purple-200">
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
              {student.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate group-hover:text-purple-600 transition-colors">
              {student.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{student.email}</p>
          </div>
        </div>

        {/* Streak and Task Stats - Highlighted */}
        <div className="grid grid-cols-2 gap-2 p-2 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg border border-orange-200 mb-3">
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

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span className="text-muted-foreground">Level</span>
            </div>
            <span className="font-semibold">{student.currentLevel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-blue-500" />
              <span className="text-muted-foreground">EXP</span>
            </div>
            <span className="font-semibold">{student.totalPoints}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-green-500" />
              <span className="text-muted-foreground">Avg Grade</span>
            </div>
            <span className="font-semibold">{student.averageGrade}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          {student.isAssigned ? (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs">
              {student.className}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">
              Not Assigned
            </Badge>
          )}
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs">
            Portal
          </Badge>
        </div>

        {student.registeredAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Calendar className="w-3 h-3" />
            <span>Joined {new Date(student.registeredAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}