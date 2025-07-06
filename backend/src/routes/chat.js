import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { chatWithGemini, getUserConversations, getConversationById } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', authenticate, chatWithGemini);
router.get('/conversations', authenticate, getUserConversations);
router.get('/conversations/:id', authenticate, getConversationById);

export default router; 