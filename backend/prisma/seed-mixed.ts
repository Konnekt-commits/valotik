import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Composants réalistes par catégorie avec photos correspondantes
const COMPOSANTS_PAR_CATEGORIE: Record<string, Array<{nom: string, poids: [number, number], prix: [number, number]}>> = {
  // MOBILIER DE BUREAU
  'Bureaux fixes': [
    { nom: 'Bureau Ikea Bekant 160x80cm', poids: [25, 35], prix: [80, 150] },
    { nom: 'Bureau Steelcase Migration SE 140x70cm', poids: [30, 40], prix: [200, 350] },
    { nom: 'Bureau Herman Miller Sense 180x90cm', poids: [35, 45], prix: [300, 500] },
    { nom: 'Bureau rectangulaire mélaminé 120x60cm', poids: [20, 30], prix: [50, 100] },
  ],
  'Bureaux réglables motorisés': [
    { nom: 'Bureau assis-debout Flexispot E7', poids: [35, 50], prix: [400, 600] },
    { nom: 'Bureau réglable Ikea Idasen 160x80cm', poids: [40, 55], prix: [350, 550] },
    { nom: 'Bureau height-adjustable Steelcase Series 7', poids: [45, 60], prix: [600, 900] },
  ],
  'Fauteuils de travail (ergonomiques)': [
    { nom: 'Fauteuil Herman Miller Aeron taille B', poids: [22, 28], prix: [400, 700] },
    { nom: 'Fauteuil Steelcase Gesture noir', poids: [24, 30], prix: [500, 800] },
    { nom: 'Fauteuil Ikea Markus bleu', poids: [15, 20], prix: [80, 150] },
    { nom: 'Fauteuil ergonomique Haworth Zody', poids: [20, 26], prix: [350, 600] },
    { nom: 'Fauteuil de bureau maille noir', poids: [12, 18], prix: [50, 120] },
  ],
  'Chaises visiteurs / réunion': [
    { nom: 'Chaise réunion empilable grise', poids: [5, 8], prix: [30, 60] },
    { nom: 'Chaise visiteur Vitra HAL', poids: [6, 9], prix: [100, 180] },
    { nom: 'Chaise conférence Steelcase Reply', poids: [7, 10], prix: [150, 250] },
  ],
  'Tables de réunion': [
    { nom: 'Table réunion ovale 240x120cm chêne', poids: [60, 80], prix: [300, 600] },
    { nom: 'Table modulaire 160x80cm blanche', poids: [35, 50], prix: [150, 300] },
    { nom: 'Table haute réunion 180x90cm', poids: [40, 55], prix: [200, 400] },
  ],
  'Armoires à portes battantes': [
    { nom: 'Armoire 2 portes métal 100x40x200cm', poids: [45, 65], prix: [150, 300] },
    { nom: 'Armoire haute Bisley 4 tablettes', poids: [50, 70], prix: [200, 400] },
    { nom: 'Armoire bois placage chêne 80x45x180cm', poids: [55, 75], prix: [250, 450] },
  ],
  'Caissons mobiles / fixes': [
    { nom: 'Caisson mobile 3 tiroirs blanc', poids: [15, 22], prix: [60, 120] },
    { nom: 'Caisson fixe 4 tiroirs métal gris', poids: [18, 25], prix: [80, 150] },
    { nom: 'Caisson Bisley sous-bureau noir', poids: [16, 23], prix: [100, 180] },
  ],

  // ÉQUIPEMENTS INFORMATIQUES
  'Unités centrales (desktop)': [
    { nom: 'PC Dell OptiPlex 7090 i5-11500', poids: [8, 12], prix: [300, 500] },
    { nom: 'PC HP EliteDesk 800 G8 i7-11700', poids: [9, 13], prix: [400, 650] },
    { nom: 'PC Lenovo ThinkCentre M90q Tiny i5', poids: [6, 9], prix: [280, 450] },
    { nom: 'PC Dell Precision 3660 Tower i7', poids: [12, 16], prix: [600, 1000] },
  ],
  'PC portables (laptops)': [
    { nom: 'Lenovo ThinkPad T14 Gen 3 i5', poids: [1.5, 2.2], prix: [400, 700] },
    { nom: 'HP EliteBook 840 G9 i7', poids: [1.4, 2.0], prix: [500, 850] },
    { nom: 'Dell Latitude 5430 i5', poids: [1.6, 2.3], prix: [380, 650] },
    { nom: 'MacBook Pro 13" M2', poids: [1.3, 1.7], prix: [800, 1200] },
  ],
  'Écrans / moniteurs 22-24"': [
    { nom: 'Écran Dell P2422H 24" Full HD', poids: [4, 6], prix: [120, 200] },
    { nom: 'Écran HP E24 G5 23.8"', poids: [4.5, 6.5], prix: [100, 180] },
    { nom: 'Écran Samsung S24F350 24"', poids: [3.5, 5.5], prix: [80, 150] },
  ],
  'Écrans / moniteurs 27-34"': [
    { nom: 'Écran Dell UltraSharp U2722DE 27" QHD', poids: [6, 9], prix: [250, 400] },
    { nom: 'Écran HP EliteDisplay E273 27"', poids: [5.5, 8.5], prix: [180, 320] },
    { nom: 'Écran LG 34WN80C-B 34" UltraWide', poids: [8, 11], prix: [350, 600] },
  ],
  'Claviers / souris': [
    { nom: 'Clavier + Souris Logitech MK270', poids: [0.5, 0.8], prix: [15, 30] },
    { nom: 'Clavier mécanique Dell KB522', poids: [0.8, 1.2], prix: [30, 60] },
  ],
  'Imprimantes laser': [
    { nom: 'Imprimante HP LaserJet Pro M404dn', poids: [10, 14], prix: [150, 280] },
    { nom: 'Imprimante Brother HL-L5100DN', poids: [11, 15], prix: [120, 220] },
  ],
  'Multifonctions (MFP)': [
    { nom: 'MFP Canon imageRUNNER 2425i', poids: [45, 60], prix: [400, 700] },
    { nom: 'MFP HP LaserJet Pro M428fdw', poids: [18, 24], prix: [280, 450] },
  ],
  'Serveurs rack': [
    { nom: 'Serveur Dell PowerEdge R740 2U', poids: [25, 35], prix: [1200, 2000] },
    { nom: 'Serveur HP ProLiant DL380 Gen10', poids: [22, 32], prix: [1000, 1800] },
  ],

  // AUDIOVISUEL
  'Téléviseurs LCD/LED 32-55"': [
    { nom: 'TV Samsung 43" UE43BU8000', poids: [8, 12], prix: [200, 350] },
    { nom: 'TV LG 50UP75006 50" 4K', poids: [10, 14], prix: [250, 450] },
  ],
  'Téléviseurs 55"+': [
    { nom: 'TV Samsung 65" QLED QE65Q60C', poids: [18, 24], prix: [500, 900] },
    { nom: 'TV LG OLED65C2 65"', poids: [20, 26], prix: [800, 1400] },
  ],
  'Projecteurs de bureau': [
    { nom: 'Projecteur Epson EB-W06', poids: [2.5, 3.5], prix: [180, 320] },
    { nom: 'Projecteur BenQ MH535', poids: [2.8, 3.8], prix: [220, 380] },
  ],
  'Barres de son': [
    { nom: 'Barre de son Samsung HW-B550', poids: [2, 3.5], prix: [80, 150] },
    { nom: 'Barre de son Sonos Beam Gen 2', poids: [2.5, 3.8], prix: [250, 450] },
  ],

  // ÉCLAIRAGE
  'Luminaires de bureau (LED)': [
    { nom: 'Lampe bureau LED Philips 71570', poids: [0.8, 1.5], prix: [20, 45] },
    { nom: 'Lampe architecte LED BenQ e-Reading', poids: [1.2, 2.0], prix: [80, 150] },
  ],
  'Réglettes LED (tubes)': [
    { nom: 'Réglette LED 120cm 36W Osram', poids: [1.5, 2.5], prix: [25, 50] },
    { nom: 'Tube LED 150cm Philips CorePro', poids: [0.8, 1.5], prix: [15, 30] },
  ],
};

