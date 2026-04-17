const { kvGet, kvSet, getSupabaseClient } = require('../../database/services/dbService');
const { trackStudentActivity } = require('../services/studentService');

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const role = user.user_metadata?.role;
    if (role === 'teacher') return res.status(403).json({ error: 'Access denied. Not a student account.' });
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Student';
    const meta = user.user_metadata || {};
    const profile = (await kvGet(`student_profile:${user.email}`)) || {};
    return res.json({
      student: {
        id: user.id,
        name,
        email: user.email,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        role: 'student',
        username: profile.username || meta.username || '',
        rollNumber: profile.rollNumber || meta.rollNumber || '',
        batch: profile.batch || meta.batch || '',
        currentLevel: profile.currentLevel || 1,
        totalPoints: profile.totalPoints || 0,
        gameProgress: profile.gameProgress || 0,
        classId: profile.classId || null,
        className: profile.className || meta.class || null,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getData = async (req, res) => {
  try {
    const user = req.user;
    const allTasks = (await kvGet(`student_tasks:${user.email}`)) || [];
    const allGrades = (await kvGet(`student_grades:${user.email}`)) || [];
    const streakData = (await kvGet(`student_streak:${user.email}`)) || { currentStreak: 0, longestStreak: 0, dates: [] };
    const tasksList = Array.isArray(allTasks) ? allTasks : [];
    const gradesList = Array.isArray(allGrades) ? allGrades : [];
    const tasksWithCompletion = tasksList.map(task => {
      const hasGrade = gradesList.some(g => g.taskId === task.id || g.task_id === task.id);
      return { ...task, completed: task.completed || hasGrade, grade: gradesList.find(g => g.taskId === task.id || g.task_id === task.id)?.grade };
    });
    return res.json({ tasks: tasksWithCompletion, grades: gradesList, streakData, assignedClass: null, adminMessage: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    const tasks = (await kvGet(`student_tasks:${user.email}`)) || [];
    const streak = (await kvGet(`student_streak:${user.email}`)) || { currentStreak: 0, dates: [] };
    const profile = (await kvGet(`student_profile:${user.email}`)) || { totalPoints: 0, currentLevel: 1 };
    return res.json({ tasks, streak, quest: null, profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const notifs = (await kvGet(`notifications:${user.email}`)) || [];
    return res.json({ notifications: notifs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const user = req.user;
    const { notificationId } = req.body;
    const key = `notifications:${user.email}`;
    const notifs = (await kvGet(key)) || [];
    const updated = Array.isArray(notifs) ? notifs.map(n => n.id === notificationId ? { ...n, read: true } : n) : [];
    await kvSet(key, updated);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const profileKey = `student_profile:${user.email}`;
    const existing = (await kvGet(profileKey)) || {};
    await kvSet(profileKey, { ...existing, ...req.body, email: user.email });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const user = req.user;
    const { taskId, score, maxScore, answers } = req.body;

    const gradeEntry = {
      taskId, task_id: taskId,
      studentEmail: user.email,
      subject: 'Quiz',
      assignment: 'Quiz',
      grade: score,
      score,
      maxScore: maxScore || 100,
      date: new Date().toISOString().split('T')[0],
      answers,
    };

    const studentGradesKey = `student_grades:${user.email}`;
    const studentGrades = (await kvGet(studentGradesKey)) || [];
    const gradesList = Array.isArray(studentGrades) ? studentGrades : [];
    const existingIndex = gradesList.findIndex(g => g.taskId === taskId || g.task_id === taskId);
    if (existingIndex >= 0) gradesList[existingIndex] = gradeEntry;
    else gradesList.push(gradeEntry);
    await kvSet(studentGradesKey, gradesList);

    const studentTasksKey = `student_tasks:${user.email}`;
    const studentTasks = (await kvGet(studentTasksKey)) || [];
    const updatedTasks = Array.isArray(studentTasks) ? studentTasks.map(t => t.id === taskId ? { ...t, completed: true, grade: score } : t) : [];
    await kvSet(studentTasksKey, updatedTasks);

    await trackStudentActivity(user.email);

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const notifKey = `notifications:${user.email}`;
    const notifs = (await kvGet(notifKey)) || [];
    const notifsList = Array.isArray(notifs) ? notifs : [];
    notifsList.push({
      id: `notif-${Date.now()}`,
      type: 'grade',
      title: `Quiz Submitted!`,
      message: `You scored ${score}/${maxScore} points (${percentage}%)`,
      createdAt: new Date().toISOString(),
      read: false,
    });
    await kvSet(notifKey, notifsList);

    return res.json({ success: true, percentage });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getQuest = async (req, res) => {
  try {
    const user = req.user;
    const tasks = (await kvGet(`student_tasks:${user.email}`)) || [];
    const tasksList = Array.isArray(tasks) ? tasks : [];
    const pending = tasksList.filter(t => !t.completed);
    return res.json({ quest: pending[0] || null, tasks: tasksList });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getProfile,
  getData,
  getDashboard,
  getNotifications,
  markNotificationRead,
  updateProfile,
  submitQuiz,
  getQuest
};
