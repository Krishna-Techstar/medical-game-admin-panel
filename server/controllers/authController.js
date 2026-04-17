const { getSupabaseClient, kvSet, kvGetByPrefix } = require('../../database/services/dbService');

const signup = async (req, res) => {
  try {
    const supabase = getSupabaseClient(true);
    const { email, password, name, role, ...rest } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password and name are required' });
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: role || 'teacher', ...rest },
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true, user: data.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const studentSignup = async (req, res) => {
  try {
    const supabase = getSupabaseClient(true);
    const { email, password, name, username, rollNumber, batch, class: className, ...rest } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password and name are required' });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'student', username, rollNumber, batch, class: className, ...rest },
    });
    if (error) return res.status(400).json({ error: error.message });

    let matchedClassId = null;
    if (className) {
      try {
        const allClassesEntries = await kvGetByPrefix('classes:');
        for (const entry of allClassesEntries) {
          const classes = Array.isArray(entry.value) ? entry.value : [];
          const match = classes.find(c => c.name === className || c.subject === className);
          if (match) { matchedClassId = match.id; break; }
        }
      } catch (e) { /* ignore */ }
    }

    const profileKey = `student_profile:${email}`;
    await kvSet(profileKey, {
      email,
      name,
      username: username || '',
      rollNumber: rollNumber || '',
      batch: batch || '',
      className: className || '',
      classId: matchedClassId || null,
      totalPoints: 0,
      currentLevel: 1,
      gameProgress: 0,
      registeredAt: new Date().toISOString(),
    });

    return res.json({ success: true, user: data.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  signup,
  studentSignup
};
