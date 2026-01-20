import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class LotController {
  // Créer un lot avec ses composants
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { caseFileId, lot, components } = req.body;

      // Validation
      if (!caseFileId || !lot || !components || components.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'caseFileId, lot et components (non vide) sont requis',
        };
        res.status(400).json(response);
        return;
      }

      // Vérifier que le dossier existe
      const caseFile = await prisma.caseFile.findUnique({
        where: { id: caseFileId },
      });

      if (!caseFile) {
        const response: ApiResponse = {
          success: false,
          error: 'Dossier non trouvé',
        };
        res.status(404).json(response);
        return;
      }

      // Générer un code unique pour le lot
      const lotCount = await prisma.lot.count();
      const lotCode = `LOT-${String(lotCount + 1).padStart(6, '0')}`;

      // Générer un QR code (pour l'instant, on utilise juste le code du lot)
      const qrCode = lotCode;

      // Créer le lot avec ses composants en une seule transaction
      const createdLot = await prisma.lot.create({
        data: {
          code: lotCode,
          qrCode: qrCode,
          caseFileId: caseFileId,
          categorieName: lot.categorie,
          grade: lot.grade,
          orientation: lot.orientation,
          poidsEstime: lot.poidsEstime ? parseFloat(lot.poidsEstime) : 0,
          notes: lot.notes || '',
          statut: 'en_stock',
          // Créer les composants associés
          components: {
            create: components.map((comp: any) => ({
              type: comp.type,
              marque: comp.marque || '',
              modele: comp.modele || '',
              numeroSerie: comp.numeroSerie || '',
              etat: comp.etat,
              notes: comp.notes || '',
            })),
          },
        },
        include: {
          components: true,
          caseFile: {
            select: {
              reference: true,
            },
          },
        },
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Lot',
          entiteId: createdLot.id,
          action: 'CREATE',
          payload: JSON.stringify({
            lotCode: createdLot.code,
            categorie: lot.categorie,
            grade: lot.grade,
            componentsCount: components.length,
          }),
        },
      });

      const response: ApiResponse = {
        success: true,
        data: createdLot,
        message: `Lot ${lotCode} créé avec succès avec ${components.length} composant(s)`,
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating lot:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la création du lot',
      };
      res.status(500).json(response);
    }
  }

  // Récupérer tous les lots d'un dossier
  async getByCaseFile(req: Request, res: Response): Promise<void> {
    try {
      const { caseFileId } = req.params;

      const lots = await prisma.lot.findMany({
        where: { caseFileId },
        include: {
          components: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const response: ApiResponse = {
        success: true,
        data: lots,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching lots:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des lots',
      };
      res.status(500).json(response);
    }
  }

  // Récupérer un lot par ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const lot = await prisma.lot.findUnique({
        where: { id },
        include: {
          components: true,
          caseFile: {
            select: {
              reference: true,
              pickupRequest: {
                select: {
                  client: {
                    select: {
                      raisonSociale: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!lot) {
        const response: ApiResponse = {
          success: false,
          error: 'Lot non trouvé',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: lot,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching lot:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération du lot',
      };
      res.status(500).json(response);
    }
  }

  // Mettre à jour un lot
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { grade, orientation, poidsReel, statut, notes } = req.body;

      const updateData: any = {};
      if (grade !== undefined) updateData.grade = grade;
      if (orientation !== undefined) updateData.orientation = orientation;
      if (poidsReel !== undefined) updateData.poidsReel = parseFloat(poidsReel);
      if (statut !== undefined) updateData.statut = statut;
      if (notes !== undefined) updateData.notes = notes;

      const lot = await prisma.lot.update({
        where: { id },
        data: updateData,
        include: {
          components: true,
        },
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Lot',
          entiteId: id,
          action: 'UPDATE',
          payload: JSON.stringify(updateData),
        },
      });

      const response: ApiResponse = {
        success: true,
        data: lot,
        message: 'Lot mis à jour avec succès',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating lot:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du lot',
      };
      res.status(500).json(response);
    }
  }

  // Supprimer un lot
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Supprimer d'abord les composants associés
      await prisma.component.deleteMany({
        where: { lotId: id },
      });

      // Ensuite supprimer le lot
      await prisma.lot.delete({
        where: { id },
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Lot',
          entiteId: id,
          action: 'DELETE',
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Lot supprimé avec succès',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error deleting lot:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la suppression du lot',
      };
      res.status(500).json(response);
    }
  }
}

export default new LotController();
