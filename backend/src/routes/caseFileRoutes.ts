import { Router } from 'express';
import caseFileController from '../controllers/caseFileController';

const router = Router();

// Routes pour les dossiers
router.get('/', caseFileController.getAll.bind(caseFileController));
router.get('/:id/users', caseFileController.getAssignedUsers.bind(caseFileController));
router.get('/:id/close', caseFileController.close.bind(caseFileController));
router.get('/:id', caseFileController.getById.bind(caseFileController));
router.put('/:id', caseFileController.update.bind(caseFileController));
router.post('/:id/close', caseFileController.close.bind(caseFileController));

export default router;
