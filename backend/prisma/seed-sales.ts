import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour générer une date aléatoire dans les 3 derniers mois
function randomRecentDate(): Date {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return new Date(threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime()));
}

async function main() {
  console.log('🏪 Début du seed des ventes...\n');

  // 1. Créer des canaux de vente
  console.log('📍 Création des canaux de vente...');

  const salesChannels = await Promise.all([
    prisma.salesChannel.create({
      data: {
        nom: 'Magasin Paris 15',
        type: 'physical',
        adresse: '45 Rue de la Convention, 75015 Paris',
        responsable: 'Jean Dupont',
        commission: 5,
        actif: true,
      },
    }),
    prisma.salesChannel.create({
      data: {
        nom: 'Site e-commerce',
        type: 'online',
        url: 'https://shop.valotik.fr',
        responsable: 'Marie Martin',
        commission: 3,
        actif: true,
      },
    }),
    prisma.salesChannel.create({
      data: {
        nom: 'Marketplace eBay',
        type: 'marketplace',
        url: 'https://www.ebay.fr/usr/valotik',
        responsable: 'Pierre Durand',
        commission: 10,
        actif: true,
      },
    }),
    prisma.salesChannel.create({
      data: {
        nom: 'Marketplace Leboncoin',
        type: 'marketplace',
        url: 'https://www.leboncoin.fr/boutique/valotik',
        responsable: 'Sophie Bernard',
        commission: 7,
        actif: true,
      },
    }),
  ]);

  console.log(`✅ ${salesChannels.length} canaux de vente créés\n`);

  // 2. Créer des clients finaux
  console.log('👥 Création des clients finaux...');

  const endCustomers = await Promise.all([
    prisma.endCustomer.create({
      data: {
        nom: 'SARL Informatique Plus',
        type: 'entreprise',
        email: 'contact@infoplus.fr',
        telephone: '+33 1 45 67 89 01',
        adresse: '12 Avenue Victor Hugo',
        codePostal: '75016',
        ville: 'Paris',
        notes: 'Client régulier - demande des PC reconditionnés',
      },
    }),
    prisma.endCustomer.create({
      data: {
        nom: 'Martin Dubois',
        type: 'particulier',
        email: 'martin.dubois@gmail.com',
        telephone: '+33 6 12 34 56 78',
        adresse: '23 Rue des Lilas',
        codePostal: '69003',
        ville: 'Lyon',
      },
    }),
    prisma.endCustomer.create({
      data: {
        nom: 'École Primaire Jean Jaurès',
        type: 'entreprise',
        email: 'secretariat@ecole-jaures.fr',
        telephone: '+33 4 56 78 90 12',
        adresse: '45 Boulevard de la République',
        codePostal: '13001',
        ville: 'Marseille',
        notes: 'Achète du matériel pour la salle informatique',
      },
    }),
    prisma.endCustomer.create({
      data: {
        nom: 'Sophie Laurent',
        type: 'particulier',
        email: 'sophie.laurent@outlook.fr',
        telephone: '+33 6 23 45 67 89',
        adresse: '67 Rue Nationale',
        codePostal: '59000',
        ville: 'Lille',
      },
    }),
    prisma.endCustomer.create({
      data: {
        nom: 'Association Les Ateliers du Numérique',
        type: 'entreprise',
        email: 'contact@ateliers-numerique.org',
        telephone: '+33 5 67 89 01 23',
        adresse: '89 Cours Gambetta',
        codePostal: '33000',
        ville: 'Bordeaux',
        notes: 'Association formant aux métiers du numérique',
      },
    }),
  ]);

  console.log(`✅ ${endCustomers.length} clients finaux créés\n`);

  // 3. Récupérer des dossiers et composants existants
  console.log('📦 Récupération des dossiers et composants...');

  const caseFiles = await prisma.caseFile.findMany({
    where: {
      statut: { in: ['in_progress', 'completed'] },
    },
    take: 10,
  });

  const components = await prisma.component.findMany({
    take: 50,
  });

  console.log(`✅ ${caseFiles.length} dossiers et ${components.length} composants trouvés\n`);

  if (caseFiles.length === 0 || components.length === 0) {
    console.log('❌ Impossible de créer des ventes : aucun dossier ou composant trouvé');
    return;
  }

  // 4. Créer des ventes
  console.log('💰 Création des ventes...');

  const productNames = [
    'PC Dell OptiPlex 7090 - Grade A',
    'MacBook Pro 13" 2020 - Grade B',
    'Écran Samsung 24" Full HD',
    'PC portable HP EliteBook 840 G5',
    'Serveur Dell PowerEdge R440',
    'Imprimante HP LaserJet Pro',
    'Switch Cisco Catalyst 2960',
    'Clavier et souris Logitech',
    'Webcam Logitech HD',
    'Station d\'accueil USB-C',
  ];

  const grades = ['A', 'B', 'C', 'D'];
  const statuses = ['completed', 'completed', 'completed', 'cancelled'];
  const paymentMethods = ['card', 'cash', 'transfer'];

  let salesCount = 0;

  for (let i = 0; i < 30; i++) {
    const caseFile = caseFiles[i % caseFiles.length];
    const component = components[i % components.length];
    const salesChannel = salesChannels[i % salesChannels.length];
    const endCustomer = endCustomers[i % endCustomers.length];

    const productName = productNames[i % productNames.length];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const prixUnitaire = Math.floor(Math.random() * 400) + 100; // Entre 100€ et 500€
    const montantHT = prixUnitaire * quantity;
    const tauxTVA = 20;
    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;
    const statut = statuses[Math.floor(Math.random() * statuses.length)];
    const modePaiement = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    try {
      await prisma.sale.create({
        data: {
          reference: `VT-2024-${String(i + 1).padStart(3, '0')}`,
          caseFileId: caseFile.id,
          componentId: component.id,
          salesChannelId: salesChannel.id,
          endCustomerId: endCustomer.id,
          productName,
          quantity,
          grade,
          prixUnitaire,
          montantHT,
          montantTVA,
          montantTTC,
          tauxTVA,
          dateVente: randomRecentDate(),
          statut,
          modePaiement,
          vendeurNom: salesChannel.responsable,
        },
      });

      salesCount++;

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ ${i + 1} ventes créées...`);
      }
    } catch (error) {
      console.error(`  ✗ Erreur lors de la création de la vente ${i + 1}:`, error);
    }
  }

  console.log(`✅ ${salesCount} ventes créées avec succès\n`);

  console.log('🎉 Seed des ventes terminé!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
