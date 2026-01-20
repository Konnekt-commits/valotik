import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour générer une date aléatoire entre juin et aujourd'hui
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Fonction pour ajouter des jours à une date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Données exemple
const companies = [
  { name: 'TechCorp Industries', sector: 'Technologie', siret: '12345678901234' },
  { name: 'Green Solutions SA', sector: 'Environnement', siret: '23456789012345' },
  { name: 'DataCenter Pro', sector: 'IT Services', siret: '34567890123456' },
  { name: 'EcoTech France', sector: 'Recyclage', siret: '45678901234567' },
  { name: 'Digital Systems', sector: 'Informatique', siret: '56789012345678' },
  { name: 'Smart Office', sector: 'Bureautique', siret: '67890123456789' },
  { name: 'Cloud Services', sector: 'Cloud Computing', siret: '78901234567890' },
  { name: 'Tech Innovation', sector: 'Innovation', siret: '89012345678901' },
  { name: 'Cyber Security Corp', sector: 'Sécurité', siret: '90123456789012' },
  { name: 'Network Solutions', sector: 'Réseaux', siret: '01234567890123' },
];

const sites = [
  'Siège Paris 15',
  'Entrepôt Lyon',
  'DC Marseille',
  'Bureau Bordeaux',
  'Site Lille',
  'Agence Toulouse',
  'Centre Nantes',
  'Bureaux Strasbourg',
  'Site Nice',
  'Agence Rennes',
];

const addresses = [
  '15 Avenue de la République, 75015 Paris',
  '234 Rue de Lyon, 69003 Lyon',
  '12 Boulevard de Marseille, 13001 Marseille',
  '89 Cours de l\'Intendance, 33000 Bordeaux',
  '45 Rue Nationale, 59000 Lille',
  '67 Allée Jean Jaurès, 31000 Toulouse',
  '23 Quai de la Fosse, 44000 Nantes',
  '90 Avenue des Vosges, 67000 Strasbourg',
  '34 Promenade des Anglais, 06000 Nice',
  '56 Rue de Rennes, 35000 Rennes',
];

const contacts = [
  { name: 'Pierre Durand', function: 'Responsable IT', phone: '+33 1 23 45 67 89', email: 'p.durand@' },
  { name: 'Marie Martin', function: 'Directrice Technique', phone: '+33 1 34 56 78 90', email: 'm.martin@' },
  { name: 'Jean Dubois', function: 'Chef de Projet', phone: '+33 1 45 67 89 01', email: 'j.dubois@' },
  { name: 'Sophie Bernard', function: 'Responsable Logistique', phone: '+33 1 56 78 90 12', email: 's.bernard@' },
  { name: 'Luc Petit', function: 'Directeur Informatique', phone: '+33 1 67 89 01 23', email: 'l.petit@' },
  { name: 'Anne Robert', function: 'Responsable Achats', phone: '+33 1 78 90 12 34', email: 'a.robert@' },
  { name: 'Thomas Richard', function: 'DSI', phone: '+33 1 89 01 23 45', email: 't.richard@' },
  { name: 'Julie Moreau', function: 'Responsable Infrastructure', phone: '+33 1 90 12 34 56', email: 'j.moreau@' },
  { name: 'François Simon', function: 'Chef de Service IT', phone: '+33 1 01 23 45 67', email: 'f.simon@' },
  { name: 'Catherine Laurent', function: 'Coordinatrice Technique', phone: '+33 1 12 34 56 78', email: 'c.laurent@' },
];

