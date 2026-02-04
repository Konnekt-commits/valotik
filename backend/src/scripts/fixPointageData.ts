import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script pour corriger les données de pointage existantes
 *
 * Problème: Les anciens pointages ont heuresMatin=0, heuresApresmidi=0
 * mais heuresTravaillees a une valeur calculée avec l'ancienne logique.
 *
 * Solution: Pour les pointages sans signature, recalculer heuresMatin et heuresApresmidi
 * à partir de heuresTravaillees.
 */
async function fixPointageData() {
  console.log('🔧 Correction des données de pointage...\n');

  // Récupérer tous les pointages journaliers sans signatures
  const pointages = await prisma.pointageJournalier.findMany({
    where: {
      signatureMatin: null,
      signatureApresmidi: null,
      heuresTravaillees: { gt: 0 }
    }
  });

  console.log(`📊 ${pointages.length} pointages à vérifier\n`);

  let corriges = 0;

  for (const p of pointages) {
    // Si heuresMatin et heuresApresmidi sont à 0 mais heuresTravaillees > 0
    // alors recalculer la répartition
    if (p.heuresMatin === 0 && p.heuresApresmidi === 0 && p.heuresTravaillees > 0) {
      const heuresMatin = Math.min(p.heuresTravaillees, 4);
      const heuresApresmidi = Math.max(0, p.heuresTravaillees - 4);

      await prisma.pointageJournalier.update({
        where: { id: p.id },
        data: {
          heuresMatin,
          heuresApresmidi
        }
      });

      console.log(`✅ Pointage ${p.id} corrigé: ${p.heuresTravaillees}h → matin: ${heuresMatin}h, apresmidi: ${heuresApresmidi}h`);
      corriges++;
    }
  }

  console.log(`\n✨ ${corriges} pointages corrigés sur ${pointages.length} vérifiés`);

  // Afficher les pointages avec signatures pour vérification
  const pointagesAvecSignature = await prisma.pointageJournalier.findMany({
    where: {
      OR: [
        { signatureMatin: { not: null } },
        { signatureApresmidi: { not: null } }
      ]
    },
    include: {
      pointageMensuel: {
        include: {
          employee: {
            select: { nom: true, prenom: true }
          }
        }
      }
    }
  });

  if (pointagesAvecSignature.length > 0) {
    console.log('\n📝 Pointages avec signatures existantes:');
    for (const p of pointagesAvecSignature) {
      const emp = p.pointageMensuel.employee;
      const date = new Date(p.date).toLocaleDateString('fr-FR');
      console.log(`  - ${emp.prenom} ${emp.nom} le ${date}: matin=${p.heuresMatin}h ${p.signatureMatin ? '✓' : ''}, apresmidi=${p.heuresApresmidi}h ${p.signatureApresmidi ? '✓' : ''}`);
    }
  }
}

fixPointageData()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
