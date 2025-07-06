import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { register, login, getProfile, updateProfile, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/reset-password', authenticate, resetPassword);

export default router; 