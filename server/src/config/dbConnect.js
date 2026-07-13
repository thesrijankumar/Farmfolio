import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';
import ApiError from '../util/ApiError.js';

async function dbConnect() {
    try {
        const client = postgres(process.env.DATABASE_URI, {prepare: false} );
        const db = drizzle( client, { schema } );
        // console.log(db);
        console.log("Database Connection Success!!");        
    } catch (err) {
        console.log(new ApiError(500, "Database Connection Failed"));
    }
}

export default dbConnect;