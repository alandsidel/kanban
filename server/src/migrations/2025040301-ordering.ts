export const up = async (knex:any) => {
  await knex.raw('DROP INDEX idx_bucket_order;');
  await knex.raw('DROP INDEX idx_task_order;');
}

export const down = async (knex:any) => {
  await knex.raw('CREATE UNIQUE INDEX idx_bucket_order ON buckets (project_id, ord);');
  await knex.raw('CREATE UNIQUE INDEX idx_task_order ON tasks (bucket_id, ord);');
}
