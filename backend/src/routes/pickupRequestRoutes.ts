import { Router } from 'express';
import pickupRequestController from '../controllers/pickupRequestController';
import { createPickupRequestValidation, updatePickupRequestValidation, validate } from '../middlewares/validation';

const router = Router();

// Routes pour les demandes d'enlèvement
router.post('/', createPickupRequestValidation, validate, pickupRequestController.create.bind(pickupRequestController));
router.get('/', pickupRequestController.getAll.bind(pickupRequestController));
router.get('/:id', pickupRequestController.getById.bind(pickupRequestController));
router.put('/:id', updatePickupRequestValidation, validate, pickupRequestController.update.bind(pickupRequestController));
router.delete('/:id', pickupRequestController.delete.bind(pickupRequestController));

export default router;
