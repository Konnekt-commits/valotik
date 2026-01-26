import { Router } from 'express';
import { login, requireAuth, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

// Route de login pour RH Insertion
router.post('/login', login);

// Route pour vérifier si le token est valide
router.get('/verify', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

export default router;
