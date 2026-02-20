import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction utilitaire pour calculer les heures contractuelles d'un mois
const calculerHeuresContratMois = (dureeHebdo: number, mois: number, annee: number): number => {
  // Nombre de jours dans le mois
  const premierJour = new Date(annee, mois - 1, 1);
  const dernierJour = new Date(annee, mois, 0);
  const nbJours = dernierJour.getDate();

  // Compter les jours ouvrés (lundi à vendredi)
  let joursOuvres = 0;
  for (let d = 1; d <= nbJours; d++) {
    const date = new Date(annee, mois - 1, d);
    const jour = date.getDay();
    if (jour !== 0 && jour !== 6) {
      joursOuvres++;
    }
  }

  // Heures par jour = dureeHebdo / 5
  const heuresParJour = dureeHebdo / 5;
  return Math.round(heuresParJour * joursOuvres * 100) / 100;
};

// Fonction pour obtenir les jours du mois avec leurs informations
const getJoursMois = (mois: number, annee: number) => {
  const jours = [];
  const nbJours = new Date(annee, mois, 0).getDate();

  for (let d = 1; d <= nbJours; d++) {
    const date = new Date(annee, mois - 1, d, 12, 0, 0); // Midi pour éviter les problèmes de timezone
    const jour = date.getDay();
    // Format YYYY-MM-DD manuellement pour éviter les problèmes de timezone
    const dateStr = `${annee}-${String(mois).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    jours.push({
      date: dateStr,
      jour: d,
      jourSemaine: jour,
      estWeekend: jour === 0 || jour === 6,
      nomJour: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][jour]
    });
  }
  return jours;
};

// ============================================
// VUE D'ENSEMBLE MENSUELLE
// ============================================

// Obtenir la vue d'ensemble pour un mois (tous les employés)
export const getPointagesMensuels = async (req: Request, res: Response) => {
  try {
    const { mois, annee } = req.query;

    const moisNum = parseInt(mois as string) || new Date().getMonth() + 1;
    const anneeNum = parseInt(annee as string) || new Date().getFullYear();

    // Récupérer tous les employés actifs
    const employees = await prisma.insertionEmployee.findMany({
      where: { statut: 'actif' },
      select: {
        id: true,
        nom: true,
        prenom: true,
        civilite: true,
        dureeHebdo: true,
        poste: true,
        dateEntree: true,
        typeContrat: true,
        numeroSecu: true
      },
      orderBy: { nom: 'asc' }
    });

    // Pour chaque employé, récupérer ou créer le pointage mensuel
    const pointages = await Promise.all(employees.map(async (emp) => {
      let pointageMensuel = await prisma.pointageMensuel.findUnique({
        where: {
          employeeId_mois_annee: {
            employeeId: emp.id,
            mois: moisNum,
            annee: anneeNum
          }
        },
        include: {
          journees: {
            orderBy: { date: 'asc' }
          }
        }
      });

      // Si pas de pointage, le créer
      if (!pointageMensuel) {
        const heuresContrat = calculerHeuresContratMois(emp.dureeHebdo, moisNum, anneeNum);

        // Récupérer la banque d'heures du mois précédent
        let heuresBanqueEntree = 0;
        const moisPrecedent = moisNum === 1 ? 12 : moisNum - 1;
        const anneePrecedent = moisNum === 1 ? anneeNum - 1 : anneeNum;

        const pointagePrecedent = await prisma.pointageMensuel.findUnique({
          where: {
            employeeId_mois_annee: {
              employeeId: emp.id,
              mois: moisPrecedent,
              annee: anneePrecedent
            }
          }
        });

        if (pointagePrecedent) {
          heuresBanqueEntree = pointagePrecedent.heuresBanqueSortie;
        }

        pointageMensuel = await prisma.pointageMensuel.create({
          data: {
            employeeId: emp.id,
            mois: moisNum,
            annee: anneeNum,
            heuresContrat,
            heuresBanqueEntree
          },
          include: {
            journees: {
              orderBy: { date: 'asc' }
            }
          }
        });
      }

      return {
        employee: emp,
        pointage: pointageMensuel
      };
    }));

    // Calculs globaux
    const totaux = pointages.reduce((acc, p) => {
      acc.heuresContrat += p.pointage.heuresContrat;
      acc.heuresPointees += p.pointage.heuresPointees;
      acc.heuresBanque += p.pointage.heuresBanqueSortie;
      return acc;
    }, { heuresContrat: 0, heuresPointees: 0, heuresBanque: 0 });

    const pourcentageGlobal = totaux.heuresContrat > 0
      ? Math.round(totaux.heuresPointees / totaux.heuresContrat * 100)
      : 0;

    res.json({
      success: true,
      data: {
        mois: moisNum,
        annee: anneeNum,
        joursMois: getJoursMois(moisNum, anneeNum),
        pointages,
        totaux: {
          ...totaux,
          pourcentageGlobal
        }
      }
    });
  } catch (error: any) {
    console.error('Erreur getPointagesMensuels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// POINTAGE INDIVIDUEL
// ============================================

// Obtenir le pointage d'un employé pour un mois
export const getPointageEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { mois, annee } = req.query;

    const moisNum = parseInt(mois as string) || new Date().getMonth() + 1;
    const anneeNum = parseInt(annee as string) || new Date().getFullYear();

    const employee = await prisma.insertionEmployee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        civilite: true,
        dureeHebdo: true,
        poste: true
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employé non trouvé' });
    }

    let pointageMensuel = await prisma.pointageMensuel.findUnique({
      where: {
        employeeId_mois_annee: {
          employeeId,
          mois: moisNum,
          annee: anneeNum
        }
      },
      include: {
        journees: {
          orderBy: { date: 'asc' }
        }
      }
    });

    // Créer si n'existe pas
    if (!pointageMensuel) {
      const heuresContrat = calculerHeuresContratMois(employee.dureeHebdo, moisNum, anneeNum);

      // Récupérer la banque d'heures du mois précédent
      let heuresBanqueEntree = 0;
      const moisPrecedent = moisNum === 1 ? 12 : moisNum - 1;
      const anneePrecedent = moisNum === 1 ? anneeNum - 1 : anneeNum;

      const pointagePrecedent = await prisma.pointageMensuel.findUnique({
        where: {
          employeeId_mois_annee: {
            employeeId,
            mois: moisPrecedent,
            annee: anneePrecedent
          }
        }
      });

      if (pointagePrecedent) {
        heuresBanqueEntree = pointagePrecedent.heuresBanqueSortie;
      }

      pointageMensuel = await prisma.pointageMensuel.create({
        data: {
          employeeId,
          mois: moisNum,
          annee: anneeNum,
          heuresContrat,
          heuresBanqueEntree
        },
        include: {
          journees: {
            orderBy: { date: 'asc' }
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        employee,
        pointage: pointageMensuel,
        joursMois: getJoursMois(moisNum, anneeNum)
      }
    });
  } catch (error: any) {
    console.error('Erreur getPointageEmployee:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// POINTAGE JOURNALIER
// ============================================

// Enregistrer/Mettre à jour un pointage journalier
// NOTE: Cette API est obsolète pour les signatures. Utiliser /signer à la place.
// Cette API respecte les signatures existantes et ne modifie pas les heures signées.
export const savePointageJournalier = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId, date, heureDebut, heureFin, pauseMinutes, typeJournee, motifAbsence, notes } = req.body;

    const dateObj = new Date(date);

    // Vérifier si un pointage existe déjà avec des signatures
    const existant = await prisma.pointageJournalier.findUnique({
      where: {
        pointageMensuelId_date: {
          pointageMensuelId,
          date: dateObj
        }
      }
    });

    // Calculer les heures travaillées à partir de heureDebut/heureFin
    let heuresCalculees = 0;
    if (heureDebut && heureFin && typeJournee === 'travail') {
      const [hD, mD] = heureDebut.split(':').map(Number);
      const [hF, mF] = heureFin.split(':').map(Number);
      const minutesTravail = (hF * 60 + mF) - (hD * 60 + mD) - (pauseMinutes || 0);
      heuresCalculees = Math.round(minutesTravail / 60 * 100) / 100;
    }

    let heuresMatin: number;
    let heuresApresmidi: number;
    let heuresTravaillees: number;

    if (existant) {
      const matinSigne = !!existant.signatureMatin;
      const apresmidiSigne = !!existant.signatureApresmidi;

      // Respecter les heures signées
      if (matinSigne && apresmidiSigne) {
        // Les deux sont signés : ne rien modifier
        return res.status(400).json({
          success: false,
          error: 'Les heures matin et après-midi sont déjà signées et ne peuvent pas être modifiées.'
        });
      }

      heuresMatin = matinSigne ? existant.heuresMatin : Math.min(heuresCalculees, 4);
      heuresApresmidi = apresmidiSigne ? existant.heuresApresmidi : Math.max(0, heuresCalculees - (matinSigne ? existant.heuresMatin : Math.min(heuresCalculees, 4)));
      heuresTravaillees = heuresMatin + heuresApresmidi;
    } else {
      // Nouveau pointage : répartir entre matin et après-midi
      heuresMatin = Math.min(heuresCalculees, 4);
      heuresApresmidi = Math.max(0, heuresCalculees - 4);
      heuresTravaillees = heuresCalculees;
    }

    // Upsert le pointage journalier
    const pointageJour = await prisma.pointageJournalier.upsert({
      where: {
        pointageMensuelId_date: {
          pointageMensuelId,
          date: dateObj
        }
      },
      create: {
        pointageMensuelId,
        date: dateObj,
        heureDebut,
        heureFin,
        pauseMinutes: pauseMinutes || 0,
        heuresMatin,
        heuresApresmidi,
        heuresTravaillees,
        typeJournee: typeJournee || 'travail',
        motifAbsence,
        notes
      },
      update: {
        heureDebut,
        heureFin,
        pauseMinutes: pauseMinutes || 0,
        heuresMatin,
        heuresApresmidi,
        heuresTravaillees,
        typeJournee: typeJournee || 'travail',
        motifAbsence,
        notes
      }
    });

    // Recalculer les totaux du mois
    await recalculerPointageMensuel(pointageMensuelId);

    res.json({ success: true, data: pointageJour });
  } catch (error: any) {
    console.error('Erreur savePointageJournalier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Signer le pointage matin ou après-midi (nouvelle API)
export const signerPointage = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId, date, periode, heures, signature } = req.body;
    // periode = 'matin' ou 'apresmidi'
    // heures = nombre d'heures pour cette période
    // signature = base64 de la signature

    if (!['matin', 'apresmidi'].includes(periode)) {
      return res.status(400).json({ success: false, error: 'Période invalide (matin ou apresmidi)' });
    }

    const dateObj = new Date(date);

    // Récupérer le pointage existant ou créer un nouveau
    let pointageExistant = await prisma.pointageJournalier.findUnique({
      where: {
        pointageMensuelId_date: {
          pointageMensuelId,
          date: dateObj
        }
      }
    });

    const now = new Date();

    if (periode === 'matin') {
      // Signer le matin
      const heuresMatin = parseFloat(heures) || 0;
      const heuresApresmidi = pointageExistant?.heuresApresmidi || 0;
      const heuresTravaillees = heuresMatin + heuresApresmidi;

      const pointageJour = await prisma.pointageJournalier.upsert({
        where: {
          pointageMensuelId_date: {
            pointageMensuelId,
            date: dateObj
          }
        },
        create: {
          pointageMensuelId,
          date: dateObj,
          heuresMatin,
          heuresApresmidi: 0,
          heuresTravaillees: heuresMatin,
          signatureMatin: signature,
          signatureMatinAt: now,
          typeJournee: 'travail'
        },
        update: {
          heuresMatin,
          heuresTravaillees,
          signatureMatin: signature,
          signatureMatinAt: now
        }
      });

      await recalculerPointageMensuel(pointageMensuelId);
      res.json({ success: true, data: pointageJour });

    } else {
      // Signer l'après-midi
      const heuresApresmidi = parseFloat(heures) || 0;
      const heuresMatin = pointageExistant?.heuresMatin || 0;
      const heuresTravaillees = heuresMatin + heuresApresmidi;

      const pointageJour = await prisma.pointageJournalier.upsert({
        where: {
          pointageMensuelId_date: {
            pointageMensuelId,
            date: dateObj
          }
        },
        create: {
          pointageMensuelId,
          date: dateObj,
          heuresMatin: 0,
          heuresApresmidi,
          heuresTravaillees: heuresApresmidi,
          signatureApresmidi: signature,
          signatureApresmidiAt: now,
          typeJournee: 'travail'
        },
        update: {
          heuresApresmidi,
          heuresTravaillees,
          signatureApresmidi: signature,
          signatureApresmidiAt: now
        }
      });

      await recalculerPointageMensuel(pointageMensuelId);
      res.json({ success: true, data: pointageJour });
    }

  } catch (error: any) {
    console.error('Erreur signerPointage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Enregistrer plusieurs pointages d'un coup (mode grille)
// IMPORTANT: Cette API respecte les signatures existantes sauf si forceUpdate=true
export const savePointagesMultiples = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId, pointages, forceUpdate } = req.body;

    // pointages = [{ date, heures, heuresMatin?, heuresApresmidi? }, ...]
    for (const p of pointages) {
      const dateObj = new Date(p.date);

      // Vérifier si un pointage existe déjà avec des signatures
      const existant = await prisma.pointageJournalier.findUnique({
        where: {
          pointageMensuelId_date: {
            pointageMensuelId,
            date: dateObj
          }
        }
      });

      // Si des signatures existent, ne pas écraser les heures signées (sauf forceUpdate)
      if (existant) {
        const matinSigne = !forceUpdate && !!existant.signatureMatin;
        const apresmidiSigne = !forceUpdate && !!existant.signatureApresmidi;

        // Calculer les nouvelles valeurs en respectant les signatures
        let heuresMatin = existant.heuresMatin;
        let heuresApresmidi = existant.heuresApresmidi;

        if (p.heuresMatin !== undefined && !matinSigne) {
          heuresMatin = p.heuresMatin;
        }
        if (p.heuresApresmidi !== undefined && !apresmidiSigne) {
          heuresApresmidi = p.heuresApresmidi;
        }

        // Si seulement 'heures' est fourni (ancien format), répartir entre matin et après-midi non signés
        if (p.heures !== undefined && p.heuresMatin === undefined && p.heuresApresmidi === undefined) {
          if (!matinSigne && !apresmidiSigne) {
            // Aucune signature (ou forceUpdate) : on peut tout modifier
            // Répartition standard : max 4h matin, reste en après-midi
            heuresMatin = Math.min(p.heures, 4);
            heuresApresmidi = Math.max(0, p.heures - 4);
          } else if (matinSigne && !apresmidiSigne) {
            // Matin signé : on ne peut modifier que l'après-midi
            heuresApresmidi = Math.max(0, p.heures - heuresMatin);
          } else if (!matinSigne && apresmidiSigne) {
            // Après-midi signé : on ne peut modifier que le matin
            heuresMatin = Math.max(0, p.heures - heuresApresmidi);
          }
          // Si les deux sont signés et pas forceUpdate, on ne modifie rien
        }

        const heuresTravaillees = heuresMatin + heuresApresmidi;

        // Déterminer typeJournee et motifAbsence
        let typeJournee: string;
        let motifAbsence: string | null = null;
        if (p.typeJournee === 'absence') {
          typeJournee = 'absence';
          motifAbsence = p.motifAbsence || existant.motifAbsence || null;
        } else if (p.typeJournee) {
          typeJournee = p.typeJournee;
          motifAbsence = p.motifAbsence !== undefined ? p.motifAbsence : existant.motifAbsence;
        } else {
          typeJournee = heuresTravaillees > 0 ? 'travail' : existant.typeJournee;
          motifAbsence = existant.motifAbsence;
        }

        await prisma.pointageJournalier.update({
          where: {
            pointageMensuelId_date: {
              pointageMensuelId,
              date: dateObj
            }
          },
          data: {
            heuresMatin,
            heuresApresmidi,
            heuresTravaillees,
            typeJournee,
            motifAbsence
          }
        });
      } else {
        // Nouveau pointage : créer avec les heures fournies
        let heuresMatin = p.heuresMatin ?? 0;
        let heuresApresmidi = p.heuresApresmidi ?? 0;

        // Si seulement 'heures' est fourni, répartir
        if (p.heures !== undefined && p.heuresMatin === undefined && p.heuresApresmidi === undefined) {
          heuresMatin = Math.min(p.heures, 4);
          heuresApresmidi = Math.max(0, p.heures - 4);
        }

        const heuresTravaillees = heuresMatin + heuresApresmidi;

        // Déterminer typeJournee et motifAbsence
        const typeJournee = p.typeJournee || (heuresTravaillees > 0 ? 'travail' : 'travail');
        const motifAbsence = p.motifAbsence || null;

        await prisma.pointageJournalier.create({
          data: {
            pointageMensuelId,
            date: dateObj,
            heuresMatin,
            heuresApresmidi,
            heuresTravaillees,
            typeJournee,
            motifAbsence
          }
        });
      }
    }

    // Recalculer les totaux
    await recalculerPointageMensuel(pointageMensuelId);

    const pointageMensuel = await prisma.pointageMensuel.findUnique({
      where: { id: pointageMensuelId },
      include: { journees: { orderBy: { date: 'asc' } } }
    });

    res.json({ success: true, data: pointageMensuel });
  } catch (error: any) {
    console.error('Erreur savePointagesMultiples:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// BANQUE D'HEURES
// ============================================

// Utiliser des heures de la banque pour régulariser
export const utiliserBanqueHeures = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId, heuresAUtiliser } = req.body;

    const pointage = await prisma.pointageMensuel.findUnique({
      where: { id: pointageMensuelId }
    });

    if (!pointage) {
      return res.status(404).json({ success: false, error: 'Pointage non trouvé' });
    }

    // Vérifier que la banque a un solde positif
    if (pointage.heuresBanqueEntree <= 0) {
      return res.status(400).json({
        success: false,
        error: pointage.heuresBanqueEntree < 0
          ? `Solde banque négatif (${pointage.heuresBanqueEntree}h). Impossible d'utiliser des heures.`
          : 'Aucune heure disponible en banque.'
      });
    }

    // Vérifier qu'on a assez d'heures en banque (ne peut utiliser que le solde positif)
    if (heuresAUtiliser > pointage.heuresBanqueEntree) {
      return res.status(400).json({
        success: false,
        error: `Heures insuffisantes en banque. Disponible: ${pointage.heuresBanqueEntree}h`
      });
    }

    // Mettre à jour avec les heures régularisées
    const heuresRegularisees = pointage.heuresRegularisees + heuresAUtiliser;
    const heuresEffectives = pointage.heuresPointees + heuresRegularisees;
    const pourcentage = pointage.heuresContrat > 0
      ? Math.round(heuresEffectives / pointage.heuresContrat * 100)
      : 0;

    // Calculer la banque de sortie (peut être négative si déficit ce mois)
    const excedent = heuresEffectives - pointage.heuresContrat;
    const heuresBanqueSortie = pointage.heuresBanqueEntree - heuresAUtiliser + excedent;

    const updated = await prisma.pointageMensuel.update({
      where: { id: pointageMensuelId },
      data: {
        heuresRegularisees,
        pourcentage,
        heuresBanqueSortie: Math.round(heuresBanqueSortie * 100) / 100
      }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Erreur utiliserBanqueHeures:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Transférer les heures excédentaires vers la banque (action individuelle)
export const transfererVersBanque = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId } = req.body;

    const pointage = await prisma.pointageMensuel.findUnique({
      where: { id: pointageMensuelId },
      include: { employee: true }
    });

    if (!pointage) {
      return res.status(404).json({ success: false, error: 'Pointage non trouvé' });
    }

    // Calculer l'excédent ou le déficit (positif si > 100%, négatif si < 100%)
    const heuresEffectives = pointage.heuresPointees + pointage.heuresRegularisees;
    const excedent = heuresEffectives - pointage.heuresContrat;

    // Mettre à jour la banque de sortie (peut être négatif = déficit)
    const heuresBanqueSortie = pointage.heuresBanqueEntree - pointage.heuresRegularisees + excedent;
    const heuresBanqueSortieArrondi = Math.round(heuresBanqueSortie * 100) / 100;

    const updated = await prisma.pointageMensuel.update({
      where: { id: pointageMensuelId },
      data: {
        heuresBanqueSortie: heuresBanqueSortieArrondi,
        statut: 'valide',
        dateValidation: new Date()
      }
    });

    // Propager vers le mois suivant (y compris les heures négatives)
    const moisSuivant = pointage.mois === 12 ? 1 : pointage.mois + 1;
    const anneeSuivante = pointage.mois === 12 ? pointage.annee + 1 : pointage.annee;

    if (pointage.employee.statut === 'actif') {
      const heuresContratSuivant = calculerHeuresContratMois(pointage.employee.dureeHebdo, moisSuivant, anneeSuivante);

      await prisma.pointageMensuel.upsert({
        where: {
          employeeId_mois_annee: {
            employeeId: pointage.employeeId,
            mois: moisSuivant,
            annee: anneeSuivante
          }
        },
        create: {
          employeeId: pointage.employeeId,
          mois: moisSuivant,
          annee: anneeSuivante,
          heuresContrat: heuresContratSuivant,
          heuresBanqueEntree: heuresBanqueSortieArrondi
        },
        update: {
          heuresBanqueEntree: heuresBanqueSortieArrondi
        }
      });
    }

    // Message adapté selon excédent ou déficit
    let message = 'Pointage validé';
    if (excedent > 0) {
      message = `+${Math.round(excedent * 10) / 10}h transférées vers la banque`;
    } else if (excedent < 0) {
      message = `${Math.round(excedent * 10) / 10}h (déficit) reportées au mois suivant`;
    }

    res.json({
      success: true,
      data: updated,
      message
    });
  } catch (error: any) {
    console.error('Erreur transfererVersBanque:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// VALIDATION
// ============================================

// Valider le pointage du mois
export const validerPointageMensuel = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId, validePar } = req.body;

    const pointage = await prisma.pointageMensuel.update({
      where: { id: pointageMensuelId },
      data: {
        statut: 'valide',
        dateValidation: new Date(),
        validePar
      }
    });

    res.json({ success: true, data: pointage });
  } catch (error: any) {
    console.error('Erreur validerPointageMensuel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Clôturer le mois (transfert banque vers mois suivant)
export const cloturerMois = async (req: Request, res: Response) => {
  try {
    const { mois, annee } = req.body;

    const moisNum = parseInt(mois);
    const anneeNum = parseInt(annee);

    // Récupérer tous les pointages du mois
    const pointages = await prisma.pointageMensuel.findMany({
      where: { mois: moisNum, annee: anneeNum }
    });

    // Calculer le mois suivant
    const moisSuivant = moisNum === 12 ? 1 : moisNum + 1;
    const anneeSuivante = moisNum === 12 ? anneeNum + 1 : anneeNum;

    // Pour chaque pointage, mettre à jour le statut et propager la banque
    for (const p of pointages) {
      // Clôturer ce mois
      await prisma.pointageMensuel.update({
        where: { id: p.id },
        data: { statut: 'cloture' }
      });

      // Récupérer l'employé pour calculer les heures du mois suivant
      const employee = await prisma.insertionEmployee.findUnique({
        where: { id: p.employeeId }
      });

      if (employee && employee.statut === 'actif') {
        const heuresContratSuivant = calculerHeuresContratMois(employee.dureeHebdo, moisSuivant, anneeSuivante);

        // Créer ou mettre à jour le pointage du mois suivant avec la banque
        // Permet les valeurs négatives (déficit) qui seront à rattraper
        await prisma.pointageMensuel.upsert({
          where: {
            employeeId_mois_annee: {
              employeeId: p.employeeId,
              mois: moisSuivant,
              annee: anneeSuivante
            }
          },
          create: {
            employeeId: p.employeeId,
            mois: moisSuivant,
            annee: anneeSuivante,
            heuresContrat: heuresContratSuivant,
            heuresBanqueEntree: p.heuresBanqueSortie // Peut être négatif
          },
          update: {
            heuresBanqueEntree: p.heuresBanqueSortie // Peut être négatif
          }
        });
      }
    }

    res.json({ success: true, message: `Mois ${moisNum}/${anneeNum} clôturé. Les soldes (positifs et négatifs) ont été reportés au mois suivant.` });
  } catch (error: any) {
    console.error('Erreur cloturerMois:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// FONCTION UTILITAIRE
// ============================================

const recalculerPointageMensuel = async (pointageMensuelId: string) => {
  // Récupérer tous les pointages journaliers
  const journees = await prisma.pointageJournalier.findMany({
    where: { pointageMensuelId }
  });

  const heuresPointees = journees.reduce((sum, j) => sum + j.heuresTravaillees, 0);

  const pointage = await prisma.pointageMensuel.findUnique({
    where: { id: pointageMensuelId }
  });

  if (!pointage) return;

  const heuresEffectives = heuresPointees + pointage.heuresRegularisees;
  const pourcentage = pointage.heuresContrat > 0
    ? Math.round(heuresEffectives / pointage.heuresContrat * 100)
    : 0;

  // Calculer la nouvelle banque (positif si > 100%, négatif si < 100%)
  // excedent peut être négatif (déficit) ou positif (surplus)
  const excedent = heuresEffectives - pointage.heuresContrat;
  // heuresBanqueSortie = solde entrant - heures utilisées pour régulariser + excédent/déficit du mois
  const heuresBanqueSortie = pointage.heuresBanqueEntree - pointage.heuresRegularisees + excedent;

  await prisma.pointageMensuel.update({
    where: { id: pointageMensuelId },
    data: {
      heuresPointees,
      pourcentage,
      // Permettre les valeurs négatives pour suivre le déficit
      heuresBanqueSortie: Math.round(heuresBanqueSortie * 100) / 100
    }
  });
};

// Statistiques pointage
export const getPointageStats = async (req: Request, res: Response) => {
  try {
    const { mois, annee } = req.query;

    const moisNum = parseInt(mois as string) || new Date().getMonth() + 1;
    const anneeNum = parseInt(annee as string) || new Date().getFullYear();

    const pointages = await prisma.pointageMensuel.findMany({
      where: { mois: moisNum, annee: anneeNum },
      include: { employee: true }
    });

    const stats = {
      totalEmployes: pointages.length,
      employesA100: pointages.filter(p => p.pourcentage >= 98 && p.pourcentage <= 103).length,
      employesSous100: pointages.filter(p => p.pourcentage < 98).length,
      employesPlus100: pointages.filter(p => p.pourcentage > 103).length,
      heuresContratTotal: pointages.reduce((sum, p) => sum + p.heuresContrat, 0),
      heuresPointeesTotal: pointages.reduce((sum, p) => sum + p.heuresPointees, 0),
      heuresBanqueTotal: pointages.reduce((sum, p) => sum + p.heuresBanqueSortie, 0),
      pourcentageGlobal: 0 as number
    };

    stats.pourcentageGlobal = stats.heuresContratTotal > 0
      ? Math.round(stats.heuresPointeesTotal / stats.heuresContratTotal * 100)
      : 0;

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Erreur getPointageStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// AUTORISATION DE SORTIE
// ============================================

// Créer une autorisation de sortie
export const createAutorisationSortie = async (req: Request, res: Response) => {
  try {
    const { employeeId, date, heureDebut, heureFin, motifCategorie, motif, signature, superieurNom, superieurSignature } = req.body;

    if (!employeeId || !date || !heureDebut || !heureFin) {
      return res.status(400).json({
        success: false,
        error: 'employeeId, date, heureDebut et heureFin sont requis'
      });
    }

    // Calculer la durée en minutes
    const [hDebut, mDebut] = heureDebut.split(':').map(Number);
    const [hFin, mFin] = heureFin.split(':').map(Number);
    const dureeMinutes = (hFin * 60 + mFin) - (hDebut * 60 + mDebut);

    if (dureeMinutes <= 0) {
      return res.status(400).json({
        success: false,
        error: 'L\'heure de fin doit être après l\'heure de début'
      });
    }

    // Créer l'autorisation
    const autorisation = await prisma.autorisationSortie.create({
      data: {
        employeeId,
        date: new Date(date),
        heureDebut,
        heureFin,
        dureeMinutes,
        motifCategorie: motifCategorie || null,
        motif: motif || null,
        signature: signature || null,
        signatureAt: signature ? new Date() : null,
        superieurNom: superieurNom || null,
        superieurSignature: superieurSignature || null
      },
      include: {
        employee: {
          select: { nom: true, prenom: true, poste: true }
        }
      }
    });

    res.json({ success: true, data: autorisation });
  } catch (error: any) {
    console.error('Erreur createAutorisationSortie:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Lister les autorisations de sortie d'un employé
export const getAutorisationsSortie = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { mois, annee } = req.query;

    const where: any = { employeeId };

    if (mois && annee) {
      const startDate = new Date(Number(annee), Number(mois) - 1, 1);
      const endDate = new Date(Number(annee), Number(mois), 0);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const autorisations = await prisma.autorisationSortie.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: { nom: true, prenom: true }
        }
      }
    });

    res.json({ success: true, data: autorisations });
  } catch (error: any) {
    console.error('Erreur getAutorisationsSortie:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer une autorisation de sortie
export const deleteAutorisationSortie = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.autorisationSortie.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erreur deleteAutorisationSortie:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// POINTAGE MOBILE (liens publics avec token)
// ============================================

// Générer un token mobile unique
const generateUniqueToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Générer ou régénérer le token mobile d'un employé
export const generateMobileToken = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    // Vérifier que l'employé existe
    const employee = await prisma.insertionEmployee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employé non trouvé' });
    }

    // Générer un nouveau token unique
    let token = generateUniqueToken();
    let attempts = 0;

    // S'assurer que le token est unique
    while (attempts < 10) {
      const existing = await prisma.insertionEmployee.findFirst({
        where: { mobileToken: token }
      });
      if (!existing) break;
      token = generateUniqueToken();
      attempts++;
    }

    // Mettre à jour l'employé avec le nouveau token
    const updated = await prisma.insertionEmployee.update({
      where: { id: employeeId },
      data: {
        mobileToken: token,
        mobileTokenCreatedAt: new Date()
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        mobileToken: true,
        mobileTokenCreatedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        ...updated,
        mobileUrl: `/pointage-mobile.html?token=${token}`
      }
    });
  } catch (error: any) {
    console.error('Erreur generateMobileToken:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer les infos de pointage mobile (public - avec token)
export const getMobilePointage = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token requis' });
    }

    // Trouver l'employé par son token
    const employee = await prisma.insertionEmployee.findFirst({
      where: { mobileToken: token },
      select: {
        id: true,
        civilite: true,
        nom: true,
        prenom: true,
        poste: true,
        dureeHebdo: true,
        photoUrl: true
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Lien invalide ou expiré' });
    }

    // Date du jour
    const now = new Date();
    const mois = now.getMonth() + 1;
    const annee = now.getFullYear();
    const jourAujourdhui = now.getDate();

    // Récupérer ou créer le pointage mensuel
    let pointageMensuel = await prisma.pointageMensuel.findUnique({
      where: {
        employeeId_mois_annee: {
          employeeId: employee.id,
          mois,
          annee
        }
      },
      include: {
        journees: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!pointageMensuel) {
      const heuresContrat = calculerHeuresContratMois(employee.dureeHebdo, mois, annee);
      pointageMensuel = await prisma.pointageMensuel.create({
        data: {
          employeeId: employee.id,
          mois,
          annee,
          heuresContrat,
          heuresBanqueEntree: 0
        },
        include: {
          journees: {
            orderBy: { date: 'asc' }
          }
        }
      });
    }

    // Générer tous les jours du mois avec leur statut
    const nbJours = new Date(annee, mois, 0).getDate();
    const nomsJours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const joursMois = [];

    for (let d = 1; d <= nbJours; d++) {
      const dateObj = new Date(annee, mois - 1, d);
      const jourSemaine = dateObj.getDay();
      const dateStr = `${annee}-${String(mois).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Trouver le pointage pour ce jour
      const pointageJour = pointageMensuel.journees?.find(j => {
        const jDate = new Date(j.date);
        return jDate.getDate() === d;
      });

      joursMois.push({
        jour: d,
        dateStr,
        nomJour: nomsJours[jourSemaine],
        estWeekend: jourSemaine === 0 || jourSemaine === 6,
        estAujourdhui: d === jourAujourdhui,
        pointage: pointageJour ? {
          heuresMatin: pointageJour.heuresMatin,
          heuresApresmidi: pointageJour.heuresApresmidi,
          heuresTravaillees: pointageJour.heuresTravaillees,
          signatureMatin: !!pointageJour.signatureMatin,
          signatureApresmidi: !!pointageJour.signatureApresmidi
        } : null
      });
    }

    res.json({
      success: true,
      data: {
        employee: {
          civilite: employee.civilite,
          nom: employee.nom,
          prenom: employee.prenom,
          poste: employee.poste,
          photoUrl: employee.photoUrl,
          dureeHebdo: employee.dureeHebdo
        },
        mois,
        annee,
        jourAujourdhui,
        joursMois,
        pointageMensuelId: pointageMensuel.id,
        totalHeures: pointageMensuel.heuresPointees,
        heuresContrat: pointageMensuel.heuresContrat
      }
    });
  } catch (error: any) {
    console.error('Erreur getMobilePointage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Signer un pointage depuis le mobile (public - avec token)
export const signerMobile = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { periode, signature, heures, date: dateParam } = req.body; // periode: 'matin' ou 'apresmidi', date: 'YYYY-MM-DD' optionnel

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token requis' });
    }

    if (!periode || !['matin', 'apresmidi'].includes(periode)) {
      return res.status(400).json({ success: false, error: 'Période invalide (matin ou apresmidi)' });
    }

    if (!signature) {
      return res.status(400).json({ success: false, error: 'Signature requise' });
    }

    // Trouver l'employé par son token
    const employee = await prisma.insertionEmployee.findFirst({
      where: { mobileToken: token },
      select: {
        id: true,
        nom: true,
        prenom: true,
        dureeHebdo: true
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Lien invalide ou expiré' });
    }

    // Date : utiliser la date fournie ou la date du jour
    const now = new Date();
    let mois: number, annee: number, jour: number, dateStr: string;

    if (dateParam) {
      // Utiliser la date fournie (format YYYY-MM-DD)
      const [y, m, d] = dateParam.split('-').map(Number);
      annee = y;
      mois = m;
      jour = d;
      dateStr = dateParam;
    } else {
      // Utiliser la date du jour
      mois = now.getMonth() + 1;
      annee = now.getFullYear();
      jour = now.getDate();
      dateStr = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    }

    const dateObj = new Date(dateStr);

    // Vérifier que ce n'est pas un weekend
    const jourSemaine = dateObj.getDay();
    if (jourSemaine === 0 || jourSemaine === 6) {
      return res.status(400).json({ success: false, error: 'Impossible de signer un weekend' });
    }

    // Récupérer ou créer le pointage mensuel
    let pointageMensuel = await prisma.pointageMensuel.findUnique({
      where: {
        employeeId_mois_annee: {
          employeeId: employee.id,
          mois,
          annee
        }
      }
    });

    if (!pointageMensuel) {
      const heuresContrat = calculerHeuresContratMois(employee.dureeHebdo, mois, annee);
      pointageMensuel = await prisma.pointageMensuel.create({
        data: {
          employeeId: employee.id,
          mois,
          annee,
          heuresContrat,
          heuresBanqueEntree: 0
        }
      });
    }

    // Récupérer ou créer le pointage journalier
    let pointageJournalier = await prisma.pointageJournalier.findUnique({
      where: {
        pointageMensuelId_date: {
          pointageMensuelId: pointageMensuel.id,
          date: dateObj
        }
      }
    });

    // Heures par défaut fixes : 3h le matin, 3.5h l'après-midi
    const heuresMatinDefaut = 3;
    const heuresApresmidiDefaut = 3.5;

    // Utiliser les heures fournies ou les défauts selon la période
    let heuresSignees: number;
    if (heures !== undefined) {
      heuresSignees = parseFloat(heures);
    } else {
      heuresSignees = periode === 'matin' ? heuresMatinDefaut : heuresApresmidiDefaut;
    }

    if (pointageJournalier) {
      // Vérifier si déjà signé
      if (periode === 'matin' && pointageJournalier.signatureMatin) {
        return res.status(400).json({ success: false, error: 'Matin déjà signé' });
      }
      if (periode === 'apresmidi' && pointageJournalier.signatureApresmidi) {
        return res.status(400).json({ success: false, error: 'Après-midi déjà signé' });
      }

      // Mettre à jour avec la signature
      const updateData: any = {};
      if (periode === 'matin') {
        updateData.signatureMatin = signature;
        updateData.signatureMatinAt = now;
        updateData.heuresMatin = heuresSignees;
      } else {
        updateData.signatureApresmidi = signature;
        updateData.signatureApresmidiAt = now;
        updateData.heuresApresmidi = heuresSignees;
      }

      // Recalculer le total
      const newHeuresMatin = periode === 'matin' ? heuresSignees : pointageJournalier.heuresMatin;
      const newHeuresApresmidi = periode === 'apresmidi' ? heuresSignees : pointageJournalier.heuresApresmidi;
      updateData.heuresTravaillees = newHeuresMatin + newHeuresApresmidi;
      updateData.typeJournee = 'travail';

      pointageJournalier = await prisma.pointageJournalier.update({
        where: { id: pointageJournalier.id },
        data: updateData
      });
    } else {
      // Créer le pointage avec la signature
      const createData: any = {
        pointageMensuelId: pointageMensuel.id,
        date: dateObj,
        typeJournee: 'travail',
        heuresMatin: periode === 'matin' ? heuresSignees : 0,
        heuresApresmidi: periode === 'apresmidi' ? heuresSignees : 0,
        heuresTravaillees: heuresSignees
      };

      if (periode === 'matin') {
        createData.signatureMatin = signature;
        createData.signatureMatinAt = now;
      } else {
        createData.signatureApresmidi = signature;
        createData.signatureApresmidiAt = now;
      }

      pointageJournalier = await prisma.pointageJournalier.create({
        data: createData
      });
    }

    // Recalculer le total mensuel
    await recalculerPointageMensuel(pointageMensuel.id);

    res.json({
      success: true,
      message: `Signature ${periode === 'matin' ? 'du matin' : 'de l\'après-midi'} enregistrée`,
      data: {
        heuresMatin: pointageJournalier.heuresMatin,
        heuresApresmidi: pointageJournalier.heuresApresmidi,
        heuresTravaillees: pointageJournalier.heuresTravaillees,
        signatureMatin: !!pointageJournalier.signatureMatin,
        signatureApresmidi: !!pointageJournalier.signatureApresmidi
      }
    });
  } catch (error: any) {
    console.error('Erreur signerMobile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
