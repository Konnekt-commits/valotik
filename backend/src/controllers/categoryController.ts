import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiResponse } from '../types';

export class CategoryController {
  // Récupérer toutes les catégories avec leurs sous-catégories
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        include: {
          subCategories: {
            orderBy: { ordre: 'asc' },
          },
        },
        orderBy: { ordre: 'asc' },
      });

      const response: ApiResponse = {
        success: true,
        data: categories,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des catégories',
      };
      res.status(500).json(response);
    }
  }

  // Récupérer une catégorie par ID avec ses sous-catégories
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          subCategories: {
            orderBy: { ordre: 'asc' },
          },
        },
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          error: 'Catégorie non trouvée',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: category,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching category:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération de la catégorie',
      };
      res.status(500).json(response);
    }
  }

  // Récupérer toutes les sous-catégories d'une catégorie
  async getSubCategories(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;

      const subCategories = await prisma.subCategory.findMany({
        where: { categoryId },
        orderBy: { ordre: 'asc' },
      });

      const response: ApiResponse = {
        success: true,
        data: subCategories,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching sub-categories:', error);
      const response: ApiResponse = {
        success: false,
        error: error.message || 'Erreur lors de la récupération des sous-catégories',
      };
      res.status(500).json(response);
    }
  }
}

export default new CategoryController();
