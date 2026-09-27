import dotenv from 'dotenv';
import path from 'path';
import db from '../src/lib/prisma';

// Explicitly load .env.test, overriding any existing variables
dotenv.config({ 
    path: path.resolve(process.cwd(), '.env.test'),
    override: true 
});

// Safe logging to verify the target database branch before tests execute
try {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        // We log ONLY the hostname (e.g., ep-syncforge-test...) to ensure secrets are never leaked
        console.log(`\n🧪 Jest DB Target: ${url.hostname}\n`);
    } else {
        console.warn('\n⚠️ WARNING: DATABASE_URL is not defined in .env.test\n');
    }
} catch (e) {
    console.error('\n⚠️ WARNING: Malformed DATABASE_URL in .env.test\n');
}
