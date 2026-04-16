import { Hono } from "https://deno.land/x/hono@v3.4.1/mod.ts";
import { cors } from "https://deno.land/x/hono@v3.4.1/middleware.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const app = new Hono();

const KV_TABLE = "kv_store_2fad19e1";

// Helper to get Supabase client
const getSupabaseClient = (isServiceRole = false) => {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = isServiceRole
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    : Deno.env.get("SUPABASE_ANON_KEY") || "";
  return createClient(url, key);
};

// KV helpers using Supabase PostgreSQL table instead of Deno.openKv()
const kvGet = async (key: string): Promise<any> => {
  const supabase = getSupabaseClient(true);
  const { data, error } = await supabase
    .from(KV_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
};

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = getSupabaseClient(true);
  const { error } = await supabase
    .from(KV_TABLE)
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
};

const kvGetByPrefix = async (prefix: string): Promise<{ key: string; value: any }[]> => {
  const supabase = getSupabaseClient(true);
  const { data, error } = await supabase
    .from(KV_TABLE)
    .select("key, value")
    .like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return data ?? [];
};

// CORS configuration - MUST BE FIRST
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  await next();
});

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-client-info"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
}));

// --- SHARED UTILS ---

async function trackStudentActivity(email: string) {
  const streakKey = `student_streak:${email}`;
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const streakData = (await kvGet(streakKey)) || {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    dates: [],
  };

  if (streakData.lastActivityDate === today) {
    return streakData;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (streakData.lastActivityDate === yesterdayStr) {
    streakData.currentStreak += 1;
  } else {
    streakData.currentStreak = 1;
  }

  if (streakData.currentStreak > streakData.longestStreak) {
    streakData.longestStreak = streakData.currentStreak;
  }

  streakData.lastActivityDate = today;
  if (!streakData.dates.includes(today)) {
    streakData.dates.push(today);
  }

  await kvSet(streakKey, streakData);
  return streakData;
}

// --- TEACHER ENDPOINTS ---

// Get all data for teacher dashboard
app.get("/make-server-2fad19e1/teacher/data", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const students = (await kvGet(`students:${user.id}`)) || [];

    // Fetch all classes from all teachers to make them shared
    const allClassesEntries = await kvGetByPrefix("classes:");
    const classesMap = new Map();
    for (const entry of allClassesEntries) {
      if (Array.isArray(entry.value)) {
        entry.value.forEach((cls: any) => {
          classesMap.set(cls.id, cls);
        });
      }
    }
    const classes = Array.from(classesMap.values());

    const tasks = (await kvGet(`tasks:${user.id}`)) || [];
    const grades = (await kvGet(`dental_college_grades:${user.id}`)) || [];

    return c.json({ students, classes, tasks, grades });
  } catch (error) {
    console.log("Teacher data error:", error);
    return c.json({ error: "Failed to get teacher data: " + error.message }, 500);
  }
});

// Save students
app.post("/make-server-2fad19e1/teacher/students", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);
    const { students } = await c.req.json();
    await kvSet(`students:${user.id}`, students || []);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Save classes
app.post("/make-server-2fad19e1/teacher/classes", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);
    const { classes } = await c.req.json();
    await kvSet(`classes:${user.id}`, classes || []);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Create a new task
