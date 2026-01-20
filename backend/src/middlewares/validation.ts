import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse } from '../types';

// Middleware pour vérifier les erreurs de validation
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Erreur de validation',
      data: errors.array(),
    };
    res.status(400).json(response);
    return;
  }

  next();
};

// Règles de validation pour la création d'une demande
export const createPickupRequestValidation = [
  body('clientName').trim().notEmpty().withMessage('Le nom du client est requis'),
  body('siteName').trim().notEmpty().withMessage('Le nom du site est requis'),
  body('siteAddress').trim().notEmpty().withMessage('L\'adresse du site est requise'),
  body('contactName').trim().notEmpty().withMessage('Le nom du contact est requis'),
  body('contactPhone').trim().notEmpty().withMessage('Le téléphone est requis'),
  body('contactEmail').isEmail().withMessage('L\'email doit être valide'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('mainCategory').trim().notEmpty().withMessage('La catégorie principale est requise'),
  body('priority').isIn(['high', 'medium', 'low']).withMessage('La priorité doit être high, medium ou low'),
];

// Règles de validation pour la mise à jour d'une demande
export const updatePickupRequestValidation = [
  body('descriptionInitiale').optional().trim(),
  body('categoriePrincipale').optional().trim(),
  body('volumeEstime').optional().trim(),
  body('priorite').optional().isIn(['high', 'medium', 'low']),
  body('statut').optional().trim(),
];
