import { prisma } from './client';
import { hashPassword } from '../auth/auth';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = await hashPassword('admin123'); // Change this in production
  
  const admin = await prisma.clinician.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@filpat.local',
      password_hash: adminPassword,
      first_name: 'System',
      last_name: 'Administrator',
      is_admin: true,
      specialization: 'System Administration',
    }
  });

  console.log('✅ Created admin user:', admin.username);

  // Create default assessment templates
  const defaultTemplate = await prisma.assessmentTemplate.upsert({
    where: { name: 'Standard Filipino Phoneme Assessment' },
    update: {},
    create: {
      name: 'Standard Filipino Phoneme Assessment',
      description: 'Default comprehensive assessment template with all phoneme groups',
      is_default: true,
      is_for_kids: false,
      created_by: admin.clinician_id,
    }
  });

  const kidsTemplate = await prisma.assessmentTemplate.upsert({
    where: { name: 'Kids Filipino Phoneme Assessment' },
    update: {},
    create: {
      name: 'Kids Filipino Phoneme Assessment',
      description: 'Child-friendly version with colorful UI and simplified instructions',
      is_default: false,
      is_for_kids: true,
      created_by: admin.clinician_id,
    }
  });

  console.log('✅ Created assessment templates');

  // Seed session items from existing data
  const sessionItemsData = [
    {
      item_number: 1,
      question: "Ito ang ginagamit natin para makakita",
      sound: "SIWI /m/",
      ipa_key: "/ma.ta/",
      consonant_group: "m",
      consonants_count: 2,
      vowels_count: 2,
      image_url: "https://i.pinimg.com/736x/00/0c/56/000c56b811f1dcd108c9280a80adbf97.jpg",
      expected_response: "mata"
    },
    {
      item_number: 2,
      question: "Ano ginagawa ng bata?",
      sound: "SFWF /m/",
      ipa_key: "/ʔi.nɔm/",
      consonant_group: "m",
      consonants_count: 3,
      vowels_count: 2,
      image_url: "https://i.pinimg.com/736x/e9/a1/4c/e9a14c4c6100e4c1aa467b74f67cb57e.jpg",
      expected_response: "inom"
    }
    // Add more items here from your existing data...
  ];

  for (const itemData of sessionItemsData) {
    await prisma.sessionItem.upsert({
      where: { 
        template_id_item_number: {
          template_id: defaultTemplate.template_id,
          item_number: itemData.item_number
        }
      },
      update: {},
      create: {
        ...itemData,
        template_id: defaultTemplate.template_id,
        display_order: itemData.item_number
      }
    });
  }

  console.log('✅ Seeded session items');

  // Create app settings
  const settings = [
    { key: 'app_name', value: 'Fil-PAT', type: 'string', category: 'general' },
    { key: 'websocket_port', value: '8080', type: 'integer', category: 'network' },
    { key: 'max_session_duration', value: '120', type: 'integer', category: 'session' },
    { key: 'kids_mode_enabled', value: 'true', type: 'boolean', category: 'ui' },
    { key: 'audio_recording_enabled', value: 'true', type: 'boolean', category: 'session' },
  ];

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { setting_key: setting.key },
      update: {},
      create: {
        setting_key: setting.key,
        setting_value: setting.value,
        setting_type: setting.type,
        category: setting.category,
        is_user_configurable: true,
        updated_by: admin.clinician_id
      }
    });
  }

  console.log('✅ Created app settings');
  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });