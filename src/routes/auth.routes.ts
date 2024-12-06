import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';
import { RequestHandler } from 'express';

const router = Router();

// Public routes
router.post('/register', register as RequestHandler);
router.post('/login', login as RequestHandler);

// Protected routes
router.get('/profile', auth, getProfile as RequestHandler);

export default router; 