// Photos par type de composant
const PHOTOS_PAR_CATEGORIE: Record<string, string[]> = {
  // Mobilier
  'Bureaux fixes': [
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
  ],
  'Bureaux réglables motorisés': [
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800',
  ],
  'Fauteuils de travail (ergonomiques)': [
    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
    'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
  ],
  'Chaises visiteurs / réunion': [
    'https://images.unsplash.com/photo-1503602642458-232111445657?w=800',
  ],
  'Tables de réunion': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
  ],
  'Armoires à portes battantes': [
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',
  ],
  'Caissons mobiles / fixes': [
    'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800',
  ],

  // IT
  'Unités centrales (desktop)': [
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
    'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800',
  ],
  'PC portables (laptops)': [
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800',
  ],
  'Écrans / moniteurs 22-24"': [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
  ],
  'Écrans / moniteurs 27-34"': [
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800',
  ],
  'Imprimantes laser': [
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800',
  ],
  'Multifonctions (MFP)': [
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800',
  ],
  'Serveurs rack': [
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
  ],

  // Audiovisuel
  'Téléviseurs LCD/LED 32-55"': [
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
  ],
  'Téléviseurs 55"+': [
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800',
  ],
  'Projecteurs de bureau': [
    'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=800',
  ],

  // Éclairage
  'Luminaires de bureau (LED)': [
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800',
  ],
  'Réglettes LED (tubes)': [
    'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800',
  ],
};

