import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedInitialData } from './server/services/seedService';
import authRoutes from './server/routes/authRoutes';
import dashboardRoutes from './server/routes/dashboardRoutes';
import transactionRoutes from './server/routes/transactionRoutes';
import budgetRoutes from './server/routes/budgetRoutes';
import savingsRoutes from './server/routes/savingsRoutes';
import aiRoutes from './server/routes/aiRoutes';
import resourceRoutes from './server/routes/resourceRoutes';
import documentRoutes from './server/routes/documentRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import educationRoutes from './server/routes/educationRoutes';
import adminRoutes from './server/routes/adminRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers (support base64 doc upload up to 10MB)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security headers & basic protection
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'FINOVA Core API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/savings', savingsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/education', educationRoutes);
  app.use('/api/admin', adminRoutes);

  // Seed default data if database is fresh
  try {
    await seedInitialData();
  } catch (err) {
    console.error('Initial data seeding notice:', err);
  }

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FINOVA server running on http://localhost:${PORT}`);
  });
}

startServer();
