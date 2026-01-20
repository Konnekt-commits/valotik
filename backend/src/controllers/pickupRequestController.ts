import { Request, Response } from 'express';
import prisma from '../config/database';
import { CreatePickupRequestDTO, ApiResponse } from '../types';

export class PickupRequestController {
  // Créer une nouvelle demande d'enlèvement
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePickupRequestDTO = req.body;

      // 1. Créer ou récupérer le client
      let client = await prisma.clientCompany.findFirst({
        where: { raisonSociale: data.clientName }
      });

      if (!client) {
        client = await prisma.clientCompany.create({
          data: {
            raisonSociale: data.clientName,
            adresseFacturation: data.siteAddress,
          }
        });
      }

      // 2. Créer le site
      const site = await prisma.clientSite.create({
        data: {
          clientId: client.id,
          nom: data.siteName,
          adresseComplete: data.siteAddress,
        }
      });

      // 3. Créer le contact
      const contact = await prisma.contact.create({
        data: {
          clientId: client.id,
          nom: data.contactName,
          fonction: data.contactFunction,
          telephone: data.contactPhone,
          email: data.contactEmail,
        }
      });

      // 4. Créer la demande d'enlèvement
      const pickupRequest = await prisma.pickupRequest.create({
        data: {
          clientId: client.id,
          siteId: site.id,
          contactId: contact.id,
          descriptionInitiale: data.description,
          categoriePrincipale: data.mainCategory,
          volumeEstime: data.estimatedVolume,
          priorite: data.priority,
          statut: 'diagnostic_pending',
          plannedVisitAt: data.plannedVisitDate ? new Date(data.plannedVisitDate) : null,
          accessNotes: data.accessNotes,
        },
        include: {
          client: true,
          site: true,
          contact: true,
        }
      });

      // 5. Créer automatiquement le dossier (CaseFile)
      const reference = `CF-${new Date().getFullYear()}-${String(await prisma.caseFile.count() + 1).padStart(3, '0')}`;

      const caseFile = await prisma.caseFile.create({
        data: {
          requestId: pickupRequest.id,
          clientId: client.id,
          reference,
          statut: 'diagnostic_pending',
        }
      });

      // 6. Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'PickupRequest',
          entiteId: pickupRequest.id,
          action: 'CREATE',
          payload: JSON.stringify(data),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          pickupRequest,
          caseFile,
        },
        message: 'Demande d\'enlèvement créée avec succès'
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating pickup request:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la création de la demande'
      };
      res.status(500).json(response);
    }
  }

  // Récupérer toutes les demandes
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { statut, priorite, page = 1, limit = 10 } = req.query;

      const where: any = {};
      if (statut) where.statut = statut;
      if (priorite) where.priorite = priorite;

      const skip = (Number(page) - 1) * Number(limit);

      const [pickupRequests, total] = await Promise.all([
        prisma.pickupRequest.findMany({
          where,
          include: {
            client: true,
            site: true,
            contact: true,
            caseFile: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.pickupRequest.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          pickupRequests,
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
      console.error('Error fetching pickup requests:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des demandes'
      };
      res.status(500).json(response);
    }
  }

  // Récupérer une demande par ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const pickupRequest = await prisma.pickupRequest.findUnique({
        where: { id },
        include: {
          client: true,
          site: true,
          contact: true,
          caseFile: {
            include: {
              lots: true,
              quotations: true,
              transportOrders: true,
            }
          }
        }
      });

      if (!pickupRequest) {
        const response: ApiResponse = {
          success: false,
          error: 'Demande non trouvée'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: pickupRequest
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching pickup request:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération de la demande'
      };
      res.status(500).json(response);
    }
  }

  // Mettre à jour une demande
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const pickupRequest = await prisma.pickupRequest.update({
        where: { id },
        data: {
          descriptionInitiale: data.descriptionInitiale,
          categoriePrincipale: data.categoriePrincipale,
          volumeEstime: data.volumeEstime,
          priorite: data.priorite,
          statut: data.statut,
          plannedVisitAt: data.plannedVisitAt ? new Date(data.plannedVisitAt) : undefined,
          accessNotes: data.accessNotes,
        },
        include: {
          client: true,
          site: true,
          contact: true,
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'PickupRequest',
          entiteId: id,
          action: 'UPDATE',
          payload: JSON.stringify(data),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: pickupRequest,
        message: 'Demande mise à jour avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating pickup request:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de la demande'
      };
      res.status(500).json(response);
    }
  }

  // Supprimer une demande
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.pickupRequest.delete({
        where: { id }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'PickupRequest',
          entiteId: id,
          action: 'DELETE',
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Demande supprimée avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error deleting pickup request:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la suppression de la demande'
      };
      res.status(500).json(response);
    }
  }
}

export default new PickupRequestController();
