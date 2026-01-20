import { Router } from 'express';
import componentController from '../controllers/componentController';

const router = Router();

// Routes pour les composants
router.get('/:id', componentController.getById.bind(componentController));
router.put('/:id', componentController.update.bind(componentController));

export default router;
