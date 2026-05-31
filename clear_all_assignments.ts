import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://zlhygscjdtkjybzuiijc.supabase.co";
const SUPABASE_KEY = "sb_publishable_ta6hxUqkalqiuANk737nSg_MWfYGB6q";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clean() {
    console.log("Xóa dữ liệu assign...");
    let { error: err1 } = await supabase.from('vnpt_assignments').delete().neq('id', 'dummy'); 
    console.log("vnpt_assignments res:", err1?.message || "Success");
}
clean();
