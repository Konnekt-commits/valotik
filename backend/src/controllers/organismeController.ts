import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// ORGANISME
// ============================================

// Récupérer l'organisme (on suppose qu'il y en a un seul pour l'instant)
export const getOrganisme = async (req: Request, res: Response) => {
  try {
    const organisme = await prisma.organisme.findFirst({
      include: {
        conventions: {
          orderBy: { annee: 'desc' },
          include: {
            objectifsNegocies: {
              include: {
                suivis: {
                  orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
                  take: 12,
                },
              },
            },
          },
        },
        ateliers: {
          where: { actif: true },
          orderBy: { nom: 'asc' },
        },
      },
    });

    if (!organisme) {
      return res.json({
        success: true,
        data: null,
        message: 'Aucun organisme configuré',
      });
    }

    res.json({
      success: true,
      data: organisme,
    });
  } catch (error) {
    console.error('Erreur getOrganisme:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'organisme',
    });
  }
};

// Créer ou mettre à jour l'organisme
export const upsertOrganisme = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const existingOrganisme = await prisma.organisme.findFirst();

    let organisme;
    if (existingOrganisme) {
      organisme = await prisma.organisme.update({
        where: { id: existingOrganisme.id },
        data: {
          raisonSociale: data.raisonSociale,
          siret: data.siret,
          formeJuridique: data.formeJuridique,
          codeAPE: data.codeAPE,
          numeroRNA: data.numeroRNA,
          adresseSiege: data.adresseSiege,
          codePostalSiege: data.codePostalSiege,
          villeSiege: data.villeSiege,
          telephoneSiege: data.telephoneSiege,
          emailSiege: data.emailSiege,
          representantNom: data.representantNom,
          representantPrenom: data.representantPrenom,
          representantFonction: data.representantFonction,
          contactAdminNom: data.contactAdminNom,
          contactAdminEmail: data.contactAdminEmail,
          contactAdminTel: data.contactAdminTel,
          iban: data.iban,
          bic: data.bic,
          nomBanque: data.nomBanque,
          titulaireCompte: data.titulaireCompte,
        },
        include: {
          conventions: true,
          ateliers: true,
        },
      });
    } else {
      organisme = await prisma.organisme.create({
        data: {
          raisonSociale: data.raisonSociale,
          siret: data.siret,
          formeJuridique: data.formeJuridique,
          codeAPE: data.codeAPE,
          numeroRNA: data.numeroRNA,
          adresseSiege: data.adresseSiege,
          codePostalSiege: data.codePostalSiege,
          villeSiege: data.villeSiege,
          telephoneSiege: data.telephoneSiege,
          emailSiege: data.emailSiege,
          representantNom: data.representantNom,
          representantPrenom: data.representantPrenom,
          representantFonction: data.representantFonction,
          contactAdminNom: data.contactAdminNom,
          contactAdminEmail: data.contactAdminEmail,
          contactAdminTel: data.contactAdminTel,
          iban: data.iban,
          bic: data.bic,
          nomBanque: data.nomBanque,
          titulaireCompte: data.titulaireCompte,
        },
        include: {
          conventions: true,
          ateliers: true,
        },
      });
    }

    res.json({
      success: true,
      data: organisme,
      message: existingOrganisme ? 'Organisme mis à jour' : 'Organisme créé',
    });
  } catch (error) {
    console.error('Erreur upsertOrganisme:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde de l\'organisme',
    });
  }
};

// ============================================
// CONVENTIONS ACI
// ============================================

