/**
 * Generate SQL INSERT statements from exported JSON data
 * 
 * Usage:
 * 1. First run: npx tsx scripts/migrate-data.ts export
 * 2. Then run: npx tsx scripts/generate-sql.ts
 * 3. Copy the output SQL to new Supabase project
 */

import * as fs from 'fs';
import * as path from 'path';

const EXPORT_DIR = path.join(__dirname, '../migration-data');
const OUTPUT_FILE = path.join(__dirname, '../migration-data/MIGRATION_DATA.sql');

// Escape string for SQL
function escapeSql(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Get column names from first row
function getColumns(data: any[]): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]);
}

// Generate INSERT statement for a table
function generateInsert(table: string, data: any[]): string {
  if (data.length === 0) return '';
  
  const columns = getColumns(data);
  const lines: string[] = [];
  
  lines.push(`-- ${table} (${data.length} rows)`);
  lines.push(`INSERT INTO public.${table} (${columns.join(', ')}) VALUES`);
  
  const values = data.map(row => {
    const vals = columns.map(col => escapeSql(row[col]));
    return `  (${vals.join(', ')})`;
  });
  
  lines.push(values.join(',\n'));
  lines.push('ON CONFLICT (id) DO NOTHING;');
  lines.push('');
  
  return lines.join('\n');
}

// Main
function generate() {
  console.log('🔨 Generating SQL migration file...\n');
  
  if (!fs.existsSync(EXPORT_DIR)) {
    console.error('❌ No migration-data directory found. Run export first.');
    process.exit(1);
  }
  
  const manifest = JSON.parse(
    fs.readFileSync(path.join(EXPORT_DIR, 'manifest.json'), 'utf-8')
  );
  
  const sqlParts: string[] = [
    '-- =============================================',
    '-- LAWAPP DATA MIGRATION',
    '-- Generated from Supabase export',
    '-- Run this AFTER the schema is created',
    '-- =============================================',
    '',
    '-- Disable triggers during import',
    'SET session_replication_role = \'replica\';',
    '',
  ];
  
  let totalRows = 0;
  
  for (const [table, count] of Object.entries(manifest)) {
    const filePath = path.join(EXPORT_DIR, `${table}.json`);
    if (!fs.existsSync(filePath)) continue;
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const sql = generateInsert(table, data);
    
    if (sql) {
      sqlParts.push(sql);
      totalRows += count as number;
    }
  }
  
  sqlParts.push('');
  sqlParts.push('-- Re-enable triggers');
  sqlParts.push('SET session_replication_role = \'origin\';');
  sqlParts.push('');
  sqlParts.push(`-- Total: ${totalRows} rows migrated`);
  
  const fullSql = sqlParts.join('\n');
  fs.writeFileSync(OUTPUT_FILE, fullSql);
  
  console.log('✅ SQL file generated!');
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log(`📊 Total: ${totalRows} rows`);
  console.log(`📏 Size: ${(fullSql.length / 1024).toFixed(1)} KB`);
  console.log('\n📋 Next steps:');
  console.log('   1. Open new Supabase project');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Run COMPLETE_SCHEMA.sql first');
  console.log('   4. Then run MIGRATION_DATA.sql');
}

generate();
