import { Router } from 'express';
import * as objectifController from '../controllers/objectifController';

const router = Router();

// ============================================
// CONFIGURATION DES OBJECTIFS
// ============================================
router.get('/configuration', objectifController.getConfiguration);
router.put('/configuration/:id', objectifController.updateConfiguration);

// ============================================
// OBJECTIFS INDIVIDUELS
// ============================================
router.get('/employees/:employeeId/objectifs', objectifController.getObjectifsIndividuels);
router.post('/employees/:employeeId/objectifs', objectifController.createObjectifIndividuel);
router.put('/objectifs/:id', objectifController.updateObjectifIndividuel);
router.delete('/objectifs/:id', objectifController.deleteObjectifIndividuel);

export default router;