// Scénarios de dossiers variés
const SCENARIOS_DOSSIERS = [
  {
    type: 'Déménagement bureau PME',
    categories: ['Mobilier de bureau', 'Équipements informatiques et telecom'],
    sousCategories: [
      'Bureaux fixes',
      'Fauteuils de travail (ergonomiques)',
      'Caissons mobiles / fixes',
      'Unités centrales (desktop)',
      'Écrans / moniteurs 22-24"',
      'Imprimantes laser',
    ],
  },
  {
    type: 'Fermeture salle de réunion',
    categories: ['Mobilier de bureau', 'Audiovisuel grand public'],
    sousCategories: [
      'Tables de réunion',
      'Chaises visiteurs / réunion',
      'Téléviseurs LCD/LED 32-55"',
      'Projecteurs de bureau',
    ],
  },
  {
    type: 'Renouvellement parc informatique',
    categories: ['Équipements informatiques et telecom'],
    sousCategories: [
      'PC portables (laptops)',
      'Écrans / moniteurs 27-34"',
      'Stations d\'accueil (dock USB/Thunderbolt)',
      'Claviers / souris',
    ],
  },
  {
    type: 'Vidage open space',
    categories: ['Mobilier de bureau', 'Équipements informatiques et telecom', 'Éclairage'],
    sousCategories: [
      'Bureaux réglables motorisés',
      'Fauteuils de travail (ergonomiques)',
      'Armoires à portes battantes',
      'Unités centrales (desktop)',
      'Écrans / moniteurs 22-24"',
      'Luminaires de bureau (LED)',
    ],
  },
  {
    type: 'Démantèlement salle serveurs',
    categories: ['Équipements informatiques et telecom'],
    sousCategories: [
      'Serveurs rack',
      'Switches (L2/L3, PoE)',
      'Onduleurs / UPS rack',
    ],
  },
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🚀 Démarrage du seed mixte...\n');

  // Récupérer toutes les catégories et sous-catégories
  const categories = await prisma.category.findMany({
    include: { subCategories: true },
  });

  console.log('📦 Catégories trouvées:', categories.map(c => c.nom).join(', '));
  console.log('');

  // Créer des utilisateurs
  console.log('👥 Création des utilisateurs...');
  const users = await Promise.all([
    prisma.user.create({
      data: { nom: 'Marie Dubois', email: 'marie@d3e.fr', role: 'admin' },
    }),
    prisma.user.create({
      data: { nom: 'Thomas Martin', email: 'thomas@d3e.fr', role: 'technicien' },
    }),
  ]);
  console.log(`✅ ${users.length} utilisateurs créés\n`);

  // Créer 20 dossiers variés
  console.log('📂 Création de 20 dossiers variés...\n');

  for (let i = 0; i < 20; i++) {
    const scenario = randomChoice(SCENARIOS_DOSSIERS);
    const createdAt = randomDate(new Date('2025-01-01'), new Date('2025-10-15'));

    // Créer client et site
    const client = await prisma.clientCompany.create({
      data: {
        raisonSociale: `${['TechCorp', 'BureauPro', 'StartupHub', 'GreenOffice', 'ModernWork'][i % 5]} ${i + 1}`,
        siret: `${90000000000 + i}`,
        adresseFacturation: `${i + 1} rue de la République, 75001 Paris`,
        secteur: randomChoice(['Informatique', 'Services', 'Commerce', 'Administration']),
        createdAt,
      },
    });

    const site = await prisma.clientSite.create({
      data: {
        clientId: client.id,
        nom: 'Siège social',
        adresseComplete: client.adresseFacturation,
        latitude: 48.8566 + Math.random() * 0.1,
        longitude: 2.3522 + Math.random() * 0.1,
        typeSite: 'bureau',
        createdAt,
      },
    });

    const contact = await prisma.contact.create({
      data: {
        clientId: client.id,
        nom: randomChoice(['Jean Dupont', 'Marie Martin', 'Luc Bernard', 'Sophie Petit']),
        fonction: randomChoice(['DSI', 'Office Manager', 'Responsable IT', 'DRH']),
        telephone: `+33 1 ${randomInt(40, 49)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
        email: `contact${i}@company.fr`,
        createdAt,
      },
    });

    // Créer demande
    const request = await prisma.pickupRequest.create({
      data: {
        clientId: client.id,
        siteId: site.id,
        contactId: contact.id,
        descriptionInitiale: `${scenario.type} - Matériel à évacuer`,
        categoriePrincipale: 'mixte',
        volumeEstime: `${randomInt(1, 5)} palettes`,
        valeurEstimee: randomInt(3000, 15000),
        valeurRevente: randomInt(2000, 10000),
        priorite: randomChoice(['low', 'medium', 'high']),
        statut: 'in_progress',
        plannedVisitAt: new Date(createdAt.getTime() + randomInt(7, 21) * 24 * 60 * 60 * 1000),
        accessNotes: 'Accès par quai de chargement',
        createdAt,
      },
    });

    // Créer dossier
    const caseFile = await prisma.caseFile.create({
      data: {
        requestId: request.id,
        clientId: client.id,
        reference: `CF-2025-${String(i + 1).padStart(3, '0')}`,
        statut: randomChoice(['in_progress', 'completed']),
        poidsEstime: randomInt(500, 3000),
        poidsReel: randomInt(500, 3000),
        valeurTotale: randomInt(5000, 25000),
        createdAt,
        closedAt: Math.random() > 0.5 ? new Date(createdAt.getTime() + randomInt(30, 60) * 24 * 60 * 60 * 1000) : null,
      },
    });

    // Créer diagnostic
    const diagnosis = await prisma.diagnosis.create({
      data: {
        caseFileId: caseFile.id,
        technicienId: randomChoice(users).id,
        dateVisite: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
        notes: `Diagnostic ${scenario.type}. Bon état général.`,
        dureeVisite: randomInt(60, 180),
        createdAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`📁 Dossier CF-2025-${String(i + 1).padStart(3, '0')}: ${scenario.type}`);

    // Créer 2-4 lots avec les sous-catégories du scénario
    const nbLots = randomInt(2, 4);

    for (let j = 0; j < nbLots; j++) {
      const subCatName = randomChoice(scenario.sousCategories);

      // Trouver la vraie sous-catégorie
      let subCategory = null;
      let category = null;

      for (const cat of categories) {
        const sub = cat.subCategories.find(s => s.nom === subCatName);
        if (sub) {
          subCategory = sub;
          category = cat;
          break;
        }
      }

      if (!subCategory || !category) {
        console.log(`  ⚠️  Sous-catégorie "${subCatName}" non trouvée, skip`);
        continue;
      }

      // Créer le lot
      const photosArray = PHOTOS_PAR_CATEGORIE[subCatName] || [];
      const photoUrl = photosArray.length > 0 ? photosArray[0] : null;

      const lot = await prisma.lot.create({
        data: {
          caseFileId: caseFile.id,
          diagnosisId: diagnosis.id,
          code: `LOT-${String(i + 1).padStart(3, '0')}-${String(j + 1).padStart(2, '0')}`,
          categorieId: category.id,
          categorieName: category.nom,
          grade: randomChoice(['A', 'B', 'C', 'D']),
          orientation: randomChoice(['resale', 'refurbishment', 'dismantling']),
          poidsEstime: randomInt(100, 500),
          poidsReel: randomInt(100, 500),
          statut: randomChoice(['pending', 'processed', 'in_stock']),
          qrCode: `QR-LOT-${i + 1}-${j + 1}`,
          photos: photoUrl,
          createdAt: new Date(createdAt.getTime() + 6 * 24 * 60 * 60 * 1000),
        },
      });

      // Créer 3-8 composants dans ce lot
      const composants = COMPOSANTS_PAR_CATEGORIE[subCatName] || [];
      if (composants.length === 0) {
        console.log(`  ⚠️  Pas de composants définis pour "${subCatName}"`);
        continue;
      }

      const nbComponents = randomInt(3, Math.min(8, composants.length * 2));
      console.log(`  📦 Lot ${lot.code}: ${subCatName} (${nbComponents} composants)`);

      for (let k = 0; k < nbComponents; k++) {
        const compTemplate = randomChoice(composants);

        await prisma.component.create({
          data: {
            lotId: lot.id,
            subCategoryId: subCategory.id,
            nom: compTemplate.nom,
            quantite: randomInt(1, 3),
            grade: lot.grade,
            poidsUnitaire: randomInt(compTemplate.poids[0], compTemplate.poids[1]),
            valeurUnitaire: randomInt(compTemplate.prix[0], compTemplate.prix[1]),
            qrCode: `QR-CMP-${i + 1}-${j + 1}-${k + 1}`,
            statut: randomChoice(['extracted', 'graded', 'stored']),
            createdAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log('');
  }

  console.log('✅ Seed mixte terminé!');
  console.log('📊 Résumé:');
  console.log(`   - ${await prisma.caseFile.count()} dossiers`);
  console.log(`   - ${await prisma.lot.count()} lots`);
  console.log(`   - ${await prisma.component.count()} composants`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
