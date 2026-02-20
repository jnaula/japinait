import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bflgnuljbahhcfaynjac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbGdudWxqYmFoaGNmYXluamFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NjUxNjksImV4cCI6MjA4NjQ0MTE2OX0.1UgvnGMJpqAvpDeXarg7Kcbmy7HYwCDgcyxlwTufI5Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunction() {
  console.log('Invoking auto-confirm-user...');

  const { data, error } = await supabase.functions.invoke('auto-confirm-user', {
    body: { userId: 'dummy-id' }
  });

  if (error) {
    console.log('Function invocation error:', error);
  } else {
    console.log('Function invocation success:', data);
  }
}

checkFunction();
