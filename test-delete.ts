import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://sgtuwnepwhucemvtugeu.supabase.co", "sb_publishable__YRNMlCYXaRFDkV88iNezA_1NNlolkG");
async function run() {
    const { data, error } = await supabase.from('vnpt_potential_customers').delete().in('id', ['test_1779958188440']);
    console.log({ error });
}
run();
