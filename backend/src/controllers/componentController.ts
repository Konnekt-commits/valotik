import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class ComponentController {
  // Mettre à jour un composant
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { categorieName, grade, poids, valeurEstimee, statut } = req.body;

      const component = await prisma.component.update({
        where: { id },
        data: {
          categorieName,
          grade,
          poids,
          valeurEstimee,
          statut,
        },
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Component',
          entiteId: id,
          action: 'UPDATE',
          payload: JSON.stringify({
            categorieName,
            grade,
            poids,
            valeurEstimee,
            statut,
          }),
        },
      });

      const response: ApiResponse = {
        success: true,
        data: component,
        message: 'Composant mis à jour avec succès',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating component:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du composant',
      };
      res.status(500).json(response);
    }
  }

  // Récupérer un composant par ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const component = await prisma.component.findUnique({
        where: { id },
        include: {
          lot: true,
        },
      });

      if (!component) {
        const response: ApiResponse = {
          success: false,
          error: 'Composant non trouvé',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: component,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching component:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération du composant',
      };
      res.status(500).json(response);
    }
  }
}

export default new ComponentController();
