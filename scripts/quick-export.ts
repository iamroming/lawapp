/**
 * Quick Export Script for Supabase Data
 * 
 * Run this to export all data from your Supabase project.
 * 
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=your-service-role-key npx tsx scripts/quick-export.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLES = [
  'profiles', 'clients', 'cases', 'hearings', 'documents',
  'time_entries', 'invoices', 'payments', 'notes', 'tags',
  'case_tags', 'reminders', 'audit_logs', 'activity_logs',
  'subscription_plans', 'user_subscriptions', 'super_admins',
  'platform_settings', 'notifications', 'notification_preferences',
  'messages', 'client_portal_users', 'tasks', 'timesheets',
  'active_timers', 'team_invites', 'expenses', 'coupon_codes',
  'coupon_uses', 'client_tags', 'client_tag_assignments',
  'client_feedback', 'client_communications', 'branches',
  'employee_branches', 'blog_posts', 'ai_usage', 'invoice_templates',
  'intake_forms', 'intake_submissions', 'consultation_slots',
  'consultations', 'collection_logs', 'deadline_reminders',
  'referrals', 'cron_jobs', 'analytics_events'
];

async function main() {
  console.log('🚀 Starting quick export...\n');
  
  const exportDir = path.join(__dirname, '../migration-data');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  const manifest: Record<string, number> = {};
  
  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) {
        if (error.message.includes('does not exist')) {
          // Table doesn't exist, skip
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
        continue;
      }
      
      if (data && data.length > 0) {
        fs.writeFileSync(
          path.join(exportDir, `${table}.json`),
          JSON.stringify(data, null, 2)
        );
        manifest[table] = data.length;
        console.log(`✅ ${table}: ${data.length} rows`);
      }
    } catch (err) {
      // Skip
    }
  }
  
  fs.writeFileSync(
    path.join(exportDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n📊 Export complete!');
  console.log(`📁 Saved to: ${exportDir}`);
}

main().catch(console.error);
