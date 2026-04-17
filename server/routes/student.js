const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/profile', studentController.getProfile);
router.get('/data', studentController.getData);
router.get('/dashboard', studentController.getDashboard);
router.get('/notifications', studentController.getNotifications);
router.post('/notifications/read', studentController.markNotificationRead);
router.post('/profile/update', studentController.updateProfile);
router.post('/quiz/submit', studentController.submitQuiz);
// Note: In original code, quest was mapped to /make-server-2fad19e1/quest directly, but we can mount it here
router.get('/quest', studentController.getQuest);

module.exports = router;
