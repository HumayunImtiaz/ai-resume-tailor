import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import jobRoutes from './routes/job.routes';
import coverLetterRoutes from './routes/coverLetter.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/cover-letters', coverLetterRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
