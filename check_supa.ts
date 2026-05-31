import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://zlhygscjdtkjybzuiijc.supabase.co";
const SUPABASE_KEY = "sb_publishable_ta6hxUqkalqiuANk737nSg_MWfYGB6q";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: d1 } = await supabase.from('vnpt_assignments').select('*').limit(2);
    console.log("Assignments:", d1?.length);
    if (d1 && d1.length > 0) {
       console.log("Deleting id:", d1[0].id);
       const { error } = await supabase.from('vnpt_assignments').delete().eq('id', d1[0].id);
       console.log("Delete error:", error);
       const { data: d2 } = await supabase.from('vnpt_assignments').select('*').eq('id', d1[0].id);
       console.log("Still exists?", d2?.length);
    }
}
check();
