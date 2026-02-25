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

// Signer un pointage (matin ou après-midi séparément)
router.post('/signer', pointageController.signerPointage);

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

// Autorisations de sortie
router.post('/autorisation-sortie', pointageController.createAutorisationSortie);
router.get('/autorisation-sortie/:employeeId', pointageController.getAutorisationsSortie);
router.delete('/autorisation-sortie/:id', pointageController.deleteAutorisationSortie);

// Demandes de congé
router.post('/demande-conge', pointageController.createDemandeConge);
router.get('/demandes-conge', pointageController.getDemandesConge);
router.put('/demande-conge/:id', pointageController.updateDemandeConge);
router.delete('/demande-conge/:id', pointageController.deleteDemandeConge);

// ============================================
// POINTAGE MOBILE (liens publics avec token)
// ============================================

// Générer un token mobile pour un employé (authentifié)
router.post('/generate-token/:employeeId', pointageController.generateMobileToken);

// Récupérer infos employé + pointage du jour (public - avec token)
router.get('/mobile/:token', pointageController.getMobilePointage);

// Signer un pointage depuis le mobile (public - avec token)
router.post('/mobile/:token/signer', pointageController.signerMobile);

export default router;
