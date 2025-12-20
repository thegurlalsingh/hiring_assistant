import express from 'express';
import { startMCQ, submitMCQ } from '../controllers/mcqController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/start', verifyToken, startMCQ);
router.post('/submit', verifyToken, submitMCQ);

export default router;