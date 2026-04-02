import express, { type Express } from 'express';
import { errorHandler } from '@/middleware/error';
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import recordsRoutes from '@/modules/records/records.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';

const app: Express = express();

// Body parsing
app.use(express.json());

const getSwaggerServers = () => {
  const servers = [];
  
  // Add production server if API_URL is set
  const apiUrl = process.env.API_URL;
  if (apiUrl) {
    servers.push({ url: apiUrl, description: 'Production' });
  }
  
  // Always include localhost for development
  servers.push({ url: 'http://localhost:3000/api', description: 'Development' });
  
  return servers;
};

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinVault API',
      version: '1.0.0',
      description: 'Finance data processing and access control backend API',
    },
    servers: getSwaggerServers(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/app.ts', './src/modules/**/*.routes.ts'],
});

app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     description: Check if the API is running
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: FinVault API is running
 */
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'FinVault API is running' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
