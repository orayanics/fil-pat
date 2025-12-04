import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTemplates() {
  console.log('🧹 Cleaning up duplicate items in templates 9 and 10...\n');
  
  // Get templates 9 and 10
  const templates = await prisma.assessmentTemplate.findMany({
    where: {
      template_id: { in: [9, 10] }
    }
  });

  for (const template of templates) {
    console.log(`Processing Template ID ${template.template_id}: ${template.name}`);
    
    // Get all items for this template
    const items = await prisma.sessionItem.findMany({
      where: { template_id: template.template_id },
      orderBy: [{ item_number: 'asc' }, { item_id: 'asc' }]
    });

    console.log(`  Found ${items.length} items`);

    // Group by item_number to find duplicates
    const itemsByNumber = new Map();
    items.forEach(item => {
      if (!itemsByNumber.has(item.item_number)) {
        itemsByNumber.set(item.item_number, []);
      }
      itemsByNumber.get(item.item_number).push(item);
    });

    // Find and remove duplicates (keep first occurrence)
    let deletedCount = 0;
    for (const [itemNum, itemList] of itemsByNumber.entries()) {
      if (itemList.length > 1) {
        console.log(`  Found ${itemList.length} duplicates for item ${itemNum}`);
        // Keep the first one, delete the rest
        for (let i = 1; i < itemList.length; i++) {
          await prisma.sessionItem.delete({
            where: { item_id: itemList[i].item_id }
          });
          deletedCount++;
        }
      }
    }

    console.log(`  ✅ Deleted ${deletedCount} duplicate items`);
    
    // Verify final count
    const finalCount = await prisma.sessionItem.count({
      where: { template_id: template.template_id }
    });
    console.log(`  Final item count: ${finalCount}\n`);
  }

  console.log('✅ Cleanup complete!');
  await prisma.$disconnect();
}

cleanupTemplates().catch(console.error);
