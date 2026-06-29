import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function GET() {
  try {
    // We make a lightweight query to Supabase. 
    // It doesn't matter if this table exists or not; 
    // the goal is just to hit the Supabase API to keep the project active.
    const { error } = await supabase.from('keep_alive').select('*').limit(1);
    
    // Even if it returns an error (like table not found), the API request was made!
    return NextResponse.json({ 
      status: 'success', 
      message: 'Supabase pinged successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error("Keep-alive error:", error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to ping Supabase' 
    }, { status: 500 });
  }
}
