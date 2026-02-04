import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://valotik:Valotik2026!@34.78.178.75/valotik"
    }
  }
});

async function resetMorningSignatures() {
  // Les 7 employés dont on a supprimé la signature dupliquée
  const employeesAReset = [
    'BOURET',
    'MOHEBI',
    'HADOUIRI',
    'LEDUC',
    'JARDOT',
    'MORTELETTE',
    'LAMNAOUAR'
  ];

  const pointages = await prisma.pointageJournalier.findMany({
    where: {
      date: new Date('2026-02-04'),
      pointageMensuel: {
        employee: {
          nom: { in: employeesAReset }
        }
      }
    },
    include: {
      pointageMensuel: {
        include: {
          employee: { select: { nom: true, prenom: true } }
        }
      }
    }
  });

  console.log(`${pointages.length} pointages à réinitialiser pour le 04/02/2026\n`);

  for (const p of pointages) {
    const emp = p.pointageMensuel.employee;

    console.log(`${emp.prenom} ${emp.nom}:`);
    console.log(`  Avant: heuresMatin=${p.heuresMatin}, signatureMatin=${p.signatureMatin ? 'OUI' : 'non'}`);

    // Remettre à zéro le matin pour permettre de re-signer
    await prisma.pointageJournalier.update({
      where: { id: p.id },
      data: {
        heuresMatin: 0,
        signatureMatin: null,
        signatureMatinAt: null,
        // Recalculer le total (garder uniquement les heures de l'après-midi)
        heuresTravaillees: p.heuresApresmidi
      }
    });

    console.log(`  Après: heuresMatin=0, signatureMatin=non, total=${p.heuresApresmidi}h`);
    console.log(`  → Prêt à re-signer le matin ✓\n`);

    // Recalculer le total mensuel
    const journees = await prisma.pointageJournalier.findMany({
      where: { pointageMensuelId: p.pointageMensuelId }
    });

    const totalHeures = journees.reduce((sum, j) => {
      if (j.id === p.id) {
        return sum + p.heuresApresmidi; // Utiliser les nouvelles heures pour ce pointage
      }
      return sum + j.heuresTravaillees;
    }, 0);

    await prisma.pointageMensuel.update({
      where: { id: p.pointageMensuelId },
      data: {
        heuresPointees: totalHeures,
        pourcentage: Math.round((totalHeures / p.pointageMensuel.heuresContrat) * 100)
      }
    });
  }

  console.log(`✅ ${pointages.length} pointages réinitialisés - les employés peuvent re-signer le matin !`);
}

resetMorningSignatures()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
