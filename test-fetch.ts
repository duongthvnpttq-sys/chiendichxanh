import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://sgtuwnepwhucemvtugeu.supabase.co", "sb_publishable__YRNMlCYXaRFDkV88iNezA_1NNlolkG");
async function run() {
    const { data, error } = await supabase.from('vnpt_potential_customers').select('*');
    console.log({ data, error });
}
run();
