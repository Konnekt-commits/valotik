import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION DES OBJECTIFS
// ============================================

// Récupérer la configuration active
export const getConfiguration = async (req: Request, res: Response) => {
  try {
    let config = await prisma.objectifConfiguration.findFirst({
      where: { estActif: true }
    });

    // Si aucune config, en créer une par défaut
    if (!config) {
      config = await prisma.objectifConfiguration.create({
        data: {
          nom: 'Configuration par défaut',
          estActif: true
        }
      });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Erreur getConfiguration:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour la configuration
export const updateConfiguration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const config = await prisma.objectifConfiguration.update({
      where: { id },
      data: {
        nom: data.nom,
        poidsAnciennete: data.poidsAnciennete,
        pointsParMoisAnciennete: data.pointsParMoisAnciennete,
        poidsSuivis: data.poidsSuivis,
        pointsParSuivi: data.pointsParSuivi,
        poidsPMSMP: data.poidsPMSMP,
        pointsParPMSMP: data.pointsParPMSMP,
        poidsFormations: data.poidsFormations,
        pointsFormationSimple: data.pointsFormationSimple,
        pointsFormationQualif: data.pointsFormationQualif,
        poidsObjectifsIndiv: data.poidsObjectifsIndiv,
        seuilProgressionMax: data.seuilProgressionMax,
        sortiePositiveAuto100: data.sortiePositiveAuto100
      }
    });

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Erreur updateConfiguration:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// OBJECTIFS INDIVIDUELS
// ============================================

// Récupérer les objectifs d'un salarié
export const getObjectifsIndividuels = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const objectifs = await prisma.objectifIndividuel.findMany({
      where: { employeeId },
      orderBy: [
        { statut: 'asc' },
        { priorite: 'desc' },
        { dateEcheance: 'asc' }
      ]
    });

    // Stats
    const stats = {
      total: objectifs.length,
      enCours: objectifs.filter(o => o.statut === 'en_cours').length,
      atteints: objectifs.filter(o => o.statut === 'atteint').length,
      abandonnes: objectifs.filter(o => o.statut === 'abandonne').length,
      reportes: objectifs.filter(o => o.statut === 'reporte').length,
      pointsObtenus: objectifs.filter(o => o.statut === 'atteint').reduce((sum, o) => sum + o.pointsAttribues, 0),
      pointsPotentiels: objectifs.filter(o => o.statut === 'en_cours').reduce((sum, o) => sum + o.pointsAttribues, 0)
    };

    res.json({ success: true, data: { objectifs, stats } });
  } catch (error) {
    console.error('Erreur getObjectifsIndividuels:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un objectif individuel
export const createObjectifIndividuel = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    const objectif = await prisma.objectifIndividuel.create({
      data: {
        employeeId,
        titre: data.titre,
        description: data.description,
        categorie: data.categorie || 'emploi',
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        pointsAttribues: data.pointsAttribues || 5,
        priorite: data.priorite || 'normale',
        notes: data.notes
      }
    });

    res.json({ success: true, data: objectif });
  } catch (error) {
    console.error('Erreur createObjectifIndividuel:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour un objectif individuel
export const updateObjectifIndividuel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: any = {
      titre: data.titre,
      description: data.description,
      categorie: data.categorie,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      statut: data.statut,
      progression: data.progression,
      pointsAttribues: data.pointsAttribues,
      priorite: data.priorite,
      notes: data.notes
    };

    // Si l'objectif est marqué comme atteint, enregistrer la date
    if (data.statut === 'atteint' && !data.dateRealisation) {
      updateData.dateRealisation = new Date();
    }

    const objectif = await prisma.objectifIndividuel.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, data: objectif });
  } catch (error) {
    console.error('Erreur updateObjectifIndividuel:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un objectif individuel
export const deleteObjectifIndividuel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.objectifIndividuel.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteObjectifIndividuel:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// CALCUL DE PROGRESSION (utilisé par getParcours)
// ============================================

export const calculateProgressionWithConfig = async (employee: any): Promise<number> => {
  // Récupérer la configuration active
  let config = await prisma.objectifConfiguration.findFirst({
    where: { estActif: true }
  });

  if (!config) {
    // Config par défaut si aucune n'existe
    config = {
      id: 'default',
      nom: 'Défaut',
      estActif: true,
      poidsAnciennete: 20,
      pointsParMoisAnciennete: 2,
      poidsSuivis: 15,
      pointsParSuivi: 2,
      poidsPMSMP: 25,
      pointsParPMSMP: 12,
      poidsFormations: 25,
      pointsFormationSimple: 5,
      pointsFormationQualif: 15,
      poidsObjectifsIndiv: 15,
      seuilProgressionMax: 85,
      sortiePositiveAuto100: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  let score = 0;

  // 1. Points pour l'ancienneté
  const moisAnciennete = Math.floor(
    (new Date().getTime() - new Date(employee.dateEntree).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  score += Math.min(config.poidsAnciennete, moisAnciennete * config.pointsParMoisAnciennete);

  // 2. Points pour les suivis
  const nbSuivis = employee.suivis?.length || 0;
  score += Math.min(config.poidsSuivis, nbSuivis * config.pointsParSuivi);

  // 3. Points pour les PMSMP réussies
  const pmsmpReussies = employee.conventionsPMSMP?.filter((p: any) => p.bilanPositif)?.length || 0;
  score += Math.min(config.poidsPMSMP, pmsmpReussies * config.pointsParPMSMP);

  // 4. Points pour les formations
  const formations = employee.formations || [];
  let pointsFormations = 0;
  formations.forEach((f: any) => {
    if (f.validation === 'validee') {
      pointsFormations += (f.type === 'qualifiante' || f.type === 'certifiante')
        ? config!.pointsFormationQualif
        : config!.pointsFormationSimple;
    }
  });
  score += Math.min(config.poidsFormations, pointsFormations);

  // 5. Points pour les objectifs individuels atteints
  const objectifsAtteints = employee.objectifsIndividuels?.filter((o: any) => o.statut === 'atteint') || [];
  const pointsObjectifs = objectifsAtteints.reduce((sum: number, o: any) => sum + o.pointsAttribues, 0);
  score += Math.min(config.poidsObjectifsIndiv, pointsObjectifs);

  // Plafonner avant sortie positive
  score = Math.min(score, config.seuilProgressionMax);

  // Sortie positive = 100%
  if (config.sortiePositiveAuto100 && employee.statut === 'sorti' && employee.fichePro?.sortiePositive) {
    score = 100;
  }

  return Math.round(score);
};
