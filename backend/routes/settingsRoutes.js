import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

// GET /api/settings - Get current settings
router.get('/', getSettings);

// PUT /api/settings - Update settings
router.put('/', updateSettings);

export default router;
