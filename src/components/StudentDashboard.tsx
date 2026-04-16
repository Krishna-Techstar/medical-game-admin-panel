import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { TakeQuiz } from "./TakeQuiz";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { StudentProfile } from "./StudentProfile";
import {
  Trophy,
  Star,
  TrendingUp,
  BookOpen,
  Target,
  Award,
  Bell,
  LogOut,
  Zap,
  BarChart3,
  ListTodo,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flame,
  Home,
  GraduationCap,
  FileText,
  Settings,
  User,
  Menu,
  X,
  Sparkles,
  MessageSquare,
  Info,
  Upload,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

export function StudentDashboard({
  student,
  onLogout,
  accessToken,
  projectId,
}) {
  const [grades, setGrades] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assignedClass, setAssignedClass] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [dailyQuest, setDailyQuest] = useState(null);
  const [showDailyQuestDialog, setShowDailyQuestDialog] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileData, setProfileData] = useState({
    name: student?.name || "",
    email: student?.email || "",
    username: student?.username || "",
    rollNumber: student?.rollNumber || "",
    batch: student?.batch || "",
    class: "",
    phone: "",
    department: "",
    semester: "",
  });
  const [stats, setStats] = useState({
    totalEXP: 0,
    level: 1,
    currentLevelEXP: 0,
    nextLevelEXP: 100,
    streak: 0,
    totalAssignments: 0,
    completedAssignments: 0,
  });

  useEffect(() => {
    loadStudentData();
    checkDailyQuest();
    loadNotifications();
  }, []);

  const loadStudentData = async () => {
    try {
      const response = await fetch(`/make-server-2fad19e1/student/data`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Student data loaded:", data);
        setGrades(data.grades || []);
        setTasks(data.tasks || []);
        setAssignedClass(data.assignedClass || null);
        setAdminMessage(data.adminMessage || null);
        calculateStats(
          data.grades || [],
          data.tasks || [],
          data.streakData || { currentStreak: 0, longestStreak: 0 },
        );
      }
    } catch (error) {
      console.error("Error loading student data:", error);
      toast.error("Failed to load data");
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(
        `/make-server-2fad19e1/student/notifications`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Notifications loaded:", data.notifications);
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const checkDailyQuest = async () => {
    try {
      const response = await fetch(`/make-server-2fad19e1/quest`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Daily quest data:", data);
        if (data.quest) {
          setDailyQuest(data.quest);
        }
      }
    } catch (error) {
      console.error("Error checking daily quest:", error);
    }
  };

  const calculateStats = (gradesData, tasksData, streakData) => {
    // Calculate total EXP from grades
    const totalEXP = gradesData.reduce((sum, grade) => {
      if (grade.score != null && grade.maxScore != null && grade.maxScore > 0) {
        const percentage = (grade.score / grade.maxScore) * 100;
        const baseExp = Math.floor(percentage);
        let bonus = 0;
        if (percentage >= 95) bonus = 15;
        else if (percentage >= 90) bonus = 10;
        else if (percentage >= 80) bonus = 5;
        return sum + baseExp + bonus;
      }
      if (grade.grade) {
        const gradeMap = {
          "A+": 100,
          A: 95,
          "A-": 90,
          "B+": 85,
          B: 80,
          "B-": 75,
          "C+": 70,
          C: 65,
          "C-": 60,
          D: 50,
          F: 0,
        };
        return sum + (gradeMap[grade.grade] || 0);
      }
      return sum;
    }, 0);

    const level = Math.floor(totalEXP / 500) + 1;
    const currentLevelEXP = totalEXP % 500;
    const nextLevelEXP = 500;

    const completedAssignments = tasksData.filter((t) => {
      const isGraded = gradesData.some(
        (g) => g.taskId === t.id || g.task_id === t.id,
      );
      return t.completed === true || t.grade != null || isGraded;
    }).length;
    const totalAssignments = tasksData.length;

    setStats({
      totalEXP,
      level,
      currentLevelEXP,
      nextLevelEXP,
      streak: streakData?.currentStreak || 0,
      totalAssignments,
      completedAssignments,
    });
  };

  const handleQuizSubmission = async (submission) => {
    try {
      const response = await fetch(
        `/make-server-2fad19e1/student/quiz/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submission),
        },
      );

      if (response.ok) {
        toast.success("Quiz submitted successfully!");
        setSelectedQuiz(null);
        loadStudentData();
      } else {
        toast.error("Failed to submit quiz");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch(`/make-server-2fad19e1/student/notifications/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      high: "border-red-200 bg-red-50 text-red-700",
      medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
      low: "border-green-200 bg-green-50 text-green-700",
    };
    return (
      priorityColors[priority?.toLowerCase()] ||
      "border-gray-200 bg-gray-50 text-gray-700"
    );
  };

  const getGradeBadge = (score, maxScore, grade) => {
    const percentage = maxScore ? (score / maxScore) * 100 : 0;
    if (percentage >= 90 || grade === "A+" || grade === "A") {
      return { color: "from-green-400 to-emerald-500" };
    } else if (percentage >= 80 || grade === "B+") {
      return { color: "from-blue-400 to-cyan-500" };
    } else if (percentage >= 70 || grade === "B") {
      return { color: "from-yellow-400 to-amber-500" };
    }
    return { color: "from-red-400 to-rose-500" };
  };

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleNotificationClick = (notif) => {
    if (notif.type === "task") {
      setActiveView("tasks");
    } else if (notif.type === "grade") {
      setActiveView("grades");
    }
  };

  const markDailyQuestSeen = () => {
    // Mark daily quest as seen in backend
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "grades", label: "My Grades", icon: BookOpen },
    { id: "tasks", label: "Tasks & Quizzes", icon: ListTodo },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "My Profile", icon: User },
  ];
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  if (selectedQuiz) {
    return (
      <TakeQuiz
        quiz={selectedQuiz}
        onBack={() => setSelectedQuiz(null)}
        onSubmit={handleQuizSubmission}
      />
    );
  }

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const response = await fetch(
        `/make-server-2fad19e1/student/profile/update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        },
      );

      if (response.ok) {
        toast.success("Profile updated successfully!");
        loadStudentData();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const ongoingTasks = sortedTasks.filter((t) => {
    const isGraded = grades.some(
      (g) =>
        g.taskId === t.id || g.task_id === t.id || g.assignment === t.title,
    );
    return !t.completed && !isGraded;
  });

  const completedTasks = sortedTasks.filter((t) => {
    const isGraded = grades.some(
      (g) =>
        g.taskId === t.id || g.task_id === t.id || g.assignment === t.title,
    );
    return t.completed || isGraded;
  });

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg flex-shrink-0 z-50 border-b-4 border-indigo-700">
          <div className="flex items-center justify-between px-4 py-3">
            <SidebarTrigger
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-lg transition-all"
            >
              <Menu className="w-6 h-6" />
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              <span className="font-bold text-base">Student Portal</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(true)}
                className="text-white hover:bg-white/20 relative rounded-lg transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
                <AvatarFallback className="bg-indigo-500 text-white text-xs font-bold">
                  {profileData.name?.slice(0, 2).toUpperCase() || "ST"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <div className="flex flex-1 w-full overflow-hidden">
          {/* Sidebar Component - Reusable for both Mobile and Desktop */}
          <Sidebar>
            <SidebarHeader>
              <div className="p-4 flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                <div>
                  <h2 className="font-semibold">Student Portal</h2>
                  <p className="text-sm text-muted-foreground">
                    {profileData.name}
                  </p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(item.id)}
                      isActive={activeView === item.id}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onLogout}>
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          {/* Mobile Overlay Backdrop */}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto min-w-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <main className="flex-1 overflow-auto">
              <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Profile Content if active */}
                {activeView === "profile" && (
                  <StudentProfile
                    student={{ ...student, ...profileData }}
                    onBack={() => setActiveView("dashboard")}
                    accessToken={accessToken}
                    projectId={projectId}
                    onUpdate={loadStudentData}
                  />
                )}

                {/* Admin Broadcast Message - only show on dashboard */}
                {activeView === "dashboard" && adminMessage && (
                  <Alert className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-md animate-in slide-in-from-top-4 duration-500">
                    <Info className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-amber-800 ml-2">
                      <span className="font-bold block mb-1 uppercase text-xs tracking-wider">
                        Message from Administration
                      </span>
                      {adminMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* View Content based on activeView */}
                {activeView === "dashboard" && (
                  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <CardContent className="p-4 sm:p-6 relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-indigo-100 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
                                Current Level
                              </p>
                              <h3 className="text-2xl sm:text-3xl font-black italic">
                                LVL {stats.level}
                              </h3>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-2xl backdrop-blur-md">
                              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                          </div>
                          <div className="mt-6">
                            <div className="flex justify-between text-xs mb-2">
                              <span>Progress to LVL {stats.level + 1}</span>
                              <span>
                                {Math.round(
                                  (stats.currentLevelEXP / stats.nextLevelEXP) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                (stats.currentLevelEXP / stats.nextLevelEXP) *
                                100
                              }
                              className="h-2 bg-white/20"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-purple-100 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
                                Total Experience
                              </p>
                              <h3 className="text-2xl sm:text-3xl font-black italic">
                                {stats.totalEXP} XP
                              </h3>
                            </div>
                            <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-2xl backdrop-blur-md">
                              <Star className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                          </div>
                          <p className="text-xs text-purple-100 mt-6 font-medium">
                            Keep going to reach the next level!
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-1">
                                Learning Streak
                              </p>
                              <h3 className="text-3xl font-black italic">
                                {stats.streak} DAYS
                              </h3>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md animate-pulse">
                              <Flame className="w-6 h-6" />
                            </div>
                          </div>
                          <p className="text-xs text-rose-100 mt-6 font-medium">
                            Fantastic! Consistency is the key to success.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">
                                Tasks Completed
                              </p>
                              <h3 className="text-3xl font-black italic">
                                {stats.completedAssignments}/
                                {stats.totalAssignments}
                              </h3>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                          </div>
                          <div className="mt-6">
                            <div className="flex justify-between text-xs mb-2">
                              <span>Total Completion Rate</span>
                              <span>
                                {stats.totalAssignments > 0
                                  ? Math.round(
                                      (stats.completedAssignments /
                                        stats.totalAssignments) *
                                        100,
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                stats.totalAssignments > 0
                                  ? (stats.completedAssignments /
                                      stats.totalAssignments) *
                                    100
                                  : 0
                              }
                              className="h-2 bg-white/20"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                          <ListTodo className="w-6 h-6 text-indigo-600" />
                          ONGOING TASKS
                        </h3>
                        <Button
                          variant="link"
                          className="text-indigo-600 font-bold"
                          onClick={() => setActiveView("tasks")}
                        >
                          View All Tasks →
                        </Button>
                      </div>

                      {ongoingTasks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {ongoingTasks.slice(0, 4).map((task) => (
                            <Card
                              key={task.id}
                              className="border-0 shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                            >
                              <div
                                className={`h-1.5 w-full bg-gradient-to-r ${
                                  task.type === "quiz"
                                    ? "from-purple-500 to-indigo-500"
                                    : "from-blue-500 to-indigo-500"
                                }`}
                              />
                              <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {task.type === "quiz" ? "QUIZ" : "TASK"}
                                  </Badge>
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    DUE{" "}
                                    {new Date(
                                      task.dueDate,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                                  {task.title}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">
                                  {task.description ||
                                    "No description provided."}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                  <div className="flex items-center gap-1 text-amber-600">
                                    <Zap className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-black">
                                      {task.maxPoints || 100} XP
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 text-xs font-bold shadow-md"
                                    onClick={() => {
                                      if (task.type === "quiz") startQuiz(task);
                                      else setActiveView("tasks");
                                    }}
                                  >
                                    {task.type === "quiz"
                                      ? "Start Quiz"
                                      : "Details"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
                          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">
                              All Caught Up!
                            </h4>
                            <p className="text-gray-500 max-w-xs mt-2 text-sm">
                              You've completed all your ongoing tasks. Take a
                              well-deserved break or review your grades!
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {activeView === "grades" && (
                  <div className="space-y-8 animate-in fade-in duration-500 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-indigo-600" />
                        MY GRADES
                      </h2>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-indigo-50">
                        <p className="text-xs font-bold text-gray-500">
                          AVG SCORE
                        </p>
                        <span className="text-lg font-black text-indigo-600">
                          {grades.length > 0
                            ? Math.round(
                                grades.reduce(
                                  (a, b) =>
                                    a +
                                    (typeof b.score === "number" ? b.score : 0),
                                  0,
                                ) / grades.length,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>

                    <Card className="border-0 shadow-xl overflow-hidden bg-white">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 border-b border-gray-100">
                              <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Assignment Name
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Subject
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Date
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Score / Grade
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {grades.map((grade, index) => {
                                const badge = getGradeBadge(
                                  grade.score,
                                  grade.maxScore,
                                  grade.grade,
                                );
                                return (
                                  <tr
                                    key={index}
                                    className="hover:bg-indigo-50/30 transition-colors group"
                                  >
                                    <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                          {grade.assignment?.charAt(0) || "A"}
                                        </div>
                                        <span className="font-bold text-gray-900">
                                          {grade.assignment}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5">
                                      <Badge
                                        variant="outline"
                                        className="border-indigo-100 text-indigo-600"
                                      >
                                        {grade.subject}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-gray-500 font-medium">
                                      {new Date(
                                        grade.date,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                      <div className="flex flex-col items-end gap-1">
                                        <span
                                          className={`text-2xl font-black bg-gradient-to-r ${badge.color} bg-clip-text text-transparent`}
                                        >
                                          {grade.grade || "—"}
                                        </span>
                                        {typeof grade.score === "number" && (
                                          <span className="text-xs font-bold text-gray-400">
                                            {grade.score}%
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              {grades.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-6 py-20 text-center"
                                  >
                                    <div className="max-w-xs mx-auto">
                                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-gray-300" />
                                      </div>
                                      <h4 className="text-gray-900 font-bold">
                                        No grades found
                                      </h4>
                                      <p className="text-gray-500 text-xs mt-1">
                                        You haven't received any grades yet.
                                        Complete your tasks to see them here!
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeView === "tasks" && (
                  <div className="space-y-8 animate-in fade-in duration-500 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <ListTodo className="w-8 h-8 text-indigo-600" />
                        TASKS & QUIZZES
                      </h2>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="bg-white shadow-sm border border-indigo-50 rounded-xl px-6 font-bold text-indigo-600"
                        >
                          Filter by Subject
                        </Button>
                      </div>
                    </div>

                    {/* Task Categories */}
                    <div className="space-y-8">
                      {/* Ongoing Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Zap className="w-5 h-5 fill-current" />
                          <h3 className="font-black uppercase tracking-widest text-sm">
                            Ongoing Assignments ({ongoingTasks.length})
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {ongoingTasks.map((task) => (
                            <Card
                              key={task.id}
                              className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden"
                            >
                              <div
                                className={`h-2 bg-gradient-to-r ${
                                  task.type === "quiz"
                                    ? "from-purple-500 to-indigo-500"
                                    : "from-blue-500 to-indigo-500"
                                }`}
                              />
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {task.type || "TASK"}
                                  </Badge>
                                  <div
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getPriorityColor(
                                      task.priority,
                                    )}`}
                                  >
                                    {task.priority || "MEDIUM"}
                                  </div>
                                </div>

                                <h4 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                                  {task.title}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-6">
                                  {task.description ||
                                    "No additional details provided."}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                  <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                                      Subject
                                    </p>
                                    <p className="text-xs font-bold text-gray-700 truncate">
                                      {task.subject}
                                    </p>
                                  </div>
                                  <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                                      Deadline
                                    </p>
                                    <p className="text-xs font-bold text-gray-700">
                                      {new Date(
                                        task.dueDate,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                  <div className="flex items-center gap-1.5 text-indigo-600">
                                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                                      <Zap className="w-3 h-3 fill-current" />
                                    </div>
                                    <span className="text-xs font-black">
                                      {task.maxPoints || 100} XP
                                    </span>
                                  </div>
                                  {task.type === "quiz" && (
                                    <Button
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black px-6 shadow-md h-10 text-xs"
                                      onClick={() => startQuiz(task)}
                                    >
                                      Take Quiz
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Completed Section */}
                      {completedTasks.length > 0 && (
                        <div className="space-y-4 pt-8">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <h3 className="font-black uppercase tracking-widest text-sm">
                              Completed Assignments ({completedTasks.length})
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completedTasks.map((task) => {
                              const grade = grades.find(
                                (g) =>
                                  g.taskId === task.id || g.task_id === task.id,
                              );
                              return (
                                <Card
                                  key={task.id}
                                  className="border-0 shadow-md bg-white/60 opacity-80 overflow-hidden"
                                >
                                  <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                      <Badge className="bg-emerald-50 text-emerald-700 border-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        COMPLETED
                                      </Badge>
                                      <div className="text-[10px] font-bold text-gray-400">
                                        {new Date(
                                          task.completedAt || task.dueDate,
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <h4 className="text-lg font-black text-gray-400 line-through mb-4">
                                      {task.title}
                                    </h4>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-black">
                                          {grade ? grade.grade || "✓" : "✓"}
                                        </div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                          {grade ? "Graded" : "Submitted"}
                                        </p>
                                      </div>
                                      {grade && (
                                        <div className="flex flex-col items-end">
                                          <span className="text-lg font-black text-indigo-600">
                                            {grade.grade}
                                          </span>
                                          {typeof grade.score === "number" && (
                                            <span className="text-[10px] font-bold text-gray-400">
                                              {grade.score}%
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeView === "leaderboard" && (
                  <div className="space-y-8 animate-in fade-in duration-500 overflow-hidden">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                      <div className="inline-block p-3 bg-indigo-50 rounded-3xl mb-2">
                        <Trophy className="w-12 h-12 text-indigo-600" />
                      </div>
                      <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                        STUDENT LEADERBOARD
                      </h2>
                      <p className="text-gray-500 font-medium">
                        Top performers across all dental departments. Rank is
                        based on total EXP earned from assignments and quizzes.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                      {/* Mock Leaderboard display - in real app, fetch from backend */}
                      {[
                        {
                          rank: 2,
                          name: "Dr. Aryan Sharma",
                          xp: 4850,
                          level: 12,
                        },
                        {
                          rank: 1,
                          name: student?.name,
                          xp: stats.totalEXP,
                          level: stats.level,
                        },
                        {
                          rank: 3,
                          name: "Dr. Isha Patel",
                          xp: 4200,
                          level: 10,
                        },
                      ]
                        .sort((a, b) => a.rank - b.rank)
                        .map((user, idx) => (
                          <Card
                            key={idx}
                            className={`border-0 shadow-xl relative overflow-hidden ${
                              user.name === student?.name
                                ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white scale-110 z-10"
                                : "bg-white"
                            }`}
                          >
                            <CardContent className="p-8 text-center">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-black italic ${
                                  user.rank === 1
                                    ? "bg-amber-100 text-amber-600"
                                    : user.rank === 2
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-orange-50 text-orange-600"
                                } ${user.name === student?.name ? "!bg-white/20 !text-white" : ""}`}
                              >
                                #{user.rank}
                              </div>
                              <Avatar className="w-20 h-20 border-4 border-white/20 shadow-xl mx-auto mb-4">
                                <AvatarFallback className="bg-indigo-500 text-white text-xl font-bold">
                                  {user.name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <h4 className="text-xl font-black mb-1 truncate">
                                {user.name}
                              </h4>
                              <p
                                className={`text-xs font-bold uppercase tracking-widest mb-6 ${
                                  user.name === student?.name
                                    ? "text-indigo-100"
                                    : "text-gray-400"
                                }`}
                              >
                                LEVEL {user.level}
                              </p>
                              <div
                                className={`p-4 rounded-2xl ${
                                  user.name === student?.name
                                    ? "bg-white/10"
                                    : "bg-slate-50"
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-black uppercase tracking-widest ${
                                    user.name === student?.name
                                      ? "text-indigo-100"
                                      : "text-gray-400"
                                  }`}
                                >
                                  Current EXP
                                </p>
                                <p className="text-2xl font-black italic">
                                  {user.xp}{" "}
                                  <span className="text-xs not-italic">XP</span>
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* Notifications Dialog */}
          <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
              <DialogHeader className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <Bell className="w-6 h-6" />
                  NOTIFICATIONS
                </DialogTitle>
                <DialogDescription className="text-indigo-100 opacity-80 font-medium">
                  You have {unreadCount} unread messages
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-6 hover:bg-indigo-50/50 transition-colors cursor-pointer relative group ${
                          !notif.read ? "bg-indigo-50/20" : ""
                        }`}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          handleNotificationClick(notif);
                        }}
                      >
                        {!notif.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">
                            {notif.type}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                          {notif.title}
                        </h5>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold">
                      No notifications yet
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Button
                  variant="ghost"
                  className="w-full text-indigo-600 font-black text-xs"
                  onClick={() => setShowNotifications(false)}
                >
                  CLOSE
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Daily Quest Dialog */}
          <Dialog
            open={showDailyQuestDialog}
            onOpenChange={setShowDailyQuestDialog}
          >
            <DialogContent className="max-w-md rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="p-8 text-center space-y-4">
                <h2 className="text-2xl font-black text-gray-900 uppercase italic">
                  New Task Assigned!
                </h2>
                <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-100">
                  <h3 className="font-black text-amber-800 text-lg mb-2">
                    {dailyQuest?.title}
                  </h3>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    {dailyQuest?.description}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-600 font-black italic">
                  <Zap className="w-5 h-5 fill-current" />
                  <span>WORTH {dailyQuest?.points} XP</span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black h-12 rounded-2xl shadow-lg mt-4"
                  onClick={() => {
                    setShowDailyQuestDialog(false);
                    markDailyQuestSeen();
                    setActiveView("tasks");
                  }}
                >
                  LET'S DO IT!
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
}
