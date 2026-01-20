import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed des salariés en insertion...\n');

  // Créer des salariés en insertion
  const employees = [
    {
      civilite: 'M.',
      nom: 'MARTIN',
      prenom: 'Jean-Pierre',
      dateNaissance: new Date('1985-03-15'),
      nationalite: 'Française',
      numeroSecu: '1850375123456',
      adresse: '15 Rue des Lilas',
      codePostal: '75020',
      ville: 'Paris',
      telephone: '06 12 34 56 78',
      email: 'jean-pierre.martin@email.fr',
      situationFamiliale: 'célibataire',
      nombreEnfants: 0,
      permisConduire: true,
      typePermis: 'B',
      vehicule: false,
      inscritFranceTravail: true,
      numeroFranceTravail: 'FT123456',
      beneficiaireRSA: true,
      passInclusionNumero: 'PI-2024-001234',
      passInclusionDate: new Date('2024-01-15'),
      passInclusionExpiration: new Date('2026-01-15'),
      eligibiliteIAE: 'Bénéficiaire RSA depuis plus de 12 mois',
      dateEntree: new Date('2024-02-01'),
      typeContrat: 'CDDI',
      dureeHebdo: 26,
      poste: 'Agent de tri D3E',
      salaireBrut: 1450,
      statut: 'actif'
    },
    {
      civilite: 'Mme',
      nom: 'DUBOIS',
      prenom: 'Sophie',
      dateNaissance: new Date('1990-07-22'),
      nationalite: 'Française',
      numeroSecu: '2900775234567',
      adresse: '8 Avenue Victor Hugo',
      codePostal: '93100',
      ville: 'Montreuil',
      telephone: '06 23 45 67 89',
      email: 'sophie.dubois@email.fr',
      situationFamiliale: 'mariée',
      nombreEnfants: 2,
      permisConduire: false,
      inscritFranceTravail: true,
      numeroFranceTravail: 'FT234567',
      beneficiaireASS: true,
      passInclusionNumero: 'PI-2024-001235',
      passInclusionDate: new Date('2024-03-01'),
      passInclusionExpiration: new Date('2026-03-01'),
      eligibiliteIAE: 'DELD > 24 mois',
      dateEntree: new Date('2024-03-15'),
      typeContrat: 'CDDI',
      dureeHebdo: 20,
      poste: 'Opératrice de démantèlement',
      salaireBrut: 1200,
      statut: 'actif'
    },
    {
      civilite: 'M.',
      nom: 'LAURENT',
      prenom: 'Karim',
      dateNaissance: new Date('1978-11-30'),
      nationalite: 'Française',
      numeroSecu: '1781175345678',
      adresse: '23 Rue de la République',
      codePostal: '94200',
      ville: 'Ivry-sur-Seine',
      telephone: '06 34 56 78 90',
      situationFamiliale: 'divorcé',
      nombreEnfants: 1,
      permisConduire: true,
      typePermis: 'B, C',
      vehicule: true,
      inscritFranceTravail: true,
      numeroFranceTravail: 'FT345678',
      beneficiaireRSA: true,
      reconnaissanceTH: true,
      passInclusionNumero: 'PI-2024-001236',
      passInclusionDate: new Date('2024-04-01'),
      passInclusionExpiration: new Date('2026-04-01'),
      eligibiliteIAE: 'Travailleur handicapé',
      dateEntree: new Date('2024-04-10'),
      typeContrat: 'CDDI',
      dureeHebdo: 35,
      poste: 'Chauffeur-livreur',
      salaireBrut: 1650,
      statut: 'actif'
    },
    {
      civilite: 'Mme',
      nom: 'PETIT',
      prenom: 'Fatima',
      dateNaissance: new Date('1995-02-14'),
      nationalite: 'Française',
      numeroSecu: '2950275456789',
      adresse: '45 Boulevard Gambetta',
      codePostal: '92110',
      ville: 'Clichy',
      telephone: '06 45 67 89 01',
      email: 'fatima.petit@email.fr',
      situationFamiliale: 'célibataire',
      nombreEnfants: 1,
      permisConduire: false,
      inscritFranceTravail: true,
      numeroFranceTravail: 'FT456789',
      beneficiaireRSA: true,
      passInclusionNumero: 'PI-2024-001237',
      passInclusionDate: new Date('2024-05-01'),
      passInclusionExpiration: new Date('2026-05-01'),
      eligibiliteIAE: 'Jeune < 26 ans en difficulté',
      dateEntree: new Date('2024-05-20'),
      typeContrat: 'CDDI',
      dureeHebdo: 26,
      poste: 'Agent administratif',
      salaireBrut: 1400,
      statut: 'actif'
    },
    {
      civilite: 'M.',
      nom: 'BERNARD',
      prenom: 'Thomas',
      dateNaissance: new Date('1982-09-08'),
      nationalite: 'Française',
      numeroSecu: '1820975567890',
      adresse: '12 Rue Jean Jaurès',
      codePostal: '93200',
      ville: 'Saint-Denis',
      telephone: '06 56 78 90 12',
      email: 'thomas.bernard@email.fr',
      situationFamiliale: 'pacsé',
      nombreEnfants: 0,
      permisConduire: true,
      typePermis: 'B',
      vehicule: false,
      inscritFranceTravail: true,
      numeroFranceTravail: 'FT567890',
      beneficiaireASS: true,
      passInclusionNumero: 'PI-2023-000890',
      passInclusionDate: new Date('2023-06-01'),
      passInclusionExpiration: new Date('2025-06-01'),
      eligibiliteIAE: 'Sortant de détention',
      dateEntree: new Date('2023-07-01'),
      dateSortie: new Date('2024-12-31'),
      typeContrat: 'CDDI',
      dureeHebdo: 35,
      poste: 'Technicien reconditionnement',
      salaireBrut: 1600,
      statut: 'sorti',
      motifSortie: 'CDI entreprise extérieure',
      typeSortie: 'positive'
    }
  ];

  for (const empData of employees) {
    const employee = await prisma.insertionEmployee.create({
      data: empData
    });
    console.log(`✅ Salarié créé: ${employee.prenom} ${employee.nom}`);

    // Créer la fiche PRO
    await prisma.fichePro.create({
      data: {
        employeeId: employee.id,
        niveauEtude: ['Sans diplôme', 'CAP/BEP', 'Bac', 'Bac+2'][Math.floor(Math.random() * 4)],
        competencesCles: 'Travail en équipe, Rigueur, Ponctualité',
        freinsMobilite: Math.random() > 0.5,
        freinsLogement: Math.random() > 0.7,
        freinsSante: Math.random() > 0.8,
        freinsGardeEnfants: empData.nombreEnfants > 0 && Math.random() > 0.5,
        freinsLangue: Math.random() > 0.8,
        freinsNumerique: Math.random() > 0.6,
        projetPro: 'Intégrer une entreprise du secteur du recyclage et de la valorisation',
        metiersVises: 'Agent de tri, Opérateur de recyclage, Technicien de maintenance',
        objectifsCourt: 'Acquérir les compétences de base du poste',
        objectifsMoyen: 'Obtenir une certification professionnelle',
        objectifsLong: 'Accéder à un emploi durable dans le secteur'
      }
    });

    // Créer des suivis/entretiens
    const suiviTypes = ['Hebdomadaire', 'Mensuel', 'Bilan', 'Point situation'];
    const nbSuivis = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < nbSuivis; i++) {
      const dateEntretien = new Date(employee.dateEntree);
      dateEntretien.setDate(dateEntretien.getDate() + i * 14);
      if (dateEntretien > new Date()) break;

      await prisma.suiviEntretien.create({
        data: {
          employeeId: employee.id,
          dateEntretien,
          typeEntretien: suiviTypes[Math.floor(Math.random() * suiviTypes.length)],
          duree: [30, 45, 60][Math.floor(Math.random() * 3)],
          conseillerNom: 'Marie CONSEILLER',
          objetEntretien: `Point d'étape sur l'intégration et les objectifs`,
          pointsAbordes: 'Adaptation au poste, difficultés rencontrées, progression',
          actionsDecidees: 'Poursuivre l\'accompagnement, prévoir formation',
          objectifsAtteints: i > 2 ? 'Objectifs court terme atteints' : null
        }
      });
    }

    // Créer une PMSMP pour certains
    if (Math.random() > 0.4) {
      const debutPMSMP = new Date(employee.dateEntree);
      debutPMSMP.setMonth(debutPMSMP.getMonth() + 3);
      const finPMSMP = new Date(debutPMSMP);
      finPMSMP.setDate(finPMSMP.getDate() + 14);

      await prisma.conventionPMSMP.create({
        data: {
          employeeId: employee.id,
          entrepriseNom: ['Veolia', 'Suez', 'Paprec', 'Derichebourg'][Math.floor(Math.random() * 4)],
          entrepriseSiret: '12345678901234',
          entrepriseAdresse: '123 Zone Industrielle, 93000 Bobigny',
          tuteurNom: 'Pierre TUTEUR',
          tuteurFonction: 'Responsable d\'équipe',
          tuteurTelephone: '01 23 45 67 89',
          dateDebut: debutPMSMP,
          dateFin: finPMSMP,
          dureeJours: 10,
          objectifDecouverte: 'Découvrir le métier de technicien de tri',
          activitesPrevues: 'Tri des déchets, utilisation des machines, sécurité',
          bilanRealise: finPMSMP < new Date(),
          bilanDate: finPMSMP < new Date() ? finPMSMP : null,
          evaluationEntreprise: finPMSMP < new Date() ? ['Très satisfaisant', 'Satisfaisant', 'À améliorer'][Math.floor(Math.random() * 3)] : null,
          statut: finPMSMP < new Date() ? 'terminee' : 'en_cours'
        }
      });
    }

    // Créer le contrat initial
    const finContrat = new Date(employee.dateEntree);
    finContrat.setMonth(finContrat.getMonth() + 4);

    await prisma.contratInsertion.create({
      data: {
        employeeId: employee.id,
        typeContrat: 'CDDI',
        dateDebut: employee.dateEntree,
        dateFin: finContrat,
        dureeHeures: empData.dureeHebdo,
        motif: 'Initial',
        dpaeNumero: `DPAE-${Date.now()}`,
        dpaeDate: new Date(employee.dateEntree.getTime() - 7 * 24 * 60 * 60 * 1000),
        dateSignature: employee.dateEntree,
        statut: employee.statut === 'sorti' ? 'termine' : 'actif'
      }
    });

    // Ajouter des formations pour certains
    if (Math.random() > 0.5) {
      const debutFormation = new Date(employee.dateEntree);
      debutFormation.setMonth(debutFormation.getMonth() + 2);

      await prisma.formation.create({
        data: {
          employeeId: employee.id,
          intitule: ['SST - Sauveteur Secouriste du Travail', 'Gestes et postures', 'Habilitation électrique', 'CACES'][Math.floor(Math.random() * 4)],
          organisme: 'Centre de Formation Professionnel',
          type: 'Externe',
          dateDebut: debutFormation,
          dateFin: new Date(debutFormation.getTime() + 2 * 24 * 60 * 60 * 1000),
          dureeHeures: 14,
          objectifs: 'Acquérir les compétences réglementaires',
          statut: debutFormation < new Date() ? 'terminee' : 'planifiee',
          resultat: debutFormation < new Date() ? 'Validée' : null
        }
      });
    }

    // Ajouter quelques documents
    const docsTypes = [
      { type: 'CNI', categorie: 'ADMIN', obligatoire: true },
      { type: 'CARTE_VITALE', categorie: 'ADMIN', obligatoire: true },
      { type: 'RIB', categorie: 'ADMIN', obligatoire: true },
      { type: 'PASS_INCLUSION', categorie: 'RH', obligatoire: true },
      { type: 'CONTRAT', categorie: 'RH', obligatoire: true }
    ];

    for (const doc of docsTypes) {
      if (Math.random() > 0.2) { // 80% de chance d'avoir le document
        await prisma.insertionDocument.create({
          data: {
            employeeId: employee.id,
            categorie: doc.categorie,
            typeDocument: doc.type,
            nomDocument: `${doc.type}_${employee.nom}.pdf`,
            url: `/uploads/documents/${doc.type.toLowerCase()}_${employee.id}.pdf`,
            estObligatoire: doc.obligatoire,
            estValide: true,
            dateDocument: employee.dateEntree,
            dateExpiration: doc.type === 'CNI' ? new Date('2030-01-01') : null
          }
        });
      }
    }
  }

  console.log('\n🎉 Seed des salariés en insertion terminé!');
  console.log(`📊 ${employees.length} salariés créés avec leurs dossiers complets`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
