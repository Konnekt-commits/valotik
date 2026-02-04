import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const pointages = await prisma.pointageJournalier.findMany({
    include: {
      pointageMensuel: {
        include: {
          employee: {
            select: { nom: true, prenom: true }
          }
        }
      }
    },
    orderBy: { date: 'desc' },
    take: 30
  });

  console.log('30 derniers pointages:');
  pointages.forEach(p => {
    const emp = p.pointageMensuel.employee;
    const date = new Date(p.date).toLocaleDateString('fr-FR');
    const hasSigMatin = p.signatureMatin ? 'OUI' : 'non';
    const hasSigPM = p.signatureApresmidi ? 'OUI' : 'non';
    console.log(`${date} - ${emp.prenom} ${emp.nom}: matin=${p.heuresMatin}h, pm=${p.heuresApresmidi}h, total=${p.heuresTravaillees}h | sigMatin=${hasSigMatin}, sigPM=${hasSigPM}`);
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
