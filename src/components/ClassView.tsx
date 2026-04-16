import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  User,
  Calendar,
  Target,
  BarChart3,
  GraduationCap,
  Plus,
  FileEdit,
  CheckCircle,
  XCircle,
  Flame,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

// Dental college subjects
const dentalSubjects = [
  "Oral Pathology",
  "Orthodontics",
  "Conservative Dentistry",
  "Prosthodontics",
  "Periodontics",
  "Oral Surgery",
  "Pedodontics",
  "Public Health Dentistry",
  "Oral Medicine",
  "Oral Anatomy",
  "Endodontics",
  "Oral Radiology"
];

// Letter grades with descriptions
const letterGrades = [
  { value: 'A+', label: 'A+', percentage: 97, description: 'Outstanding' },
  { value: 'A', label: 'A', percentage: 93, description: 'Excellent' },
  { value: 'A-', label: 'A-', percentage: 90, description: 'Very Good' },
  { value: 'B+', label: 'B+', percentage: 87, description: 'Good' },
  { value: 'B', label: 'B', percentage: 83, description: 'Above Average' },
  { value: 'B-', label: 'B-', percentage: 80, description: 'Average' },
  { value: 'C+', label: 'C+', percentage: 77, description: 'Below Average' },
  { value: 'C', label: 'C', percentage: 73, description: 'Fair' },
  { value: 'C-', label: 'C-', percentage: 70, description: 'Pass' },
  { value: 'D', label: 'D', percentage: 65, description: 'Minimum Pass' },
  { value: 'F', label: 'F', percentage: 0, description: 'Fail' }
];

