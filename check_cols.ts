import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://zlhygscjdtkjybzuiijc.supabase.co", "sb_publishable_ta6hxUqkalqiuANk737nSg_MWfYGB6q");
async function check() {
    const { data } = await supabase.from('vnpt_assignments').select('*').limit(1);
    console.log("Cols:", Object.keys(data?.[0] || {}));
}
check();
