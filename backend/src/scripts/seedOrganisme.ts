import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOrganisme() {
  console.log('Création des données Organisme depuis annexeFinanciere.pdf...');

  // 1. Créer l'organisme
  const organisme = await prisma.organisme.upsert({
    where: { siret: '90001343400031' },
    update: {},
    create: {
      raisonSociale: 'VALORISATION INCLUSION ETHIQUE 59',
      siret: '90001343400031',
      formeJuridique: 'Association Loi 1901',
      adresseSiege: '123 Rue de l\'Insertion',
      codePostalSiege: '59000',
      villeSiege: 'LILLE',
      telephoneSiege: '03 20 00 00 00',
      emailSiege: 'contact@vie59.fr',
      representantNom: 'DUPONT',
      representantPrenom: 'Jean',
      representantFonction: 'Président',
      contactAdminNom: 'MARTIN Marie',
      contactAdminEmail: 'admin@vie59.fr',
      contactAdminTel: '03 20 00 00 01',
      iban: 'FR76 3000 4000 0500 0000 0000 123',
      bic: 'BNPAFRPP',
      nomBanque: 'BNP Paribas',
      titulaireCompte: 'VALORISATION INCLUSION ETHIQUE 59',
    },
  });

  console.log('✓ Organisme créé:', organisme.raisonSociale);

  // 2. Créer la convention ACI 2026
  const convention = await prisma.conventionACI.upsert({
    where: {
      organismeId_annee: {
        organismeId: organisme.id,
        annee: 2026,
      },
    },
    update: {
      effectifETPAutorise: 9.34,
      aidePosteUnitaire: 23921.00,
      aidePosteTotale: 223422.14,
    },
    create: {
      organismeId: organisme.id,
      numeroConvention: 'CONV-ACI-2026-059',
      annee: 2026,
      dateDebut: new Date('2026-01-01'),
      dateFin: new Date('2026-12-31'),
      typeStructure: 'ACI',
      effectifETPAutorise: 9.34,
      effectifPhysique: 15,
      aidePosteUnitaire: 23921.00,
      aidePosteTotale: 223422.14,
      aideRegion: 15000,
      aideDepartement: 10000,
      aideCommune: 5000,
      autresAides: 0,
      chiffreAffaires: 450000,
      resultatNet: 12500,
      fondsAssociatifs: 85000,
      dettesFinancieres: 0,
      referentDDETSNom: 'DURAND Pierre',
      referentDDETSEmail: 'pierre.durand@ddets59.gouv.fr',
      referentDDETSTel: '03 20 00 00 99',
      statut: 'active',
    },
  });

  console.log('✓ Convention ACI 2026 créée');

  // 3. Créer les objectifs négociés
  await prisma.objectifNegocie.upsert({
    where: {
      conventionId_annee: {
        conventionId: convention.id,
        annee: 2026,
      },
    },
    update: {
      nombreSortiesPrevisionnel: 14,
      tauxSortiesDynamiquesCible: 60.00,
      tauxEmploiDurableCible: 25.00,
      tauxEmploiTransitionCible: 20.00,
      tauxSortiesPositivesCible: 15.00,
    },
    create: {
      conventionId: convention.id,
      annee: 2026,
      nombreSortiesPrevisionnel: 14,
      tauxSortiesDynamiquesCible: 60.00,
      tauxEmploiDurableCible: 25.00,
      tauxEmploiTransitionCible: 20.00,
      tauxSortiesPositivesCible: 15.00,
      notes: 'Objectifs négociés conformément à l\'annexe financière ACI 2026',
    },
  });

  console.log('✓ Objectifs négociés créés');

  // 4. Créer les ateliers
  const ateliers = [
    {
      organismeId: organisme.id,
      nom: 'Atelier Recyclage DEEE',
      code: 'AT-DEEE',
      secteurActivite: 'Recyclage / Valorisation',
      codeROME: 'H2101',
      effectifETP: 4.5,
      effectifEncadrants: 2,
      description: 'Collecte, tri et démantèlement d\'équipements électriques et électroniques',
      activites: 'Collecte DEEE, Tri sélectif, Démantèlement, Préparation au réemploi',
    },
    {
      organismeId: organisme.id,
      nom: 'Atelier Espaces Verts',
      code: 'AT-EV',
      secteurActivite: 'Entretien espaces verts',
      codeROME: 'A1203',
      effectifETP: 3.0,
      effectifEncadrants: 1,
      description: 'Entretien des espaces verts pour collectivités et particuliers',
      activites: 'Tonte, Taille, Débroussaillage, Plantations',
    },
    {
      organismeId: organisme.id,
      nom: 'Atelier Logistique',
      code: 'AT-LOG',
      secteurActivite: 'Logistique / Manutention',
      codeROME: 'N1103',
      effectifETP: 1.84,
      effectifEncadrants: 1,
      description: 'Activités logistiques et préparation de commandes',
      activites: 'Réception, Stockage, Préparation de commandes, Expédition',
    },
  ];

  // Supprimer les ateliers existants pour cet organisme
  await prisma.atelierChantier.deleteMany({
    where: { organismeId: organisme.id },
  });

  // Créer les nouveaux ateliers
  for (const atelier of ateliers) {
    await prisma.atelierChantier.create({
      data: atelier,
    });
  }

  console.log('✓ 3 Ateliers créés');

  console.log('\n✅ Données Organisme initialisées avec succès!');
  console.log('   - Organisme: VALORISATION INCLUSION ETHIQUE 59');
  console.log('   - SIRET: 90001343400031');
  console.log('   - Convention 2026: 9.34 ETP');
  console.log('   - Aide au poste: 223 422,14 €');
  console.log('   - Objectifs: 14 sorties prévisionnelles');
}

seedOrganisme()
  .catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
