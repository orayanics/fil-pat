/**
 * Script to delete assessment templates
 * 
 * Usage:
 *   npx tsx scripts/deleteTemplates.ts <template_id1> <template_id2> ...
 *   npx tsx scripts/deleteTemplates.ts 9 10
 *   npx tsx scripts/deleteTemplates.ts --all-by-name "Template Name"
 * 
 * Examples:
 *   npx tsx scripts/deleteTemplates.ts 9 10
 *   npx tsx scripts/deleteTemplates.ts --all-by-name "Complete Filipino Phonological Assessment (77 Items)"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTemplates() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: No template IDs or options provided');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/deleteTemplates.ts <template_id1> <template_id2> ...');
    console.log('  npx tsx scripts/deleteTemplates.ts --all-by-name "Template Name"');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/deleteTemplates.ts 9 10');
    console.log('  npx tsx scripts/deleteTemplates.ts --all-by-name "Complete Filipino Phonological Assessment (77 Items)"');
    process.exit(1);
  }

  let templateIds: number[] = [];

  // Check if deleting by name
  if (args[0] === '--all-by-name' && args[1]) {
    const templateName = args[1];
    console.log(`🔍 Finding all templates with name: "${templateName}"\n`);
    
    const templates = await prisma.assessmentTemplate.findMany({
      where: { name: templateName },
      select: { template_id: true, name: true, created_by: true }
    });

    if (templates.length === 0) {
      console.log(`❌ No templates found with name: "${templateName}"`);
      process.exit(0);
    }

    templateIds = templates.map(t => t.template_id);
    console.log(`Found ${templates.length} template(s):`);
    templates.forEach(t => console.log(`  - ID ${t.template_id} (created by clinician ${t.created_by})`));
    console.log('');
  } else {
    // Parse template IDs from arguments
    templateIds = args.map(arg => parseInt(arg)).filter(id => !isNaN(id));

    if (templateIds.length === 0) {
      console.error('❌ Error: No valid template IDs provided');
      process.exit(1);
    }
  }

  console.log(`🗑️  Deleting ${templateIds.length} template(s)...\n`);

  for (const templateId of templateIds) {
    try {
      // Check if template exists
      const template = await prisma.assessmentTemplate.findUnique({
        where: { template_id: templateId },
        include: {
          _count: {
            select: {
              session_items: true,
              sessions: true
            }
          }
        }
      });

      if (!template) {
        console.log(`⚠️  Template ${templateId} not found, skipping...`);
        continue;
      }

      console.log(`📋 Template ${templateId}: "${template.name}"`);
      console.log(`   - Session items: ${template._count.session_items}`);
      console.log(`   - Used in sessions: ${template._count.sessions}`);

      if (template._count.sessions > 0) {
        console.log(`   ⚠️  Warning: This template is used in ${template._count.sessions} session(s)`);
        console.log(`   ⚠️  Deleting will fail due to foreign key constraints`);
        console.log(`   💡 Tip: Update or delete those sessions first\n`);
        continue;
      }

      // Delete items first (foreign key constraint)
      const deletedItems = await prisma.sessionItem.deleteMany({
        where: { template_id: templateId }
      });
      console.log(`   ✅ Deleted ${deletedItems.count} session item(s)`);

      // Delete template
      await prisma.assessmentTemplate.delete({
        where: { template_id: templateId }
      });
      console.log(`   ✅ Deleted template ${templateId}\n`);

    } catch (error) {
      console.error(`   ❌ Error deleting template ${templateId}:`, error);
      if (error instanceof Error) {
        console.error(`   ${error.message}\n`);
      }
    }
  }

  console.log('✅ Template deletion complete!');
  
  await prisma.$disconnect();
}

deleteTemplates().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
