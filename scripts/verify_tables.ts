
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    const tables = [
        'project_interviews_enhanced',
        'interview_assumption_tags',
        'interview_synthesis'
    ];

    console.log('Verifying tables...');

    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Table '${table}' NOT found or not accessible:`, error.message);
        } else {
            console.log(`✅ Table '${table}' exists and is accessible.`);
        }
    }
}

verifyTables();
