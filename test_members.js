require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // Since RLS is off on members we can test this

async function check() {
  const { data: members, error } = await supabase.from('company_members').select('*');
  console.log("Members:", { members, error });
  
  const { data: companies, err } = await supabase.from('companies').select('*');
  console.log("Companies:", { companies, err }); 
}
check();
