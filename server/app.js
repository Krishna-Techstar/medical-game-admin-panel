require('dotenv').config({ path: '../.env' }); // Load root .env
const express = require('express');
const cors = require('cors');

const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Routes
app.use('/make-server-2fad19e1/teacher', teacherRoutes);
app.use('/make-server-2fad19e1/student', studentRoutes);
app.use('/make-server-2fad19e1', authRoutes);

// Health check endpoints
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/make-server-2fad19e1/health', (req, res) => res.json({ status: 'ok' }));

// Debug students route (from index.js)
const { requireAuth } = require('./middleware/authMiddleware');
const { kvGet } = require('../database/services/dbService');
app.get('/make-server-2fad19e1/debug/students', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const students = (await kvGet(`students:${user.id}`)) || [];
    return res.json({ students, count: Array.isArray(students) ? students.length : 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

module.exports = app;
