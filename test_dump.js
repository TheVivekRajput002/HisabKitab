require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_constraint', { constraint_name: 'company_members_company_id_user_id_key' });
  console.log("RPC:", data, error);
  
  // Since we disabled RLS on company_members let's just fetch all of them to see if there is a weird state
  const { data: members, err } = await supabase.from('company_members').select('*');
  console.log("All Members Dump:", members);
  if(err) console.log("Member err:", err);

  const { data: companies, err2 } = await supabase.from('companies').select('*');
  console.log("Companies:", companies);
}
check();
