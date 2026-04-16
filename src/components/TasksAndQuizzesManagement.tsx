import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ListTodo,
  Clock,
  CheckCircle2,
  Users,
  Calendar,
  Edit2,
  Trash2,
  BookOpen,
  Target,
  AlertCircle,
  TrendingUp,
  FileText,
  Brain,
  X,
  Award,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

// Letter grades with colors
const letterGrades = [
  {
    value: "A+",
    label: "A+",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    value: "A",
    label: "A",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  {
    value: "A-",
    label: "A-",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    value: "B+",
    label: "B+",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    value: "B",
    label: "B",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "B-",
    label: "B-",
    color: "bg-blue-100 text-blue-600 border-blue-200",
  },
  {
    value: "C+",
    label: "C+",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    value: "C",
    label: "C",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    value: "C-",
    label: "C-",
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
  },
  {
    value: "D",
    label: "D",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  { value: "F", label: "F", color: "bg-red-100 text-red-800 border-red-300" },
];

export function TasksAndQuizzesManagement({
  tasks,
  classes,
  students,
  onEditTask,
  onDeleteTask,
  projectId,
  accessToken,
}) {
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTaskForStudents, setSelectedTaskForStudents] = useState(null);
  const [studentListType, setStudentListType] = useState(null); // 'assigned', 'attempted', 'completed'
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [studentGrades, setStudentGrades] = useState({}); // Store grades: { studentEmail: grade }

  // Validate required props
  useEffect(() => {
    if (!projectId) {
      console.error("ERROR: projectId is missing in TasksAndQuizzesManagement");
      toast.error("Configuration error: Project ID is missing");
    }
    if (!accessToken) {
      console.error(
        "ERROR: accessToken is missing in TasksAndQuizzesManagement",
      );
      toast.error("Configuration error: Access token is missing");
    }
  }, [projectId, accessToken]);

  useEffect(() => {
    calculateTaskStats();
  }, [tasks, students]);

  const calculateTaskStats = async () => {
    setLoading(true);

    try {
      // Fetch all task statistics in one API call
      const response = await fetch(
        `/make-server-2fad19e1/teacher/task-stats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Task statistics loaded:", data.taskStats);
        setTaskStats(data.taskStats || {});
      } else {
        console.error("Failed to load task statistics");
        toast.error("Failed to load task statistics");
      }
    } catch (error) {
      console.error("Error fetching task statistics:", error);
      toast.error("Error loading statistics");
    }

    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (completionRate) => {
    if (completionRate >= 80) return "text-green-600 bg-green-50";
    if (completionRate >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const allTasks = [...(tasks || [])].sort((a, b) => {
    // Sort by createdAt or id timestamp newest first
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (typeof a.id === 'string' ? parseInt(a.id.split('-')[1]) || 0 : 0);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (typeof b.id === 'string' ? parseInt(b.id.split('-')[1]) || 0 : 0);
    return timeB - timeA;
  });
  const regularTasks = allTasks.filter((t) => t.type !== "quiz");
  const quizzes = allTasks.filter((t) => t.type === "quiz");

  const renderTaskCard = (task) => {
    const stats = taskStats[task.id] || {
      totalStudents: 0,
      completed: 0,
      attempted: 0,
      completionRate: 0,
      attemptRate: 0,
    };
    const overdue = isOverdue(task.dueDate);
    const isQuiz = task.type === "quiz";

    return (
      <Card
        key={task.id}
        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isQuiz ? (
                  <Brain className="w-5 h-5 text-indigo-600" />
                ) : (
                  <FileText className="w-5 h-5 text-green-600" />
                )}
                <CardTitle className="text-lg">{task.title}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge
                  className={
                    isQuiz
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0"
                  }
                >
                  {isQuiz ? "Quiz" : "Task"}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority || "Medium"} Priority
                </Badge>
                {overdue && (
                  <Badge className="bg-red-500 text-white border-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Overdue
                  </Badge>
                )}
                {task.status === "active" ? (
                  <Badge className="bg-blue-500 text-white border-0">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditTask(task)}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteTask(task.id)}
                className="hover:bg-red-50 hover:border-red-300 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{task.description}</p>

          {/* Task Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Class</p>
                <p className="text-sm font-medium">{task.className}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm font-medium">
                  {formatDate(task.dueDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="text-sm font-medium">
                  {task.totalPoints || task.maxPoints}
                </p>
              </div>
            </div>

            {isQuiz && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{task.duration} min</p>
                </div>
              </div>
            )}

            {!isQuiz && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="text-sm font-medium">{task.subject}</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics - REMOVED Progress Bar and Completion Text */}
          <div className="space-y-3">
            {isQuiz && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions</span>
                  <span className="font-medium">
                    {task.questions?.length || 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Stats */}
          <div className="pt-3 border-t">
            <Button
              onClick={() => fetchStudentsList(task.id, "attempted")}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors py-6"
            >
              <Users className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm font-semibold">Manage Students</p>
                <p className="text-xs text-blue-500">
                  {stats.totalStudents} Students Assigned
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const fetchStudentsList = async (taskId, listType) => {
    setLoadingStudents(true);
    setSelectedTaskForStudents(taskId);
    setStudentListType("attempted");

    try {
      const response = await fetch(
        `/make-server-2fad19e1/teacher/task-students`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            listType: "assigned",
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStudentsList(data.students || []);

        // Fetch existing grades for these students
        const gradesResponse = await fetch(
          `/make-server-2fad19e1/teacher/task-grades/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (gradesResponse.ok) {
          const gradesData = await gradesResponse.json();
          setStudentGrades(gradesData.grades || {});
        }
      } else {
        console.error("Failed to fetch students list");
        toast.error("Failed to fetch students list");
      }
    } catch (error) {
      console.error("Error fetching students list:", error);
      toast.error("Error fetching students list");
    }

    setLoadingStudents(false);
    setIsStudentDialogOpen(true);
  };

  const handleGradeChange = async (studentEmail, grade) => {
    // 1. Get previous state for rollback
    const previousGrade = studentGrades[studentEmail];
    // Check if this is a NEW grade (was previously empty/null)
    const isNewGrade = !previousGrade || previousGrade === "none";

    console.log(`Grading ${studentEmail}:`, { previousGrade, isNewGrade });

    try {
      // 2. OPTIMISTIC UPDATE: Update the Grade UI immediately
      setStudentGrades((prev) => ({
        ...prev,
        [studentEmail]: grade,
      }));

      // 3. OPTIMISTIC UPDATE: Increase Progress Bar immediately
      // We do this manually so we don't have to wait for the slow server
      if (isNewGrade) {
        setTaskStats((prevStats) => {
          const currentStats = prevStats[selectedTaskForStudents] || {
            totalStudents: 0,
            completed: 0,
          };

          const newCompletedCount = (currentStats.completed || 0) + 1;
          const total = currentStats.totalStudents || 1;
          const newCompletionRate = Math.round(
            (newCompletedCount / total) * 100,
          );

          return {
            ...prevStats,
            [selectedTaskForStudents]: {
              ...currentStats,
              completed: newCompletedCount,
              completionRate: newCompletionRate,
            },
          };
        });
      }

      // 4. API Call to save to database
      const response = await fetch(
        `/make-server-2fad19e1/teacher/task-grade`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId: selectedTaskForStudents,
            studentEmail,
            grade,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success(`Grade ${grade} saved!`);

      // ❌ REMOVED: calculateTaskStats();
      // We removed this line because fetching too fast causes the "Snap Back" issue.
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Failed to save grade");

      // 5. ROLLBACK: If API fails, undo the changes
      setStudentGrades((prev) => ({
        ...prev,
        [studentEmail]: previousGrade,
      }));

      if (isNewGrade) {
        setTaskStats((prevStats) => {
          const currentStats = prevStats[selectedTaskForStudents];
          const oldCompleted = Math.max(0, (currentStats.completed || 0) - 1);
          const total = currentStats.totalStudents || 1;
          const oldRate = Math.round((oldCompleted / total) * 100);

          return {
            ...prevStats,
            [selectedTaskForStudents]: {
              ...currentStats,
              completed: oldCompleted,
              completionRate: oldRate,
            },
          };
        });
      }
    }
  };

  const getGradeColor = (grade) => {
    const gradeObj = letterGrades.find((g) => g.value === grade);
    return gradeObj
      ? gradeObj.color
      : "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Tasks & Quizzes Management
        </h1>
        <p className="text-muted-foreground">
          View and manage all your assigned tasks and quizzes
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Tasks
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {regularTasks.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Quizzes
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {quizzes.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {allTasks.filter((t) => t.status === "active").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overdue</p>
                <p className="text-3xl font-bold text-orange-600">
                  {
                    allTasks.filter(
                      (t) => isOverdue(t.dueDate) && t.status === "active",
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tasks and Quizzes */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
          <TabsTrigger value="all">All ({allTasks.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({regularTasks.length})</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes ({quizzes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {allTasks.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ListTodo className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  No Tasks or Quizzes Yet
                </h3>
                <p className="text-muted-foreground">
                  You haven't created any tasks or quizzes. Start by creating
                  one!
                </p>
              </CardContent>
            </Card>
          ) : (
            allTasks.map((task) => renderTaskCard(task))
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {regularTasks.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Tasks Created</h3>
                <p className="text-muted-foreground">
                  Create your first task from a class view.
                </p>
              </CardContent>
            </Card>
          ) : (
            regularTasks.map((task) => renderTaskCard(task))
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          {quizzes.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Quizzes Created</h3>
                <p className="text-muted-foreground">
                  Create your first quiz from a class view.
                </p>
              </CardContent>
            </Card>
          ) : (
            quizzes.map((task) => renderTaskCard(task))
          )}
        </TabsContent>
      </Tabs>

      {/* Student Management Dialog */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Student Submissions
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-1">
                  Manage and grade student submissions for this task
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsStudentDialogOpen(false)}
                className="text-white hover:bg-white/20 border-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground animate-pulse">
                  Loading student data...
                </p>
              </div>
            ) : studentsList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No Students Found
                </h3>
                <p className="text-muted-foreground">
                  No students are currently associated with this task.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentsList.map((student) => {
                  const currentGrade =
                    studentGrades[student.email] || student.grade;
                  const isCompleted = !!currentGrade;

                  return (
                    <div
                      key={student.email}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 shadow-sm ${
                        isCompleted
                          ? "bg-green-50 border-green-100 hover:shadow-md"
                          : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-full ${isCompleted ? "bg-green-100" : "bg-blue-100"}`}
                        >
                          <Users
                            className={`w-5 h-5 ${isCompleted ? "text-green-600" : "text-blue-600"}`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {student.name || "Unknown Student"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge
                          variant="secondary"
                          className={`px-3 py-1 ${
                            isCompleted
                              ? "bg-green-200 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {isCompleted ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </Badge>

                        <div className="w-32">
                          <Select
                            value={currentGrade || "none"}
                            onValueChange={(val) =>
                              handleGradeChange(student.email, val)
                            }
                          >
                            <SelectTrigger
                              className={`h-9 border-2 transition-colors ${
                                isCompleted
                                  ? "border-green-300 bg-white text-green-800"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <SelectValue placeholder="Grade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>
                                Select Grade
                              </SelectItem>
                              {letterGrades.map((g) => (
                                <SelectItem key={g.value} value={g.value}>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full ${g.color.split(" ")[0]}`}
                                    />
                                    {g.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsStudentDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
