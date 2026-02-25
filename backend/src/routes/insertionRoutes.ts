import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as insertionController from '../controllers/insertionController';

const router = Router();

// Configuration multer pour l'upload en mémoire (pour GCS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé (${file.mimetype}). Formats acceptés : PDF, JPG, PNG, DOC, DOCX`));
    }
  }
});

// Wrapper pour capturer les erreurs multer et renvoyer un message clair
const handleUpload = (fieldName: string) => (req: Request, res: Response, next: NextFunction) => {
  const uploadMiddleware = upload.single(fieldName);
  uploadMiddleware(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'Le fichier est trop volumineux (max 10 Mo)' });
      }
      return res.status(400).json({ success: false, error: err.message || 'Erreur lors de l\'upload du fichier' });
    }
    next();
  });
};

// ============================================
// DASHBOARD & STATISTIQUES
// ============================================
router.get('/stats', insertionController.getInsertionStats);
router.get('/alertes', insertionController.getAlertes);
router.get('/agenda', insertionController.getAgendaEvents);
router.get('/rapport/dialogue-gestion', insertionController.getRapportDialogueGestion);

// ============================================
// SYNCHRONISATION
// ============================================
router.post('/employees/sync', insertionController.syncEmployees);

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
router.post('/employees/:employeeId/documents', handleUpload('file'), insertionController.createDocument);
router.get('/documents/:id/download', insertionController.downloadDocument);
router.delete('/documents/:id', insertionController.deleteDocument);

// ============================================
// CONTRATS
// ============================================
router.get('/employees/:employeeId/contrats', insertionController.getContrats);
router.post('/employees/:employeeId/contrats', insertionController.createContrat);
router.put('/contrats/:id', insertionController.updateContrat);
router.get('/contrats/:id', insertionController.getContrat);
router.post('/contrats/:id/generate-signing-link', insertionController.generateSigningLink);

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

// ============================================
// FICHES DE PAIE
// ============================================
router.get('/employees/:employeeId/fiches-paie', insertionController.getFichesPaie);
router.post('/employees/:employeeId/fiches-paie', handleUpload('file'), insertionController.createFichePaie);
router.get('/fiches-paie/:id/download', insertionController.downloadFichePaie);
router.delete('/fiches-paie/:id', insertionController.deleteFichePaie);

export default router;
