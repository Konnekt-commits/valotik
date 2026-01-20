import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/end-customers - Liste des clients finaux avec statistiques
router.get('/', async (req, res) => {
  try {
    const endCustomers = await prisma.endCustomer.findMany({
      include: {
        sales: {
          select: {
            id: true,
            reference: true,
            montantTTC: true,
            dateVente: true,
            statut: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrichir avec les statistiques
    const enrichedCustomers = endCustomers.map((customer) => {
      const completedSales = customer.sales.filter(s => s.statut === 'completed');
      const totalAchats = completedSales.length;
      const totalDepense = completedSales.reduce((sum, sale) => sum + sale.montantTTC, 0);
      const derniereVente = completedSales.length > 0
        ? completedSales.reduce((latest, sale) =>
            new Date(sale.dateVente) > new Date(latest.dateVente) ? sale : latest
          ).dateVente
        : null;

      return {
        ...customer,
        stats: {
          totalAchats,
          totalDepense,
          derniereVente,
        },
      };
    });

    res.json({
      success: true,
      data: enrichedCustomers,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients finaux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des clients finaux',
    });
  }
});

// GET /api/end-customers/:id - Détails d'un client final
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.endCustomer.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            caseFile: {
              include: {
                request: {
                  include: {
                    client: true,
                  },
                },
              },
            },
            salesChannel: true,
          },
          orderBy: {
            dateVente: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Client final non trouvé',
      });
    }

    // Calculer les statistiques
    const completedSales = customer.sales.filter(s => s.statut === 'completed');
    const stats = {
      totalAchats: completedSales.length,
      totalDepense: completedSales.reduce((sum, sale) => sum + sale.montantTTC, 0),
      panierMoyen: completedSales.length > 0
        ? completedSales.reduce((sum, sale) => sum + sale.montantTTC, 0) / completedSales.length
        : 0,
      derniereVente: completedSales.length > 0
        ? completedSales[0].dateVente
        : null,
      premiereVente: completedSales.length > 0
        ? completedSales[completedSales.length - 1].dateVente
        : null,
    };

    res.json({
      success: true,
      data: {
        ...customer,
        stats,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du client final:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du client final',
    });
  }
});

export default router;
