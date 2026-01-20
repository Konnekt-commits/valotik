import { Router } from 'express';
import aiController from '../controllers/aiController';

const router = Router();

// Routes pour l'IA
router.post('/analyze-conversation', aiController.analyzeConversation.bind(aiController));
router.post('/create-pickup-from-conversation', aiController.createPickupFromConversation.bind(aiController));

export default router;
