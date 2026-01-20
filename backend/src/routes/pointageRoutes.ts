import { Router } from 'express';
import * as pointageController from '../controllers/pointageController';

const router = Router();

// Vue d'ensemble mensuelle (tous les employés)
router.get('/mensuel', pointageController.getPointagesMensuels);

// Statistiques
router.get('/stats', pointageController.getPointageStats);

// Pointage individuel d'un employé
router.get('/employee/:employeeId', pointageController.getPointageEmployee);

// Enregistrer un pointage journalier
router.post('/journalier', pointageController.savePointageJournalier);

// Enregistrer plusieurs pointages (mode grille)
router.post('/journalier/batch', pointageController.savePointagesMultiples);

// Utiliser la banque d'heures
router.post('/banque/utiliser', pointageController.utiliserBanqueHeures);

// Transférer les heures excédentaires vers la banque (individuel)
router.post('/banque/transferer', pointageController.transfererVersBanque);

// Valider un pointage mensuel
router.post('/valider', pointageController.validerPointageMensuel);

// Clôturer le mois
router.post('/cloturer', pointageController.cloturerMois);

export default router;
