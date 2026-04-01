import express, { type Express } from 'express';
import { errorHandler } from '@/middleware/error';
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import recordsRoutes from '@/modules/records/records.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';

const app: Express = express();

// Body parsing
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'FinVault API is running' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
