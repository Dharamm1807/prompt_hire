/*
CONNECTS TO SUPABASE AUTH DATABASE USING PG POOL
I DONT KNOW WHAT THE FUCK PG POOL DOES BUT IT WORKS SO I DONT CARE
IF ON NPM RUN DEV YOU WILL SEE A MESSAGE IN THE CONSOLE SAYING "DATABASE CONNECTED SUCCESSFULLY!" IF IT CONNECTS
IF YOU SEE THIS MESSAGE WHILE DEBUGGING IT MEANS BUG IS NOT HERE AND THIS FILE IS FUNCTIONING PROPERLY
*/

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function connectToDatabase() {
    try {
        console.log("Connecting to the database...");
        await pool.query("SELECT NOW()");
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error);
    }
}

export default pool;