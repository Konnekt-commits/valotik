import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import prisma from './config/database';

// Charger les variables d'environnement
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middlewares de sécurité et utilitaires
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// CORS - Autoriser les requêtes depuis le frontend
app.use(cors({
  origin: true,
  credentials: true,
}));

// Parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes de l'API
app.use('/api', routes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API D3E Collection Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      pickupRequests: '/api/pickup-requests',
      caseFiles: '/api/case-files',
    },
  });
});

// Gestion des erreurs
app.use(notFoundHandler);
app.use(errorHandler);

// Démarrer le serveur
const server = app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);

  // Tester la connexion à la base de données
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️  Make sure PostgreSQL is running and DATABASE_URL is configured in .env\n');
  }
});

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  });
});

export default app;
