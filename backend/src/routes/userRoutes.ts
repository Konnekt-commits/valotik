import { Router } from 'express';
import userController from '../controllers/userController';

const router = Router();

// Routes pour les utilisateurs/personnel
router.get('/', userController.getAll.bind(userController));
router.get('/statistics', userController.getStatistics.bind(userController));
router.get('/:id', userController.getById.bind(userController));
router.post('/', userController.create.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.delete('/:id', userController.delete.bind(userController));

export default router;
