import {readFile}from'node:fs/promises';import{database}from'../lib/db.mjs';
if(process.env.RUFAL_MIGRATION_CONFIRMED!=='true')throw new Error('Migration requires a verified DATABASE_URL and RUFAL_MIGRATION_CONFIRMED=true.');
const db=await database();try{for(const file of ['001-foundation.sql','002-catalog-finance.sql'])await db.query(await readFile(new URL('../db/'+file,import.meta.url),'utf8'));console.log('Foundation schema applied. No private data was seeded.');}finally{await db.end();}
