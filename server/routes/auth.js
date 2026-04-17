const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/student/signup', authController.studentSignup);

module.exports = router;
