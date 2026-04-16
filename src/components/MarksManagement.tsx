import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  Plus, 
  Edit, 
  Save, 
  Search,
  Filter,
  FileSpreadsheet,
  GraduationCap,
  BookOpen,
  UserPlus
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
  { value: 'A+', label: 'A+', percentage: 97, description: 'Outstanding', color: 'bg-gradient-to-r from-green-500 to-emerald-600' },
  { value: 'A', label: 'A', percentage: 93, description: 'Excellent', color: 'bg-gradient-to-r from-green-500 to-emerald-600' },
  { value: 'A-', label: 'A-', percentage: 90, description: 'Very Good', color: 'bg-gradient-to-r from-green-500 to-emerald-600' },
  { value: 'B+', label: 'B+', percentage: 87, description: 'Good', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { value: 'B', label: 'B', percentage: 83, description: 'Above Average', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { value: 'B-', label: 'B-', percentage: 80, description: 'Average', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { value: 'C+', label: 'C+', percentage: 77, description: 'Below Average', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
  { value: 'C', label: 'C', percentage: 73, description: 'Fair', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
  { value: 'C-', label: 'C-', percentage: 70, description: 'Pass', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
  { value: 'D', label: 'D', percentage: 65, description: 'Minimum Pass', color: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { value: 'F', label: 'F', percentage: 0, description: 'Fail', color: 'bg-gradient-to-r from-red-500 to-red-600' }
];

export function MarksManagement({ students, classes, accessToken, projectId }) {
  const [grades, setGrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [editingGrade, setEditingGrade] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    classId: '',
    subject: '',
    assignment: '',
    grade: '',
    date: new Date().toISOString().split('T')[0],
    feedback: ''
  });

  // Load grades from localStorage on mount
  useEffect(() => {
    const savedGrades = localStorage.getItem('dental_college_grades');
    if (savedGrades) {
      setGrades(JSON.parse(savedGrades));
    }
  }, []);

  // Save grades to localStorage and backend whenever they change
  useEffect(() => {
    if (grades.length >= 0) {
      localStorage.setItem('dental_college_grades', JSON.stringify(grades));
      
      // Also sync to backend
      syncGradesToBackend();
    }
  }, [grades]);

  const syncGradesToBackend = async () => {
    if (!accessToken || !projectId) return;
    
    try {
      const response = await fetch(
        `/make-server-2fad19e1/teacher/grades`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ grades })
        }
      );
      
      if (!response.ok) {
        console.error('Failed to sync grades to backend');
      }
    } catch (error) {
      console.error('Error syncing grades:', error);
    }
  };

  const filteredGrades = grades.filter(grade => {
    const student = students.find(s => s.id === grade.studentId);
    if (!student) return false;

    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.assignment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || grade.subject === selectedSubject;
    const matchesClass = selectedClass === 'all' || grade.classId === selectedClass;
    return matchesSearch && matchesSubject && matchesClass;
  });

  const handleUpdateGrade = (gradeId, updatedData) => {
    setGrades(grades.map(grade => 
      grade.id === gradeId ? { ...grade, ...updatedData } : grade
    ));
    setEditingGrade(null);
    setIsEditDialogOpen(false);
    toast.success('Grade updated successfully!');
  };

  const handleAddGrade = () => {
    if (!newGrade.studentId || !newGrade.subject || !newGrade.assignment || !newGrade.grade) {
      toast.error('Please fill in all required fields');
      return;
    }

    const student = students.find(s => s.id === parseInt(newGrade.studentId));
    if (!student) {
      toast.error('Student not found');
      return;
    }

    // Determine if grade is a letter grade or numeric
    const gradeValue = letterGrades.find(lg => lg.value === newGrade.grade);
    
    const grade = {
      id: Date.now(),
      studentId: parseInt(newGrade.studentId),
      studentName: student.name,
      studentEmail: student.email, // Store student email for backend matching
      classId: newGrade.classId || student.classId,
      subject: newGrade.subject,
      assignment: newGrade.assignment,
      grade: gradeValue ? newGrade.grade : null, // Store letter grade if applicable
      score: gradeValue ? gradeValue.percentage : parseFloat(newGrade.grade),
      maxScore: 100,
      date: newGrade.date,
      feedback: newGrade.feedback
    };

    setGrades([grade, ...grades]);
    setNewGrade({
      studentId: '',
      classId: '',
      subject: '',
      assignment: '',
      grade: '',
      date: new Date().toISOString().split('T')[0],
      feedback: ''
    });
    setIsAddDialogOpen(false);
    toast.success('New grade added successfully!');
  };

  const getGradeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBadge = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm">A</Badge>;
    if (percentage >= 80) return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">B</Badge>;
    if (percentage >= 70) return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-sm">C</Badge>;
    if (percentage >= 60) return <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-sm">D</Badge>;
    return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm">F</Badge>;
  };

  const getStudentById = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const getClassById = (classId) => {
    return classes.find(c => c.id === classId);
  };

  const calculateStudentAverage = (studentId) => {
    const studentGrades = grades.filter(g => g.studentId === studentId);
    if (studentGrades.length === 0) return 0;
    
    const totalPercentage = studentGrades.reduce((acc, grade) => {
      return acc + (grade.score / grade.maxScore) * 100;
    }, 0);
    
    return (totalPercentage / studentGrades.length).toFixed(1);
  };

  // Empty state when no students exist
  if (students.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6 p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-medium">Marks Management</h1>
              <p className="text-white/90 text-sm mt-1">Track and manage student grades and performance</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-4">
                <UserPlus className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-medium">No Students Added Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You need to add students first before you can manage their marks. 
                Start by adding students from the sidebar menu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6 p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-medium">Marks Management</h1>
              <p className="text-white/90 text-sm mt-1">Track and manage student grades and performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Grade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Grade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="classFilter">Class Filter (Optional)</Label>
                    <Select 
                      value={newGrade.classId} 
                      onValueChange={(value) => {
                        setNewGrade({
                          ...newGrade, 
                          classId: value,
                          studentId: '' // Reset student when class changes
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="studentId">Student *</Label>
                    <Select 
                      value={newGrade.studentId} 
                      onValueChange={(value) => {
                        const student = students.find(s => s.id === parseInt(value));
                        setNewGrade({
                          ...newGrade, 
                          studentId: value,
                          classId: student?.classId || newGrade.classId
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Group students by class */}
                        {newGrade.classId && newGrade.classId !== 'all' ? (
                          // Show only students from selected class
                          students
                            .filter(s => s.classId === newGrade.classId)
                            .map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.name} - {student.className}
                              </SelectItem>
                            ))
                        ) : (
                          // Show all students grouped by class
                          classes.map((cls) => {
                            const classStudents = students.filter(s => s.classId === cls.id);
                            if (classStudents.length === 0) return null;
                            return (
                              <React.Fragment key={cls.id}>
                                <SelectItem value={`header-${cls.id}`} disabled className="font-semibold text-blue-600">
                                  {cls.name} ({classStudents.length} students)
                                </SelectItem>
                                {classStudents.map((student) => (
                                  <SelectItem key={student.id} value={student.id.toString()} className="pl-6">
                                    {student.name}
                                  </SelectItem>
                                ))}
                              </React.Fragment>
                            );
                          })
                        )}
                        {/* Show unassigned students */}
                        {students.filter(s => !s.classId).length > 0 && (
                          <React.Fragment>
                            <SelectItem value="header-unassigned" disabled className="font-semibold text-gray-600">
                              Unassigned ({students.filter(s => !s.classId).length} students)
                            </SelectItem>
                            {students
                              .filter(s => !s.classId)
                              .map((student) => (
                                <SelectItem key={student.id} value={student.id.toString()} className="pl-6">
                                  {student.name}
                                </SelectItem>
                              ))}
                          </React.Fragment>
                        )}
                      </SelectContent>
                    </Select>
                    {newGrade.classId && newGrade.classId !== 'all' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Showing students from {classes.find(c => c.id === newGrade.classId)?.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select value={newGrade.subject} onValueChange={(value) => setNewGrade({...newGrade, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {dentalSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignment">Assignment/Exam Name *</Label>
                    <Input
                      id="assignment"
                      value={newGrade.assignment}
                      onChange={(e) => setNewGrade({...newGrade, assignment: e.target.value})}
                      placeholder="e.g., Midterm Exam, Practical Lab 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade">Grade *</Label>
                    <Select value={newGrade.grade} onValueChange={(value) => setNewGrade({...newGrade, grade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {letterGrades.map((grade) => (
                          <SelectItem key={grade.value} value={grade.percentage.toString()}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{grade.label}</span>
                              <span className="text-muted-foreground text-sm">- {grade.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newGrade.date}
                      onChange={(e) => setNewGrade({...newGrade, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={newGrade.feedback}
                      onChange={(e) => setNewGrade({...newGrade, feedback: e.target.value})}
                      placeholder="Optional feedback for student"
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAddGrade} 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0"
                  >
                    Add Grade
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-md"
              onClick={() => {
                if (grades.length === 0) {
                  toast.error('No grades to export');
                  return;
                }
                toast.success('Export feature coming soon!');
              }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Grades</p>
                <p className="text-2xl font-bold">{grades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Save className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Grade</p>
                <p className="text-2xl font-bold">
                  {grades.length > 0 
                    ? (grades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0) / grades.length).toFixed(0) + '%'
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students, assignments, or subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {dentalSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGrades.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Grades Yet</h3>
              <p className="text-muted-foreground mb-4">
                {grades.length === 0 
                  ? 'Start by adding grades for your students using the "Add Grade" button above.'
                  : 'No grades found matching your search criteria.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => {
                  const student = getStudentById(grade.studentId);
                  const classData = getClassById(grade.classId);
                  return (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {student ? student.name : 'Unknown Student'}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200">
                          {classData ? classData.name : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200">
                          {grade.subject}
                        </Badge>
                      </TableCell>
                      <TableCell>{grade.assignment}</TableCell>
                      <TableCell>
                        <span className={getGradeColor(grade.score, grade.maxScore)}>
                          {grade.score}/{grade.maxScore} ({((grade.score / grade.maxScore) * 100).toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell>
                        {getGradeBadge(grade.score, grade.maxScore)}
                      </TableCell>
                      <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog open={isEditDialogOpen && editingGrade?.id === grade.id} onOpenChange={(open) => {
                          setIsEditDialogOpen(open);
                          if (!open) setEditingGrade(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingGrade(grade);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Grade</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Student: {student?.name}</Label>
                              </div>
                              <div>
                                <Label>Assignment: {grade.assignment}</Label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="editScore">Score</Label>
                                  <Input
                                    id="editScore"
                                    type="number"
                                    defaultValue={grade.score}
                                    onChange={(e) => setEditingGrade({...editingGrade, score: parseFloat(e.target.value)})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editMaxScore">Max Score</Label>
                                  <Input
                                    id="editMaxScore"
                                    type="number"
                                    defaultValue={grade.maxScore}
                                    onChange={(e) => setEditingGrade({...editingGrade, maxScore: parseFloat(e.target.value)})}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="editFeedback">Feedback</Label>
                                <Textarea
                                  id="editFeedback"
                                  defaultValue={grade.feedback}
                                  onChange={(e) => setEditingGrade({...editingGrade, feedback: e.target.value})}
                                  rows={3}
                                />
                              </div>
                              <Button 
                                onClick={() => handleUpdateGrade(grade.id, editingGrade || {})}
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Update Grade
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}