app.post("/make-server-2fad19e1/teacher/tasks", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const task = await c.req.json();
    if (!task || !task.title || !task.title.trim()) {
      return c.json({ error: "Invalid task payload — title is required" }, 400);
    }

    const newTask = {
      id: task.id || `task-${Date.now()}`,
      title: task.title,
      description: task.description || "",
      maxPoints: task.maxPoints || task.points || 100,
      points: task.points || task.maxPoints || 100,
      dueDate: task.dueDate || task.date || new Date().toISOString().split("T")[0],
      date: task.date || task.dueDate || new Date().toISOString().split("T")[0],
      classId: task.classId || null,
      className: task.className || null,
      subject: task.subject || "General",
      priority: task.priority || "Medium",
      type: task.type || "task",
      status: task.status || "active",
      createdAt: new Date().toISOString(),
      teacherId: user.id,
    };

    const tasksKey = `tasks:${user.id}`;
    const existingTasks = (await kvGet(tasksKey)) || [];
    const tasksList: any[] = Array.isArray(existingTasks) ? existingTasks : [];
    tasksList.push(newTask);
    await kvSet(tasksKey, tasksList);

    // Assign to students in the class
    if (newTask.classId) {
      try {
        const allStudentsRaw = (await kvGet(`students:${user.id}`)) || [];
        const allStudents: any[] = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];
        const classStudents = allStudents.filter(
          (s: any) => s && s.classId === newTask.classId && s.email
        );
        for (const student of classStudents) {
          const studentTasksKey = `student_tasks:${student.email}`;
          const existing = (await kvGet(studentTasksKey)) || [];
          const studentTasks: any[] = Array.isArray(existing) ? existing : [];
          studentTasks.push({ ...newTask, completed: false });
          await kvSet(studentTasksKey, studentTasks);
        }
      } catch (assignError) {
        console.log("Student assignment error (non-fatal):", assignError);
      }
    }

    return c.json(newTask);
  } catch (error) {
    console.log("Create task error:", error);
    return c.json({ error: "Failed to create task: " + error.message }, 500);
  }
});

