import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// POST /api/auth/signup - Register a new user account (Rate limited)
router.post('/signup', authLimiter, authController.signup);

// POST /api/auth/login - Authenticate user & receive JWT token (Rate limited)
router.post('/login', authLimiter, authController.login);

// GET /api/auth/me - Retrieve current authenticated user profile
router.get('/me', requireAuth, authController.getProfile);

// POST /api/auth/logout - Log out user and clear auth cookies
router.post('/logout', authController.logout);

export default router;
