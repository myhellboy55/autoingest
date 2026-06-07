import express from 'express';
import { reportDrives, getDrives, startIngest, ejectDrive } from '../controllers/ingestController.js';

const router = express.Router();

router.post('/report', reportDrives);
router.get('/', getDrives);
router.post('/:driveId/ingest', startIngest);
router.post('/:driveId/eject', ejectDrive);

export default router;
