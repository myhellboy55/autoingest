import express from 'express';
import { getJob } from '../controllers/ingestController.js';

const router = express.Router();

router.get('/:jobId', getJob);

export default router;
