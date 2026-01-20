import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSalesData() {
  console.log('🔄 Génération des données de ventes...');

  try {
    // 0. Supprimer les anciennes données
    console.log('🗑️  Suppression des anciennes ventes et clients finaux...');
    await prisma.sale.deleteMany({});
    await prisma.endCustomer.deleteMany({});
    console.log('✅ Anciennes données supprimées');

    // 1. Récupérer tous les dossiers
    const caseFiles = await prisma.caseFile.findMany({
      include: {
        lots: {
          include: {
            components: true,
          },
        },
      },
    });

    console.log(`📁 ${caseFiles.length} dossiers trouvés`);

    // 2. Récupérer les canaux de vente
    const salesChannels = await prisma.salesChannel.findMany();
    console.log(`🏪 ${salesChannels.length} canaux de vente trouvés`);

    if (salesChannels.length === 0) {
      console.log('❌ Aucun canal de vente trouvé. Veuillez d\'abord créer des canaux de vente.');
      return;
    }

    // 3. Liste de vendeurs fictifs
    const vendeurs = [
      { id: 'v1', nom: 'Sophie Martin' },
      { id: 'v2', nom: 'Thomas Dubois' },
      { id: 'v3', nom: 'Marie Lefebvre' },
      { id: 'v4', nom: 'Pierre Moreau' },
      { id: 'v5', nom: 'Julie Bernard' },
      { id: 'v6', nom: 'Alexandre Petit' },
    ];

    // 4. Créer les clients finaux (end customers)
    const endCustomersData = [
      { nom: 'TechRecycle SAS', type: 'entreprise', email: 'contact@techrecycle.fr', telephone: '0145678901', adresse: '12 rue de la Tech', codePostal: '75015', ville: 'Paris' },
      { nom: 'EcoElectro SARL', type: 'entreprise', email: 'ventes@ecoelectro.fr', telephone: '0234567890', adresse: '45 avenue Verte', codePostal: '69002', ville: 'Lyon' },
      { nom: 'GreenIT Solutions', type: 'entreprise', email: 'achats@greenit.fr', telephone: '0345678901', adresse: '8 boulevard Digital', codePostal: '31000', ville: 'Toulouse' },
      { nom: 'ReValue Équipements', type: 'entreprise', email: 'commandes@revalue.fr', telephone: '0456789012', adresse: '23 rue du Commerce', codePostal: '44000', ville: 'Nantes' },
      { nom: 'SecondLife Tech', type: 'entreprise', email: 'achat@secondlife.fr', telephone: '0567890123', adresse: '67 avenue Innovation', codePostal: '33000', ville: 'Bordeaux' },
      { nom: 'Digital Reborn', type: 'entreprise', email: 'contact@digitalreborn.fr', telephone: '0678901234', adresse: '90 rue Écologique', codePostal: '59000', ville: 'Lille' },
      { nom: 'Jean Dupont', type: 'particulier', email: 'jean.dupont@gmail.com', telephone: '0612345678', adresse: '15 rue des Lilas', codePostal: '75020', ville: 'Paris' },
      { nom: 'Marie Lambert', type: 'particulier', email: 'marie.lambert@gmail.com', telephone: '0623456789', adresse: '28 avenue des Roses', codePostal: '69003', ville: 'Lyon' },
      { nom: 'Pierre Martin', type: 'particulier', email: 'pierre.martin@hotmail.fr', telephone: '0634567890', adresse: '5 impasse du Parc', codePostal: '13001', ville: 'Marseille' },
      { nom: 'Sophie Bernard', type: 'particulier', email: 'sophie.bernard@yahoo.fr', telephone: '0645678901', adresse: '42 rue Pasteur', codePostal: '67000', ville: 'Strasbourg' },
    ];

    console.log('📝 Création des clients finaux...');
    const endCustomers = [];
    for (const customerData of endCustomersData) {
      const customer = await prisma.endCustomer.create({
        data: customerData,
      });
      endCustomers.push(customer);
    }
    console.log(`✅ ${endCustomers.length} clients finaux créés`);

    const modes = ['carte_bancaire', 'virement', 'especes', 'cheque'];
    const grades = ['A', 'B', 'C', 'D'];

    let totalSales = 0;
    const salesData = [];

    // 5. Pour chaque dossier, créer des ventes aléatoires
    for (const caseFile of caseFiles) {
      // Nombre de ventes par dossier (30-70% des composants)
      const totalComponents = caseFile.lots.reduce((sum, lot) => sum + lot.components.length, 0);

      if (totalComponents === 0) continue;

      const salesCount = Math.floor(totalComponents * (0.3 + Math.random() * 0.4));

      // Récupérer tous les composants du dossier
      const allComponents = caseFile.lots.flatMap(lot =>
        lot.components.map(comp => ({ ...comp, lotId: lot.id }))
      );

      // Mélanger et sélectionner des composants aléatoires
      const shuffled = allComponents.sort(() => 0.5 - Math.random());
      const selectedComponents = shuffled.slice(0, salesCount);

      // Créer des ventes pour les composants sélectionnés
      for (const component of selectedComponents) {
        const vendeur = vendeurs[Math.floor(Math.random() * vendeurs.length)];
        const customer = endCustomers[Math.floor(Math.random() * endCustomers.length)];
        const channel = salesChannels[Math.floor(Math.random() * salesChannels.length)];
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const mode = modes[Math.floor(Math.random() * modes.length)];

        // Prix en fonction du grade et du type de composant
        let prixBase = 50;
        if (component.nom.toLowerCase().includes('ordinateur') || component.nom.toLowerCase().includes('pc')) {
          prixBase = 150 + Math.random() * 350;
        } else if (component.nom.toLowerCase().includes('écran') || component.nom.toLowerCase().includes('moniteur')) {
          prixBase = 50 + Math.random() * 150;
        } else if (component.nom.toLowerCase().includes('imprimante')) {
          prixBase = 30 + Math.random() * 120;
        } else if (component.nom.toLowerCase().includes('clavier') || component.nom.toLowerCase().includes('souris')) {
          prixBase = 5 + Math.random() * 25;
        } else if (component.nom.toLowerCase().includes('serveur')) {
          prixBase = 300 + Math.random() * 700;
        }

        // Ajustement selon le grade
        const gradeMultiplier = grade === 'A' ? 1.5 : grade === 'B' ? 1.0 : grade === 'C' ? 0.6 : 0.3;
        const prixUnitaire = Math.round(prixBase * gradeMultiplier * 100) / 100;

        const quantity = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 2 : 1;
        const tauxTVA = 20;
        const montantHT = Math.round(prixUnitaire * quantity * 100) / 100;
        const montantTVA = Math.round(montantHT * (tauxTVA / 100) * 100) / 100;
        const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100;

        // Date de vente entre il y a 6 mois et aujourd'hui
        const daysAgo = Math.floor(Math.random() * 180);
        const dateVente = new Date();
        dateVente.setDate(dateVente.getDate() - daysAgo);

        salesData.push({
          reference: `VT-${new Date().getFullYear()}-${String(totalSales + 1).padStart(5, '0')}`,
          caseFileId: caseFile.id,
          lotId: component.lotId,
          componentId: component.id,
          salesChannelId: channel.id,
          endCustomerId: customer.id,
          productName: component.nom,
          quantity,
          grade,
          prixUnitaire,
          montantHT,
          montantTVA,
          montantTTC,
          tauxTVA,
          acheteurNom: customer.nom,
          acheteurEmail: customer.email,
          acheteurTelephone: customer.telephone,
          dateVente,
          statut: 'completed',
          vendeurId: vendeur.id,
          vendeurNom: vendeur.nom,
          modePaiement: mode,
          notes: `Vente générée automatiquement - Grade ${grade} - Client ${customer.type}`,
        });

        totalSales++;
      }
    }

    // 6. Insérer toutes les ventes dans la base de données
    console.log(`\n💾 Insertion de ${salesData.length} ventes...`);

    for (const sale of salesData) {
      await prisma.sale.create({
        data: sale,
      });
    }

    console.log(`✅ ${totalSales} ventes créées avec succès !`);

    // 7. Afficher les statistiques
    const stats = await prisma.sale.aggregate({
      _sum: {
        montantTTC: true,
        montantHT: true,
        quantity: true,
      },
      _count: true,
    });

    console.log('\n📊 Statistiques des ventes :');
    console.log(`   Total ventes : ${stats._count}`);
    console.log(`   Quantité totale : ${stats._sum.quantity || 0} unités`);
    console.log(`   CA HT : ${(stats._sum.montantHT || 0).toFixed(2)} €`);
    console.log(`   CA TTC : ${(stats._sum.montantTTC || 0).toFixed(2)} €`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération des ventes :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateSalesData()
  .then(() => {
    console.log('\n✨ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });
