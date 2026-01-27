import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadToGCS, deleteFromGCS, getSignedUrl } from '../services/storageService';

const prisma = new PrismaClient();

// ============================================
// SALARIÉS EN INSERTION
// ============================================

// Liste des salariés avec filtres et pagination
export const getInsertionEmployees = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      statut,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search as string } },
        { prenom: { contains: search as string } },
        { email: { contains: search as string } },
        { numeroSecu: { contains: search as string } }
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.insertionEmployee.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          fichePro: true,
          contrats: {
            where: { statut: 'actif' },
            take: 1
          },
          documents: {
            select: {
              id: true,
              categorie: true,
              typeDocument: true,
              estObligatoire: true,
              estValide: true,
              dateExpiration: true
            }
          },
          _count: {
            select: {
              suivis: true,
              conventionsPMSMP: true,
              formations: true,
              avertissements: true
            }
          }
        }
      }),
      prisma.insertionEmployee.count({ where })
    ]);

    // Calculer les documents manquants et expirés pour chaque salarié
    const employeesWithStats = employees.map(emp => {
      const docsObligatoires = ['CNI', 'CARTE_VITALE', 'JUSTIF_DOMICILE', 'ATTESTATION_SECU', 'RIB', 'PASS_INCLUSION', 'DPAE', 'CONTRAT'];
      const docsPresents = emp.documents.map(d => d.typeDocument);
      const docsManquants = docsObligatoires.filter(d => !docsPresents.includes(d));
      const docsExpires = emp.documents.filter(d => d.dateExpiration && new Date(d.dateExpiration) < new Date());

      return {
        ...emp,
        stats: {
          documentsManquants: docsManquants.length,
          documentsExpires: docsExpires.length,
          dossierComplet: docsManquants.length === 0 && docsExpires.length === 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        employees: employeesWithStats,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      }
    });
  } catch (error) {
    console.error('Erreur getInsertionEmployees:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Détail d'un salarié
export const getInsertionEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.insertionEmployee.findUnique({
      where: { id },
      include: {
        fichePro: true,
        suivis: {
          orderBy: { dateEntretien: 'desc' }
        },
        conventionsPMSMP: {
          orderBy: { dateDebut: 'desc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        contrats: {
          orderBy: { dateDebut: 'desc' }
        },
        avertissements: {
          orderBy: { dateAvertissement: 'desc' }
        },
        formations: {
          orderBy: { dateDebut: 'desc' }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Salarié non trouvé' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Erreur getInsertionEmployee:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un salarié
export const createInsertionEmployee = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const employee = await prisma.insertionEmployee.create({
      data: {
        ...data,
        dateNaissance: new Date(data.dateNaissance),
        dateEntree: new Date(data.dateEntree),
        dateSortie: data.dateSortie ? new Date(data.dateSortie) : null,
        dateExpirationPiece: data.dateExpirationPiece ? new Date(data.dateExpirationPiece) : null,
        passInclusionDate: data.passInclusionDate ? new Date(data.passInclusionDate) : null,
        passInclusionExpiration: data.passInclusionExpiration ? new Date(data.passInclusionExpiration) : null
      },
      include: {
        fichePro: true
      }
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error('Erreur createInsertionEmployee:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour un salarié
export const updateInsertionEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Convertir les dates
    if (data.dateNaissance) data.dateNaissance = new Date(data.dateNaissance);
    if (data.dateEntree) data.dateEntree = new Date(data.dateEntree);
    if (data.dateSortie) data.dateSortie = new Date(data.dateSortie);
    if (data.dateExpirationPiece) data.dateExpirationPiece = new Date(data.dateExpirationPiece);
    if (data.passInclusionDate) data.passInclusionDate = new Date(data.passInclusionDate);
    if (data.passInclusionExpiration) data.passInclusionExpiration = new Date(data.passInclusionExpiration);

    const employee = await prisma.insertionEmployee.update({
      where: { id },
      data,
      include: {
        fichePro: true
      }
    });

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Erreur updateInsertionEmployee:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un salarié
export const deleteInsertionEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.insertionEmployee.delete({ where: { id } });

    res.json({ success: true, message: 'Salarié supprimé' });
  } catch (error) {
    console.error('Erreur deleteInsertionEmployee:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// FICHE PRO
// ============================================

export const createOrUpdateFichePro = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    const fichePro = await prisma.fichePro.upsert({
      where: { employeeId },
      update: {
        ...data,
        dateBilan: data.dateBilan ? new Date(data.dateBilan) : null,
        cvDateMaj: data.cvDateMaj ? new Date(data.cvDateMaj) : null
      },
      create: {
        employeeId,
        ...data,
        dateBilan: data.dateBilan ? new Date(data.dateBilan) : null,
        cvDateMaj: data.cvDateMaj ? new Date(data.cvDateMaj) : null
      }
    });

    res.json({ success: true, data: fichePro });
  } catch (error) {
    console.error('Erreur createOrUpdateFichePro:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// SUIVIS / ENTRETIENS
// ============================================

export const getSuivis = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const suivis = await prisma.suiviEntretien.findMany({
      where: { employeeId },
      orderBy: { dateEntretien: 'desc' }
    });

    res.json({ success: true, data: suivis });
  } catch (error) {
    console.error('Erreur getSuivis:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createSuivi = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    const suivi = await prisma.suiviEntretien.create({
      data: {
        employeeId,
        ...data,
        dateEntretien: new Date(data.dateEntretien),
        dateProchainRdv: data.dateProchainRdv ? new Date(data.dateProchainRdv) : null
      }
    });

    res.status(201).json({ success: true, data: suivi });
  } catch (error) {
    console.error('Erreur createSuivi:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateSuivi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.dateEntretien) data.dateEntretien = new Date(data.dateEntretien);
    if (data.dateProchainRdv) data.dateProchainRdv = new Date(data.dateProchainRdv);

    const suivi = await prisma.suiviEntretien.update({
      where: { id },
      data
    });

    res.json({ success: true, data: suivi });
  } catch (error) {
    console.error('Erreur updateSuivi:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteSuivi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.suiviEntretien.delete({ where: { id } });

    res.json({ success: true, message: 'Suivi supprimé' });
  } catch (error) {
    console.error('Erreur deleteSuivi:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// CONVENTIONS PMSMP
// ============================================

export const getConventionsPMSMP = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const conventions = await prisma.conventionPMSMP.findMany({
      where: { employeeId },
      orderBy: { dateDebut: 'desc' }
    });

    res.json({ success: true, data: conventions });
  } catch (error) {
    console.error('Erreur getConventionsPMSMP:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createConventionPMSMP = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    const convention = await prisma.conventionPMSMP.create({
      data: {
        employeeId,
        ...data,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        bilanDate: data.bilanDate ? new Date(data.bilanDate) : null
      }
    });

    res.status(201).json({ success: true, data: convention });
  } catch (error) {
    console.error('Erreur createConventionPMSMP:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateConventionPMSMP = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) data.dateFin = new Date(data.dateFin);
    if (data.bilanDate) data.bilanDate = new Date(data.bilanDate);

    const convention = await prisma.conventionPMSMP.update({
      where: { id },
      data
    });

    res.json({ success: true, data: convention });
  } catch (error) {
    console.error('Erreur updateConventionPMSMP:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// DOCUMENTS
// ============================================

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { categorie } = req.query;

    const where: any = { employeeId };
    if (categorie) where.categorie = categorie;

    const documents = await prisma.insertionDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Générer les URLs signées pour les documents GCS
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        if (doc.url && doc.url.startsWith('gs://')) {
          const signedUrl = await getSignedUrl(doc.url);
          return { ...doc, signedUrl };
        }
        return { ...doc, signedUrl: doc.url };
      })
    );

    res.json({ success: true, data: documentsWithUrls });
  } catch (error) {
    console.error('Erreur getDocuments:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createDocument = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;
    let fileUrl = data.url || null;

    // Si un fichier a été uploadé via multer
    if (req.file) {
      try {
        fileUrl = await uploadToGCS(req.file, `insertion-documents/${employeeId}`);
      } catch (uploadError) {
        console.error('Erreur upload GCS:', uploadError);
        // Continuer sans fichier si l'upload échoue
      }
    }

    const document = await prisma.insertionDocument.create({
      data: {
        employeeId,
        categorie: data.categorie || 'ADMIN',
        typeDocument: data.typeDocument || 'AUTRE',
        nomDocument: data.nomDocument || req.file?.originalname || 'Document',
        url: fileUrl || '',
        dateDocument: data.dateDocument ? new Date(data.dateDocument) : new Date(),
        dateExpiration: data.dateExpiration ? new Date(data.dateExpiration) : undefined
      }
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('Erreur createDocument:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.insertionDocument.delete({ where: { id } });

    res.json({ success: true, message: 'Document supprimé' });
  } catch (error) {
    console.error('Erreur deleteDocument:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// CONTRATS
// ============================================

export const getContrats = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const contrats = await prisma.contratInsertion.findMany({
      where: { employeeId },
      orderBy: { dateDebut: 'desc' }
    });

    res.json({ success: true, data: contrats });
  } catch (error) {
    console.error('Erreur getContrats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createContrat = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    const contrat = await prisma.contratInsertion.create({
      data: {
        employeeId,
        ...data,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        dpaeDate: data.dpaeDate ? new Date(data.dpaeDate) : null,
        dateSignature: data.dateSignature ? new Date(data.dateSignature) : null,
        dateSortieEffective: data.dateSortieEffective ? new Date(data.dateSortieEffective) : null
      }
    });

    res.status(201).json({ success: true, data: contrat });
  } catch (error) {
    console.error('Erreur createContrat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateContrat = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) data.dateFin = new Date(data.dateFin);
    if (data.dpaeDate) data.dpaeDate = new Date(data.dpaeDate);
    if (data.dateSignature) data.dateSignature = new Date(data.dateSignature);
    if (data.dateSortieEffective) data.dateSortieEffective = new Date(data.dateSortieEffective);

    const contrat = await prisma.contratInsertion.update({
      where: { id },
      data
    });

    res.json({ success: true, data: contrat });
  } catch (error) {
    console.error('Erreur updateContrat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// AVERTISSEMENTS
// ============================================

export const createAvertissement = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    const avertissement = await prisma.avertissement.create({
      data: {
        employeeId,
        ...data,
        dateAvertissement: new Date(data.dateAvertissement),
        dateConvocation: data.dateConvocation ? new Date(data.dateConvocation) : null,
        dateEntretien: data.dateEntretien ? new Date(data.dateEntretien) : null
      }
    });

    res.status(201).json({ success: true, data: avertissement });
  } catch (error) {
    console.error('Erreur createAvertissement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// FORMATIONS
// ============================================

export const getFormations = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const formations = await prisma.formation.findMany({
      where: { employeeId },
      orderBy: { dateDebut: 'desc' }
    });

    res.json({ success: true, data: formations });
  } catch (error) {
    console.error('Erreur getFormations:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const createFormation = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const data = req.body;

    const formation = await prisma.formation.create({
      data: {
        employeeId,
        ...data,
        dateDebut: new Date(data.dateDebut),
        dateFin: data.dateFin ? new Date(data.dateFin) : null
      }
    });

    res.status(201).json({ success: true, data: formation });
  } catch (error) {
    console.error('Erreur createFormation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateFormation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
    if (data.dateFin) data.dateFin = new Date(data.dateFin);

    const formation = await prisma.formation.update({
      where: { id },
      data
    });

    res.json({ success: true, data: formation });
  } catch (error) {
    console.error('Erreur updateFormation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// STATISTIQUES & DASHBOARD
// ============================================

export const getInsertionStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const debutAnnee = new Date(now.getFullYear(), 0, 1);

    // Statistiques générales
    const [
      totalActifs,
      totalSortis,
      entreesAnnee,
      sortiesAnnee,
      sortiesPositives,
      totalPMSMP,
      totalFormations,
      employeesParStatut
    ] = await Promise.all([
      prisma.insertionEmployee.count({ where: { statut: 'actif' } }),
      prisma.insertionEmployee.count({ where: { statut: 'sorti' } }),
      prisma.insertionEmployee.count({
        where: {
          dateEntree: { gte: debutAnnee }
        }
      }),
      prisma.insertionEmployee.count({
        where: {
          dateSortie: { gte: debutAnnee },
          statut: 'sorti'
        }
      }),
      prisma.insertionEmployee.count({
        where: {
          dateSortie: { gte: debutAnnee },
          typeSortie: 'positive'
        }
      }),
      prisma.conventionPMSMP.count({
        where: { dateDebut: { gte: debutAnnee } }
      }),
      prisma.formation.count({
        where: { dateDebut: { gte: debutAnnee } }
      }),
      prisma.insertionEmployee.groupBy({
        by: ['statut'],
        _count: { id: true }
      })
    ]);

    // Documents manquants / alertes
    const employeesAvecDocs = await prisma.insertionEmployee.findMany({
      where: { statut: 'actif' },
      select: {
        id: true,
        nom: true,
        prenom: true,
        documents: {
          select: {
            typeDocument: true,
            dateExpiration: true
          }
        }
      }
    });

    const docsObligatoires = ['CNI', 'CARTE_VITALE', 'JUSTIF_DOMICILE', 'ATTESTATION_SECU', 'RIB', 'PASS_INCLUSION', 'DPAE', 'CONTRAT'];

    let alertesDocuments = 0;
    let dossierIncomplets = 0;

    employeesAvecDocs.forEach(emp => {
      const typesPresents = emp.documents.map(d => d.typeDocument);
      const manquants = docsObligatoires.filter(d => !typesPresents.includes(d));
      const expires = emp.documents.filter(d => d.dateExpiration && new Date(d.dateExpiration) < now);

      if (manquants.length > 0) dossierIncomplets++;
      alertesDocuments += expires.length;
    });

    // Contrats à renouveler (fin dans les 30 prochains jours)
    const dans30Jours = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const contratsARenouveler = await prisma.contratInsertion.count({
      where: {
        statut: 'actif',
        dateFin: {
          gte: now,
          lte: dans30Jours
        }
      }
    });

    // Entretiens récents et à venir
    const entretiensCeMois = await prisma.suiviEntretien.count({
      where: {
        dateEntretien: { gte: debutMois }
      }
    });

    res.json({
      success: true,
      data: {
        effectifs: {
          actifs: totalActifs,
          sortis: totalSortis,
          parStatut: employeesParStatut
        },
        mouvements: {
          entreesAnnee,
          sortiesAnnee,
          sortiesPositives,
          tauxSortiePositive: sortiesAnnee > 0 ? Math.round((sortiesPositives / sortiesAnnee) * 100) : 0
        },
        accompagnement: {
          pmsmpAnnee: totalPMSMP,
          formationsAnnee: totalFormations,
          entretiensMois: entretiensCeMois
        },
        alertes: {
          dossierIncomplets,
          documentsExpires: alertesDocuments,
          contratsARenouveler
        }
      }
    });
  } catch (error) {
    console.error('Erreur getInsertionStats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Alertes détaillées
export const getAlertes = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const dans30Jours = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dans7Jours = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Documents expirés ou expirant bientôt
    const docsExpirant = await prisma.insertionDocument.findMany({
      where: {
        dateExpiration: {
          lte: dans30Jours
        },
        employee: {
          statut: 'actif'
        }
      },
      include: {
        employee: {
          select: { id: true, nom: true, prenom: true }
        }
      },
      orderBy: { dateExpiration: 'asc' }
    });

    // Contrats expirant bientôt
    const contratsExpirant = await prisma.contratInsertion.findMany({
      where: {
        statut: 'actif',
        dateFin: {
          lte: dans30Jours
        }
      },
      include: {
        employee: {
          select: { id: true, nom: true, prenom: true }
        }
      },
      orderBy: { dateFin: 'asc' }
    });

    // Pass Inclusion expirant
    const passExpirant = await prisma.insertionEmployee.findMany({
      where: {
        statut: 'actif',
        passInclusionExpiration: {
          lte: dans30Jours
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        passInclusionExpiration: true
      },
      orderBy: { passInclusionExpiration: 'asc' }
    });

    // Entretiens en retard (pas d'entretien depuis 30 jours)
    const il_y_a_30_jours = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const employeesSansEntretienRecent = await prisma.insertionEmployee.findMany({
      where: {
        statut: 'actif',
        suivis: {
          none: {
            dateEntretien: { gte: il_y_a_30_jours }
          }
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        suivis: {
          orderBy: { dateEntretien: 'desc' },
          take: 1
        }
      }
    });

    res.json({
      success: true,
      data: {
        documentsExpirant: docsExpirant.map(d => ({
          ...d,
          urgence: d.dateExpiration && d.dateExpiration < now ? 'expire' :
                   d.dateExpiration && d.dateExpiration < dans7Jours ? 'urgent' : 'attention'
        })),
        contratsExpirant: contratsExpirant.map(c => ({
          ...c,
          urgence: c.dateFin < now ? 'expire' :
                   c.dateFin < dans7Jours ? 'urgent' : 'attention'
        })),
        passInclusionExpirant: passExpirant,
        entretiensEnRetard: employeesSansEntretienRecent
      }
    });
  } catch (error) {
    console.error('Erreur getAlertes:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// GÉNÉRATION DE RAPPORTS
// ============================================

// Données pour rapport individuel
export const getRapportIndividuel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.insertionEmployee.findUnique({
      where: { id },
      include: {
        fichePro: true,
        suivis: {
          orderBy: { dateEntretien: 'desc' }
        },
        conventionsPMSMP: {
          orderBy: { dateDebut: 'desc' }
        },
        documents: true,
        contrats: {
          orderBy: { dateDebut: 'desc' }
        },
        formations: {
          orderBy: { dateDebut: 'desc' }
        },
        avertissements: {
          orderBy: { dateAvertissement: 'desc' }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Salarié non trouvé' });
    }

    // Calcul des statistiques du parcours
    const dureeParcoursJours = employee.dateSortie
      ? Math.floor((new Date(employee.dateSortie).getTime() - new Date(employee.dateEntree).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((new Date().getTime() - new Date(employee.dateEntree).getTime()) / (1000 * 60 * 60 * 24));

    const totalEntretiens = employee.suivis.length;
    const totalPMSMP = employee.conventionsPMSMP.length;
    const totalFormations = employee.formations.length;
    const heuresFormation = employee.formations.reduce((sum, f) => sum + (f.dureeHeures || 0), 0);

    res.json({
      success: true,
      data: {
        employee,
        statistiques: {
          dureeParcoursJours,
          dureeParcoursMois: Math.floor(dureeParcoursJours / 30),
          totalEntretiens,
          totalPMSMP,
          pmsmpReussies: employee.conventionsPMSMP.filter(p => p.evaluationEntreprise === 'Très satisfaisant' || p.evaluationEntreprise === 'Satisfaisant').length,
          totalFormations,
          heuresFormation,
          formationsValidees: employee.formations.filter(f => f.resultat === 'Validée').length
        }
      }
    });
  } catch (error) {
    console.error('Erreur getRapportIndividuel:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Rapport de synthèse pour dialogue de gestion
export const getRapportDialogueGestion = async (req: Request, res: Response) => {
  try {
    const { dateDebut, dateFin } = req.query;

    const debut = dateDebut ? new Date(dateDebut as string) : new Date(new Date().getFullYear(), 0, 1);
    const fin = dateFin ? new Date(dateFin as string) : new Date();

    // Mouvements sur la période
    const [entrees, sorties, sortiesPositives] = await Promise.all([
      prisma.insertionEmployee.count({
        where: {
          dateEntree: { gte: debut, lte: fin }
        }
      }),
      prisma.insertionEmployee.count({
        where: {
          dateSortie: { gte: debut, lte: fin }
        }
      }),
      prisma.insertionEmployee.count({
        where: {
          dateSortie: { gte: debut, lte: fin },
          typeSortie: 'positive'
        }
      })
    ]);

    // Détail des sorties
    const detailSorties = await prisma.insertionEmployee.groupBy({
      by: ['typeSortie', 'motifSortie'],
      where: {
        dateSortie: { gte: debut, lte: fin }
      },
      _count: { id: true }
    });

    // Accompagnement
    const [entretiens, pmsmp, formations] = await Promise.all([
      prisma.suiviEntretien.count({
        where: {
          dateEntretien: { gte: debut, lte: fin }
        }
      }),
      prisma.conventionPMSMP.findMany({
        where: {
          dateDebut: { gte: debut, lte: fin }
        },
        include: {
          employee: { select: { nom: true, prenom: true } }
        }
      }),
      prisma.formation.findMany({
        where: {
          dateDebut: { gte: debut, lte: fin }
        },
        include: {
          employee: { select: { nom: true, prenom: true } }
        }
      })
    ]);

    // Effectif actuel
    const effectifActuel = await prisma.insertionEmployee.count({
      where: { statut: 'actif' }
    });

    res.json({
      success: true,
      data: {
        periode: { debut, fin },
        effectifActuel,
        mouvements: {
          entrees,
          sorties,
          sortiesPositives,
          tauxSortiePositive: sorties > 0 ? Math.round((sortiesPositives / sorties) * 100) : 0,
          detailSorties
        },
        accompagnement: {
          nombreEntretiens: entretiens,
          nombrePMSMP: pmsmp.length,
          nombreFormations: formations.length,
          pmsmp,
          formations
        }
      }
    });
  } catch (error) {
    console.error('Erreur getRapportDialogueGestion:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// AGENDA - Tous les événements
// ============================================

export const getAgendaEvents = async (req: Request, res: Response) => {
  try {
    const { mois, annee } = req.query;

    const moisNum = parseInt(mois as string) || new Date().getMonth() + 1;
    const anneeNum = parseInt(annee as string) || new Date().getFullYear();

    // Calculer les dates de début et fin du mois (avec marge pour affichage calendrier)
    const debutMois = new Date(anneeNum, moisNum - 1, 1);
    const finMois = new Date(anneeNum, moisNum, 0, 23, 59, 59);

    // Étendre pour le calendrier (semaines complètes)
    const premierJourSemaine = debutMois.getDay();
    const debut = new Date(debutMois);
    debut.setDate(debut.getDate() - (premierJourSemaine === 0 ? 6 : premierJourSemaine - 1));

    const dernierJourSemaine = finMois.getDay();
    const fin = new Date(finMois);
    fin.setDate(fin.getDate() + (dernierJourSemaine === 0 ? 0 : 7 - dernierJourSemaine));

    // Récupérer tous les événements
    const [suivis, pmsmp, formations, contrats, avertissements, documents] = await Promise.all([
      // Suivis/Entretiens
      prisma.suiviEntretien.findMany({
        where: {
          dateEntretien: { gte: debut, lte: fin }
        },
        include: {
          employee: { select: { id: true, nom: true, prenom: true, civilite: true } }
        },
        orderBy: { dateEntretien: 'asc' }
      }),
      // PMSMP
      prisma.conventionPMSMP.findMany({
        where: {
          OR: [
            { dateDebut: { gte: debut, lte: fin } },
            { dateFin: { gte: debut, lte: fin } },
            { AND: [{ dateDebut: { lte: debut } }, { dateFin: { gte: fin } }] }
          ]
        },
        include: {
          employee: { select: { id: true, nom: true, prenom: true, civilite: true } }
        }
      }),
      // Formations
      prisma.formation.findMany({
        where: {
          OR: [
            { dateDebut: { gte: debut, lte: fin } },
            { dateFin: { gte: debut, lte: fin } },
            { AND: [{ dateDebut: { lte: debut } }, { dateFin: { gte: fin } }] }
          ]
        },
        include: {
          employee: { select: { id: true, nom: true, prenom: true, civilite: true } }
        }
      }),
      // Contrats (début et fin)
      prisma.contratInsertion.findMany({
        where: {
          OR: [
            { dateDebut: { gte: debut, lte: fin } },
            { dateFin: { gte: debut, lte: fin } }
          ]
        },
        include: {
          employee: { select: { id: true, nom: true, prenom: true, civilite: true } }
        }
      }),
      // Avertissements
      prisma.avertissement.findMany({
        where: {
          OR: [
            { dateAvertissement: { gte: debut, lte: fin } },
            { dateConvocation: { gte: debut, lte: fin } },
            { dateEntretien: { gte: debut, lte: fin } }
          ]
        },
        include: {
          employee: { select: { id: true, nom: true, prenom: true, civilite: true } }
        }
      }),
      // Documents avec date d'expiration
      prisma.insertionDocument.findMany({
        where: {
          dateExpiration: { gte: debut, lte: fin }
        },
        include: {
          employee: { select: { id: true, nom: true, prenom: true, civilite: true } }
        }
      })
    ]);

    // Transformer en événements uniformes
    const events: any[] = [];

    // Suivis
    suivis.forEach(s => {
      events.push({
        id: s.id,
        type: 'suivi',
        category: 'PRO',
        title: `Entretien ${s.typeEntretien || ''}`,
        description: s.objetEntretien,
        date: s.dateEntretien,
        dateEnd: null,
        employee: s.employee,
        color: '#3B82F6', // blue
        icon: 'calendar',
        details: {
          duree: s.duree,
          conseiller: s.conseillerNom,
          prochainRdv: s.dateProchainRdv
        }
      });
    });

    // PMSMP
    pmsmp.forEach(p => {
      events.push({
        id: p.id,
        type: 'pmsmp',
        category: 'PRO',
        title: `PMSMP - ${p.entrepriseNom}`,
        description: p.objectifDecouverte,
        date: p.dateDebut,
        dateEnd: p.dateFin,
        employee: p.employee,
        color: '#8B5CF6', // purple
        icon: 'building',
        details: {
          tuteur: p.tuteurNom,
          statut: p.statut
        }
      });
    });

    // Formations
    formations.forEach(f => {
      events.push({
        id: f.id,
        type: 'formation',
        category: 'PRO',
        title: `Formation: ${f.intitule}`,
        description: f.objectifs,
        date: f.dateDebut,
        dateEnd: f.dateFin,
        employee: f.employee,
        color: '#10B981', // green
        icon: 'graduation',
        details: {
          organisme: f.organisme,
          duree: f.dureeHeures,
          statut: f.statut
        }
      });
    });

    // Contrats
    contrats.forEach(c => {
      // Début de contrat
      if (c.dateDebut >= debut && c.dateDebut <= fin) {
        events.push({
          id: `${c.id}-debut`,
          type: 'contrat-debut',
          category: 'RH',
          title: `Début contrat ${c.typeContrat}`,
          description: c.motif,
          date: c.dateDebut,
          dateEnd: null,
          employee: c.employee,
          color: '#F59E0B', // amber
          icon: 'file-signature',
          details: {
            dureeHeures: c.dureeHeures,
            dpae: c.dpaeNumero
          }
        });
      }
      // Fin de contrat
      if (c.dateFin && c.dateFin >= debut && c.dateFin <= fin) {
        events.push({
          id: `${c.id}-fin`,
          type: 'contrat-fin',
          category: 'RH',
          title: `Fin contrat ${c.typeContrat}`,
          description: c.motif === 'Renouvellement' ? 'À renouveler' : 'Échéance',
          date: c.dateFin,
          dateEnd: null,
          employee: c.employee,
          color: '#EF4444', // red
          icon: 'calendar-x',
          details: {
            statut: c.statut
          }
        });
      }
    });

    // Avertissements
    avertissements.forEach(a => {
      if (a.dateAvertissement >= debut && a.dateAvertissement <= fin) {
        events.push({
          id: a.id,
          type: 'avertissement',
          category: 'RH',
          title: `Avertissement ${a.type}`,
          description: a.motif,
          date: a.dateAvertissement,
          dateEnd: null,
          employee: a.employee,
          color: '#DC2626', // red-600
          icon: 'alert-triangle',
          details: {}
        });
      }
      if (a.dateConvocation && a.dateConvocation >= debut && a.dateConvocation <= fin) {
        events.push({
          id: `${a.id}-conv`,
          type: 'convocation',
          category: 'RH',
          title: 'Convocation entretien',
          description: a.motif,
          date: a.dateConvocation,
          dateEnd: null,
          employee: a.employee,
          color: '#F97316', // orange
          icon: 'mail',
          details: {}
        });
      }
    });

    // Documents expiration
    documents.forEach(d => {
      events.push({
        id: d.id,
        type: 'document-expiration',
        category: 'ADMIN',
        title: `Expiration: ${d.typeDocument}`,
        description: d.nomDocument,
        date: d.dateExpiration,
        dateEnd: null,
        employee: d.employee,
        color: '#F43F5E', // rose
        icon: 'file-warning',
        details: {
          categorie: d.categorie
        }
      });
    });

    // Trier par date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: {
        mois: moisNum,
        annee: anneeNum,
        periode: { debut, fin },
        events,
        stats: {
          total: events.length,
          parCategorie: {
            PRO: events.filter(e => e.category === 'PRO').length,
            ADMIN: events.filter(e => e.category === 'ADMIN').length,
            RH: events.filter(e => e.category === 'RH').length
          }
        }
      }
    });
  } catch (error) {
    console.error('Erreur getAgendaEvents:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// PARCOURS VISUEL
// ============================================

export const getParcours = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Récupérer le salarié avec toutes ses données
    const employee = await prisma.insertionEmployee.findUnique({
      where: { id },
      include: {
        fichePro: true,
        contrats: { orderBy: { dateDebut: 'asc' } },
        suivis: { orderBy: { dateEntretien: 'asc' } },
        conventionsPMSMP: { orderBy: { dateDebut: 'asc' } },
        formations: { orderBy: { dateDebut: 'asc' } },
        documents: { orderBy: { createdAt: 'asc' } },
        avertissements: { orderBy: { dateAvertissement: 'asc' } },
        objectifsIndividuels: { orderBy: { dateCreation: 'asc' } }
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Salarié non trouvé' });
    }

    // Construire les événements du parcours
    const parcours: any[] = [];

    // 1. Entrée dans la structure
    parcours.push({
      id: 'entree',
      type: 'milestone',
      category: 'ENTREE',
      title: 'Entrée dans la structure',
      description: `Début du parcours d'insertion - ${employee.typeContrat} ${employee.dureeHebdo}h/semaine`,
      date: employee.dateEntree,
      icon: 'door-open',
      color: 'emerald',
      importance: 'high',
      details: {
        contrat: employee.typeContrat,
        heures: employee.dureeHebdo,
        poste: employee.poste,
        prescripteur: employee.fichePro?.prescripteur,
        conseiller: employee.fichePro?.conseillerReferent
      }
    });

    // 2. Diagnostic initial (si fichePro existe et a des données)
    if (employee.fichePro) {
      const fp = employee.fichePro;
      if (fp.niveauFormation || fp.situationAvantEntree) {
        parcours.push({
          id: 'diagnostic',
          type: 'milestone',
          category: 'DIAGNOSTIC',
          title: 'Diagnostic initial',
          description: 'Évaluation de la situation à l\'entrée',
          date: employee.dateEntree,
          icon: 'clipboard-check',
          color: 'blue',
          importance: 'high',
          details: {
            niveau: fp.niveauFormation,
            situation: fp.situationAvantEntree,
            freins: [
              fp.freinMobilite && 'Mobilité',
              fp.freinLangue && 'Langue',
              fp.freinLogement && 'Logement',
              fp.freinSante && 'Santé',
              fp.freinGardeEnfant && 'Garde d\'enfant',
              fp.freinAdministratif && 'Administratif',
              fp.freinFinancier && 'Financier'
            ].filter(Boolean),
            objectif: fp.objectifPrincipal
          }
        });
      }
    }

    // 3. Contrats et renouvellements
    employee.contrats.forEach((contrat, idx) => {
      parcours.push({
        id: `contrat-${contrat.id}`,
        type: idx === 0 ? 'milestone' : 'event',
        category: 'CONTRAT',
        title: idx === 0 ? 'Signature du contrat initial' : `Renouvellement n°${idx}`,
        description: `${contrat.type} - ${contrat.duree || ''} mois`,
        date: contrat.dateDebut,
        dateEnd: contrat.dateFin,
        icon: 'file-signature',
        color: idx === 0 ? 'amber' : 'yellow',
        importance: idx === 0 ? 'high' : 'medium',
        details: {
          type: contrat.type,
          duree: contrat.duree,
          motif: contrat.motifRenouvellement
        }
      });
    });

    // 4. Suivis / Entretiens
    employee.suivis.forEach(suivi => {
      let importance = 'low';
      if (suivi.typeEntretien === 'Bilan' || suivi.typeEntretien === 'bilan_mi_parcours' || suivi.typeEntretien === 'bilan_fin_parcours') {
        importance = 'high';
      } else if (suivi.typeEntretien === 'Mensuel' || suivi.typeEntretien === 'entretien_mensuel') {
        importance = 'medium';
      }

      parcours.push({
        id: `suivi-${suivi.id}`,
        type: importance === 'high' ? 'milestone' : 'event',
        category: 'ACCOMPAGNEMENT',
        title: formatTypeSuivi(suivi.typeEntretien),
        description: suivi.objetEntretien?.substring(0, 100),
        date: suivi.dateEntretien,
        icon: 'comments',
        color: 'blue',
        importance,
        details: {
          type: suivi.typeEntretien,
          duree: suivi.duree,
          conseiller: suivi.conseillerNom,
          objet: suivi.objetEntretien,
          pointsAbordes: suivi.pointsAbordes,
          actionsDecidees: suivi.actionsDecidees
        }
      });
    });

    // 5. PMSMP (Périodes de Mise en Situation en Milieu Professionnel)
    employee.conventionsPMSMP.forEach(pmsmp => {
      parcours.push({
        id: `pmsmp-${pmsmp.id}`,
        type: 'milestone',
        category: 'PMSMP',
        title: `PMSMP - ${pmsmp.entreprise}`,
        description: `${pmsmp.metierCible} - ${pmsmp.objectif}`,
        date: pmsmp.dateDebut,
        dateEnd: pmsmp.dateFin,
        icon: 'building',
        color: 'purple',
        importance: 'high',
        details: {
          entreprise: pmsmp.entreprise,
          metier: pmsmp.metierCible,
          objectif: pmsmp.objectif,
          tuteur: pmsmp.tuteurNom,
          evaluation: pmsmp.evaluation,
          bilanPositif: pmsmp.bilanPositif
        }
      });
    });

    // 6. Formations
    employee.formations.forEach(formation => {
      const isQualifiante = formation.type === 'qualifiante' || formation.type === 'certifiante';
      parcours.push({
        id: `formation-${formation.id}`,
        type: isQualifiante ? 'milestone' : 'event',
        category: 'FORMATION',
        title: formation.intitule,
        description: `${formation.organisme} - ${formation.dureeHeures}h`,
        date: formation.dateDebut,
        dateEnd: formation.dateFin,
        icon: 'graduation-cap',
        color: 'green',
        importance: isQualifiante ? 'high' : 'medium',
        details: {
          type: formation.type,
          organisme: formation.organisme,
          duree: formation.dureeHeures,
          financement: formation.financement,
          validation: formation.validation,
          certificationObtenue: formation.certificationObtenue
        }
      });
    });

    // 7. Documents importants obtenus
    const docsImportants = employee.documents.filter(d =>
      ['CERTIFICATION', 'DIPLOME', 'ATTESTATION_FORMATION', 'PERMIS'].includes(d.typeDocument)
    );
    docsImportants.forEach(doc => {
      parcours.push({
        id: `doc-${doc.id}`,
        type: 'event',
        category: 'ACQUISITION',
        title: `Obtention: ${doc.nomDocument}`,
        description: doc.typeDocument,
        date: doc.createdAt,
        icon: 'award',
        color: 'teal',
        importance: 'medium',
        details: {
          type: doc.typeDocument,
          categorie: doc.categorie
        }
      });
    });

    // 8. Avertissements (événements négatifs)
    employee.avertissements.forEach(avert => {
      parcours.push({
        id: `avert-${avert.id}`,
        type: 'event',
        category: 'AVERTISSEMENT',
        title: `Avertissement - ${avert.type}`,
        description: avert.motif,
        date: avert.dateAvertissement,
        icon: 'exclamation-triangle',
        color: 'red',
        importance: 'medium',
        details: {
          type: avert.type,
          motif: avert.motif
        }
      });
    });

    // 9. Objectifs individuels
    employee.objectifsIndividuels.forEach(obj => {
      const isAtteint = obj.statut === 'atteint';
      parcours.push({
        id: `objectif-${obj.id}`,
        type: isAtteint ? 'milestone' : 'event',
        category: 'OBJECTIF',
        title: obj.titre,
        description: obj.description || `Objectif ${obj.categorie}`,
        date: obj.dateRealisation || obj.dateEcheance || obj.dateCreation,
        icon: isAtteint ? 'check-circle' : 'target',
        color: isAtteint ? 'emerald' : obj.priorite === 'haute' || obj.priorite === 'critique' ? 'orange' : 'cyan',
        importance: isAtteint ? 'high' : 'medium',
        details: {
          categorie: obj.categorie,
          statut: obj.statut,
          progression: obj.progression,
          priorite: obj.priorite,
          points: obj.pointsAttribues,
          echeance: obj.dateEcheance,
          realisation: obj.dateRealisation
        }
      });
    });

    // 10. Sortie (si statut = sorti)
    if (employee.statut === 'sorti' && employee.dateSortie) {
      const fp = employee.fichePro;
      parcours.push({
        id: 'sortie',
        type: 'milestone',
        category: 'SORTIE',
        title: 'Fin du parcours',
        description: fp?.motifSortie || 'Sortie de la structure',
        date: employee.dateSortie,
        icon: 'flag-checkered',
        color: fp?.sortiePositive ? 'emerald' : 'gray',
        importance: 'high',
        details: {
          motif: fp?.motifSortie,
          positive: fp?.sortiePositive,
          employeurSortie: fp?.employeurSortie,
          typeContratSortie: fp?.typeContratSortie
        }
      });
    }

    // Trier par date
    parcours.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculer les statistiques du parcours
    const now = new Date();
    const entree = new Date(employee.dateEntree);
    const dureeParcours = Math.floor((now.getTime() - entree.getTime()) / (1000 * 60 * 60 * 24));

    // Récupérer la configuration des objectifs
    const config = await prisma.objectifConfiguration.findFirst({ where: { estActif: true } });

    // Calculer la progression avec la config
    const progression = await calculateProgressionWithConfig(employee, config);

    // Stats des objectifs individuels
    const objectifsIndiv = employee.objectifsIndividuels || [];
    const objectifsStats = {
      total: objectifsIndiv.length,
      enCours: objectifsIndiv.filter(o => o.statut === 'en_cours').length,
      atteints: objectifsIndiv.filter(o => o.statut === 'atteint').length,
      pointsObtenus: objectifsIndiv.filter(o => o.statut === 'atteint').reduce((sum, o) => sum + o.pointsAttribues, 0)
    };

    const stats = {
      dureeParcours: dureeParcours,
      dureeMois: Math.floor(dureeParcours / 30),
      nbSuivis: employee.suivis.length,
      nbPMSMP: employee.conventionsPMSMP.length,
      nbFormations: employee.formations.length,
      heuresFormation: employee.formations.reduce((sum, f) => sum + (f.dureeHeures || 0), 0),
      nbRenouvellements: Math.max(0, employee.contrats.length - 1),
      nbObjectifs: objectifsStats.total,
      objectifsAtteints: objectifsStats.atteints,
      progression
    };

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          nom: employee.nom,
          prenom: employee.prenom,
          civilite: employee.civilite,
          statut: employee.statut,
          dateEntree: employee.dateEntree,
          dateSortie: employee.dateSortie,
          typeContrat: employee.typeContrat,
          poste: employee.poste,
          photo: employee.photo
        },
        parcours,
        stats,
        objectifs: {
          principal: employee.fichePro?.objectifPrincipal,
          metiersCibles: employee.fichePro?.metiersCibles,
          projetProfessionnel: employee.fichePro?.projetProfessionnel
        }
      }
    });
  } catch (error) {
    console.error('Erreur getParcours:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Helper pour formater le type de suivi
function formatTypeSuivi(type: string): string {
  const types: Record<string, string> = {
    'Hebdomadaire': 'Entretien hebdomadaire',
    'Mensuel': 'Entretien mensuel',
    'Bilan': 'Bilan de parcours',
    'Urgent': 'Entretien urgent',
    'entretien_mensuel': 'Entretien mensuel',
    'bilan_mi_parcours': 'Bilan mi-parcours',
    'bilan_fin_parcours': 'Bilan fin de parcours',
    'point_situation': 'Point de situation',
    'entretien_professionnel': 'Entretien professionnel',
    'accompagnement_social': 'Accompagnement social',
    'autre': 'Entretien'
  };
  return types[type] || type;
}

// ============================================
// SYNCHRONISATION DES EMPLOYÉS
// ============================================

// Endpoint pour synchroniser (remplacer) tous les employés avec les données fournies
export const syncEmployees = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Début de la synchronisation des employés...');

    // Liste des salariés à synchroniser (données du fichier des salariés)
    const employeesData = [
      {
        civilite: 'M.',
        nom: 'BOURET',
        prenom: 'Franck',
        dateNaissance: new Date('1974-05-19'),
        lieuNaissance: 'DECHY (59)',
        nationalite: 'Française',
        numeroSecu: '1740559170082',
        adresse: '22 grand rue',
        codePostal: '59259',
        ville: 'LÉCLUSE',
        telephone: '',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-05-27'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'Mme',
        nom: 'BOUZIDI',
        prenom: 'Warda',
        dateNaissance: new Date('1990-01-30'),
        lieuNaissance: 'DECHY (59)',
        nationalite: 'Française',
        numeroSecu: '2900159170134',
        adresse: '3 rue Henri Beauchamps',
        codePostal: '59187',
        ville: 'DECHY',
        telephone: '',
        email: 'wardanassiri@outlook.fr',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-02-10'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'DUBOIS',
        prenom: 'Mehdi',
        dateNaissance: new Date('1987-09-09'),
        lieuNaissance: 'DOUAI (59)',
        nationalite: 'Française',
        numeroSecu: '1870959178043',
        adresse: 'Appt 36, Le lauragais',
        codePostal: '59540',
        ville: 'SIN-LE-NOBLE',
        telephone: '',
        email: 'medhidubois@hotmail.com',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-05-12'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'Mme',
        nom: 'ESSERGHINI',
        prenom: 'Awatef',
        dateNaissance: new Date('1989-11-08'),
        lieuNaissance: 'SECLIN (59)',
        nationalite: 'Française',
        numeroSecu: '2891159560057',
        adresse: '2 rue des Tulipes',
        codePostal: '62590',
        ville: 'OIGNIES',
        telephone: '',
        email: 'esserghini.awatef@hotmail.fr',
        typeContrat: 'CDDI',
        dureeHebdo: 35,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2023-06-05'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'Mme',
        nom: 'GUILBERT',
        prenom: 'Amandine',
        dateNaissance: new Date('1994-11-11'),
        lieuNaissance: 'DECHY (59)',
        nationalite: 'Française',
        numeroSecu: '2941159170244',
        adresse: '156 rue Emile Zola',
        codePostal: '59450',
        ville: 'SIN-LE-NOBLE',
        telephone: '',
        typeContrat: 'CDI',
        dureeHebdo: 35,
        poste: 'C.I.P',
        dateEntree: new Date('2025-04-07'),
        salaireBrut: 2023.10,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'JARDOT',
        prenom: 'Martial',
        dateNaissance: new Date('1972-04-22'),
        lieuNaissance: 'DUNKERQUE (59)',
        nationalite: 'Française',
        numeroSecu: '1721159183236',
        adresse: '39 rue Saint-Denis',
        codePostal: '59287',
        ville: 'GUESNAIN',
        telephone: '',
        email: 'mJARDOT71@gmail.com',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2024-04-27'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'KACED',
        prenom: 'Hugo',
        dateNaissance: new Date('1985-09-22'),
        lieuNaissance: 'CAMBRAI (59)',
        nationalite: 'Française',
        numeroSecu: '1850959122134',
        adresse: '22 rue Maginot',
        codePostal: '59252',
        ville: 'MARCQ EN OSTREVENT',
        telephone: '',
        email: 'yoanekaced@gmail.com',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-03-03'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'LEDUC',
        prenom: 'Cédric',
        dateNaissance: new Date('1989-05-12'),
        lieuNaissance: 'DECHY (59)',
        nationalite: 'Française',
        numeroSecu: '1890559170061',
        adresse: '2 rue Trégastel',
        codePostal: '59450',
        ville: 'SIN-LE-NOBLE',
        telephone: '',
        email: 'cedric59.leduc@hotmail.fr',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-03-19'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'MOHEBI',
        prenom: 'Daniel',
        dateNaissance: new Date('2003-12-22'),
        lieuNaissance: 'AFGHANISTAN',
        nationalite: 'Afghane',
        numeroSecu: '1031299212081',
        adresse: '180 rue victor pecqueur appt 25',
        codePostal: '59500',
        ville: 'DOUAI',
        telephone: '',
        email: 'mohebidaniel1@gmail.com',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-06-10'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'RAHIMI',
        prenom: 'Abass',
        dateNaissance: new Date('1998-02-02'),
        lieuNaissance: 'AFGHANISTAN',
        nationalite: 'Afghane',
        numeroSecu: '1980299212429',
        adresse: '122 cours de l\'Arsenal appt 124',
        codePostal: '59500',
        ville: 'DOUAI',
        telephone: '',
        email: 'rahimiabbas658@gmail.com',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-04-28'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'GALOUITE',
        prenom: 'Hassan',
        dateNaissance: new Date('1983-01-01'),
        lieuNaissance: 'DECHY (59)',
        nationalite: 'Française',
        numeroSecu: '1830159170000',
        adresse: '328 rue Gambetta',
        codePostal: '59450',
        ville: 'SIN LE NOBLE',
        telephone: '',
        email: 'hgalouite@hotmail.com',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-11-05'),
        salaireBrut: 1338.52,
        statut: 'actif'
      },
      {
        civilite: 'M.',
        nom: 'MORTELETTE',
        prenom: 'Jonathan',
        dateNaissance: new Date('1985-06-27'),
        lieuNaissance: 'DECHY (59)',
        nationalite: 'Française',
        numeroSecu: '1850659170127',
        adresse: '292 rue de Nantes le bois duriez',
        codePostal: '59167',
        ville: 'LALLAING',
        telephone: '',
        typeContrat: 'CDDI',
        dureeHebdo: 26,
        poste: 'OUVRIER POLYVALENT',
        dateEntree: new Date('2025-11-10'),
        salaireBrut: 1338.52,
        statut: 'actif'
      }
    ];

    // Supprimer tous les employés existants et leurs données liées
    console.log('🗑️ Suppression des données existantes...');

    // Supprimer dans l'ordre pour respecter les contraintes de clé étrangère
    await prisma.pointageJournalier.deleteMany({});
    await prisma.pointageMensuel.deleteMany({});
    await prisma.objectifIndividuel.deleteMany({});
    await prisma.formation.deleteMany({});
    await prisma.avertissement.deleteMany({});
    await prisma.contratInsertion.deleteMany({});
    await prisma.insertionDocument.deleteMany({});
    await prisma.conventionPMSMP.deleteMany({});
    await prisma.suiviEntretien.deleteMany({});
    await prisma.fichePro.deleteMany({});
    await prisma.insertionEmployee.deleteMany({});

    console.log('✅ Données existantes supprimées');

    // Créer les nouveaux employés
    console.log('➕ Création des nouveaux employés...');
    const createdEmployees = [];

    for (const empData of employeesData) {
      const employee = await prisma.insertionEmployee.create({
        data: empData
      });
      createdEmployees.push(employee);
      console.log(`  ✅ ${employee.prenom} ${employee.nom} créé`);

      // Créer une fiche PRO vide pour chaque employé
      await prisma.fichePro.create({
        data: {
          employeeId: employee.id
        }
      });
    }

    console.log(`\n🎉 Synchronisation terminée: ${createdEmployees.length} employés créés`);

    res.json({
      success: true,
      message: `Synchronisation réussie: ${createdEmployees.length} employés importés`,
      data: {
        count: createdEmployees.length,
        employees: createdEmployees.map(e => ({
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          dateEntree: e.dateEntree,
          poste: e.poste,
          typeContrat: e.typeContrat
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erreur syncEmployees:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la synchronisation' });
  }
};

// Helper pour calculer la progression avec configuration
async function calculateProgressionWithConfig(employee: any, config: any): Promise<number> {
  // Config par défaut si aucune n'existe
  const cfg = config || {
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
    sortiePositiveAuto100: true
  };

  let score = 0;

  // 1. Points pour l'ancienneté
  const moisAnciennete = Math.floor(
    (new Date().getTime() - new Date(employee.dateEntree).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  score += Math.min(cfg.poidsAnciennete, moisAnciennete * cfg.pointsParMoisAnciennete);

  // 2. Points pour les suivis
  const nbSuivis = employee.suivis?.length || 0;
  score += Math.min(cfg.poidsSuivis, nbSuivis * cfg.pointsParSuivi);

  // 3. Points pour les PMSMP réussies
  const pmsmpReussies = employee.conventionsPMSMP?.filter((p: any) => p.bilanPositif)?.length || 0;
  score += Math.min(cfg.poidsPMSMP, pmsmpReussies * cfg.pointsParPMSMP);

  // 4. Points pour les formations
  const formations = employee.formations || [];
  let pointsFormations = 0;
  formations.forEach((f: any) => {
    if (f.validation === 'validee') {
      pointsFormations += (f.type === 'qualifiante' || f.type === 'certifiante')
        ? cfg.pointsFormationQualif
        : cfg.pointsFormationSimple;
    }
  });
  score += Math.min(cfg.poidsFormations, pointsFormations);

  // 5. Points pour les objectifs individuels atteints
  const objectifsAtteints = employee.objectifsIndividuels?.filter((o: any) => o.statut === 'atteint') || [];
  const pointsObjectifs = objectifsAtteints.reduce((sum: number, o: any) => sum + o.pointsAttribues, 0);
  score += Math.min(cfg.poidsObjectifsIndiv, pointsObjectifs);

  // Plafonner avant sortie positive
  score = Math.min(score, cfg.seuilProgressionMax);

  // Sortie positive = 100%
  if (cfg.sortiePositiveAuto100 && employee.statut === 'sorti' && employee.fichePro?.sortiePositive) {
    score = 100;
  }

  return Math.round(score);
}