// Récupérer toutes les conventions
export const getConventions = async (req: Request, res: Response) => {
  try {
    const { organismeId } = req.params;

    const conventions = await prisma.conventionACI.findMany({
      where: { organismeId },
      orderBy: { annee: 'desc' },
      include: {
        objectifsNegocies: {
          include: {
            suivis: {
              orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: conventions,
    });
  } catch (error) {
    console.error('Erreur getConventions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des conventions',
    });
  }
};

// Récupérer la convention active (année en cours)
export const getConventionActive = async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();

    const convention = await prisma.conventionACI.findFirst({
      where: {
        annee: currentYear,
        statut: 'active',
      },
      include: {
        organisme: true,
        objectifsNegocies: {
          include: {
            suivis: {
              orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: convention,
    });
  } catch (error) {
    console.error('Erreur getConventionActive:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la convention active',
    });
  }
};

// Créer une convention
export const createConvention = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const convention = await prisma.conventionACI.create({
      data: {
        organismeId: data.organismeId,
        numeroConvention: data.numeroConvention,
        annee: data.annee,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        typeStructure: data.typeStructure || 'ACI',
        effectifETPAutorise: parseFloat(data.effectifETPAutorise),
        effectifPhysique: data.effectifPhysique ? parseInt(data.effectifPhysique) : null,
        aidePosteUnitaire: parseFloat(data.aidePosteUnitaire),
        aidePosteTotale: parseFloat(data.effectifETPAutorise) * parseFloat(data.aidePosteUnitaire),
        aideRegion: data.aideRegion ? parseFloat(data.aideRegion) : 0,
        aideDepartement: data.aideDepartement ? parseFloat(data.aideDepartement) : 0,
        aideCommune: data.aideCommune ? parseFloat(data.aideCommune) : 0,
        autresAides: data.autresAides ? parseFloat(data.autresAides) : 0,
        autresAidesDetail: data.autresAidesDetail,
        chiffreAffaires: data.chiffreAffaires ? parseFloat(data.chiffreAffaires) : null,
        resultatNet: data.resultatNet ? parseFloat(data.resultatNet) : null,
        fondsAssociatifs: data.fondsAssociatifs ? parseFloat(data.fondsAssociatifs) : null,
        dettesFinancieres: data.dettesFinancieres ? parseFloat(data.dettesFinancieres) : null,
        referentDDETSNom: data.referentDDETSNom,
        referentDDETSEmail: data.referentDDETSEmail,
        referentDDETSTel: data.referentDDETSTel,
        conventionUrl: data.conventionUrl,
        annexeFinanciereUrl: data.annexeFinanciereUrl,
      },
      include: {
        objectifsNegocies: true,
      },
    });

    res.status(201).json({
      success: true,
      data: convention,
      message: 'Convention créée avec succès',
    });
  } catch (error) {
    console.error('Erreur createConvention:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la convention',
    });
  }
};

// Mettre à jour une convention
export const updateConvention = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const convention = await prisma.conventionACI.update({
      where: { id },
      data: {
        numeroConvention: data.numeroConvention,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
        typeStructure: data.typeStructure,
        effectifETPAutorise: data.effectifETPAutorise ? parseFloat(data.effectifETPAutorise) : undefined,
        effectifPhysique: data.effectifPhysique ? parseInt(data.effectifPhysique) : undefined,
        aidePosteUnitaire: data.aidePosteUnitaire ? parseFloat(data.aidePosteUnitaire) : undefined,
        aidePosteTotale: data.effectifETPAutorise && data.aidePosteUnitaire
          ? parseFloat(data.effectifETPAutorise) * parseFloat(data.aidePosteUnitaire)
          : undefined,
        aideRegion: data.aideRegion !== undefined ? parseFloat(data.aideRegion) : undefined,
        aideDepartement: data.aideDepartement !== undefined ? parseFloat(data.aideDepartement) : undefined,
        aideCommune: data.aideCommune !== undefined ? parseFloat(data.aideCommune) : undefined,
        autresAides: data.autresAides !== undefined ? parseFloat(data.autresAides) : undefined,
        autresAidesDetail: data.autresAidesDetail,
        chiffreAffaires: data.chiffreAffaires !== undefined ? parseFloat(data.chiffreAffaires) : undefined,
        resultatNet: data.resultatNet !== undefined ? parseFloat(data.resultatNet) : undefined,
        fondsAssociatifs: data.fondsAssociatifs !== undefined ? parseFloat(data.fondsAssociatifs) : undefined,
        dettesFinancieres: data.dettesFinancieres !== undefined ? parseFloat(data.dettesFinancieres) : undefined,
        referentDDETSNom: data.referentDDETSNom,
        referentDDETSEmail: data.referentDDETSEmail,
        referentDDETSTel: data.referentDDETSTel,
        statut: data.statut,
        conventionUrl: data.conventionUrl,
        annexeFinanciereUrl: data.annexeFinanciereUrl,
      },
      include: {
        objectifsNegocies: {
          include: {
            suivis: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: convention,
      message: 'Convention mise à jour',
    });
  } catch (error) {
    console.error('Erreur updateConvention:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la convention',
    });
  }
};

// ============================================
// ATELIERS ET CHANTIERS
// ============================================

// Récupérer les ateliers
export const getAteliers = async (req: Request, res: Response) => {
  try {
    const { organismeId } = req.params;

    const ateliers = await prisma.atelierChantier.findMany({
      where: { organismeId },
      orderBy: { nom: 'asc' },
    });

    res.json({
      success: true,
      data: ateliers,
    });
  } catch (error) {
    console.error('Erreur getAteliers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des ateliers',
    });
  }
};

