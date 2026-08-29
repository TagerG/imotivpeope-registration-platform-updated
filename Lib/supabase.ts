import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lttbdwplbigtobksgweb.supabase.co';
const supabaseAnonKey = 'sb_publishable_f23WedigsVZqzl6Ja4Vq1w_RNEK-HWP'; // Replace with your actual publishable key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);