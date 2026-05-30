import { supabase } from './src/services/dataService.js';
supabase.from('vnpt_assignments').select('*').limit(2).then(console.log);
