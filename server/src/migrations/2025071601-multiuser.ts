export const up = async (knex:any) => {
  await knex.raw('ALTER TABLE users ADD COLUMN email TEXT;');
}

export const down = async (knex:any) => {
  await knex.raw('ALTER TABLE users DROP COLUMN email;');
}
