import { Router } from 'express';
import * as organismeController from '../controllers/organismeController';

const router = Router();

// ============================================
// ORGANISME
// ============================================
router.get('/', organismeController.getOrganisme);
router.put('/', organismeController.upsertOrganisme);

// ============================================
// CONVENTIONS ACI
// ============================================
router.get('/:organismeId/conventions', organismeController.getConventions);
router.get('/conventions/active', organismeController.getConventionActive);
router.post('/conventions', organismeController.createConvention);
router.put('/conventions/:id', organismeController.updateConvention);

// ============================================
// ATELIERS ET CHANTIERS
// ============================================
router.get('/:organismeId/ateliers', organismeController.getAteliers);
router.post('/ateliers', organismeController.createAtelier);
router.put('/ateliers/:id', organismeController.updateAtelier);
router.delete('/ateliers/:id', organismeController.deleteAtelier);

// ============================================
// OBJECTIFS NÉGOCIÉS
// ============================================
router.get('/conventions/:conventionId/objectifs', organismeController.getObjectifsNegocies);
router.put('/conventions/:conventionId/objectifs', organismeController.upsertObjectifsNegocies);

// ============================================
// SUIVI DES OBJECTIFS
// ============================================
router.put('/objectifs/:objectifNegocieId/suivis', organismeController.upsertSuiviObjectif);

// ============================================
// TABLEAU DE BORD
// ============================================
router.get('/dashboard/objectifs', organismeController.getDashboardObjectifs);

export default router;
