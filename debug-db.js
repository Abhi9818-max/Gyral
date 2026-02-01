
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tajxamprszpohyxbirju.supabase.co';
const supabaseKey = 'sb_publishable_lDkps4MNLfIuVDwJzRX0ow_08cpO7k-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDebts() {
    console.log("Checking debts table...");
    const { data, error } = await supabase
        .from('debts')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error accessing debts table:", JSON.stringify(error, null, 2));
        if (error.code === '42P01') {
            console.log("CONCLUSION: Table 'debts' does not exist.");
        }
    } else {
        console.log("Success! Debts table exists. Rows found:", data.length);
    }
}

checkDebts();
