import { prisma } from './client';
import { hashPassword } from '../auth/auth';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = await hashPassword('admin123'); 
  
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
  // Fix: Use findFirst + create pattern instead of upsert with non-unique field
  let defaultTemplate = await prisma.assessmentTemplate.findFirst({
    where: { name: 'Standard Filipino Phoneme Assessment' }
  });

  if (!defaultTemplate) {
    defaultTemplate = await prisma.assessmentTemplate.create({
      data: {
        name: 'Standard Filipino Phoneme Assessment',
        description: 'Default comprehensive assessment template with all phoneme groups',
        is_default: true,
        is_for_kids: false,
        created_by: admin.clinician_id,
      }
    });
  }

  let kidsTemplate = await prisma.assessmentTemplate.findFirst({
    where: { name: 'Kids Filipino Phoneme Assessment' }
  });

  if (!kidsTemplate) {
    kidsTemplate = await prisma.assessmentTemplate.create({
      data: {
        name: 'Kids Filipino Phoneme Assessment',
        description: 'Child-friendly version with colorful UI and simplified instructions',
        is_default: false,
        is_for_kids: true,
        created_by: admin.clinician_id,
      }
    });
  }

  console.log('✅ Created assessment templates');

  // Seed session items from existing data (sample - add more from your data.ts)
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
      expected_response: "mata",
      difficulty_level: "Easy",
      max_score: 1.0
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
      expected_response: "inom",
      difficulty_level: "Easy",
      max_score: 1.0
    },
    {
      item_number: 3,
      question: "Ginagamit natin ito panghawak",
      sound: "SIWW /m/",
      ipa_key: "/ka.maj/",
      consonant_group: "m",
      consonants_count: 2,
      vowels_count: 2,
      expected_response: "kamay",
      difficulty_level: "Easy",
      max_score: 1.0
    },
    {
      item_number: 4,
      question: "Ito ay isang insekto na may walong paa at gumagawa ng web",
      sound: "SFWW /m/",
      ipa_key: "/ga.gam.ba/",
      consonant_group: "m",
      consonants_count: 4,
      vowels_count: 3,
      expected_response: "gagamba",
      difficulty_level: "Medium",
      max_score: 1.0
    },
    {
      item_number: 5,
      question: "Ito ay bilog na tumatalbog",
      sound: "SIWI /b/",
      ipa_key: "/bɔ.la/",
      consonant_group: "b",
      consonants_count: 2,
      vowels_count: 2,
      expected_response: "bola",
      difficulty_level: "Easy",
      max_score: 1.0
    }
  ];

  // Check if items already exist before creating
  const existingItemsCount = await prisma.sessionItem.count({
    where: { template_id: defaultTemplate.template_id }
  });

  if (existingItemsCount === 0) {
    for (const itemData of sessionItemsData) {
      await prisma.sessionItem.create({
        data: {
          ...itemData,
          template_id: defaultTemplate.template_id,
          display_order: itemData.item_number
        }
      });
    }
    console.log(`✅ Seeded ${sessionItemsData.length} session items`);
  } else {
    console.log(`ℹ️  Session items already exist (${existingItemsCount} items), skipping...`);
  }

  // Create app settings
  const settings = [
    { key: 'app_name', value: 'Fil-PAT', type: 'string', category: 'general', display_name: 'Application Name' },
    { key: 'websocket_port', value: '8080', type: 'integer', category: 'network', display_name: 'WebSocket Port' },
    { key: 'max_session_duration', value: '120', type: 'integer', category: 'session', display_name: 'Max Session Duration' },
    { key: 'kids_mode_enabled', value: 'true', type: 'boolean', category: 'ui', display_name: 'Kids Mode Enabled' },
    { key: 'audio_recording_enabled', value: 'true', type: 'boolean', category: 'session', display_name: 'Audio Recording' },
    { key: 'show_progress_bar', value: 'true', type: 'boolean', category: 'ui', display_name: 'Show Progress Bar' },
    { key: 'allow_session_pause', value: 'true', type: 'boolean', category: 'session', display_name: 'Allow Session Pause' },
    { key: 'auto_save_interval', value: '30', type: 'integer', category: 'session', display_name: 'Auto-save Interval (seconds)' }
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
        display_name: setting.display_name,
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