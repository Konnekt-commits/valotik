import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class QuotationController {
  // Ajouter une ligne de devis
  async addLine(req: Request, res: Response): Promise<void> {
    try {
      const { quotationId } = req.params;
      const { typeLigne, description, unite, quantite, prixUnitaire, tauxTVA } = req.body;

      // Vérifier que le devis existe
      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { lines: true },
      });

      if (!quotation) {
        const response: ApiResponse = {
          success: false,
          error: 'Devis non trouvé',
        };
        res.status(404).json(response);
        return;
      }

      // Calculer l'ordre d'affichage (dernier + 1)
      const maxOrdre = quotation.lines.length > 0
        ? Math.max(...quotation.lines.map(l => l.ordreAffichage))
        : 0;

      // Créer la nouvelle ligne
      const newLine = await prisma.quotationLine.create({
        data: {
          quotationId,
          typeLigne,
          description,
          unite,
          quantite: parseFloat(quantite),
          prixUnitaire: parseFloat(prixUnitaire),
          tauxTVA: parseFloat(tauxTVA) || 20,
          ordreAffichage: maxOrdre + 1,
        },
      });

      // Recalculer les totaux du devis
      const allLines = await prisma.quotationLine.findMany({
        where: { quotationId },
      });

      let totalHT = 0;
      allLines.forEach(line => {
        totalHT += line.quantite * line.prixUnitaire;
      });

      const totalTVA = totalHT * 0.2; // TVA à 20%
      const totalTTC = totalHT + totalTVA;

      // Mettre à jour le devis
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          montantHT: totalHT,
          montantTVA: totalTVA,
          montantTTC: totalTTC,
        },
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'QuotationLine',
          entiteId: newLine.id,
          action: 'CREATE',
          payload: JSON.stringify(req.body),
        },
      });

      const response: ApiResponse = {
        success: true,
        data: newLine,
        message: 'Ligne de devis ajoutée avec succès',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error adding quotation line:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de l\'ajout de la ligne de devis',
      };
      res.status(500).json(response);
    }
  }

  // Supprimer une ligne de devis
  async deleteLine(req: Request, res: Response): Promise<void> {
    try {
      const { quotationId, lineId } = req.params;

      // Vérifier que la ligne existe
      const line = await prisma.quotationLine.findUnique({
        where: { id: lineId },
      });

      if (!line || line.quotationId !== quotationId) {
        const response: ApiResponse = {
          success: false,
          error: 'Ligne de devis non trouvée',
        };
        res.status(404).json(response);
        return;
      }

      // Supprimer la ligne
      await prisma.quotationLine.delete({
        where: { id: lineId },
      });

      // Recalculer les totaux du devis
      const allLines = await prisma.quotationLine.findMany({
        where: { quotationId },
      });

      let totalHT = 0;
      allLines.forEach(l => {
        totalHT += l.quantite * l.prixUnitaire;
      });

      const totalTVA = totalHT * 0.2;
      const totalTTC = totalHT + totalTVA;

      // Mettre à jour le devis
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          montantHT: totalHT,
          montantTVA: totalTVA,
          montantTTC: totalTTC,
        },
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'QuotationLine',
          entiteId: lineId,
          action: 'DELETE',
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Ligne de devis supprimée avec succès',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error deleting quotation line:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la suppression de la ligne de devis',
      };
      res.status(500).json(response);
    }
  }

  // Mettre à jour une ligne de devis
  async updateLine(req: Request, res: Response): Promise<void> {
    try {
      const { quotationId, lineId } = req.params;
      const { typeLigne, description, unite, quantite, prixUnitaire, tauxTVA } = req.body;

      // Vérifier que la ligne existe
      const line = await prisma.quotationLine.findUnique({
        where: { id: lineId },
      });

      if (!line || line.quotationId !== quotationId) {
        const response: ApiResponse = {
          success: false,
          error: 'Ligne de devis non trouvée',
        };
        res.status(404).json(response);
        return;
      }

      // Mettre à jour la ligne
      const updatedLine = await prisma.quotationLine.update({
        where: { id: lineId },
        data: {
          typeLigne,
          description,
          unite,
          quantite: parseFloat(quantite),
          prixUnitaire: parseFloat(prixUnitaire),
          tauxTVA: parseFloat(tauxTVA) || 20,
        },
      });

      // Recalculer les totaux du devis
      const allLines = await prisma.quotationLine.findMany({
        where: { quotationId },
      });

      let totalHT = 0;
      allLines.forEach(l => {
        totalHT += l.quantite * l.prixUnitaire;
      });

      const totalTVA = totalHT * 0.2;
      const totalTTC = totalHT + totalTVA;

      // Mettre à jour le devis
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          montantHT: totalHT,
          montantTVA: totalTVA,
          montantTTC: totalTTC,
        },
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'QuotationLine',
          entiteId: lineId,
          action: 'UPDATE',
          payload: JSON.stringify(req.body),
        },
      });

      const response: ApiResponse = {
        success: true,
        data: updatedLine,
        message: 'Ligne de devis mise à jour avec succès',
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating quotation line:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de la ligne de devis',
      };
      res.status(500).json(response);
    }
  }
}

export default new QuotationController();
