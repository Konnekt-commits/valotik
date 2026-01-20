import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class UserController {
  // Récupérer tous les utilisateurs
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { role, actif, page = 1, limit = 50 } = req.query;

      const where: any = {};
      if (role) where.role = role;
      if (actif !== undefined) where.actif = actif === 'true';

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.user.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          users,
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
      console.error('Error fetching users:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des utilisateurs'
      };
      res.status(500).json(response);
    }
  }

  // Récupérer un utilisateur par ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          caseFileAssignments: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'Utilisateur non trouvé'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: user
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération de l\'utilisateur'
      };
      res.status(500).json(response);
    }
  }

  // Créer un nouvel utilisateur
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nom, email, role, actif = true } = req.body;

      if (!nom || !email || !role) {
        const response: ApiResponse = {
          success: false,
          error: 'Nom, email et rôle requis'
        };
        res.status(400).json(response);
        return;
      }

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          error: 'Un utilisateur avec cet email existe déjà'
        };
        res.status(400).json(response);
        return;
      }

      const user = await prisma.user.create({
        data: {
          nom,
          email,
          role,
          actif,
        }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'User',
          entiteId: user.id,
          action: 'CREATE',
          payload: JSON.stringify({ nom, email, role }),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Utilisateur créé avec succès'
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la création de l\'utilisateur'
      };
      res.status(500).json(response);
    }
  }

  // Mettre à jour un utilisateur
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nom, email, role, actif } = req.body;

      const updateData: any = {};
      if (nom !== undefined) updateData.nom = nom;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (actif !== undefined) updateData.actif = actif;

      const user = await prisma.user.update({
        where: { id },
        data: updateData
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'User',
          entiteId: id,
          action: 'UPDATE',
          payload: JSON.stringify(updateData),
        }
      });

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Utilisateur mis à jour avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error updating user:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de l\'utilisateur'
      };
      res.status(500).json(response);
    }
  }

  // Supprimer un utilisateur
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id }
      });

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          entite: 'User',
          entiteId: id,
          action: 'DELETE',
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Utilisateur supprimé avec succès'
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la suppression de l\'utilisateur'
      };
      res.status(500).json(response);
    }
  }

  // Obtenir des statistiques RH
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        usersByRole,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { actif: true } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole: usersByRole.map((item: any) => ({
          role: item.role,
          count: item._count
        })),
      };

      const response: ApiResponse = {
        success: true,
        data: stats
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching user statistics:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des statistiques'
      };
      res.status(500).json(response);
    }
  }
}

export default new UserController();
