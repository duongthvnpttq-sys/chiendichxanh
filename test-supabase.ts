import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const rawUrl = "https://sgtuwnepwhucemvtugeu.supabase.co/rest/v1/";
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, ""); 
const SUPABASE_KEY = "sb_publishable__YRNMlCYXaRFDkV88iNezA_1NNlolkG";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const { data, error } = await supabase.from('vnpt_notifications').upsert([{
        id: "test",
        title: "test",
        message: "test",
        type: "INFO",
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: null,
        userId: null
    }]);
    
    console.log("Upsert 1:", { error });

    const { data: d2, error: e2 } = await supabase.from('notifications').upsert([{
        id: "test",
        title: "test",
        message: "test",
        type: "INFO",
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: null,
        userId: null
    }]);

    console.log("Upsert 2:", { error: e2 });
}
run();