const descriptions = [
  'Enlèvement de matériel informatique en fin de vie : unités centrales, écrans LCD, et accessoires divers.',
  'Débarras complet d\'un datacenter : serveurs, baies de brassage, onduleurs et câblage.',
  'Collecte de matériel bureautique obsolète suite à un déménagement de locaux.',
  'Enlèvement d\'équipements réseau et télécoms en fin de contrat de location.',
  'Récupération de postes de travail et périphériques suite à un renouvellement de parc.',
  'Démantèlement partiel d\'infrastructure IT avec récupération de composants valorisables.',
  'Collecte d\'écrans et moniteurs suite à passage au télétravail.',
  'Enlèvement de serveurs et équipements de stockage après migration cloud.',
  'Récupération de matériel électronique suite à fermeture de site.',
  'Collecte de matériel IT suite à restructuration d\'entreprise.',
];

const categories = ['informatique', 'serveurs', 'ecrans', 'telecom', 'cables', 'mixte'];
const priorities = ['high', 'medium', 'low'];
const statuses = ['diagnostic_pending', 'quote_pending', 'quote_approved', 'in_collection', 'in_progress', 'completed'];

async function main() {
  console.log('🌱 Début du seed de la base de données...\n');

  // Nettoyer la base de données
  console.log('🧹 Nettoyage des données existantes...');
  await prisma.auditLog.deleteMany();
  await prisma.caseFileAssignment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.weighingRecord.deleteMany();
  await prisma.component.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.storageLocation.deleteMany();
  await prisma.transportOrder.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.caseFile.deleteMany();
  await prisma.pickupRequest.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.clientSite.deleteMany();
  await prisma.clientCompany.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Nettoyage terminé\n');

  // Créer les catégories et sous-catégories
  console.log('📂 Création des catégories et sous-catégories...');

  // Structure complète des catégories D3E
  const categoriesData = [
    {
      nom: 'Mobilier de bureau',
      description: 'Mobilier professionnel et équipements de bureau',
      icone: 'armchair',
      subCategories: [
        'Bureaux fixes', 'Bureaux réglables motorisés', 'Bureaux en L / angle', 'Bench multi-postes',
        'Convertisseurs sit-stand (plateau)', 'Tables de réunion', 'Tables hautes / mange-debout',
        'Tables pliantes / formation (roulantes)', 'Comptoirs d\'accueil / banques', 'Crédences / meubles bas',
        'Tables d\'appoint / coffee tables', 'Fauteuils de travail (ergonomiques)', 'Chaises visiteurs / réunion',
        'Tabourets hauts / assis-debout', 'Canapés / banquettes / ottomans', 'Caissons mobiles / fixes',
        'Armoires à portes battantes', 'Armoires à rideaux (tambour)', 'Classeurs latéraux / dossiers suspendus',
        'Rayonnages / étagères', 'Lockers / casiers standards', 'Lockers connectés (électroniques)',
        'Cloisons de séparation sur pied', 'Écrans de bureau / séparateurs', 'Panneaux acoustiques (muraux/suspendus)',
        'Cabines acoustiques (phone booths)', 'Blocs prises encastrés / top access', 'Colonnettes / boîtiers de sol',
        'Goulottes / chemins de câbles', 'Spines / descentes de câbles', 'Multiprises / parafoudre',
        'Chargeurs sans fil intégrés', 'Bras écrans', 'Supports UC / tiroirs clavier',
        'Stations d\'accueil intégrées (dock)', 'Porte-câbles / paniers sous bureau', 'Repose-pieds / accessoires ergonomiques',
        'Murs médias / meubles TV', 'Chariots écrans (motorisés ou non)', 'Pupitres / lutrins',
        'Tableaux blancs / whiteboards', 'Tableaux en verre / panneaux liège', 'Chariots de charge (PC/Chromebook)',
        'Imprimantes — dessertes / meubles', 'Trieurs / mobilier courrier', 'Portemanteaux / patères / parapluies',
        'Jardinières / bacs décoratifs'
      ]
    },
    {
      nom: 'Équipements informatiques et telecom',
      description: 'Matériel IT, réseau et télécommunications',
      icone: 'computer',
      subCategories: [
        'Unités centrales (desktop)', 'Stations de travail (workstations)', 'PC portables (laptops)',
        'Ultrabooks / 2-en-1', 'Chromebooks / thin clients', 'Tablettes', 'Écrans / moniteurs 22-24"',
        'Écrans / moniteurs 27-34"', 'Moniteurs spécialisés (gaming/graphisme)', 'Claviers / souris',
        'Webcams / micros', 'Casques audio / oreillettes', 'Stations d\'accueil (dock USB/Thunderbolt)',
        'Lecteurs cartes / smartcard', 'Imprimantes laser', 'Imprimantes jet d\'encre', 'Multifonctions (MFP)',
        'Traceurs / plotters', 'Scanners', 'Disques durs (HDD)', 'SSD / NVMe', 'Mémoire RAM',
        'Cartes graphiques (GPU)', 'Alimentations (PSU)', 'Cartes mères / CPU', 'Switches (L2/L3, PoE)',
        'Routeurs / pare-feu', 'Points d\'accès Wi-Fi', 'Contrôleurs Wi-Fi', 'Modems / ONT',
        'Téléphones IP / DECT', 'Serveurs rack', 'Serveurs tour / blade', 'Baies / racks 19"',
        'NAS / SAN / DAS', 'PDU / onduleurs (UPS)', 'KVM / consoles', 'Câbles réseau (cuivre)',
        'Câbles fibre optique', 'Câbles vidéo (HDMI/DP)', 'Adaptateurs / convertisseurs',
        'Sacs / housses / supports PC', 'Disques à détruire (effacement / broyage)', 'Badges / lecteurs d\'accès',
        'Cartes / modules IoT', 'Raspberry Pi / mini PC', 'Accessoires divers (dongles, hubs)'
      ]
    },
    {
      nom: 'Audiovisuel grand public',
      description: 'Équipements audiovisuels et multimédia',
      icone: 'tv',
      subCategories: [
        'Televiseurs / projecteurs', 'Consoles de jeux', 'Chaines hi-fi / amplis',
        'Lecteurs DVD / Blu-ray', 'Enceintes / casques'
      ]
    },
    {
      nom: 'Éclairage',
      description: 'Systèmes d\'éclairage et luminaires',
      icone: 'lightbulb',
      subCategories: [
        'Tubes fluorescents / neons', 'Lampes fluocompactes', 'Ampoules LED',
        'Luminaires', 'Ballasts / drivers'
      ]
    },
    {
      nom: 'Outils electriques / electroniques',
      description: 'Outillage électrique et électronique',
      icone: 'wrench',
      subCategories: [
        'Perceuses / visseuses', 'Scies / ponceuses / meuleuses', 'Outils de jardin motorises',
        'Compresseurs / nettoyeurs HP', 'Batteries d\'outillage'
      ]
    },
    {
      nom: 'Équipements medicaux',
      description: 'Matériel médical et de soins',
      icone: 'heart-pulse',
      subCategories: [
        'Imagerie / diagnostic (non implantables)', 'Appareils de soins',
        'Instruments de laboratoire', 'Lits medicalises electriques'
      ]
    },
    {
      nom: 'Surveillance / controle',
      description: 'Systèmes de surveillance et contrôle',
      icone: 'video',
      subCategories: [
        'Multimetres / oscilloscopes', 'Cameras de securite / capteurs IoT',
        'Alarmes / controle d\'acces', 'Thermostats / regulateurs'
      ]
    },
    {
      nom: 'Distributeurs / bornes',
      description: 'Bornes interactives et distributeurs automatiques',
      icone: 'square-terminal',
      subCategories: [
        'Distributeurs de boissons / snacks', 'Bornes de recharge / paiement', 'Kiosques interactifs'
      ]
    },
    {
      nom: 'Batteries et accumulateurs',
      description: 'Batteries et systèmes de stockage d\'énergie',
      icone: 'battery',
      subCategories: [
        'Plomb', 'NiCd / NiMH', 'Li-ion', 'Packs d\'alimentation (outils, PC, VAE)'
      ]
    },
    {
      nom: 'Categories complementaires',
      description: 'Équipements divers et spécialisés',
      icone: 'package',
      subCategories: [
        'Cablage et faisceaux', 'Cartes electroniques (PCB)', 'Equipements industriels / automates',
        'Photovoltaique (panneaux, onduleurs)', 'Mesure et controle environnemental'
      ]
    }
  ];

  // Créer toutes les catégories et leurs sous-catégories
  const categoryMap: Record<string, any> = {};
  const subCategoryMap: Record<string, any> = {};
  let totalSubCategories = 0;

  for (let i = 0; i < categoriesData.length; i++) {
    const catData = categoriesData[i];

    // Créer la catégorie
    const category = await prisma.category.create({
      data: {
        nom: catData.nom,
        description: catData.description,
        icone: catData.icone,
        ordre: i + 1,
      },
    });

    categoryMap[catData.nom] = category;

    // Créer toutes les sous-catégories de cette catégorie
    for (let j = 0; j < catData.subCategories.length; j++) {
      const subCatNom = catData.subCategories[j];
      const subCategory = await prisma.subCategory.create({
        data: {
          categoryId: category.id,
          nom: subCatNom,
          description: subCatNom,
          ordre: j + 1,
        },
      });

      // Stocker pour référence ultérieure
      subCategoryMap[subCatNom] = subCategory;
      totalSubCategories++;
    }
  }

  console.log(`✅ ${categoriesData.length} catégories et ${totalSubCategories} sous-catégories créées\n`);

  // Créer des références pratiques pour les équipements les plus courants
  const pcDesktop = subCategoryMap['Unités centrales (desktop)'];
  const pcPortable = subCategoryMap['PC portables (laptops)'];
  const ecran2224 = subCategoryMap['Écrans / moniteurs 22-24"'];
  const ecran2734 = subCategoryMap['Écrans / moniteurs 27-34"'];
  const serveurRack = subCategoryMap['Serveurs rack'];
  const serveurTour = subCategoryMap['Serveurs tour / blade'];
  const switchReseau = subCategoryMap['Switches (L2/L3, PoE)'];
  const cablesReseau = subCategoryMap['Câbles réseau (cuivre)'];
  const claviersSouris = subCategoryMap['Claviers / souris'];
  const imprimantesLaser = subCategoryMap['Imprimantes laser'];

  // Définir la période (juin à aujourd'hui)
  const startDate = new Date('2024-06-01');
  const endDate = new Date();

  // Créer les utilisateurs de l'équipe
  console.log('👥 Création des utilisateurs...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        nom: 'Jean Dupont',
        email: 'j.dupont@valotik.fr',
        role: 'admin',
        actif: true,
      },
    }),
    prisma.user.create({
      data: {
        nom: 'Marie Laurent',
        email: 'm.laurent@valotik.fr',
        role: 'planificateur',
        actif: true,
      },
    }),
    prisma.user.create({
      data: {
        nom: 'Pierre Martin',
        email: 'p.martin@valotik.fr',
        role: 'technicien',
        actif: true,
      },
    }),
    prisma.user.create({
      data: {
        nom: 'Sophie Bernard',
        email: 's.bernard@valotik.fr',
        role: 'logisticien',
        actif: true,
      },
    }),
    prisma.user.create({
      data: {
        nom: 'Thomas Petit',
        email: 't.petit@valotik.fr',
        role: 'technicien',
        actif: true,
      },
    }),
    prisma.user.create({
      data: {
        nom: 'Claire Dubois',
        email: 'c.dubois@valotik.fr',
        role: 'logisticien',
        actif: true,
      },
    }),
  ]);
  console.log(`✅ ${users.length} utilisateurs créés\n`);

  // Créer 20 dossiers
  for (let i = 0; i < 20; i++) {
    const companyIndex = i % companies.length;
    const company = companies[companyIndex];
    const site = sites[i % sites.length];
    const address = addresses[i % addresses.length];
    const contact = contacts[i % contacts.length];
    const description = descriptions[i % descriptions.length];

    // Date de création aléatoire entre juin et aujourd'hui
    const createdDate = randomDate(startDate, endDate);

    console.log(`📦 Création du dossier ${i + 1}/20 - ${company.name}...`);

    // 1. Créer le client (avec SIRET unique pour éviter les conflits)
    const uniqueSiret = String(Number(company.siret) + i).padStart(14, '0');

    const client = await prisma.clientCompany.create({
      data: {
        raisonSociale: `${company.name} ${i > 9 ? `(Groupe ${i - 9})` : ''}`.trim(),
        siret: uniqueSiret,
        adresseFacturation: address,
        secteur: company.sector,
        createdAt: createdDate,
        updatedAt: createdDate,
      },
    });

    // 2. Créer le site
    const clientSite = await prisma.clientSite.create({
      data: {
        clientId: client.id,
        nom: site,
        adresseComplete: address,
        latitude: 48.8566 + (Math.random() - 0.5) * 2,
        longitude: 2.3522 + (Math.random() - 0.5) * 2,
        typeSite: i % 2 === 0 ? 'bureau' : 'entrepot',
        createdAt: createdDate,
        updatedAt: createdDate,
      },
    });

    // 3. Créer le contact
    const clientContact = await prisma.contact.create({
      data: {
        clientId: client.id,
        nom: contact.name,
        fonction: contact.function,
        telephone: contact.phone,
        email: contact.email + company.name.toLowerCase().replace(/\s+/g, '') + '.fr',
        createdAt: createdDate,
        updatedAt: createdDate,
      },
    });

    // 4. Créer la demande d'enlèvement
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const visitDate = addDays(createdDate, Math.floor(Math.random() * 30) + 5);

    const valeurEstimee = Math.floor(Math.random() * 20000) + 5000; // Entre 5000€ et 25000€
    const valeurRevente = Math.floor(valeurEstimee * (0.5 + Math.random() * 0.4)); // Entre 50% et 90% de la valeur estimée

    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        clientId: client.id,
        siteId: clientSite.id,
        contactId: clientContact.id,
        descriptionInitiale: description,
        categoriePrincipale: category,
        volumeEstime: `${Math.floor(Math.random() * 10) + 1} palettes`,
        valeurEstimee,
        valeurRevente,
        priorite: priority,
        statut: status,
        plannedVisitAt: visitDate,
        accessNotes: 'Accès par quai de chargement, badge nécessaire',
        createdAt: createdDate,
        updatedAt: createdDate,
      },
    });

    // 5. Créer le dossier (CaseFile)
    const reference = `CF-2024-${String(i + 1).padStart(3, '0')}`;
    const poidsEstime = Math.floor(Math.random() * 5000) + 500;
    const poidsReel = status === 'completed' || status === 'in_progress'
      ? poidsEstime + Math.floor((Math.random() - 0.5) * 500)
      : null;
    const valeurTotale = Math.floor(Math.random() * 50000) + 5000;

    const caseFile = await prisma.caseFile.create({
      data: {
        requestId: pickupRequest.id,
        clientId: client.id,
        reference,
        statut: status,
        poidsEstime,
        poidsReel,
        valeurTotale,
        createdAt: createdDate,
        closedAt: status === 'completed' ? addDays(createdDate, Math.floor(Math.random() * 60) + 30) : null,
        updatedAt: createdDate,
      },
    });

    // 6. Si le statut est avancé, créer un diagnostic
    if (['quote_pending', 'quote_approved', 'in_collection', 'in_progress', 'completed'].includes(status)) {
      const diagnosisDate = addDays(createdDate, Math.floor(Math.random() * 10) + 3);

      await prisma.diagnosis.create({
        data: {
          caseFileId: caseFile.id,
          dateVisite: diagnosisDate,
          notes: 'Site facilement accessible. Matériel bien organisé. Aucun risque sécurité identifié.',
          dureeVisite: Math.floor(Math.random() * 180) + 60, // 60 à 240 minutes
          createdAt: diagnosisDate,
          updatedAt: diagnosisDate,
        },
      });

      // Créer 2-4 lots pour ce dossier
      const numLots = Math.floor(Math.random() * 3) + 2;
      const lotCategories = ['Unités centrales', 'Écrans LCD', 'Serveurs', 'Câbles et accessoires'];
      const grades = ['A', 'B', 'C', 'D'];
      const orientations = ['resale', 'refurbishment', 'dismantling', 'waste'];

      for (let j = 0; j < numLots; j++) {
        const lotCode = `LOT-${String(i + 1).padStart(3, '0')}-${String(j + 1).padStart(2, '0')}`;
        const lotCategory = lotCategories[j % lotCategories.length];
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const orientation = orientations[Math.floor(Math.random() * orientations.length)];
        const lotPoidsEstime = Math.floor(Math.random() * 500) + 100;

        const lot = await prisma.lot.create({
          data: {
            caseFileId: caseFile.id,
            code: lotCode,
            categorieId: `CAT-${j + 1}`,
            categorieName: lotCategory,
            grade,
            orientation,
            poidsEstime: lotPoidsEstime,
            poidsReel: status === 'in_progress' || status === 'completed'
              ? lotPoidsEstime + Math.floor((Math.random() - 0.5) * 50)
              : null,
            statut: status === 'completed' ? 'in_stock' : 'pending',
            qrCode: `QR-${lotCode}`,
            createdAt: diagnosisDate,
            updatedAt: diagnosisDate,
          },
        });

        // Créer des matériels (équipements complets) regroupés par quantité
        const equipmentByCategory: Record<string, Array<{ name: string; weight: [number, number]; value: [number, number]; subCategoryId: string }>> = {
          'Unités centrales': [
            { name: 'PC Dell OptiPlex 7090', weight: [8, 12], value: [150, 400], subCategoryId: pcDesktop.id },
            { name: 'PC HP EliteDesk 800 G8', weight: [8, 12], value: [150, 400], subCategoryId: pcDesktop.id },
            { name: 'PC Lenovo ThinkCentre M90', weight: [7, 11], value: [120, 350], subCategoryId: pcDesktop.id },
            { name: 'Lenovo ThinkPad T14', weight: [1.5, 2.5], value: [200, 600], subCategoryId: pcPortable.id },
            { name: 'HP EliteBook 840 G8', weight: [1.3, 2.2], value: [250, 700], subCategoryId: pcPortable.id },
            { name: 'Dell Latitude 5420', weight: [1.4, 2.3], value: [180, 550], subCategoryId: pcPortable.id },
          ],
          'Écrans LCD': [
            { name: 'Écran Dell UltraSharp 24"', weight: [4, 6], value: [80, 200], subCategoryId: ecran2224.id },
            { name: 'Écran HP EliteDisplay 27"', weight: [5, 7], value: [100, 250], subCategoryId: ecran2734.id },
            { name: 'Écran Samsung 22" S22F350', weight: [3, 5], value: [50, 150], subCategoryId: ecran2224.id },
            { name: 'Écran LG 24" Full HD', weight: [3, 5], value: [60, 180], subCategoryId: ecran2224.id },
            { name: 'Écran ASUS 27" ProArt', weight: [5, 8], value: [150, 350], subCategoryId: ecran2734.id },
            { name: 'Écran BenQ 22" GW2270', weight: [3, 4], value: [40, 120], subCategoryId: ecran2224.id },
          ],
          'Serveurs': [
            { name: 'Serveur Dell PowerEdge R740', weight: [25, 35], value: [800, 2000], subCategoryId: serveurRack.id },
            { name: 'Serveur HP ProLiant DL380 Gen10', weight: [20, 30], value: [700, 1800], subCategoryId: serveurRack.id },
            { name: 'Serveur Lenovo ThinkSystem SR650', weight: [22, 32], value: [750, 1900], subCategoryId: serveurRack.id },
            { name: 'Serveur Dell PowerEdge T440', weight: [18, 28], value: [600, 1500], subCategoryId: serveurTour.id },
            { name: 'Switch Cisco 48 ports', weight: [4, 8], value: [200, 800], subCategoryId: switchReseau.id },
          ],
          'Câbles et accessoires': [
            { name: 'Câble HDMI', weight: [0.05, 0.15], value: [0.5, 2], subCategoryId: subCategoryMap['Câbles vidéo (HDMI/DP)'].id },
            { name: 'Câble réseau RJ45', weight: [0.05, 0.1], value: [0.5, 1.5], subCategoryId: cablesReseau.id },
            { name: 'Câble alimentation', weight: [0.15, 0.3], value: [0.4, 1.2], subCategoryId: subCategoryMap['Alimentations (PSU)'].id },
            { name: 'Hub USB 4 ports', weight: [0.2, 0.5], value: [5, 15], subCategoryId: subCategoryMap['Accessoires divers (dongles, hubs)'].id },
            { name: 'Multiprise parasurtenseur', weight: [0.5, 1], value: [10, 30], subCategoryId: subCategoryMap['Multiprises / parafoudre'].id },
            { name: 'Clavier USB', weight: [0.3, 0.8], value: [3, 12], subCategoryId: claviersSouris.id },
            { name: 'Souris optique', weight: [0.1, 0.3], value: [2, 8], subCategoryId: claviersSouris.id },
          ],
        };

        const equipmentList = equipmentByCategory[lotCategory] || [
          { name: 'Équipement divers', weight: [1, 5] as [number, number], value: [10, 50] as [number, number], subCategoryId: subCategoryMap['Accessoires divers (dongles, hubs)'].id }
        ];

        // Créer 3-6 lignes d'équipement groupées par quantité
        const numEquipmentLines = Math.floor(Math.random() * 4) + 3; // 3 à 6 lignes

        for (let k = 0; k < numEquipmentLines; k++) {
          const componentGrade = grades[Math.floor(Math.random() * grades.length)];
          const equipment = equipmentList[k % equipmentList.length];

          // Quantité par ligne: 1 à 15 unités (plus petit pour équipements chers, plus grand pour accessoires)
          const maxQty = equipment.value[1] > 500 ? 5 : (equipment.value[1] > 100 ? 10 : 20);
          const quantite = Math.floor(Math.random() * maxQty) + 1;

          // Calculer le poids et la valeur UNITAIRE en fonction du grade
          const baseWeight = equipment.weight[0] + Math.random() * (equipment.weight[1] - equipment.weight[0]);
          const baseValue = equipment.value[0] + Math.random() * (equipment.value[1] - equipment.value[0]);

          // Réduire la valeur selon le grade
          const gradeMultiplier = componentGrade === 'A' ? 1
                                 : componentGrade === 'B' ? 0.6
                                 : componentGrade === 'C' ? 0.3
                                 : 0.1;

          const finalValueUnitaire = baseValue * gradeMultiplier;

          await prisma.component.create({
            data: {
              lotId: lot.id,
              subCategoryId: equipment.subCategoryId,
              nom: equipment.name,
              quantite: quantite,
              grade: componentGrade,
              poidsUnitaire: Math.round(baseWeight * 100) / 100,
              valeurUnitaire: Math.round(finalValueUnitaire * 100) / 100,
              qrCode: `QR-${lotCode}-L${String(k + 1).padStart(3, '0')}`,
              statut: status === 'completed' ? 'graded' : 'extracted',
              createdAt: diagnosisDate,
              updatedAt: diagnosisDate,
            },
          });
        }
      }
    }

    // 7. Si devis approuvé ou plus, créer un devis
    if (['quote_approved', 'in_collection', 'in_progress', 'completed'].includes(status)) {
      const quotationDate = addDays(createdDate, Math.floor(Math.random() * 15) + 5);

      const montantHT = Math.floor(Math.random() * 3000) + 500;
      const montantTVA = montantHT * 0.2;
      const montantTTC = montantHT + montantTVA;

      const quotation = await prisma.quotation.create({
        data: {
          caseFileId: caseFile.id,
          version: 1,
          statut: status === 'quote_approved' || status === 'in_collection' || status === 'in_progress' || status === 'completed' ? 'approved' : 'sent',
          montantHT,
          montantTVA,
          montantTTC,
          validiteAt: addDays(quotationDate, 30),
          createdAt: quotationDate,
          updatedAt: quotationDate,
        },
      });

      // Créer 3-5 lignes de devis
      const numLines = Math.floor(Math.random() * 3) + 3;
      const lineTypes = ['service', 'material', 'package'];
      const lineDescriptions = [
        'Transport - Forfait enlèvement',
        'Manutention',
        'Diagnostic et inventaire sur site',
        'Palettes EUR - Location',
        'Traitement et recyclage',
      ];

      for (let j = 0; j < numLines; j++) {
        await prisma.quotationLine.create({
          data: {
            quotationId: quotation.id,
            typeLigne: lineTypes[j % lineTypes.length],
            description: lineDescriptions[j % lineDescriptions.length],
            unite: j % 2 === 0 ? 'forfait' : 'unité',
            quantite: Math.floor(Math.random() * 5) + 1,
            prixUnitaire: Math.floor(Math.random() * 500) + 50,
            tauxTVA: 20,
            ordreAffichage: j + 1,
          },
        });
      }
    }

    // 8. Créer des documents pour certains dossiers
    const sampleDocs = [
      { type: 'devis', name: 'sample-devis.pdf', size: 492 },
      { type: 'bon_pesée', name: 'sample-bon-pesee.pdf', size: 502 },
      { type: 'certificat', name: 'sample-certificat.pdf', size: 522 },
    ];

    const numDocuments = Math.floor(Math.random() * 2) + 2; // 2 à 3 documents
    for (let j = 0; j < numDocuments; j++) {
      const doc = sampleDocs[j % sampleDocs.length];

      await prisma.document.create({
        data: {
          caseFileId: caseFile.id,
          type: doc.type,
          nomFichier: doc.name,
          url: `/uploads/documents/${doc.name}`,
          taille: doc.size,
          auteurId: users[Math.floor(Math.random() * users.length)].id,
          createdAt: addDays(createdDate, Math.floor(Math.random() * 15) + 1),
        },
      });
    }

    // 9. Assigner 2-4 utilisateurs aléatoires à ce dossier
    const numAssignments = Math.floor(Math.random() * 3) + 2; // 2 à 4 utilisateurs
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const assignedUsers = shuffledUsers.slice(0, numAssignments);

    for (const user of assignedUsers) {
      await prisma.caseFileAssignment.create({
        data: {
          caseFileId: caseFile.id,
          userId: user.id,
          createdAt: createdDate,
        },
      });
    }

    // 10. Log d'audit
    await prisma.auditLog.create({
      data: {
        entite: 'PickupRequest',
        entiteId: pickupRequest.id,
        action: 'CREATE',
        payload: JSON.stringify({
          clientName: company.name,
          reference,
          status,
        }),
        horodatage: createdDate,
      },
    });

    console.log(`✅ Dossier ${reference} créé avec succès (${status})\n`);
  }

  console.log('🎉 Seed terminé avec succès!');
  console.log(`📊 20 dossiers créés avec des dates de juin 2024 à aujourd'hui`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