// Créer un atelier
export const createAtelier = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const atelier = await prisma.atelierChantier.create({
      data: {
        organismeId: data.organismeId,
        nom: data.nom,
        code: data.code,
        secteurActivite: data.secteurActivite,
        codeROME: data.codeROME,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        effectifETP: data.effectifETP ? parseFloat(data.effectifETP) : null,
        effectifEncadrants: data.effectifEncadrants ? parseInt(data.effectifEncadrants) : null,
        description: data.description,
        activites: data.activites,
        actif: data.actif !== false,
      },
    });

    res.status(201).json({
      success: true,
      data: atelier,
      message: 'Atelier créé avec succès',
    });
  } catch (error) {
    console.error('Erreur createAtelier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'atelier',
    });
  }
};

// Mettre à jour un atelier
export const updateAtelier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const atelier = await prisma.atelierChantier.update({
      where: { id },
      data: {
        nom: data.nom,
        code: data.code,
        secteurActivite: data.secteurActivite,
        codeROME: data.codeROME,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        effectifETP: data.effectifETP !== undefined ? parseFloat(data.effectifETP) : undefined,
        effectifEncadrants: data.effectifEncadrants !== undefined ? parseInt(data.effectifEncadrants) : undefined,
        description: data.description,
        activites: data.activites,
        actif: data.actif,
      },
    });

    res.json({
      success: true,
      data: atelier,
      message: 'Atelier mis à jour',
    });
  } catch (error) {
    console.error('Erreur updateAtelier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'atelier',
    });
  }
};

// Supprimer un atelier
export const deleteAtelier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.atelierChantier.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Atelier supprimé',
    });
  } catch (error) {
    console.error('Erreur deleteAtelier:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'atelier',
    });
  }
};

// ============================================
// OBJECTIFS NÉGOCIÉS
// ============================================

// Récupérer les objectifs négociés d'une convention
export const getObjectifsNegocies = async (req: Request, res: Response) => {
  try {
    const { conventionId } = req.params;

    const objectifs = await prisma.objectifNegocie.findMany({
      where: { conventionId },
      include: {
        suivis: {
          orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        },
      },
    });

    res.json({
      success: true,
      data: objectifs,
    });
  } catch (error) {
    console.error('Erreur getObjectifsNegocies:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des objectifs négociés',
    });
  }
};

// Créer ou mettre à jour les objectifs négociés
export const upsertObjectifsNegocies = async (req: Request, res: Response) => {
  try {
    const { conventionId } = req.params;
    const data = req.body;

    const existingObjectif = await prisma.objectifNegocie.findFirst({
      where: {
        conventionId,
        annee: data.annee,
      },
    });

    let objectif;
    if (existingObjectif) {
      objectif = await prisma.objectifNegocie.update({
        where: { id: existingObjectif.id },
        data: {
          nombreSortiesPrevisionnel: parseInt(data.nombreSortiesPrevisionnel),
          tauxSortiesDynamiquesCible: parseFloat(data.tauxSortiesDynamiquesCible),
          tauxEmploiDurableCible: parseFloat(data.tauxEmploiDurableCible),
          tauxEmploiTransitionCible: parseFloat(data.tauxEmploiTransitionCible),
          tauxSortiesPositivesCible: parseFloat(data.tauxSortiesPositivesCible),
          notes: data.notes,
        },
        include: {
          suivis: true,
        },
      });
    } else {
      objectif = await prisma.objectifNegocie.create({
        data: {
          conventionId,
          annee: data.annee,
          nombreSortiesPrevisionnel: parseInt(data.nombreSortiesPrevisionnel),
          tauxSortiesDynamiquesCible: parseFloat(data.tauxSortiesDynamiquesCible),
          tauxEmploiDurableCible: parseFloat(data.tauxEmploiDurableCible),
          tauxEmploiTransitionCible: parseFloat(data.tauxEmploiTransitionCible),
          tauxSortiesPositivesCible: parseFloat(data.tauxSortiesPositivesCible),
          notes: data.notes,
        },
        include: {
          suivis: true,
        },
      });
    }

    res.json({
      success: true,
      data: objectif,
      message: existingObjectif ? 'Objectifs mis à jour' : 'Objectifs créés',
    });
  } catch (error) {
    console.error('Erreur upsertObjectifsNegocies:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde des objectifs négociés',
    });
  }
};

