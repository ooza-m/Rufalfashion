import { AppError } from './domain.mjs';
let pool;
export async function database(){if(!process.env.DATABASE_URL)throw new AppError('database_not_configured',503);if(!pool){const {Pool}=await import('pg');pool=new Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:6000,idleTimeoutMillis:10000});}return pool;}
export async function query(sql,values=[]){return(await(await database()).query(sql,values)).rows;}
export async function transaction(fn){const client=await(await database()).connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
