require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'products' });
  console.log("RPC Error (if any):", error);
  console.log("Data:", data);
  
  // Alternative: just select 1 row to see all columns
  const { data: rows, error: err } = await supabase.from('products').select('*').limit(1);
  console.log("Row:", rows);
}
check();