// Add task of the day
app.post("/make-server-2fad19e1/teacher/add-task", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { title, description, points, date, class_id, type, subject, priority } = body;

    if (!title || !title.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }

    const task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description || "",
      points: points || 50,
      maxPoints: points || 50,
      type: type || "task",
      date: date || new Date().toISOString().split("T")[0],
      dueDate: date || new Date().toISOString().split("T")[0],
      classId: class_id || null,
      subject: subject || "General",
      priority: priority || "Medium",
      teacherId: user.id,
      createdAt: new Date().toISOString(),
      status: "active"
    };

    const tasksKey = `tasks:${user.id}`;
    const tasks = (await kvGet(tasksKey)) || [];
    const tasksList: any[] = Array.isArray(tasks) ? tasks : [];
    tasksList.push(task);
    await kvSet(tasksKey, tasksList);

    // Assign to students
    let assignmentCount = 0;
    try {
      const allStudentsRaw = (await kvGet(`students:${user.id}`)) || [];
      const allStudents: any[] = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];
      const eligibleStudents = class_id
        ? allStudents.filter((s: any) => s && s.classId === class_id && s.email)
        : allStudents.filter((s: any) => s && s.email);

      for (const student of eligibleStudents) {
        const studentTasksKey = `student_tasks:${student.email}`;
        const existing = (await kvGet(studentTasksKey)) || [];
        const studentTasks: any[] = Array.isArray(existing) ? existing : [];
        studentTasks.push({ ...task, completed: false, grade: null });
        await kvSet(studentTasksKey, studentTasks);

        const notifKey = `notifications:${student.email}`;
        const notifs = (await kvGet(notifKey)) || [];
        const notifsList: any[] = Array.isArray(notifs) ? notifs : [];
        notifsList.push({
          id: `notif-${Date.now()}-${student.email}`,
          type: "task",
          title: `New Task: ${title}`,
          message: description || "",
          createdAt: new Date().toISOString(),
          read: false,
          taskId: task.id
        });
        await kvSet(notifKey, notifsList);
        assignmentCount++;
      }
    } catch (e) {
      console.log("Error during student assignment:", e);
    }

    return c.json({ success: true, task, assignedCount: assignmentCount });
  } catch (error) {
    console.log("Add task error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get students assigned to a specific task with their grades
app.post("/make-server-2fad19e1/teacher/task-students", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { taskId } = body;

    // Get all teacher's students
    const allStudentsRaw = (await kvGet(`students:${user.id}`)) || [];
    const allStudents: any[] = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];

    // Get tasks to find classId for this task
    const tasks = (await kvGet(`tasks:${user.id}`)) || [];
    const tasksList: any[] = Array.isArray(tasks) ? tasks : [];
    const task = tasksList.find((t: any) => t.id === taskId);

    // Filter students: if task has a classId, only that class; otherwise all
    const relevantStudents = task?.classId
      ? allStudents.filter((s: any) => s.classId === task.classId)
      : allStudents;

    // Get grades for this task
    const taskGrades = (await kvGet(`task_grades:${taskId}`)) || {};

    // Build student list with grade info
    const studentsWithGrades = relevantStudents.map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      classId: s.classId,
      className: s.className,
      grade: taskGrades[s.email] || null,
    }));

    return c.json({ students: studentsWithGrades });
  } catch (error) {
    console.log("Task students error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get grades for a specific task
app.get("/make-server-2fad19e1/teacher/task-grades/:taskId", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const taskId = c.req.param("taskId");
    const grades = (await kvGet(`task_grades:${taskId}`)) || {};
    return c.json({ grades });
  } catch (error) {
    console.log("Task grades error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Quest backward compat
app.post("/make-server-2fad19e1/teacher/quest", async (c) => {
  return c.redirect(307, "/make-server-2fad19e1/teacher/add-task");
});

// Save grade for a student's task
app.post("/make-server-2fad19e1/teacher/grades", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { taskId, studentEmail, grade } = body;

    if (!taskId || !studentEmail || !grade) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const grades = (await kvGet(`task_grades:${taskId}`)) || {};
    grades[studentEmail] = grade;
    await kvSet(`task_grades:${taskId}`, grades);

    const teacherGradesKey = `dental_college_grades:${user.id}`;
    const teacherGrades = (await kvGet(teacherGradesKey)) || [];
    const teacherGradesList: any[] = Array.isArray(teacherGrades) ? teacherGrades : [];

    const studentGradesKey = `student_grades:${studentEmail}`;
    const studentGrades = (await kvGet(studentGradesKey)) || [];
    const studentGradesList: any[] = Array.isArray(studentGrades) ? studentGrades : [];

    const tasks = (await kvGet(`tasks:${user.id}`)) || [];
    const task = Array.isArray(tasks) ? tasks.find((t: any) => t.id === taskId) : null;

    const gradeEntry = {
      studentEmail,
      subject: task?.subject || "General",
      assignment: task?.title || "Assignment",
      taskId,
      task_id: taskId,
      grade,
      score: grade,
      maxScore: 100,
      date: new Date().toISOString().split("T")[0],
    };

    const existingTeacherIndex = teacherGradesList.findIndex(
      (g: any) => g.studentEmail === studentEmail && g.taskId === taskId
    );
    if (existingTeacherIndex >= 0) {
      teacherGradesList[existingTeacherIndex] = gradeEntry;
    } else {
      teacherGradesList.push(gradeEntry);
    }
    await kvSet(teacherGradesKey, teacherGradesList);

    const existingStudentIndex = studentGradesList.findIndex((g: any) => g.taskId === taskId);
    if (existingStudentIndex >= 0) {
      studentGradesList[existingStudentIndex] = gradeEntry;
    } else {
      studentGradesList.push(gradeEntry);
    }
    await kvSet(studentGradesKey, studentGradesList);

    const studentTasksKey = `student_tasks:${studentEmail}`;
    const studentTasks = (await kvGet(studentTasksKey)) || [];
    const studentTasksList: any[] = Array.isArray(studentTasks) ? studentTasks : [];
    const updatedTasks = studentTasksList.map((t: any) =>
      t.id === taskId ? { ...t, completed: true, grade } : t
    );
    await kvSet(studentTasksKey, updatedTasks);

    await trackStudentActivity(studentEmail);

    return c.json({ success: true });
  } catch (error) {
    console.log("Save grade error:", error);
    return c.json({ error: "Failed to save grade: " + error.message }, 500);
  }
});

// Get all registered students
app.get("/make-server-2fad19e1/teacher/all-students", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const students = authUsers?.users?.filter((u: any) => u.user_metadata?.role === "student") || [];

    const profileEntries = await kvGetByPrefix("student_profile:");
    const profileMap = new Map();
    for (const entry of profileEntries) {
      if (entry.value && entry.value.email) {
        profileMap.set(entry.value.email, entry.value);
      }
    }

    const teacherStudents = (await kvGet(`students:${user.id}`)) || [];
    const assignedEmails = new Set(
      Array.isArray(teacherStudents) ? teacherStudents.map((s: any) => s.email) : []
    );

    const result = students.map((u: any) => {
      const profile = profileMap.get(u.email) || {};
      const name = u.user_metadata?.name || u.email?.split("@")[0] || "Student";
      return {
        id: u.id,
        name,
        email: u.email,
        avatar: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        currentLevel: profile.currentLevel || 1,
        totalPoints: profile.totalPoints || 0,
        gameProgress: profile.gameProgress || 0,
        lastActive: u.last_sign_in_at || u.created_at,
        status: "active",
        subjects: profile.subjects || [],
        averageGrade: 0,
        classId: profile.classId || null,
        className: profile.className || null,
        isRegistered: true,
        isAssigned: assignedEmails.has(u.email),
        registeredAt: u.created_at,
      };
    });

    return c.json(result);
  } catch (error) {
    console.log("All students error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update teacher profile
app.post("/make-server-2fad19e1/teacher/profile/update", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);
    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, ...body },
    });
    if (updateError) return c.json({ error: updateError.message }, 400);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// --- STUDENT ENDPOINTS ---

// Get student data
app.get("/make-server-2fad19e1/student/data", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const allTasks = (await kvGet(`student_tasks:${user.email}`)) || [];
    const allGrades = (await kvGet(`student_grades:${user.email}`)) || [];
    const streakData = (await kvGet(`student_streak:${user.email}`)) || {
      currentStreak: 0,
      longestStreak: 0,
      dates: [],
    };

    const tasksList: any[] = Array.isArray(allTasks) ? allTasks : [];
    const gradesList: any[] = Array.isArray(allGrades) ? allGrades : [];

    const tasksWithCompletion = tasksList.map((task: any) => {
      const hasGrade = gradesList.some(
        (grade: any) => grade.taskId === task.id || grade.task_id === task.id
      );
      return {
        ...task,
        completed: task.completed || hasGrade,
        grade: gradesList.find(
          (g: any) => g.taskId === task.id || g.task_id === task.id
        )?.grade,
      };
    });

    return c.json({
      tasks: tasksWithCompletion,
      grades: gradesList,
      streakData,
      assignedClass: null,
      adminMessage: null,
    });
  } catch (error) {
    console.log("Student data error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-2fad19e1/student/dashboard", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    if (!accessToken) return c.json({ error: "Unauthorized" }, 401);

    const supabase = getSupabaseClient(true);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const tasks = (await kvGet(`student_tasks:${user.email}`)) || [];
    const streak = (await kvGet(`student_streak:${user.email}`)) || { currentStreak: 0, dates: [] };
    const profile = (await kvGet(`student_profile:${user.email}`)) || { totalPoints: 0, currentLevel: 1 };

    return c.json({ tasks, streak, quest: null, profile });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-2fad19e1/student/notifications", async (c) => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const supabase = getSupabaseClient(true);
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const notifs = (await kvGet(`notifications:${user.email}`)) || [];
  return c.json({ notifications: notifs });
});

app.post("/make-server-2fad19e1/student/notifications/read", async (c) => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const supabase = getSupabaseClient(true);
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  const { notificationId } = await c.req.json();

  const key = `notifications:${user.email}`;
  const notifs = (await kvGet(key)) || [];
  const notifsList: any[] = Array.isArray(notifs) ? notifs : [];
  const updated = notifsList.map((n: any) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  await kvSet(key, updated);
  return c.json({ success: true });
});

// --- DEPLOYMENT ---
Deno.serve(app.fetch);
