import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../../prisma/contract.json';

const globalForPrisma = global as unknown as { db: any };

const db = globalForPrisma.db || postgres({
  contractJson,
  url: process.env.DATABASE_URL!,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.db = db;

export default db;