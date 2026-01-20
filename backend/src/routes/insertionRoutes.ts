import { Router } from 'express';
import * as insertionController from '../controllers/insertionController';

const router = Router();

// ============================================
// DASHBOARD & STATISTIQUES
// ============================================
router.get('/stats', insertionController.getInsertionStats);
router.get('/alertes', insertionController.getAlertes);
router.get('/agenda', insertionController.getAgendaEvents);
router.get('/rapport/dialogue-gestion', insertionController.getRapportDialogueGestion);

// ============================================
// SALARIÉS
// ============================================
router.get('/employees', insertionController.getInsertionEmployees);
router.get('/employees/:id', insertionController.getInsertionEmployee);
router.post('/employees', insertionController.createInsertionEmployee);
router.put('/employees/:id', insertionController.updateInsertionEmployee);
router.delete('/employees/:id', insertionController.deleteInsertionEmployee);

// Rapport individuel
router.get('/employees/:id/rapport', insertionController.getRapportIndividuel);

// Parcours visuel
router.get('/employees/:id/parcours', insertionController.getParcours);

// ============================================
// FICHE PRO
// ============================================
router.put('/employees/:employeeId/fiche-pro', insertionController.createOrUpdateFichePro);

// ============================================
// SUIVIS / ENTRETIENS
// ============================================
router.get('/employees/:employeeId/suivis', insertionController.getSuivis);
router.post('/employees/:employeeId/suivis', insertionController.createSuivi);
router.put('/suivis/:id', insertionController.updateSuivi);
router.delete('/suivis/:id', insertionController.deleteSuivi);

// ============================================
// CONVENTIONS PMSMP
// ============================================
router.get('/employees/:employeeId/pmsmp', insertionController.getConventionsPMSMP);
router.post('/employees/:employeeId/pmsmp', insertionController.createConventionPMSMP);
router.put('/pmsmp/:id', insertionController.updateConventionPMSMP);

// ============================================
// DOCUMENTS
// ============================================
router.get('/employees/:employeeId/documents', insertionController.getDocuments);
router.post('/employees/:employeeId/documents', insertionController.createDocument);
router.delete('/documents/:id', insertionController.deleteDocument);

// ============================================
// CONTRATS
// ============================================
router.get('/employees/:employeeId/contrats', insertionController.getContrats);
router.post('/employees/:employeeId/contrats', insertionController.createContrat);
router.put('/contrats/:id', insertionController.updateContrat);

// ============================================
// AVERTISSEMENTS
// ============================================
router.post('/employees/:employeeId/avertissements', insertionController.createAvertissement);

// ============================================
// FORMATIONS
// ============================================
router.get('/employees/:employeeId/formations', insertionController.getFormations);
router.post('/employees/:employeeId/formations', insertionController.createFormation);
router.put('/formations/:id', insertionController.updateFormation);

export default router;
