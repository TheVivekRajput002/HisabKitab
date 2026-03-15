require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // using anon to see publicly accessible RPCs or just forcing error to see where we stand

async function check() {
  const { data, error } = await supabase.from('companies').select('*').limit(1);
  console.log("Basic check:", { data, error });
}
check();
