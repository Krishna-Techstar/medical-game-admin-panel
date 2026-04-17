const { kvGet, kvSet } = require('../../database/services/dbService');

async function trackStudentActivity(email) {
  const streakKey = `student_streak:${email}`;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const streakData = (await kvGet(streakKey)) || { currentStreak: 0, longestStreak: 0, lastActivityDate: null, dates: [] };
  if (streakData.lastActivityDate === today) return streakData;
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (streakData.lastActivityDate === yesterdayStr) {
    streakData.currentStreak += 1;
  } else {
    streakData.currentStreak = 1;
  }
  
  if (streakData.currentStreak > streakData.longestStreak) streakData.longestStreak = streakData.currentStreak;
  streakData.lastActivityDate = today;
  if (!streakData.dates.includes(today)) streakData.dates.push(today);
  
  await kvSet(streakKey, streakData);
  return streakData;
}

module.exports = {
  trackStudentActivity
};
