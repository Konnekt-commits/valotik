import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://valotik:Valotik2026!@34.78.178.75/valotik"
    }
  }
});

async function undoDuplicateSignatures() {
  // Trouver les pointages du 4 février où signatureMatin = signatureApresmidi (dupliquées)
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

  let annulations = 0;

  for (const p of pointages) {
    const emp = p.pointageMensuel.employee;
    const hasRealSignatureMatin = p.signatureMatin?.startsWith('data:image');
    const hasRealSignatureApresmidi = p.signatureApresmidi?.startsWith('data:image');

    // Si les deux signatures sont identiques et sont des images, c'est une duplication
    if (hasRealSignatureMatin && hasRealSignatureApresmidi && p.signatureMatin === p.signatureApresmidi) {
      console.log(`${emp.prenom} ${emp.nom}: Signature matin dupliquée détectée`);

      // Supprimer la signature matin (qui était copiée de l'après-midi)
      await prisma.pointageJournalier.update({
        where: { id: p.id },
        data: {
          signatureMatin: null,
          signatureMatinAt: null
        }
      });

      console.log(`  → Signature matin supprimée ✓\n`);
      annulations++;
    } else {
      console.log(`${emp.prenom} ${emp.nom}: Pas de duplication (matin=${hasRealSignatureMatin ? 'OUI' : 'non'}, pm=${hasRealSignatureApresmidi ? 'OUI' : 'non'})`);
    }
  }

  console.log(`\n✅ ${annulations} signatures dupliquées annulées !`);
}

undoDuplicateSignatures()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
