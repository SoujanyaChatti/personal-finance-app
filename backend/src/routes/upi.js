import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  syncUPITransactions,
  getUPITransactions,
  importTransactions,
  getAnalytics,
  updateCategory,
  getUPIAppsSummary,
  getConnections,
  getOAuthUrl,
  handleOAuthCallback,
  disconnectApp
} from '../controllers/upiController.js';

const router = express.Router();

// UPI connection management
router.get('/connections', authenticate, getConnections);
router.get('/oauth/:upiApp', authenticate, getOAuthUrl);
router.get('/oauth/callback', authenticate, handleOAuthCallback);
router.delete('/connections/:upiApp', authenticate, disconnectApp);

// UPI transaction management
router.post('/sync', authenticate, syncUPITransactions);
router.get('/transactions', authenticate, getUPITransactions);
router.post('/import', authenticate, importTransactions);
router.put('/transactions/:transactionId/category', authenticate, updateCategory);

// UPI analytics
router.get('/analytics', authenticate, getAnalytics);
router.get('/apps-summary', authenticate, getUPIAppsSummary);

export default router; 