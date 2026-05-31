import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zlhygscjdtkjybzuiijc.supabase.co";
const SUPABASE_KEY = "sb_publishable_ta6hxUqkalqiuANk737nSg_MWfYGB6q";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanOldData() {
    console.log("Xóa dữ liệu giao việc cũ...");
    const { error: err1 } = await supabase.from('vnpt_assignments').delete().neq('id', 'dummy'); 
    console.log("vnpt_assignments res:", err1?.message || "Success");

    console.log("Xóa phân tập/đợt triển khai cũ...");
    const { error: err2 } = await supabase.from('vnpt_batches').delete().neq('id', 'dummy'); 
    console.log("vnpt_batches res:", err2?.message || "Success");

    console.log("Xóa tập danh sách khách hàng cũ...");
    const { error: err3 } = await supabase.from('vnpt_customers').delete().neq('id', 'dummy'); 
    console.log("vnpt_customers res:", err3?.message || "Success");
    
    console.log("Xóa nhóm chương trình cũ...");
    const { error: err4 } = await supabase.from('vnpt_categories').delete().neq('id', 'dummy'); 
    console.log("vnpt_categories res:", err4?.message || "Success");
}

cleanOldData();
