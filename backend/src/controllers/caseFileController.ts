import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class CaseFileController {
  // Récupérer tous les dossiers
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { statut, clientId, page = 1, limit = 100 } = req.query;

      const where: any = {};
      if (statut) where.statut = statut;
      if (clientId) where.clientId = clientId;

      const skip = (Number(page) - 1) * Number(limit);

      const [caseFiles, total] = await Promise.all([
        prisma.caseFile.findMany({
          where,
          include: {
            request: {
              include: {
                client: true,
                site: true,
                contact: true,
              }
            },
            lots: {
              include: {
                components: {
                  include: {
                    subCategory: {
                      include: {
                        category: true,
                      }
                    }
                  }
                },
              }
            },
            quotations: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            documents: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.caseFile.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          caseFiles,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching case files:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des dossiers'
      };
      res.status(500).json(response);
    }
  }

  // Récupérer un dossier par ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const caseFile = await prisma.caseFile.findUnique({
        where: { id },
        include: {
          request: {
            include: {
              client: true,
              site: true,
              contact: true,
            }
          },
          diagnosis: true,
          lots: {
            include: {
              components: {
                include: {
                  subCategory: {
                    include: {
                      category: true,
                    }
                  }
                }
              },
            }
          },
          quotations: {
            include: {
              lines: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          transportOrders: true,
          documents: true,
        }
      });

      if (!caseFile) {
        const response: ApiResponse = {
          success: false,
          error: 'Dossier non trouvé'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: caseFile
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching case file:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération du dossier'
      };
      res.status(500).json(response);
    }
  }

  // Mettre à jour un dossier
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { statut, poidsEstime, poidsReel, valeurTotale } = req.body;

      const caseFile = await prisma.caseFile.update({
        where: { id },
        data: {
          statut,
          poidsEstime,
          poidsReel,
          valeurTotale,
        },
        include: {
          request: {
            include: {
              client: true,
              site: true,
            }
          }
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'CaseFile',
          entiteId: id,
          action: 'UPDATE',
          payload: JSON.stringify(req.body),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: caseFile,
        message: 'Dossier mis à jour avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating case file:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du dossier'
      };
      res.status(500).json(response);
    }
  }

  // Clôturer un dossier
  async close(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const caseFile = await prisma.caseFile.update({
        where: { id },
        data: {
          statut: 'completed',
          closedAt: new Date(),
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'CaseFile',
          entiteId: id,
          action: 'CLOSE',
        }
      });

      const response: ApiResponse = {
        success: true,
        data: caseFile,
        message: 'Dossier clôturé avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error closing case file:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la clôture du dossier'
      };
      res.status(500).json(response);
    }
  }

  // Récupérer les utilisateurs assignés à un dossier
  async getAssignedUsers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const assignments = await prisma.caseFileAssignment.findMany({
        where: { caseFileId: id },
        include: {
          user: true,
        }
      });

      const users = assignments.map(assignment => assignment.user);

      const response: ApiResponse = {
        success: true,
        data: users
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching assigned users:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des utilisateurs assignés'
      };
      res.status(500).json(response);
    }
  }
}

export default new CaseFileController();
