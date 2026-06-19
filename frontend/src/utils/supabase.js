import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bptqfddxplfbymgdateh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_2FRROfxOkTFPp1-0fkXZrg_Qqy4gd9X';

export const supabase = createClient(supabaseUrl, supabaseKey);
