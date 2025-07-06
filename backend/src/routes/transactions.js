import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  getAnalytics,
} from '../controllers/transactionController.js';

const router = express.Router();

router.post('/', authenticate, createTransaction);
router.get('/', authenticate, listTransactions);
router.get('/analytics', authenticate, getAnalytics);
router.put('/:id', authenticate, updateTransaction);
router.delete('/:id', authenticate, deleteTransaction);

export default router; 