// ============================================
// SUIVI DES OBJECTIFS NÉGOCIÉS
// ============================================

// Ajouter/mettre à jour un suivi mensuel
export const upsertSuiviObjectif = async (req: Request, res: Response) => {
  try {
    const { objectifNegocieId } = req.params;
    const data = req.body;

    // Récupérer l'objectif pour avoir les cibles
    const objectifNegocie = await prisma.objectifNegocie.findUnique({
      where: { id: objectifNegocieId },
    });

    if (!objectifNegocie) {
      return res.status(404).json({
        success: false,
        error: 'Objectif négocié non trouvé',
      });
    }

    // Calculer les totaux et taux
    const sortiesEmploiDurable = parseInt(data.sortiesEmploiDurable) || 0;
    const sortiesEmploiTransition = parseInt(data.sortiesEmploiTransition) || 0;
    const sortiesFormation = parseInt(data.sortiesFormation) || 0;
    const sortiesAutresPositives = parseInt(data.sortiesAutresPositives) || 0;
    const sortiesNegatives = parseInt(data.sortiesNegatives) || 0;

    const totalSorties = sortiesEmploiDurable + sortiesEmploiTransition + sortiesFormation + sortiesAutresPositives + sortiesNegatives;

    // Calcul des taux (en évitant division par 0)
    const tauxSortiesDynamiques = totalSorties > 0
      ? ((sortiesEmploiDurable + sortiesEmploiTransition + sortiesFormation) / totalSorties) * 100
      : 0;
    const tauxEmploiDurable = totalSorties > 0
      ? (sortiesEmploiDurable / totalSorties) * 100
      : 0;
    const tauxEmploiTransition = totalSorties > 0
      ? (sortiesEmploiTransition / totalSorties) * 100
      : 0;
    const tauxSortiesPositives = totalSorties > 0
      ? ((sortiesEmploiDurable + sortiesEmploiTransition + sortiesFormation + sortiesAutresPositives) / totalSorties) * 100
      : 0;

    // Calcul des écarts par rapport aux objectifs
    const ecartDynamiques = tauxSortiesDynamiques - objectifNegocie.tauxSortiesDynamiquesCible;
    const ecartEmploiDurable = tauxEmploiDurable - objectifNegocie.tauxEmploiDurableCible;
    const ecartEmploiTransition = tauxEmploiTransition - objectifNegocie.tauxEmploiTransitionCible;
    const ecartSortiesPositives = tauxSortiesPositives - objectifNegocie.tauxSortiesPositivesCible;

    // Upsert du suivi
    const existingSuivi = await prisma.suiviObjectifNegocie.findFirst({
      where: {
        objectifNegocieId,
        mois: parseInt(data.mois),
        annee: parseInt(data.annee),
      },
    });

    let suivi;
    const suiviData = {
      effectifEntree: parseInt(data.effectifEntree) || 0,
      effectifSortie: parseInt(data.effectifSortie) || 0,
      effectifPresent: parseInt(data.effectifPresent) || 0,
      sortiesEmploiDurable,
      sortiesEmploiTransition,
      sortiesFormation,
      sortiesAutresPositives,
      sortiesNegatives,
      totalSorties,
      tauxSortiesDynamiques,
      tauxEmploiDurable,
      tauxEmploiTransition,
      tauxSortiesPositives,
      ecartDynamiques,
      ecartEmploiDurable,
      ecartEmploiTransition,
      ecartSortiesPositives,
      commentaire: data.commentaire,
      actionsCorrectives: data.actionsCorrectives,
    };

    if (existingSuivi) {
      suivi = await prisma.suiviObjectifNegocie.update({
        where: { id: existingSuivi.id },
        data: suiviData,
      });
    } else {
      suivi = await prisma.suiviObjectifNegocie.create({
        data: {
          objectifNegocieId,
          mois: parseInt(data.mois),
          annee: parseInt(data.annee),
          ...suiviData,
        },
      });
    }

    res.json({
      success: true,
      data: suivi,
      message: existingSuivi ? 'Suivi mis à jour' : 'Suivi créé',
    });
  } catch (error) {
    console.error('Erreur upsertSuiviObjectif:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde du suivi',
    });
  }
};

