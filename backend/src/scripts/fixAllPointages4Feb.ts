import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  // Trouver tous les pointages du 4 février 2026 avec 7.5h
  const pointages = await prisma.pointageJournalier.findMany({
    where: {
      date: new Date('2026-02-04'),
      heuresTravaillees: 7.5
    },
    include: {
      pointageMensuel: {
        include: {
          employee: true
        }
      }
    }
  });

  console.log(`${pointages.length} pointages à corriger pour le 04/02/2026\n`);

  for (const p of pointages) {
    const emp = p.pointageMensuel.employee;
    console.log(`Correction ${emp.prenom} ${emp.nom}:`);
    console.log(`  Avant: matin=${p.heuresMatin}h, pm=${p.heuresApresmidi}h, total=${p.heuresTravaillees}h`);

    // Corriger : 3h matin signé, 0h après-midi (pas encore signé)
    await prisma.pointageJournalier.update({
      where: { id: p.id },
      data: {
        heuresMatin: 3,
        heuresApresmidi: 0,
        heuresTravaillees: 3,
        signatureMatin: 'SIGNATURE_MATIN_VALIDEE',
        signatureMatinAt: new Date()
      }
    });

    console.log(`  Après: matin=3h (SIGNÉ), pm=0h, total=3h\n`);

    // Recalculer le total mensuel
    const journees = await prisma.pointageJournalier.findMany({
      where: { pointageMensuelId: p.pointageMensuelId }
    });

    const totalHeures = journees.reduce((sum, j) => sum + (j.id === p.id ? 3 : j.heuresTravaillees), 0);

    await prisma.pointageMensuel.update({
      where: { id: p.pointageMensuelId },
      data: {
        heuresPointees: totalHeures,
        pourcentage: Math.round((totalHeures / p.pointageMensuel.heuresContrat) * 100)
      }
    });
  }

  console.log(`\n✅ ${pointages.length} pointages corrigés !`);
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
