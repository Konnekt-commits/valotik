import { PrismaClient } from '@prisma/client';
import { PDFParse } from 'pdf-parse';
import { execSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';

const prisma = new PrismaClient();

function extractCongesFromPDF(text: string): { congesN1Solde: number | null; congesNSolde: number | null } {
  try {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let netPayeLineIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (/Net payé\s*:\s*[\d., ]+euros/i.test(lines[i])) {
        netPayeLineIdx = i;
        break;
      }
    }

    if (netPayeLineIdx === -1) return { congesN1Solde: null, congesNSolde: null };

    // Collecter TOUS les nombres avant "Net payé : X euros"
    const congesValues: number[] = [];
    for (let i = netPayeLineIdx - 1; i >= 0; i--) {
      const line = lines[i];
      const num = line.match(/^([\d ]+[.,][\d]+)$/);
      const numInt = line.match(/^([\d]+)$/);
      if (num) {
        congesValues.unshift(parseFloat(num[1].replace(/\s/g, '').replace(',', '.')));
      } else if (numInt) {
        congesValues.unshift(parseFloat(numInt[1]));
      } else if (line && !/^[\d.,\s-]+$/.test(line)) {
        break;
      }
    }

    // La dernière valeur = Solde, l'avant-dernière = Pris
    if (congesValues.length >= 1) {
      const solde = congesValues[congesValues.length - 1];
      const pris = congesValues.length >= 2 ? congesValues[congesValues.length - 2] : null;
      return { congesN1Solde: solde, congesNSolde: pris };
    }

    return { congesN1Solde: null, congesNSolde: null };
  } catch (e) {
    console.error('Erreur extraction congés PDF:', e);
    return { congesN1Solde: null, congesNSolde: null };
  }
}

async function main() {
  console.log('=== Recalcul des congés payés depuis les PDF ===\n');

  const employees = await prisma.insertionEmployee.findMany({
    select: {
      id: true,
      nom: true,
      prenom: true,
      fichesPaie: {
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        take: 1,
        select: {
          id: true,
          mois: true,
          annee: true,
          url: true,
          nomFichier: true
        }
      }
    }
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const emp of employees) {
    const fiche = emp.fichesPaie[0];
    if (!fiche || !fiche.url || !fiche.url.startsWith('gs://')) {
      console.log(`⏭  ${emp.prenom} ${emp.nom} - Pas de fiche de paie`);
      skipped++;
      continue;
    }

    try {
      console.log(`📄 ${emp.prenom} ${emp.nom} - ${fiche.nomFichier} (${fiche.mois}/${fiche.annee})`);

      // Télécharger via gsutil (auth locale)
      const tmpPath = `/tmp/recalcul_${fiche.id}.pdf`;
      execSync(`gsutil cp "${fiche.url}" "${tmpPath}" 2>/dev/null`);

      const pdfBuffer = readFileSync(tmpPath);
      const uint8 = new Uint8Array(pdfBuffer);
      const parser = new PDFParse(uint8);
      await parser.load();
      const result = await parser.getText();
      const text = typeof result === 'string' ? result : (result as any)?.text || (result as any)?.pages?.[0]?.text || '';
      parser.destroy();

      // Cleanup
      try { unlinkSync(tmpPath); } catch {}

      const conges = extractCongesFromPDF(text);

      await prisma.fichePaie.update({
        where: { id: fiche.id },
        data: {
          congesN1Solde: conges.congesN1Solde,
          congesNSolde: conges.congesNSolde
        }
      });

      console.log(`   ✅ N-1=${conges.congesN1Solde}, N=${conges.congesNSolde}`);
      updated++;
    } catch (e: any) {
      console.log(`   ❌ Erreur: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n=== Résultat ===`);
  console.log(`✅ Mis à jour: ${updated}`);
  console.log(`⏭  Ignorés: ${skipped}`);
  console.log(`❌ Erreurs: ${errors}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
