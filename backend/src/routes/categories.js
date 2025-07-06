import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { listCategories, createCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', authenticate, listCategories);
router.post('/', authenticate, createCategory);

export default router; 