import express from 'express';
import { login, saveBasicInfo } from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { uploadResume } from "../controllers/resumeController.js"
// import { isHR } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
// router.get('/admin', protectRoute(['hr']), adminOnlyRoute);
// router.post('/basic-info', verifyToken, saveBasicInfo);

router.post('/info_resume', verifyToken, uploadResume);


export default router;