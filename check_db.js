import { createClient } from '@supabase/supabase-js';

// Use the new credentials
const supabaseUrl = 'https://bflgnuljbahhcfaynjac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbGdudWxqYmFoaGNmYXluamFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NjUxNjksImV4cCI6MjA4NjQ0MTE2OX0.1UgvnGMJpqAvpDeXarg7Kcbmy7HYwCDgcyxlwTufI5Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking database connection and profiles table...');

  // 1. Check if profiles table exists by selecting 1 record
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
      console.error('❌ FAIL: The "profiles" table DOES NOT EXIST.');
      console.error('   You must run the SQL migration provided in supabase/migrations/20260212000000_fix_profiles_rls.sql');
    } else {
      console.error('❌ FAIL: Error accessing "profiles" table:', error.message);
      console.error('   If this is a "permission denied" or "RLS" error, ensure RLS is disabled as per the migration.');
    }
  } else {
    console.log('✅ SUCCESS: The "profiles" table exists and is accessible.');
    
    // Check RLS by trying to insert a dummy record? No, that would require a user.
    // But since we selected successfully (even if empty array), it means RLS allows SELECT (or is disabled).
    // If RLS was enabled and no policy allowed SELECT for anon, we would get an empty array? No, RLS filters rows.
    // If table has RLS enabled but no policy, `select` returns empty array (implicitly denies).
    // If RLS disabled, `select` works (returns all rows).
    
    // Since we can't easily distinguish empty table from RLS blocking, we just report success on access.
    console.log('   Table access confirmed.');
  }
}

checkDatabase();
