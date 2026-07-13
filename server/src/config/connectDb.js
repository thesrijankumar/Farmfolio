import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import ApiError from '../util/ApiError.js';

async function connectDb() {
    try {
        const client = postgres(process.env.DATABASE_URI, {prepare: false} );
        const db = drizzle( {client} );
        // console.log(client);
        console.log("Database Connection Success!!");        
    } catch (err) {
        console.log(new ApiError(500, "Database Connection Failed"));
    }
}

export default connectDb;