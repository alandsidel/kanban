import dotenv from 'dotenv';
dotenv.config();

const _consts = {
  ORIGINS     : process.env.ORIGINS ?
    process.env.ORIGINS.split(',').map((origin) => origin.trim()) :
    ['http://localho.st:5173'],
  DB_TYPE     : process.env.DB_TYPE   || 'better-sqlite3',
  BUCKETS     : process.env.BUCKETS ?
    process.env.BUCKETS.split(',') :
    ['Backlog', 'Doing', 'Review', 'Done'],
  SVC_PORT    : process.env.SVC_PORT    || null,
  SECRET      : process.env.SECRET      || 'this is a super secret string',
  SESSION_LEN : process.env.SESSION_LEN || 60 * 60 * 24, // session length in seconds
}

export const consts = Object.freeze(_consts);