// Récupérer le tableau de bord des objectifs (avec stats temps réel)
export const getDashboardObjectifs = async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Récupérer la convention active avec objectifs
    const convention = await prisma.conventionACI.findFirst({
      where: {
        annee: currentYear,
        statut: 'active',
      },
      include: {
        organisme: true,
        objectifsNegocies: {
          where: { annee: currentYear },
          include: {
            suivis: {
              orderBy: [{ mois: 'asc' }],
            },
          },
        },
      },
    });

    if (!convention) {
      return res.json({
        success: true,
        data: null,
        message: 'Aucune convention active pour l\'année en cours',
      });
    }

    const objectif = convention.objectifsNegocies[0];

    // Calculer les stats temps réel depuis les salariés
    const employees = await prisma.insertionEmployee.findMany({
      where: {
        OR: [
          { statut: 'actif' },
          {
            dateSortie: {
              gte: new Date(currentYear, 0, 1),
            },
          },
        ],
      },
      select: {
        id: true,
        statut: true,
        typeSortie: true,
        motifSortie: true,
        dateEntree: true,
        dateSortie: true,
      },
    });

    // Compter les sorties par type
    const sortis = employees.filter((e) => e.statut === 'sorti' && e.dateSortie);
    const sortiesEmploiDurable = sortis.filter((e) =>
      ['CDI', 'CDD > 6 mois', 'Création entreprise'].includes(e.motifSortie || '')
    ).length;
    const sortiesEmploiTransition = sortis.filter((e) =>
      ['CDD < 6 mois', 'Intérim', 'Autre SIAE'].includes(e.motifSortie || '')
    ).length;
    const sortiesFormation = sortis.filter((e) =>
      e.motifSortie?.toLowerCase().includes('formation')
    ).length;
    const sortiesPositives = sortis.filter((e) => e.typeSortie === 'positive').length;
    const sortiesNegatives = sortis.filter((e) => e.typeSortie === 'negative').length;

    const totalSorties = sortis.length;

    // Calculer les taux réels
    const tauxReels = {
      sortiesDynamiques: totalSorties > 0
        ? ((sortiesEmploiDurable + sortiesEmploiTransition + sortiesFormation) / totalSorties) * 100
        : 0,
      emploiDurable: totalSorties > 0
        ? (sortiesEmploiDurable / totalSorties) * 100
        : 0,
      emploiTransition: totalSorties > 0
        ? (sortiesEmploiTransition / totalSorties) * 100
        : 0,
      sortiesPositives: totalSorties > 0
        ? (sortiesPositives / totalSorties) * 100
        : 0,
    };

    res.json({
      success: true,
      data: {
        convention,
        objectif,
        statsTempsReel: {
          effectifActif: employees.filter((e) => e.statut === 'actif').length,
          totalSorties,
          sortiesEmploiDurable,
          sortiesEmploiTransition,
          sortiesFormation,
          sortiesPositives,
          sortiesNegatives,
          tauxReels,
          ecarts: objectif ? {
            dynamiques: tauxReels.sortiesDynamiques - objectif.tauxSortiesDynamiquesCible,
            emploiDurable: tauxReels.emploiDurable - objectif.tauxEmploiDurableCible,
            emploiTransition: tauxReels.emploiTransition - objectif.tauxEmploiTransitionCible,
            sortiesPositives: tauxReels.sortiesPositives - objectif.tauxSortiesPositivesCible,
          } : null,
          progression: objectif
            ? Math.round((totalSorties / objectif.nombreSortiesPrevisionnel) * 100)
            : 0,
        },
        moisEcoules: currentMonth,
      },
    });
  } catch (error) {
    console.error('Erreur getDashboardObjectifs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du tableau de bord',
    });
  }
};
