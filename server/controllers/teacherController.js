const { kvGet, kvSet, kvGetByPrefix, getSupabaseClient } = require('../../database/services/dbService');
const { trackStudentActivity } = require('../services/studentService');

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const role = user.user_metadata?.role;
    if (role === 'student') return res.status(403).json({ error: 'Access denied. Not a teacher account.' });
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Teacher';
    return res.json({
      teacher: {
        id: user.id,
        name,
        email: user.email,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        role: 'teacher',
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getData = async (req, res) => {
  try {
    const user = req.user;
    const students = (await kvGet(`students:${user.id}`)) || [];
    const allClassesEntries = await kvGetByPrefix('classes:');
    const classesMap = new Map();
    for (const entry of allClassesEntries) {
      if (Array.isArray(entry.value)) {
        entry.value.forEach(cls => classesMap.set(cls.id, cls));
      }
    }
    const classes = Array.from(classesMap.values());
    const tasks = (await kvGet(`tasks:${user.id}`)) || [];
    const grades = (await kvGet(`dental_college_grades:${user.id}`)) || [];
    return res.json({ students, classes, tasks, grades });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const saveStudents = async (req, res) => {
  try {
    const user = req.user;
    const { students } = req.body;
    await kvSet(`students:${user.id}`, students || []);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const saveClasses = async (req, res) => {
  try {
    const user = req.user;
    const { classes } = req.body;
    await kvSet(`classes:${user.id}`, classes || []);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const user = req.user;
    const task = req.body;
    if (!task?.title?.trim()) return res.status(400).json({ error: 'Title is required' });
    const newTask = {
      id: task.id || `task-${Date.now()}`,
      title: task.title,
      description: task.description || '',
      maxPoints: task.maxPoints || task.points || 100,
      points: task.points || task.maxPoints || 100,
      dueDate: task.dueDate || task.date || new Date().toISOString().split('T')[0],
      date: task.date || task.dueDate || new Date().toISOString().split('T')[0],
      classId: task.classId || null,
      className: task.className || null,
      subject: task.subject || 'General',
      priority: task.priority || 'Medium',
      type: task.type || 'task',
      status: task.status || 'active',
      createdAt: new Date().toISOString(),
      teacherId: user.id,
    };
    const tasksKey = `tasks:${user.id}`;
    const existingTasks = (await kvGet(tasksKey)) || [];
    const tasksList = Array.isArray(existingTasks) ? existingTasks : [];
    tasksList.push(newTask);
    await kvSet(tasksKey, tasksList);
    try {
      const emailsToAssign = new Set();
      const allStudentsRaw = (await kvGet(`students:${user.id}`)) || [];
      const allStudents = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];
      const classStudents = newTask.classId ? allStudents.filter(s => s?.classId === newTask.classId && s.email) : allStudents.filter(s => s?.email);
      classStudents.forEach(s => emailsToAssign.add(s.email));
      const profileEntries = await kvGetByPrefix('student_profile:');
      const fromProfiles = newTask.classId
        ? profileEntries.filter(e => e.value?.classId === newTask.classId && e.value?.email)
        : profileEntries.filter(e => e.value?.email);
      fromProfiles.forEach(e => emailsToAssign.add(e.value.email));
      for (const email of emailsToAssign) {
        const key = `student_tasks:${email}`;
        const existing = (await kvGet(key)) || [];
        const list = Array.isArray(existing) ? existing : [];
        if (!list.some(t => t.id === newTask.id)) {
          list.push({ ...newTask, completed: false });
          await kvSet(key, list);
          const notifKey = `notifications:${email}`;
          const notifs = (await kvGet(notifKey)) || [];
          const notifsList = Array.isArray(notifs) ? notifs : [];
          notifsList.push({ id: `notif-${Date.now()}-${Math.random()}`, type: 'task', title: `New Assignment`, message: `You have been assigned: ${newTask.title}`, createdAt: new Date().toISOString(), read: false, taskId: newTask.id });
          await kvSet(notifKey, notifsList);
        }
      }
    } catch (e) { console.log('Student assignment error (non-fatal):', e); }
    return res.json(newTask);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const addTask = async (req, res) => {
  try {
    const user = req.user;
    const { title, description, points, date, class_id, type, subject, priority } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    const task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description || '',
      points: points || 50,
      maxPoints: points || 50,
      type: type || 'task',
      date: date || new Date().toISOString().split('T')[0],
      dueDate: date || new Date().toISOString().split('T')[0],
      classId: class_id || null,
      subject: subject || 'General',
      priority: priority || 'Medium',
      teacherId: user.id,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    const tasksKey = `tasks:${user.id}`;
    const tasks = (await kvGet(tasksKey)) || [];
    const tasksList = Array.isArray(tasks) ? tasks : [];
    tasksList.push(task);
    await kvSet(tasksKey, tasksList);
    let assignmentCount = 0;
    try {
      const emailsToAssign = new Set();
      const allStudentsRaw = (await kvGet(`students:${user.id}`)) || [];
      const allStudents = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];
      const fromTeacherList = class_id ? allStudents.filter(s => s?.classId === class_id && s.email) : allStudents.filter(s => s?.email);
      fromTeacherList.forEach(s => emailsToAssign.add(s.email));
      const profileEntries = await kvGetByPrefix('student_profile:');
      const fromProfiles = class_id
        ? profileEntries.filter(e => e.value?.classId === class_id && e.value?.email)
        : profileEntries.filter(e => e.value?.email);
      fromProfiles.forEach(e => emailsToAssign.add(e.value.email));
      for (const email of emailsToAssign) {
        const key = `student_tasks:${email}`;
        const existing = (await kvGet(key)) || [];
        const list = Array.isArray(existing) ? existing : [];
        if (!list.some(t => t.id === task.id)) {
          list.push({ ...task, completed: false, grade: null });
          await kvSet(key, list);
          const notifKey = `notifications:${email}`;
          const notifs = (await kvGet(notifKey)) || [];
          const notifsList = Array.isArray(notifs) ? notifs : [];
          notifsList.push({ id: `notif-${Date.now()}-${Math.random()}`, type: 'task', title: `New Assignment`, message: `You have been assigned: ${title}`, createdAt: new Date().toISOString(), read: false, taskId: task.id });
          await kvSet(notifKey, notifsList);
          assignmentCount++;
        }
      }
    } catch (e) { console.log('Error during student assignment:', e); }
    return res.json({ success: true, task, assignedCount: assignmentCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getTaskStudents = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.body;
    const allStudentsRaw = (await kvGet(`students:${user.id}`)) || [];
    const allStudents = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];
    const tasks = (await kvGet(`tasks:${user.id}`)) || [];
    const task = Array.isArray(tasks) ? tasks.find(t => t.id === taskId) : null;
    const relevantStudents = task?.classId ? allStudents.filter(s => s.classId === task.classId) : allStudents;
    const taskGrades = (await kvGet(`task_grades:${taskId}`)) || {};
    const studentsWithGrades = relevantStudents.map(s => ({ id: s.id, name: s.name, email: s.email, avatar: s.avatar, classId: s.classId, className: s.className, grade: taskGrades[s.email] || null }));
    return res.json({ students: studentsWithGrades });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getTaskGrades = async (req, res) => {
  try {
    const grades = (await kvGet(`task_grades:${req.params.taskId}`)) || {};
    return res.json({ grades });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const saveGrades = async (req, res) => {
  try {
    const user = req.user;
    const { taskId, studentEmail, grade } = req.body;
    if (!taskId || !studentEmail || !grade) return res.status(400).json({ error: 'Missing required fields' });
    const grades = (await kvGet(`task_grades:${taskId}`)) || {};
    grades[studentEmail] = grade;
    await kvSet(`task_grades:${taskId}`, grades);
    const teacherGradesKey = `dental_college_grades:${user.id}`;
    const teacherGrades = (await kvGet(teacherGradesKey)) || [];
    const teacherGradesList = Array.isArray(teacherGrades) ? teacherGrades : [];
    const studentGradesKey = `student_grades:${studentEmail}`;
    const studentGrades = (await kvGet(studentGradesKey)) || [];
    const studentGradesList = Array.isArray(studentGrades) ? studentGrades : [];
    const tasks = (await kvGet(`tasks:${user.id}`)) || [];
    const task = Array.isArray(tasks) ? tasks.find(t => t.id === taskId) : null;
    const gradeEntry = { studentEmail, subject: task?.subject || 'General', assignment: task?.title || 'Assignment', taskId, task_id: taskId, grade, score: grade, maxScore: 100, date: new Date().toISOString().split('T')[0] };
    const existingTeacherIndex = teacherGradesList.findIndex(g => g.studentEmail === studentEmail && g.taskId === taskId);
    if (existingTeacherIndex >= 0) teacherGradesList[existingTeacherIndex] = gradeEntry;
    else teacherGradesList.push(gradeEntry);
    await kvSet(teacherGradesKey, teacherGradesList);
    const existingStudentIndex = studentGradesList.findIndex(g => g.taskId === taskId);
    if (existingStudentIndex >= 0) studentGradesList[existingStudentIndex] = gradeEntry;
    else studentGradesList.push(gradeEntry);
    await kvSet(studentGradesKey, studentGradesList);
    const studentTasksKey = `student_tasks:${studentEmail}`;
    const studentTasks = (await kvGet(studentTasksKey)) || [];
    const updatedTasks = Array.isArray(studentTasks) ? studentTasks.map(t => t.id === taskId ? { ...t, completed: true, grade } : t) : [];
    await kvSet(studentTasksKey, updatedTasks);
    await trackStudentActivity(studentEmail);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const user = req.user;
    const supabase = getSupabaseClient(true);
    const { data: authData } = await supabase.auth.admin.listUsers();
    const students = authData?.users?.filter(u => u.user_metadata?.role === 'student' && u.email !== user.email) || [];
    const profileEntries = await kvGetByPrefix('student_profile:');
    const profileMap = new Map();
    for (const entry of profileEntries) {
      if (entry.value?.email) profileMap.set(entry.value.email, entry.value);
    }
    const teacherStudents = (await kvGet(`students:${user.id}`)) || [];
    const assignedEmails = new Set(Array.isArray(teacherStudents) ? teacherStudents.map(s => s.email) : []);
    const result = students.map(u => {
      const profile = profileMap.get(u.email) || {};
      const meta = u.user_metadata || {};
      const name = meta.name || u.email?.split('@')[0] || 'Student';
      return {
        id: u.id, name, email: u.email,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        username: profile.username || meta.username || '',
        rollNumber: profile.rollNumber || meta.rollNumber || '',
        batch: profile.batch || meta.batch || '',
        currentLevel: profile.currentLevel || 1,
        totalPoints: profile.totalPoints || 0,
        gameProgress: profile.gameProgress || 0,
        lastActive: u.last_sign_in_at || u.created_at,
        status: 'active',
        subjects: profile.subjects || [],
        averageGrade: 0,
        classId: profile.classId || null,
        className: profile.className || meta.class || null,
        isRegistered: true,
        isAssigned: assignedEmails.has(u.email),
        registeredAt: u.created_at,
      };
    });
    return res.json({ students: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getTaskStats = async (req, res) => {
  try {
    const user = req.user;
    const tasks = (await kvGet(`tasks:${user.id}`)) || [];
    const tasksList = Array.isArray(tasks) ? tasks : [];
    const allStudentsRaw = (await kvGet(`students:${user.id}`)) || [];
    const allStudents = Array.isArray(allStudentsRaw) ? allStudentsRaw : [];
    const taskStats = {};
    for (const task of tasksList) {
      const relevantStudents = task.classId ? allStudents.filter(s => s.classId === task.classId) : allStudents;
      const totalStudents = relevantStudents.length;
      let completed = 0;
      let attempted = 0;
      const taskGrades = (await kvGet(`task_grades:${task.id}`)) || {};
      for (const student of relevantStudents) {
        if (taskGrades[student.email]) { completed++; attempted++; }
        else {
          const studentTasks = (await kvGet(`student_tasks:${student.email}`)) || [];
          const studentTask = Array.isArray(studentTasks) ? studentTasks.find(t => t.id === task.id) : null;
          if (studentTask?.completed) { completed++; attempted++; }
        }
      }
      taskStats[task.id] = { totalStudents, completed, attempted, completionRate: totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0, attemptRate: totalStudents > 0 ? Math.round((attempted / totalStudents) * 100) : 0 };
    }
    return res.json({ taskStats });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, ...req.body } });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getStudentStreak = async (req, res) => {
  try {
    const streakData = (await kvGet(`student_streak:${req.params.email}`)) || { currentStreak: 0, longestStreak: 0, dates: [] };
    return res.json({ streakData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getStudentTasks = async (req, res) => {
  try {
    const tasks = (await kvGet(`student_tasks:${req.params.email}`)) || [];
    return res.json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const assignStudent = async (req, res) => {
  try {
    const user = req.user;
    const { studentId, studentEmail, classId, className } = req.body;
    if (!studentEmail || !classId) return res.status(400).json({ error: 'studentEmail and classId are required' });
    const supabase = getSupabaseClient(true);
    const { data: authData } = await supabase.auth.admin.getUserById(studentId);
    const studentName = authData?.user?.user_metadata?.name || studentEmail.split('@')[0];
    const avatar = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const studentsKey = `students:${user.id}`;
    const existingStudents = (await kvGet(studentsKey)) || [];
    const studentsList = Array.isArray(existingStudents) ? existingStudents : [];
    const existingIndex = studentsList.findIndex(s => s.email === studentEmail || s.id === studentId);
    const studentEntry = { id: studentId, name: studentName, email: studentEmail, avatar, classId, className, status: 'active', addedAt: new Date().toISOString() };
    if (existingIndex >= 0) { studentsList[existingIndex] = { ...studentsList[existingIndex], classId, className }; } 
    else { studentsList.push(studentEntry); }
    await kvSet(studentsKey, studentsList);
    const profileKey = `student_profile:${studentEmail}`;
    const existingProfile = (await kvGet(profileKey)) || {};
    await kvSet(profileKey, { ...existingProfile, classId, className, email: studentEmail });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const unassignStudent = async (req, res) => {
  try {
    const user = req.user;
    const { studentId } = req.body;
    const studentsKey = `students:${user.id}`;
    const existingStudents = (await kvGet(studentsKey)) || [];
    const studentsList = Array.isArray(existingStudents) ? existingStudents : [];
    const student = studentsList.find(s => s.id === studentId);
    const updated = studentsList.filter(s => s.id !== studentId);
    await kvSet(studentsKey, updated);
    if (student?.email) {
      const profileKey = `student_profile:${student.email}`;
      const existingProfile = (await kvGet(profileKey)) || {};
      await kvSet(profileKey, { ...existingProfile, classId: null, className: null });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const batchStudentData = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails)) return res.status(400).json({ error: 'emails array required' });
    const results = {};
    for (const email of emails) {
      const streak = (await kvGet(`student_streak:${email}`)) || { currentStreak: 0, longestStreak: 0, dates: [] };
      const tasks = (await kvGet(`student_tasks:${email}`)) || [];
      const grades = (await kvGet(`student_grades:${email}`)) || [];
      results[email] = { streak, taskCount: Array.isArray(tasks) ? tasks.length : 0, completedCount: Array.isArray(tasks) ? tasks.filter(t => t.completed).length : 0, grades };
    }
    return res.json({ students: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const saveSingleTaskGrade = async (req, res) => {
  try {
    const user = req.user;
    const { taskId, studentEmail, grade } = req.body;
    if (!taskId || !studentEmail || grade === undefined) return res.status(400).json({ error: 'Missing fields' });
    const grades = (await kvGet(`task_grades:${taskId}`)) || {};
    grades[studentEmail] = grade;
    await kvSet(`task_grades:${taskId}`, grades);
    const allTasks = (await kvGet(`tasks:${user.id}`)) || [];
    const task = Array.isArray(allTasks) ? allTasks.find(t => t.id === taskId) : null;
    const gradeToScore = { 'A+': 100, 'A': 95, 'A-': 90, 'B+': 85, 'B': 80, 'B-': 75, 'C+': 70, 'C': 65, 'C-': 60, 'D': 50, 'F': 0 };
    const numericScore = gradeToScore[grade] ?? 0;
    const maxPoints = task?.maxPoints || task?.points || 100;
    const gradeEntry = { taskId, task_id: taskId, studentEmail, subject: task?.subject || task?.className || 'General', assignment: task?.title || 'Assignment', grade, score: numericScore, maxScore: 100, maxPoints, date: new Date().toISOString().split('T')[0], gradedAt: new Date().toISOString() };
    const studentGradesKey = `student_grades:${studentEmail}`;
    const studentGrades = (await kvGet(studentGradesKey)) || [];
    const studentGradesList = Array.isArray(studentGrades) ? studentGrades : [];
    const existingIdx = studentGradesList.findIndex(g => g.taskId === taskId || g.task_id === taskId);
    if (existingIdx >= 0) studentGradesList[existingIdx] = gradeEntry;
    else studentGradesList.push(gradeEntry);
    await kvSet(studentGradesKey, studentGradesList);
    const studentTasksKey = `student_tasks:${studentEmail}`;
    const studentTasks = (await kvGet(studentTasksKey)) || [];
    const updatedTasks = Array.isArray(studentTasks) ? studentTasks.map(t => t.id === taskId ? { ...t, completed: true, grade, score: numericScore } : t) : [];
    await kvSet(studentTasksKey, updatedTasks);
    const notifKey = `notifications:${studentEmail}`;
    const notifs = (await kvGet(notifKey)) || [];
    const notifsList = Array.isArray(notifs) ? notifs : [];
    notifsList.push({ id: `notif-grade-${taskId}-${Date.now()}`, type: 'grade', title: `Grade Assigned: ${grade}`, message: `You received a grade of ${grade} for "${task?.title || 'your assignment'}"`, createdAt: new Date().toISOString(), read: false, taskId });
    await kvSet(notifKey, notifsList);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getProfile, getData, saveStudents, saveClasses, createTask, addTask, getTaskStudents, getTaskGrades,
  saveGrades, getAllStudents, getTaskStats, updateProfile, getStudentStreak, getStudentTasks, assignStudent,
  unassignStudent, batchStudentData, saveSingleTaskGrade
};