export function ClassView({ classData, students, onBack, onAddTask, onAddQuiz, accessToken, projectId }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [studentAttemptedTasks, setStudentAttemptedTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [studentsWithData, setStudentsWithData] = useState([]);
  const [isLoadingStudentData, setIsLoadingStudentData] = useState(false);
  const [newGrade, setNewGrade] = useState({
    subject: '',
    assignment: '',
    taskId: '',
    grade: '',
    date: new Date().toISOString().split('T')[0],
    feedback: ''
  });

  // Sort enrolled students by roll number
  const enrolledStudents = students
    .filter(student => student.classId === classData.id)
    .sort((a, b) => {
      // If both have roll numbers, sort numerically
      if (a.rollNumber && b.rollNumber) {
        return parseInt(a.rollNumber) - parseInt(b.rollNumber);
      }
      // If only one has a roll number, prioritize that one
      if (a.rollNumber) return -1;
      if (b.rollNumber) return 1;
      // Otherwise sort by name
      return a.name.localeCompare(b.name);
    });

  // Fetch streak and task data for all enrolled students
  useEffect(() => {
    const fetchAllStudentData = async () => {
      setIsLoadingStudentData(true);
      
      if (!accessToken || !projectId) {
        console.error('Missing accessToken or projectId');
        setStudentsWithData(enrolledStudents);
        setIsLoadingStudentData(false);
        return;
      }

      if (enrolledStudents.length === 0) {
        setStudentsWithData([]);
        setIsLoadingStudentData(false);
        return;
      }

      try {
        // OPTIMIZED: Fetch all student data in one API call
        const studentEmails = enrolledStudents.map(s => s.email);
        
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

          const studentsWithEnhancedData = enrolledStudents.map(student => ({
            ...student,
            streakData: studentsData[student.email]?.streakData || { currentStreak: 0, longestStreak: 0, dates: [] },
            taskData: studentsData[student.email]?.taskData || { completedCount: 0, totalCount: 0 }
          }));

          setStudentsWithData(studentsWithEnhancedData);
        } else {
          console.error('Failed to fetch batch student data');
          setStudentsWithData(enrolledStudents);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setStudentsWithData(enrolledStudents);
      } finally {
        setIsLoadingStudentData(false);
      }
    };

    if (enrolledStudents && enrolledStudents.length > 0) {
      fetchAllStudentData();
    } else {
      setStudentsWithData([]);
    }
  }, [enrolledStudents.length, accessToken, projectId]);

  // Use studentsWithData instead of enrolledStudents for display
  const displayStudents = studentsWithData.length > 0 ? studentsWithData : enrolledStudents;

  // Load all tasks from localStorage
  useEffect(() => {
    console.log('=== LOADING TASKS FOR CLASS ===');
    console.log('Class ID:', classData.id);
    console.log('Class Name:', classData.name);
    
    // Load tasks from backend via AdminDashboard's tasks state
    // The tasks are already loaded and filtered, so we'll use them directly
    
    console.log('=== END LOADING TASKS ===');
  }, [classData.id]);

  // Function to sync/assign tasks to all enrolled students
  const syncTasksToStudents = (classTasks) => {
    console.log('=== SYNCING TASKS TO STUDENTS ===');
    
    let totalAssignments = 0;
    
    enrolledStudents.forEach(student => {
      const studentTasksKey = `student_tasks:${student.email}`;
      const existingTasksStr = localStorage.getItem(studentTasksKey);
      const existingTasks = existingTasksStr ? JSON.parse(existingTasksStr) : [];
      
      console.log(`Student: ${student.name} (${student.email})`);
      console.log(`  Existing tasks: ${existingTasks.length}`);
      
      // Get IDs of tasks student already has
      const existingTaskIds = existingTasks.map(t => t.id);
      
      // Find tasks that need to be assigned
      const tasksToAssign = classTasks.filter(task => !existingTaskIds.includes(task.id));
      
      if (tasksToAssign.length > 0) {
        console.log(`  Assigning ${tasksToAssign.length} new task(s)`);
        
        // Add new tasks to student's list
        tasksToAssign.forEach(task => {
          existingTasks.push({
            ...task,
            completed: false,
            started: false,
            submittedAt: null
          });
          totalAssignments++;
        });
        
        // Save updated task list
        localStorage.setItem(studentTasksKey, JSON.stringify(existingTasks));
        console.log(`  Saved ${existingTasks.length} total tasks for ${student.email}`);
      } else {
        console.log(`  No new tasks to assign`);
      }
    });
    
    if (totalAssignments > 0) {
      console.log(`✅ Synced ${totalAssignments} task assignment(s) to students`);
      toast.success(`Synced ${totalAssignments} task(s) to students in this class`);
    }
    
    console.log('=== END SYNC ===');
  };

  // Function to get attempted tasks for a student
  const getStudentAttemptedTasks = (student) => {
    if (!student || !student.email) return [];
    
    // Get student tasks from localStorage (this would come from backend)
    const studentTasksKey = `student_tasks:${student.email}`;
    const studentTasksStr = localStorage.getItem(studentTasksKey);
    
    console.log('Looking for tasks for student:', student.email);
    console.log('Student tasks key:', studentTasksKey);
    console.log('Found tasks:', studentTasksStr);
    
    if (!studentTasksStr) {
      console.log('No tasks found in localStorage for this student');
      return [];
    }
    
    try {
      const studentTasks = JSON.parse(studentTasksStr);
      console.log('Parsed student tasks:', studentTasks);
      
      // Show ALL tasks assigned to the student, not just attempted ones
      // Teacher should be able to grade any assigned task (including giving failing grades for non-attempts)
      return studentTasks || [];
    } catch (e) {
      console.error('Error parsing student tasks:', e);
      return [];
    }
  };

  const handleGradeDialogOpen = async (student) => {
    setSelectedStudent(student);
    setIsLoadingTasks(true);
    setIsGradeDialogOpen(true);
    
    console.log('=== FETCHING TASKS FROM BACKEND ===');
    console.log('Student:', student.name);
    console.log('Student email:', student.email);
    console.log('AccessToken exists:', !!accessToken);
    console.log('ProjectId:', projectId);
    
    if (!accessToken) {
      console.error('ERROR: No accessToken provided to ClassView!');
      toast.error('Authentication error - please refresh the page');
      setIsLoadingTasks(false);
      return;
    }

    if (!projectId) {
      console.error('ERROR: No projectId provided to ClassView!');
      toast.error('Configuration error - please refresh the page');
      setIsLoadingTasks(false);
      return;
    }
    
    try {
      // Fetch student tasks from backend
      const url = `/make-server-2fad19e1/teacher/student-tasks/${encodeURIComponent(student.email)}`;
      console.log('Fetching from URL:', url);
      console.log('Authorization header:', `Bearer ${accessToken.substring(0, 20)}...`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Tasks fetched from backend:', data.tasks.length);
        setStudentAttemptedTasks(data.tasks || []);
        
        if (data.tasks.length === 0) {
          toast.info(`No tasks assigned to ${student.name} yet`);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch tasks:', errorData);
        console.error('Response status:', response.status);
        toast.error(`Failed to load student tasks: ${errorData.error || 'Unknown error'}`);
        setStudentAttemptedTasks([]);
      }
    } catch (error) {
      console.error('Error fetching student tasks:', error);
      toast.error('Failed to load student tasks');
      setStudentAttemptedTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
    
    console.log('=== END FETCH ===');
  };

  const handleTaskSelect = (taskId) => {
    const selectedTask = studentAttemptedTasks.find(t => t.id === taskId);
    if (selectedTask) {
      setNewGrade({
        ...newGrade,
        taskId: taskId,
        assignment: selectedTask.title,
        subject: selectedTask.subject || ''
      });
    }
  };

  const handleAddGrade = () => {
    if (!newGrade.taskId || !newGrade.grade) {
      toast.error('Please select a task/quiz and assign a grade');
      return;
    }

    // Get existing grades
    const savedGrades = localStorage.getItem('dental_college_grades');
    const grades = savedGrades ? JSON.parse(savedGrades) : [];

    // Create new grade entry
    const grade = {
      id: Date.now(),
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentEmail: selectedStudent.email,
      classId: classData.id,
      className: classData.name,
      subject: newGrade.subject,
      assignment: newGrade.assignment,
      taskId: newGrade.taskId,
      score: parseFloat(newGrade.grade),
      maxScore: 100,
      date: newGrade.date,
      feedback: newGrade.feedback
    };

    // Save grade
    grades.push(grade);
    localStorage.setItem('dental_college_grades', JSON.stringify(grades));

    // Reset form
    setNewGrade({
      subject: '',
      assignment: '',
      taskId: '',
      grade: '',
      date: new Date().toISOString().split('T')[0],
      feedback: ''
    });
    setIsGradeDialogOpen(false);
    toast.success(`Grade added for ${selectedStudent.name}!`);
  };

  const averageProgress = displayStudents.length > 0
    ? Math.round(displayStudents.reduce((acc, s) => acc + s.gameProgress, 0) / displayStudents.length)
    : 0;
  
  const averageGrade = displayStudents.length > 0
    ? Math.round(displayStudents.reduce((acc, s) => acc + s.averageGrade, 0) / displayStudents.length)
    : 0;

  const activeStudents = displayStudents.filter(s => s.status === 'active').length;
  
  const getGradeColor = (grade) => {
    const gradeNumber = parseInt(grade);
    if (gradeNumber <= 5) return 'bg-gradient-to-r from-green-400 to-emerald-500';
    if (gradeNumber <= 8) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (gradeNumber <= 10) return 'bg-gradient-to-r from-purple-400 to-purple-500';
    return 'bg-gradient-to-r from-orange-400 to-red-500';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeColorByScore = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleGradeDialogClose = () => {
    setSelectedStudent(null);
    setIsGradeDialogOpen(false);
    setNewGrade({
      subject: '',
      assignment: '',
      taskId: '',
      grade: '',
      date: new Date().toISOString().split('T')[0],
      feedback: ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={onAddQuiz}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Quiz
          </Button>
          <Button
            size="sm"
            onClick={onAddTask}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Class Header */}
      <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-medium">{classData.name}</h1>
                <p className="text-white/90 text-sm mt-1">{classData.subject}</p>
              </div>
            </div>
            <Badge className={`${getGradeColor(classData.grade)} text-white border-0`}>
              {classData.grade}
            </Badge>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" />
                <p className="text-sm text-white/90">Enrolled</p>
              </div>
              <p className="text-2xl font-semibold">{enrolledStudents.length}/{classData.capacity}</p>
            </div>
            <div className="text-center bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" />
                <p className="text-sm text-white/90">Active</p>
              </div>
              <p className="text-2xl font-semibold">{activeStudents}</p>
            </div>
          </div>
        </div>
        
        {classData.description && (
          <p className="mt-4 text-white/90">
            {classData.description}
          </p>
        )}
      </div>

      {/* Statistics Cards - REMOVED Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Average Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold mb-2 text-blue-600">{averageProgress}%</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-green-500" />
              Average Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold mb-2 text-green-600">{averageGrade}%</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold mb-2 text-purple-600">
              {Math.round((enrolledStudents.length / classData.capacity) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="all">
            All Students ({enrolledStudents.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeStudents})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({enrolledStudents.length - activeStudents})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {enrolledStudents.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Students Enrolled</h3>
                <p className="text-muted-foreground">
                  This class doesn't have any students yet. Add students to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            displayStudents.map((student) => (
              <Card 
                key={student.id} 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Student Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1">{student.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {student.lastActive}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Student Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <GraduationCap className="w-4 h-4 text-purple-500" />
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                        <p className="text-xl font-semibold text-purple-600">{student.currentLevel}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <p className="text-xl font-semibold text-yellow-600">{student.totalPoints}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-4 h-4 text-blue-500" />
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-xl font-semibold text-blue-600">{student.gameProgress}%</p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <p className="text-xs text-muted-foreground">Grade</p>
                        </div>
                        <Badge className={`${getGradeColorByScore(student.averageGrade)} text-lg px-2 py-1 border-0`}>
                          {student.averageGrade}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Game Progress</span>
                      <span className="text-xs font-medium">{student.gameProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(student.gameProgress)} transition-all duration-500`}
                        style={{ width: `${student.gameProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Streak and Task Completion */}
                  <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg border border-orange-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Current Streak</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {student.streakData?.currentStreak || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Tasks Completed</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {student.taskData?.completedCount || 0}<span className="text-lg text-muted-foreground">/{student.taskData?.totalCount || 0}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.taskData?.totalCount > 0 
                          ? `${Math.round((student.taskData.completedCount / student.taskData.totalCount) * 100)}% complete`
                          : 'No tasks assigned'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Add Grade Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleGradeDialogOpen(student)}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-md"
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Add/Upload Grade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {enrolledStudents.filter(s => s.status === 'active').length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Active Students</h3>
                <p className="text-muted-foreground">
                  There are no active students in this class.
                </p>
              </CardContent>
            </Card>
          ) : (
            enrolledStudents.filter(s => s.status === 'active').map((student) => (
              <Card 
                key={student.id} 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1">{student.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default">🟢 Active</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {student.lastActive}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <GraduationCap className="w-4 h-4 text-purple-500" />
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                        <p className="text-xl font-semibold text-purple-600">{student.currentLevel}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <p className="text-xl font-semibold text-yellow-600">{student.totalPoints}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-4 h-4 text-blue-500" />
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                        <p className="text-xl font-semibold text-blue-600">{student.gameProgress}%</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <p className="text-xs text-muted-foreground">Grade</p>
                        </div>
                        <Badge className={`${getGradeColorByScore(student.averageGrade)} text-lg px-2 py-1 border-0`}>
                          {student.averageGrade}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Game Progress</span>
                      <span className="text-xs font-medium">{student.gameProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(student.gameProgress)} transition-all duration-500`}
                        style={{ width: `${student.gameProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Add Grade Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleGradeDialogOpen(student)}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-md"
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Add/Upload Grade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {enrolledStudents.filter(s => s.status === 'inactive').length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Inactive Students</h3>
                <p className="text-muted-foreground">
                  All students in this class are currently active!
                </p>
              </CardContent>
            </Card>
          ) : (
            enrolledStudents.filter(s => s.status === 'inactive').map((student) => (
              <Card 
                key={student.id} 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1">{student.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">🔴 Inactive</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {student.lastActive}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <GraduationCap className="w-4 h-4 text-purple-500" />
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                        <p className="text-xl font-semibold text-purple-600">{student.currentLevel}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <p className="text-xl font-semibold text-yellow-600">{student.totalPoints}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-4 h-4 text-blue-500" />
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                        <p className="text-xl font-semibold text-blue-600">{student.gameProgress}%</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <p className="text-xs text-muted-foreground">Grade</p>
                        </div>
                        <Badge className={`${getGradeColorByScore(student.averageGrade)} text-lg px-2 py-1 border-0`}>
                          {student.averageGrade}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Game Progress</span>
                      <span className="text-xs font-medium">{student.gameProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(student.gameProgress)} transition-all duration-500`}
                        style={{ width: `${student.gameProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Add Grade Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleGradeDialogOpen(student)}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-md"
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Add/Upload Grade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Grade Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={handleGradeDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Add Grade for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Add a grade for the selected task/quiz.
            </DialogDescription>
          </DialogHeader>
          
          {studentAttemptedTasks.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-2">
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">No Tasks Assigned Yet</h3>
                <p className="text-muted-foreground text-sm">
                  {selectedStudent?.name} hasn't been assigned any tasks or quizzes yet.
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Create tasks or quizzes for this class to start grading.
                </p>
              </div>
              <Button
                onClick={handleGradeDialogClose}
                variant="outline"
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span><strong>{studentAttemptedTasks.length}</strong> task(s)/quiz(zes) assigned to student</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You can grade any task, including those not attempted (e.g., assign F for incomplete work)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task">Select Task/Quiz *</Label>
                <Select
                  value={newGrade.taskId}
                  onValueChange={handleTaskSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task or quiz to grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentAttemptedTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        <div className="flex items-center gap-2">
                          {task.type === 'quiz' ? '📝' : '📋'} {task.title}
                          {task.completed && <Badge className="ml-2 bg-green-100 text-green-700 border-0">Completed</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newGrade.assignment && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: <strong>{newGrade.assignment}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={newGrade.subject}
                  onValueChange={(value) => setNewGrade({ ...newGrade, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentalSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Letter Grade *</Label>
                <Select
                  value={newGrade.grade}
                  onValueChange={(value) => setNewGrade({ ...newGrade, grade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {letterGrades.map(grade => (
                      <SelectItem key={grade.value} value={grade.percentage.toString()}>
                        <div className="flex items-center gap-3 py-1">
                          <span className="font-bold text-base w-8">{grade.label}</span>
                          <span className="text-muted-foreground text-sm">- {grade.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newGrade.date}
                  onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  value={newGrade.feedback}
                  onChange={(e) => setNewGrade({ ...newGrade, feedback: e.target.value })}
                  placeholder="Add feedback for the student..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={handleGradeDialogClose}
                  variant="outline"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAddGrade}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-md"
                  disabled={!newGrade.taskId || !newGrade.grade || !newGrade.subject}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add Grade
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}