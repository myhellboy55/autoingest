import express from 'express';
import { reportDrives, getDrives, startIngest } from '../controllers/ingestController.js';

const router = express.Router();

router.post('/report', reportDrives);
router.get('/', getDrives);
router.post('/:driveId/ingest', startIngest);

export default router;
