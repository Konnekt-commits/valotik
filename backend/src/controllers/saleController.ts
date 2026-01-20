import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class SaleController {
  // Récupérer toutes les ventes
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        caseFileId,
        salesChannelId,
        statut,
        vendeurId,
        dateDebut,
        dateFin,
        page = 1,
        limit = 50
      } = req.query;

      const where: any = {};
      if (caseFileId) where.caseFileId = caseFileId;
      if (salesChannelId) where.salesChannelId = salesChannelId;
      if (statut) where.statut = statut;
      if (vendeurId) where.vendeurId = vendeurId;

      // Filtrage par plage de dates
      if (dateDebut || dateFin) {
        where.dateVente = {};
        if (dateDebut) where.dateVente.gte = new Date(dateDebut as string);
        if (dateFin) where.dateVente.lte = new Date(dateFin as string);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [sales, total] = await Promise.all([
        prisma.sale.findMany({
          where,
          include: {
            caseFile: {
              include: {
                request: {
                  include: {
                    client: true,
                  }
                }
              }
            },
            lot: true,
            component: {
              include: {
                subCategory: {
                  include: {
                    category: true
                  }
                }
              }
            },
            salesChannel: true,
          },
          orderBy: { dateVente: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.sale.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          sales,
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
      console.error('Error fetching sales:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des ventes'
      };
      res.status(500).json(response);
    }
  }

  // Récupérer une vente par ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          caseFile: {
            include: {
              request: {
                include: {
                  client: true,
                  site: true,
                }
              }
            }
          },
          lot: true,
          component: {
            include: {
              subCategory: {
                include: {
                  category: true
                }
              }
            }
          },
          salesChannel: true,
        }
      });

      if (!sale) {
        const response: ApiResponse = {
          success: false,
          error: 'Vente non trouvée'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: sale
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération de la vente'
      };
      res.status(500).json(response);
    }
  }

  // Créer une nouvelle vente
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        caseFileId,
        lotId,
        componentId,
        salesChannelId,
        productName,
        quantity,
        grade,
        prixUnitaire,
        tauxTVA,
        acheteurNom,
        acheteurEmail,
        acheteurTelephone,
        vendeurId,
        vendeurNom,
        modePaiement,
        notes,
        dateVente,
      } = req.body;

      // Calculer les montants
      const montantHT = prixUnitaire * quantity;
      const montantTVA = montantHT * (tauxTVA / 100);
      const montantTTC = montantHT + montantTVA;

      // Générer une référence unique
      const count = await prisma.sale.count();
      const reference = `VT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      const sale = await prisma.sale.create({
        data: {
          reference,
          caseFileId,
          lotId,
          componentId,
          salesChannelId,
          productName,
          quantity,
          grade,
          prixUnitaire,
          montantHT,
          montantTVA,
          montantTTC,
          tauxTVA,
          acheteurNom,
          acheteurEmail,
          acheteurTelephone,
          vendeurId,
          vendeurNom,
          modePaiement,
          notes,
          dateVente: dateVente ? new Date(dateVente) : new Date(),
          statut: 'completed',
        },
        include: {
          caseFile: true,
          lot: true,
          component: true,
          salesChannel: true,
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Sale',
          entiteId: sale.id,
          action: 'CREATE',
          payload: JSON.stringify(req.body),
          userId: vendeurId,
        }
      });

      const response: ApiResponse = {
        success: true,
        data: sale,
        message: 'Vente créée avec succès'
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating sale:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la création de la vente'
      };
      res.status(500).json(response);
    }
  }

  // Mettre à jour une vente
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Recalculer les montants si les valeurs changent
      if (updateData.prixUnitaire || updateData.quantity || updateData.tauxTVA) {
        const currentSale = await prisma.sale.findUnique({ where: { id } });
        if (!currentSale) {
          const response: ApiResponse = {
            success: false,
            error: 'Vente non trouvée'
          };
          res.status(404).json(response);
          return;
        }

        const prixUnitaire = updateData.prixUnitaire || currentSale.prixUnitaire;
        const quantity = updateData.quantity || currentSale.quantity;
        const tauxTVA = updateData.tauxTVA || currentSale.tauxTVA;

        const montantHT = prixUnitaire * quantity;
        const montantTVA = montantHT * (tauxTVA / 100);
        const montantTTC = montantHT + montantTVA;

        updateData.montantHT = montantHT;
        updateData.montantTVA = montantTVA;
        updateData.montantTTC = montantTTC;
      }

      const sale = await prisma.sale.update({
        where: { id },
        data: updateData,
        include: {
          caseFile: true,
          lot: true,
          component: true,
          salesChannel: true,
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Sale',
          entiteId: id,
          action: 'UPDATE',
          payload: JSON.stringify(req.body),
          userId: updateData.vendeurId,
        }
      });

      const response: ApiResponse = {
        success: true,
        data: sale,
        message: 'Vente mise à jour avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating sale:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de la vente'
      };
      res.status(500).json(response);
    }
  }

  // Supprimer (annuler) une vente
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Au lieu de supprimer, on change le statut en "cancelled"
      const sale = await prisma.sale.update({
        where: { id },
        data: { statut: 'cancelled' }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'Sale',
          entiteId: id,
          action: 'CANCEL',
        }
      });

      const response: ApiResponse = {
        success: true,
        data: sale,
        message: 'Vente annulée avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error cancelling sale:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de l\'annulation de la vente'
      };
      res.status(500).json(response);
    }
  }

  // Obtenir les statistiques de ventes
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { dateDebut, dateFin, caseFileId } = req.query;

      const where: any = { statut: 'completed' };

      if (dateDebut || dateFin) {
        where.dateVente = {};
        if (dateDebut) where.dateVente.gte = new Date(dateDebut as string);
        if (dateFin) where.dateVente.lte = new Date(dateFin as string);
      }

      if (caseFileId) where.caseFileId = caseFileId;

      // Statistiques globales
      const [totalVentes, revenueData, salesByChannel, salesByVendor, salesByGrade] = await Promise.all([
        prisma.sale.count({ where }),
        prisma.sale.aggregate({
          where,
          _sum: {
            montantTTC: true,
            montantHT: true,
            quantity: true,
          },
          _avg: {
            montantTTC: true,
          }
        }),
        prisma.sale.groupBy({
          by: ['salesChannelId'],
          where,
          _sum: {
            montantTTC: true,
            quantity: true,
          },
          _count: true,
        }),
        prisma.sale.groupBy({
          by: ['vendeurNom'],
          where: { ...where, vendeurNom: { not: null } },
          _sum: {
            montantTTC: true,
            quantity: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              montantTTC: 'desc'
            }
          },
          take: 10,
        }),
        prisma.sale.groupBy({
          by: ['grade'],
          where: { ...where, grade: { not: null } },
          _sum: {
            montantTTC: true,
            quantity: true,
          },
          _count: true,
        }),
      ]);

      // Enrichir les données des canaux avec leurs informations
      const channelsWithDetails = await Promise.all(
        salesByChannel.map(async (channel) => {
          const channelInfo = await prisma.salesChannel.findUnique({
            where: { id: channel.salesChannelId }
          });
          return {
            ...channel,
            channel: channelInfo
          };
        })
      );

      // Calculer les ventes par dossier avec taux de vente
      const salesByCaseFile = await prisma.sale.groupBy({
        by: ['caseFileId'],
        where,
        _sum: {
          montantTTC: true,
          quantity: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            montantTTC: 'desc'
          }
        },
        take: 10,
      });

      // Enrichir avec les informations du dossier et le taux de vente
      const caseFilesWithDetails = await Promise.all(
        salesByCaseFile.map(async (caseFileSale) => {
          const caseFile = await prisma.caseFile.findUnique({
            where: { id: caseFileSale.caseFileId },
            include: {
              request: {
                include: {
                  client: true,
                }
              }
            }
          });

          // Compter le total de composants dans le dossier
          const totalComponents = await prisma.component.count({
            where: {
              lot: {
                caseFileId: caseFileSale.caseFileId
              }
            }
          });

          // Compter les composants vendus
          const soldComponents = await prisma.sale.count({
            where: {
              caseFileId: caseFileSale.caseFileId,
              statut: 'completed',
              componentId: { not: null }
            }
          });

          const salesRate = totalComponents > 0 ? Math.round((soldComponents / totalComponents) * 100 * 100) / 100 : 0;

          return {
            ...caseFileSale,
            caseFile,
            totalComponents,
            soldComponents,
            salesRate
          };
        })
      );

      const response: ApiResponse = {
        success: true,
        data: {
          totalVentes,
          revenue: {
            totalTTC: revenueData._sum.montantTTC || 0,
            totalHT: revenueData._sum.montantHT || 0,
            average: revenueData._avg.montantTTC || 0,
          },
          totalQuantity: revenueData._sum.quantity || 0,
          byChannel: channelsWithDetails,
          topVendors: salesByVendor,
          byGrade: salesByGrade,
          byCaseFile: caseFilesWithDetails,
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching sales stats:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des statistiques'
      };
      res.status(500).json(response);
    }
  }

  // Obtenir toutes les demandes avec des ventes
  async getCaseFilesWithSales(req: Request, res: Response): Promise<void> {
    try {
      const { dateDebut, dateFin } = req.query;

      const where: any = { statut: 'completed' };

      if (dateDebut || dateFin) {
        where.dateVente = {};
        if (dateDebut) where.dateVente.gte = new Date(dateDebut as string);
        if (dateFin) where.dateVente.lte = new Date(dateFin as string);
      }

      // Récupérer les dossiers qui ont des ventes
      const caseFilesWithSales = await prisma.caseFile.findMany({
        where: {
          sales: {
            some: where
          }
        },
        include: {
          request: {
            include: {
              client: true,
            }
          },
          sales: {
            where,
            select: {
              id: true,
              reference: true,
              montantTTC: true,
              dateVente: true,
              statut: true,
            }
          },
          _count: {
            select: {
              sales: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Enrichir avec les statistiques
      const enrichedCaseFiles = await Promise.all(
        caseFilesWithSales.map(async (caseFile) => {
          const completedSales = caseFile.sales.filter(s => s.statut === 'completed');
          const totalVentes = completedSales.length;
          const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.montantTTC, 0);

          // Compter le total de composants
          const totalComponents = await prisma.component.count({
            where: {
              lot: {
                caseFileId: caseFile.id
              }
            }
          });

          // Compter les composants vendus
          const soldComponents = await prisma.sale.count({
            where: {
              caseFileId: caseFile.id,
              statut: 'completed',
              componentId: { not: null }
            }
          });

          const salesRate = totalComponents > 0 ? Math.round((soldComponents / totalComponents) * 100 * 100) / 100 : 0;

          return {
            ...caseFile,
            stats: {
              totalVentes,
              totalRevenue,
              totalComponents,
              soldComponents,
              salesRate,
            },
          };
        })
      );

      const response: ApiResponse = {
        success: true,
        data: enrichedCaseFiles
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching case files with sales:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des dossiers avec ventes'
      };
      res.status(500).json(response);
    }
  }

  // Obtenir le taux de matériel vendu par demande
  async getSalesRateByRequest(req: Request, res: Response): Promise<void> {
    try {
      const { caseFileId } = req.params;

      // Compter le total de composants dans le dossier
      const totalComponents = await prisma.component.count({
        where: {
          lot: {
            caseFileId
          }
        }
      });

      // Compter les composants vendus
      const soldComponents = await prisma.sale.count({
        where: {
          caseFileId,
          statut: 'completed',
          componentId: { not: null }
        }
      });

      const salesRate = totalComponents > 0 ? (soldComponents / totalComponents) * 100 : 0;

      // Récupérer les ventes par lot
      const salesByLot = await prisma.sale.groupBy({
        by: ['lotId'],
        where: {
          caseFileId,
          statut: 'completed',
          lotId: { not: null }
        },
        _sum: {
          montantTTC: true,
          quantity: true,
        },
        _count: true,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          caseFileId,
          totalComponents,
          soldComponents,
          salesRate: Math.round(salesRate * 100) / 100,
          salesByLot,
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching sales rate:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors du calcul du taux de vente'
      };
      res.status(500).json(response);
    }
  }
}

// Contrôleur pour les canaux de vente
export class SalesChannelController {
  // Récupérer tous les canaux
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { type, actif } = req.query;

      const where: any = {};
      if (type) where.type = type;
      if (actif !== undefined) where.actif = actif === 'true';

      const channels = await prisma.salesChannel.findMany({
        where,
        include: {
          _count: {
            select: { sales: true }
          }
        },
        orderBy: { nom: 'asc' }
      });

      const response: ApiResponse = {
        success: true,
        data: channels
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching sales channels:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des canaux de vente'
      };
      res.status(500).json(response);
    }
  }

  // Créer un nouveau canal
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nom, type, adresse, url, responsable, commission, actif } = req.body;

      const channel = await prisma.salesChannel.create({
        data: {
          nom,
          type,
          adresse,
          url,
          responsable,
          commission: commission || 0,
          actif: actif !== undefined ? actif : true,
        }
      });

      const response: ApiResponse = {
        success: true,
        data: channel,
        message: 'Canal de vente créé avec succès'
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating sales channel:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la création du canal de vente'
      };
      res.status(500).json(response);
    }
  }

  // Mettre à jour un canal
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const channel = await prisma.salesChannel.update({
        where: { id },
        data: updateData
      });

      const response: ApiResponse = {
        success: true,
        data: channel,
        message: 'Canal de vente mis à jour avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating sales channel:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du canal de vente'
      };
      res.status(500).json(response);
    }
  }

  // Supprimer un canal
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Vérifier s'il y a des ventes liées
      const salesCount = await prisma.sale.count({
        where: { salesChannelId: id }
      });

      if (salesCount > 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Impossible de supprimer ce canal car il contient des ventes'
        };
        res.status(400).json(response);
        return;
      }

      await prisma.salesChannel.delete({
        where: { id }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Canal de vente supprimé avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error deleting sales channel:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la suppression du canal de vente'
      };
      res.status(500).json(response);
    }
  }
}

export const saleController = new SaleController();
export const salesChannelController = new SalesChannelController();
