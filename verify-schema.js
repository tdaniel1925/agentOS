/**
 * Verify Database Schema
 * Checks that all tables were created successfully
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySchema() {
  console.log('🔍 Verifying database schema...\n');

  const expectedTables = [
    'reps',
    'subscribers',
    'feature_flags',
    'control_states',
    'commands_log',
    'unknown_requests',
    'call_summaries',
    'campaigns',
    'campaign_emails',
    'cost_events',
    'apex_commissions',
    'upgrade_events',
    'weekly_scorecards',
    'task_performance',
    'subscriber_apps',
  ];

  let allGood = true;

  for (const table of expectedTables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ ${table}: exists (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allGood = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('✅ All 15 tables created successfully!');
    console.log('✅ Database schema is ready!');
  } else {
    console.log('⚠️  Some tables are missing or have errors');
  }
}

verifySchema().catch(console.error);
