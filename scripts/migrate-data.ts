/**
 * Supabase Data Migration Script
 * 
 * This script exports all data from your current Supabase project
 * and can be used to import into a new project.
 * 
 * Usage:
 * 1. Set environment variables for SOURCE project
 * 2. Run: npx tsx scripts/migrate-data.ts export
 * 3. Set environment variables for TARGET project
 * 4. Run: npx tsx scripts/migrate-data.ts import
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SOURCE_URL = process.env.SOURCE_SUPABASE_URL || '';
const SOURCE_KEY = process.env.SOURCE_SUPABASE_SERVICE_KEY || '';
const TARGET_URL = process.env.TARGET_SUPABASE_URL || '';
const TARGET_KEY = process.env.TARGET_SUPABASE_SERVICE_KEY || '';

// Tables to migrate (in order due to foreign keys)
const TABLES = [
  // Core tables
  'profiles',
  'clients',
  'cases',
  'hearings',
  'documents',
  'time_entries',
  'invoices',
  'payments',
  'notes',
  'tags',
  'case_tags',
  'reminders',
  'audit_logs',
  'activity_logs',
  
  // Subscription tables
  'subscription_plans',
  'user_subscriptions',
  
  // Platform tables
  'super_admins',
  'platform_settings',
  'notifications',
  'notification_preferences',
  
  // Client portal
  'messages',
  'client_portal_users',
  
  // Task management
  'tasks',
  'timesheets',
  'active_timers',
  
  // Team management
  'team_invites',
  
  // Salary & payments
  'role_salary_defaults',
  'salary_settings',
  'salary_payments',
  'case_team',
  'case_earnings',
  'firm_profit_sharing',
  
  // Firm management
  'firm_roles',
  'firm_members',
  'permissions',
  'role_permissions',
  
  // Billing
  'quotations',
  'expenses',
  'coupon_codes',
  'coupon_uses',
  
  // Court integration
  'ecourts_cases',
  'cause_list_entries',
  'ecourts_orders',
  'ecourts_sync_log',
  'whatsapp_logs',
  'scheduled_reminders',
  'trust_accounts',
  'trust_transactions',
  'tds_records',
  
  // Client management
  'client_tags',
  'client_tag_assignments',
  'client_feedback',
  'client_communications',
  
  // Case management
  'case_law_results',
  'case_alerts',
  'case_alert_history',
  
  // Calendar
  'calendar_rules',
  'calendar_events',
  
  // Branches
  'branches',
  'employee_branches',
  
  // Blog
  'blog_posts',
  
  // AI
  'ai_usage',
  
  // Invoice templates
  'invoice_counters',
  'invoice_templates',
  
  // Intake forms
  'intake_forms',
  'intake_submissions',
  
  // Consultations
  'consultation_slots',
  'consultations',
  
  // Collections
  'collection_logs',
  
  // Deadlines
  'deadline_reminders',
  
  // Court integration
  'court_case_links',
  'court_orders',
  'court_cause_lists',
  
  // Rate limiting
  'rate_limits',
  
  // Notifications
  'notification_logs',
  
  // Referrals
  'referrals',
  
  // Cron jobs
  'cron_jobs',
  
  // Analytics
  'analytics_events',
];

// Export data from source
async function exportData() {
  console.log('🚀 Starting data export...\n');
  
  const supabase = createClient(SOURCE_URL, SOURCE_KEY);
  const exportDir = path.join(__dirname, '../migration-data');
  
  // Create export directory
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  const manifest: Record<string, number> = {};
  
  for (const table of TABLES) {
    try {
      console.log(`📤 Exporting: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`   ⚠️  Skipped (table may not exist): ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        const filePath = path.join(exportDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        manifest[table] = data.length;
        console.log(`   ✅ ${data.length} rows exported`);
      } else {
        console.log(`   ℹ️  Empty table`);
      }
    } catch (err) {
      console.log(`   ⚠️  Error: ${err}`);
    }
  }
  
  // Save manifest
  fs.writeFileSync(
    path.join(exportDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n✅ Export complete!');
  console.log(`📁 Data saved to: ${exportDir}`);
  console.log('\n📊 Summary:');
  let totalRows = 0;
  for (const [table, count] of Object.entries(manifest)) {
    console.log(`   ${table}: ${count} rows`);
    totalRows += count;
  }
  console.log(`   TOTAL: ${totalRows} rows`);
}

// Import data to target
async function importData() {
  console.log('🚀 Starting data import...\n');
  
  const supabase = createClient(TARGET_URL, TARGET_KEY);
  const importDir = path.join(__dirname, '../migration-data');
  
  // Check if export exists
  if (!fs.existsSync(path.join(importDir, 'manifest.json'))) {
    console.error('❌ No export found. Run export first.');
    process.exit(1);
  }
  
  const manifest = JSON.parse(
    fs.readFileSync(path.join(importDir, 'manifest.json'), 'utf-8')
  );
  
  // Import in order (respect foreign keys)
  const importOrder = TABLES.filter(table => manifest[table]);
  
  let totalImported = 0;
  let totalErrors = 0;
  
  for (const table of importOrder) {
    try {
      console.log(`📥 Importing: ${table}`);
      
      const filePath = path.join(importDir, `${table}.json`);
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found, skipping`);
        continue;
      }
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (data.length === 0) {
        console.log(`   ℹ️  No data to import`);
        continue;
      }
      
      // Import in batches of 100
      const batchSize = 100;
      let imported = 0;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(table)
          .upsert(batch, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.log(`   ⚠️  Batch error: ${error.message}`);
          totalErrors++;
        } else {
          imported += batch.length;
        }
      }
      
      totalImported += imported;
      console.log(`   ✅ ${imported}/${data.length} rows imported`);
      
    } catch (err) {
      console.log(`   ❌ Error: ${err}`);
      totalErrors++;
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log(`📊 Summary:`);
  console.log(`   Total imported: ${totalImported} rows`);
  console.log(`   Errors: ${totalErrors}`);
}

// Main
const command = process.argv[2];

if (command === 'export') {
  exportData().catch(console.error);
} else if (command === 'import') {
  importData().catch(console.error);
} else {
  console.log(`
📊 Supabase Data Migration Tool

Usage:
  npx tsx scripts/migrate-data.ts export   # Export from source
  npx tsx scripts/migrate-data.ts import   # Import to target

Environment Variables:
  SOURCE_SUPABASE_URL        - Source project URL
  SOURCE_SUPABASE_SERVICE_KEY - Source service role key
  TARGET_SUPABASE_URL        - Target project URL
  TARGET_SUPABASE_SERVICE_KEY - Target service role key

Example:
  # Export
  SOURCE_SUPABASE_URL=https://xxx.supabase.co SOURCE_SUPABASE_SERVICE_KEY=xxx npx tsx scripts/migrate-data.ts export

  # Import
  TARGET_SUPABASE_URL=https://yyy.supabase.co TARGET_SUPABASE_SERVICE_KEY=yyy npx tsx scripts/migrate-data.ts import
  `);
}
