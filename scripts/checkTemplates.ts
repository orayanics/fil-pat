import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplates() {
  console.log('Checking templates in database...\n');
  
  const templates = await prisma.assessmentTemplate.findMany({
    select: {
      template_id: true,
      name: true,
    }
  });

  for (const template of templates) {
    const items = await prisma.sessionItem.findMany({
      where: { template_id: template.template_id },
      orderBy: { item_number: 'asc' }
    });

    console.log(`Template ID ${template.template_id}: ${template.name}`);
    console.log(`  Total items: ${items.length}`);
    
    if (items.length > 0) {
      console.log(`  Item numbers: ${items[0].item_number} to ${items[items.length - 1].item_number}`);
      
      // Check for duplicates
      const itemNumbers = items.map(i => i.item_number);
      const duplicates = itemNumbers.filter((item, index) => itemNumbers.indexOf(item) !== index);
      if (duplicates.length > 0) {
        console.log(`  ⚠️  DUPLICATES FOUND: ${[...new Set(duplicates)].join(', ')}`);
      }
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkTemplates().catch(console.error);
