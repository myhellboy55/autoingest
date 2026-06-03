import express from 'express';
import { upload } from '../config/storage.js';
import { handleUpload, getUploadHistory, getUploadStats, clearHistory } from '../controllers/uploadController.js';
import errorHandler from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/upload - Handle file uploads
router.post('/', upload.array('files', 100), handleUpload);

// GET /api/upload/history - Get upload history
router.get('/history', getUploadHistory);

// GET /api/upload/stats - Get upload statistics
router.get('/stats', getUploadStats);

// DELETE /api/upload/history - Clear upload history
router.delete('/history', clearHistory);

// Error handling for this router
router.use(errorHandler);

export default router;
