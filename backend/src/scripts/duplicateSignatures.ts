import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://valotik:Valotik2026!@34.78.178.75/valotik"
    }
  }
});

async function duplicateSignatures() {
  // Trouver les pointages du 4 février avec signature après-midi mais pas de vraie signature matin
  const pointages = await prisma.pointageJournalier.findMany({
    where: {
      date: new Date('2026-02-04')
    },
    include: {
      pointageMensuel: {
        include: {
          employee: { select: { nom: true, prenom: true } }
        }
      }
    }
  });

  console.log(`${pointages.length} pointages trouvés pour le 04/02/2026\n`);

  let copies = 0;

  for (const p of pointages) {
    const emp = p.pointageMensuel.employee;
    const hasRealSignatureMatin = p.signatureMatin?.startsWith('data:image');
    const hasRealSignatureApresmidi = p.signatureApresmidi?.startsWith('data:image');

    console.log(`${emp.prenom} ${emp.nom}:`);
    console.log(`  Matin: ${hasRealSignatureMatin ? 'IMAGE ✓' : (p.signatureMatin || 'NULL')}`);
    console.log(`  Après-midi: ${hasRealSignatureApresmidi ? 'IMAGE ✓' : (p.signatureApresmidi || 'NULL')}`);

    // Si pas de vraie signature matin mais une vraie signature après-midi, copier
    if (!hasRealSignatureMatin && hasRealSignatureApresmidi) {
      await prisma.pointageJournalier.update({
        where: { id: p.id },
        data: {
          signatureMatin: p.signatureApresmidi,
          signatureMatinAt: p.signatureApresmidiAt || new Date()
        }
      });
      console.log(`  → Signature PM copiée vers Matin ✓`);
      copies++;
    }
    console.log('');
  }

  console.log(`\n✅ ${copies} signatures copiées !`);
}

duplicateSignatures()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
