import { startCodingRound } from "../controllers/codingController.js";
import { verifyToken } from "../middlewares/authMiddleware.js"
import { submitCodingSolution } from "../controllers/codingController.js";
import express from 'express';


const router = express.Router();

router.get('/start', verifyToken, startCodingRound);
router.post('/submit', verifyToken, submitCodingSolution);

export default router;