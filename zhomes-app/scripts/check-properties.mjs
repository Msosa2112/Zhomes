import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://elhqcwpqbnxafaepmswl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHFjd3BxYm54YWZhZXBtc3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjUxMzMsImV4cCI6MjA0Mjk0MTEzM30.yT5F14NA892OvOH8zethl3Vjqjn80jJ0sQ_FaD20RA4'
);

async function check() {
  const { data, error, count } = await supabase.from('mls_properties').select('*', { count: 'exact', head: true });
  console.log('Properties table count:', count);
  console.log('Error:', error);
}

check();
