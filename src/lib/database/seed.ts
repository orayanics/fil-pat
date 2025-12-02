import { prisma } from './client';
import { hashPassword } from '../auth/auth';

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('📦 Seeding for Electron-ready deployment...');

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

  console.log('✅ Created admin user:', admin.username, '(Password: admin123)');

  // Create test clinician account for fresh installations
  const clinicianPassword = await hashPassword('clinician123');
  
  const testClinician = await prisma.clinician.upsert({
    where: { username: 'clinician' },
    update: {},
    create: {
      username: 'clinician',
      email: 'clinician@filpat.local',
      password_hash: clinicianPassword,
      first_name: 'Test',
      last_name: 'Clinician',
      middle_name: 'Demo',
      is_admin: false,
      specialization: 'Speech-Language Pathology',
      mobile: '+63 917 123 4567',
      address: 'UST College of Rehabilitation Sciences',
    }
  });

  console.log('✅ Created test clinician:', testClinician.username, '(Password: clinician123)');
  console.log('   Use these accounts for testing and initial setup');
  console.log('');
  console.log('💡 Note: To add assessment templates, run:');
  console.log('   npx tsx scripts/seedTemplates.ts [clinician_id]');
  console.log('   Example: npx tsx scripts/seedTemplates.ts 1');
  console.log('');

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
  console.log('');
  console.log('🎉 Database seed completed!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Seeded Data Summary:');
  console.log('   • 2 Clinician accounts (admin + test clinician)');
  console.log('   • 8 App settings');
  console.log('');
  console.log('🔐 Test Accounts:');
  console.log('   Admin     → Username: admin      | Password: admin123');
  console.log('   Clinician → Username: clinician  | Password: clinician123');
  console.log('');
  console.log('📝 To create assessment templates for a clinician:');
  console.log('   npx tsx scripts/seedTemplates.ts [clinician_id]');
  console.log('   Example: npx tsx scripts/seedTemplates.ts 1');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✨ Ready for Electron deployment!');
}

// Export for use as a module (production Electron)
export default main;

// Run directly if executed as a script
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}