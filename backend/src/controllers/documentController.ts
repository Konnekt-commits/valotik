import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class DocumentController {
  // Récupérer les documents d'un dossier
  async getByCaseFile(req: Request, res: Response): Promise<void> {
    try {
      const { caseFileId } = req.params;

      const documents = await prisma.document.findMany({
        where: { caseFileId },
        orderBy: { createdAt: 'desc' },
      });

      const response: ApiResponse = {
        success: true,
        data: documents
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des documents'
      };
      res.status(500).json(response);
    }
  }

  // Upload d'un nouveau document
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const { caseFileId } = req.params;
      const file = req.file;

      if (!file) {
        const response: ApiResponse = {
          success: false,
          error: 'Aucun fichier fourni'
        };
        res.status(400).json(response);
        return;
      }

      // Déterminer le type de document basé sur l'extension
      let docType = 'autre';
      const fileName = file.originalname.toLowerCase();
      if (fileName.includes('devis')) docType = 'devis';
      else if (fileName.includes('pesee') || fileName.includes('pesée')) docType = 'bon_pesée';
      else if (fileName.includes('certificat')) docType = 'certificat';
      else if (fileName.includes('photo') || file.mimetype.startsWith('image/')) docType = 'photo';

      const document = await prisma.document.create({
        data: {
          caseFileId,
          type: docType,
          nomFichier: file.originalname,
          url: `/uploads/documents/${file.filename}`,
          taille: file.size,
          auteurId: null, // TODO: récupérer l'ID de l'utilisateur connecté
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Document',
          entiteId: document.id,
          action: 'UPLOAD',
          payload: JSON.stringify({
            fileName: file.originalname,
            size: file.size,
            caseFileId,
          }),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document uploadé avec succès'
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de l\'upload du document'
      };
      res.status(500).json(response);
    }
  }

  // Sauvegarder un document généré (HTML)
  async saveGenerated(req: Request, res: Response): Promise<void> {
    try {
      const { caseFileId } = req.params;
      const { filename, htmlContent, documentType } = req.body;

      if (!filename || !htmlContent) {
        const response: ApiResponse = {
          success: false,
          error: 'Nom de fichier et contenu HTML requis'
        };
        res.status(400).json(response);
        return;
      }

      // Déterminer le type de document
      const docTypeMap: Record<string, string> = {
        'BSDD': 'bordereau_dd',
        'BSDA': 'bordereau_da',
        'BORDEAU_BATTERIES': 'bordereau_batteries',
        'ATTESTATION_EFFACEMENT': 'attestation_effacement'
      };

      const docType = docTypeMap[documentType] || 'document_interne';

      const document = await prisma.document.create({
        data: {
          caseFileId,
          type: docType,
          nomFichier: filename,
          url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`,
          taille: htmlContent.length,
          auteurId: null,
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Document',
          entiteId: document.id,
          action: 'GENERATE',
          payload: JSON.stringify({
            fileName: filename,
            documentType,
            caseFileId,
          }),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document ajouté au dossier avec succès'
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error saving generated document:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la sauvegarde du document'
      };
      res.status(500).json(response);
    }
  }

  // Supprimer un document
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const document = await prisma.document.delete({
        where: { id }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Document',
          entiteId: id,
          action: 'DELETE',
        }
      });

      const response: ApiResponse = {
        success: true,
        data: document,
        message: 'Document supprimé avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error deleting document:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la suppression du document'
      };
      res.status(500).json(response);
    }
  }
}

export default new DocumentController();
