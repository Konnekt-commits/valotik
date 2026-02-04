import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  // Trouver le pointage de Franck BOURET pour le 4 février 2026
  const pointage = await prisma.pointageJournalier.findFirst({
    where: {
      date: new Date('2026-02-04'),
      pointageMensuel: {
        employee: {
          nom: 'BOURET',
          prenom: 'Franck'
        }
      }
    },
    include: {
      pointageMensuel: {
        include: {
          employee: true
        }
      }
    }
  });

  if (!pointage) {
    console.log('Pointage non trouvé pour Franck BOURET le 04/02/2026');
    return;
  }

  console.log('Pointage actuel:');
  console.log(`  heuresMatin: ${pointage.heuresMatin}`);
  console.log(`  heuresApresmidi: ${pointage.heuresApresmidi}`);
  console.log(`  heuresTravaillees: ${pointage.heuresTravaillees}`);
  console.log(`  signatureMatin: ${pointage.signatureMatin ? 'OUI' : 'NON'}`);

  // Corriger : 3h matin signé, 0h après-midi (pas encore signé)
  const updated = await prisma.pointageJournalier.update({
    where: { id: pointage.id },
    data: {
      heuresMatin: 3,
      heuresApresmidi: 0,
      heuresTravaillees: 3,
      // Marquer comme signé matin (on met un placeholder pour la signature)
      signatureMatin: 'SIGNATURE_MATIN_MANUELLE',
      signatureMatinAt: new Date()
    }
  });

  console.log('\nPointage corrigé:');
  console.log(`  heuresMatin: ${updated.heuresMatin}`);
  console.log(`  heuresApresmidi: ${updated.heuresApresmidi}`);
  console.log(`  heuresTravaillees: ${updated.heuresTravaillees}`);
  console.log(`  signatureMatin: OUI`);

  // Recalculer le total mensuel
  const journees = await prisma.pointageJournalier.findMany({
    where: { pointageMensuelId: pointage.pointageMensuelId }
  });

  const totalHeures = journees.reduce((sum, j) => sum + j.heuresTravaillees, 0);

  await prisma.pointageMensuel.update({
    where: { id: pointage.pointageMensuelId },
    data: {
      heuresPointees: totalHeures,
      pourcentage: Math.round((totalHeures / pointage.pointageMensuel.heuresContrat) * 100)
    }
  });

  console.log(`\nTotal mensuel recalculé: ${totalHeures}h`);
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
