import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadReceipt, uploadHistory } from '../controllers/receiptController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authenticate, upload.single('file'), uploadReceipt);
router.post('/upload-history', authenticate, upload.single('file'), uploadHistory);

export default router; 