import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://valotik:Valotik2026!@34.78.178.75/valotik"
    }
  }
});

async function removeAmandine() {
  const emp = await prisma.insertionEmployee.findFirst({
    where: { nom: 'GUILBERT', prenom: 'Amandine' }
  });

  if (!emp) {
    console.log('Amandine GUILBERT non trouvée');
    return;
  }

  console.log('Employée trouvée:', emp.prenom, emp.nom, '(ID:', emp.id, ')');

  // Supprimer les données liées
  await prisma.suiviEntretien.deleteMany({ where: { employeeId: emp.id } });
  console.log('Suivis supprimés');

  await prisma.insertionDocument.deleteMany({ where: { employeeId: emp.id } });
  console.log('Documents supprimés');

  await prisma.contratInsertion.deleteMany({ where: { employeeId: emp.id } });
  console.log('Contrats supprimés');

  await prisma.conventionPMSMP.deleteMany({ where: { employeeId: emp.id } });
  console.log('Conventions PMSMP supprimées');

  await prisma.formation.deleteMany({ where: { employeeId: emp.id } });
  console.log('Formations supprimées');

  await prisma.avertissement.deleteMany({ where: { employeeId: emp.id } });
  console.log('Avertissements supprimés');

  await prisma.fichePro.deleteMany({ where: { employeeId: emp.id } });
  console.log('Fiche pro supprimée');

  await prisma.objectifIndividuel.deleteMany({ where: { employeeId: emp.id } });
  console.log('Objectifs individuels supprimés');

  // Supprimer les pointages
  const pointagesMensuels = await prisma.pointageMensuel.findMany({
    where: { employeeId: emp.id }
  });

  for (const pm of pointagesMensuels) {
    await prisma.pointageJournalier.deleteMany({ where: { pointageMensuelId: pm.id } });
  }
  await prisma.pointageMensuel.deleteMany({ where: { employeeId: emp.id } });
  console.log('Pointages supprimés');

  // Supprimer l'employée
  await prisma.insertionEmployee.delete({ where: { id: emp.id } });
  console.log('\n✅ Amandine GUILBERT supprimée de la base insertion');
}

removeAmandine()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
