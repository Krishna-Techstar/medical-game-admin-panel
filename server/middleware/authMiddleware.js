const { getSupabaseClient } = require('../../database/services/dbService');

const getUser = async (authHeader) => {
  const accessToken = authHeader?.split(' ')[1];
  if (!accessToken) return null;
  const supabase = getSupabaseClient(true);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  return user;
};

const requireAuth = async (req, res, next) => {
  try {
    const user = await getUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUser,
  requireAuth
};
