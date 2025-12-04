import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAndReseed() {
  console.log('🗑️  Deleting templates 9 and 10 and their items...\n');
  
  // Delete items first (foreign key constraint)
  const deletedItems9 = await prisma.sessionItem.deleteMany({
    where: { template_id: 9 }
  });
  console.log(`  Deleted ${deletedItems9.count} items from template 9`);
  
  const deletedItems10 = await prisma.sessionItem.deleteMany({
    where: { template_id: 10 }
  });
  console.log(`  Deleted ${deletedItems10.count} items from template 10`);
  
  // Delete templates
  await prisma.assessmentTemplate.delete({
    where: { template_id: 9 }
  });
  console.log('  Deleted template 9');
  
  await prisma.assessmentTemplate.delete({
    where: { template_id: 10 }
  });
  console.log('  Deleted template 10');
  
  console.log('\n✅ Cleanup complete! Now run: npx ts-node scripts/seedTemplates.ts');
  
  await prisma.$disconnect();
}

deleteAndReseed().catch(console.error);
