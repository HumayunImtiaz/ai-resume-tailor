import express from 'express';
import { analyzeMatch } from './services/ai.service';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import jobRoutes from './routes/job.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TEMPORARY - remove after testing
app.post('/api/test-ai', async (req, res) => {
  const { resumeText, jobText } = req.body;
  const result = await analyzeMatch(resumeText, jobText);
  res.json(result);
});

export default app;
