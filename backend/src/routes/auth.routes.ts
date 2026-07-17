import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Success, returns token and user
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post('/signup', authController.signup);

export default router;
