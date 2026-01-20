import { Router } from 'express';
import { saleController, salesChannelController } from '../controllers/saleController';

const router = Router();

// Routes pour les ventes
router.get('/sales', saleController.getAll.bind(saleController));
router.get('/sales/stats', saleController.getStats.bind(saleController));
router.get('/sales/case-files', saleController.getCaseFilesWithSales.bind(saleController));
router.get('/sales/:id', saleController.getById.bind(saleController));
router.get('/sales/rate/:caseFileId', saleController.getSalesRateByRequest.bind(saleController));
router.post('/sales', saleController.create.bind(saleController));
router.put('/sales/:id', saleController.update.bind(saleController));
router.delete('/sales/:id', saleController.delete.bind(saleController));

// Routes pour les canaux de vente
router.get('/sales-channels', salesChannelController.getAll.bind(salesChannelController));
router.post('/sales-channels', salesChannelController.create.bind(salesChannelController));
router.put('/sales-channels/:id', salesChannelController.update.bind(salesChannelController));
router.delete('/sales-channels/:id', salesChannelController.delete.bind(salesChannelController));

export default router;
