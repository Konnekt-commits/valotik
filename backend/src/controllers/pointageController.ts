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
        dateEntree: true
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
export const savePointageJournalier = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId, date, heureDebut, heureFin, pauseMinutes, typeJournee, motifAbsence, notes } = req.body;

    // Calculer les heures travaillées
    let heuresTravaillees = 0;
    if (heureDebut && heureFin && typeJournee === 'travail') {
      const [hD, mD] = heureDebut.split(':').map(Number);
      const [hF, mF] = heureFin.split(':').map(Number);
      const minutesTravail = (hF * 60 + mF) - (hD * 60 + mD) - (pauseMinutes || 0);
      heuresTravaillees = Math.round(minutesTravail / 60 * 100) / 100;
    }

    const dateObj = new Date(date);

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
        heuresTravaillees,
        typeJournee: typeJournee || 'travail',
        motifAbsence,
        notes
      },
      update: {
        heureDebut,
        heureFin,
        pauseMinutes: pauseMinutes || 0,
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

// Enregistrer plusieurs pointages d'un coup (mode grille)
export const savePointagesMultiples = async (req: Request, res: Response) => {
  try {
    const { pointageMensuelId, pointages } = req.body;

    // pointages = [{ date, heures }, ...]
    for (const p of pointages) {
      const dateObj = new Date(p.date);

      await prisma.pointageJournalier.upsert({
        where: {
          pointageMensuelId_date: {
            pointageMensuelId,
            date: dateObj
          }
        },
        create: {
          pointageMensuelId,
          date: dateObj,
          heuresTravaillees: p.heures || 0,
          typeJournee: p.heures > 0 ? 'travail' : (p.typeJournee || 'travail')
        },
        update: {
          heuresTravaillees: p.heures || 0,
          typeJournee: p.heures > 0 ? 'travail' : (p.typeJournee || 'travail')
        }
      });
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
