import express from 'express';
import { uploadVideo, transcribeVideo, startVideoRound, submitVideoAnswer } from '../controllers/videoController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/upload', verifyToken, uploadVideo);
router.post('/transcribe', verifyToken, transcribeVideo);
router.get('/start', verifyToken, startVideoRound);
router.post('/submit', verifyToken, submitVideoAnswer);

export default router;