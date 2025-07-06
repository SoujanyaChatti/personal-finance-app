import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCurrentBudget,
  updateBudget,
  getBudgetAnalytics
} from '../controllers/budgetController.js';

const router = express.Router();

router.get('/', authenticate, getCurrentBudget);
router.put('/', authenticate, updateBudget);
router.get('/analytics', authenticate, getBudgetAnalytics);

export default router; 