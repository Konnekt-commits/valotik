import { Router } from 'express';
import categoryController from '../controllers/categoryController';

const router = Router();

// GET /api/categories - Récupérer toutes les catégories avec leurs sous-catégories
router.get('/', categoryController.getAll);

// GET /api/categories/:id - Récupérer une catégorie par ID
router.get('/:id', categoryController.getById);

// GET /api/categories/:categoryId/sub-categories - Récupérer les sous-catégories d'une catégorie
router.get('/:categoryId/sub-categories', categoryController.getSubCategories);

export default router;
