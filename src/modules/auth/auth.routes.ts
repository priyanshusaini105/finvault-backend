import { Router, type Router as RouterType } from 'express';
import { register, login, getMe } from './auth.controller';
import { validate } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';
import {
  registerSchema,
  loginSchema,
} from './auth.schemas';

const router: RouterType = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, getMe);

export default router;
