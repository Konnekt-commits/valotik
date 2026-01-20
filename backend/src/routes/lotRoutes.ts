import { Router } from 'express';
import lotController from '../controllers/lotController';

const router = Router();

// Créer un lot avec ses composants
router.post('/', lotController.create.bind(lotController));

// Récupérer tous les lots d'un dossier
router.get('/case-file/:caseFileId', lotController.getByCaseFile.bind(lotController));

// Récupérer un lot par ID
router.get('/:id', lotController.getById.bind(lotController));

// Mettre à jour un lot
router.put('/:id', lotController.update.bind(lotController));

// Supprimer un lot
router.delete('/:id', lotController.delete.bind(lotController));

export default router;
