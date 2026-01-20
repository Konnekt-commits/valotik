import { Router } from 'express';
import quotationController from '../controllers/quotationController';

const router = Router();

// POST /api/quotations/:quotationId/lines - Ajouter une ligne de devis
router.post('/:quotationId/lines', quotationController.addLine);

// PUT /api/quotations/:quotationId/lines/:lineId - Mettre à jour une ligne de devis
router.put('/:quotationId/lines/:lineId', quotationController.updateLine);

// DELETE /api/quotations/:quotationId/lines/:lineId - Supprimer une ligne de devis
router.delete('/:quotationId/lines/:lineId', quotationController.deleteLine);

export default router;
