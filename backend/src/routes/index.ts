import { Router } from 'express';
import pickupRequestRoutes from './pickupRequestRoutes';
import caseFileRoutes from './caseFileRoutes';
import userRoutes from './userRoutes';
import documentRoutes from './documentRoutes';
import componentRoutes from './componentRoutes';
import categoryRoutes from './categoryRoutes';
import quotationRoutes from './quotationRoutes';
import saleRoutes from './saleRoutes';
import endCustomerRoutes from './endCustomerRoutes';
import aiRoutes from './aiRoutes';
import lotRoutes from './lotRoutes';
import insertionRoutes from './insertionRoutes';
import pointageRoutes from './pointageRoutes';
import objectifRoutes from './objectifRoutes';
import organismeRoutes from './organismeRoutes';

const router = Router();

// Monter les routes
router.use('/pickup-requests', pickupRequestRoutes);
router.use('/case-files', caseFileRoutes);
router.use('/users', userRoutes);
router.use('/components', componentRoutes);
router.use('/categories', categoryRoutes);
router.use('/quotations', quotationRoutes);
router.use('/end-customers', endCustomerRoutes);
router.use('/ai', aiRoutes);
router.use('/lots', lotRoutes);
router.use('/insertion', insertionRoutes);
router.use('/pointage', pointageRoutes);
router.use('/objectifs', objectifRoutes);
router.use('/organisme', organismeRoutes);
router.use('/', saleRoutes);
router.use('/', documentRoutes);

// Route de santé
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API D3E Collection - Backend is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
