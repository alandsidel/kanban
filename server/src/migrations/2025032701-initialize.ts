import { generatePassword, generatePasswordRec } from '../lib/utils.js';

export const up = async (knex:any) => {
  await knex.raw([
    'CREATE TABLE users (',
    '  username TEXT PRIMARY KEY NOT NULL,',
    '  is_admin INTEGER NOT NULL DEFAULT FALSE,',
    '  password TEXT NOT NULL',
    ') STRICT;'].join(' '));

  await knex.raw([
    'CREATE TABLE projects (',
    '  id INTEGER PRIMARY KEY,',
    '  owner TEXT NOT NULL,',
    '  name TEXT NOT NULL,',
    '  FOREIGN KEY(owner) REFERENCES users(username)',
    ') STRICT;'].join(' '));

  await knex.raw('CREATE UNIQUE INDEX idx_project_name ON projects (owner, name);');

  await knex.raw([
    'CREATE TABLE project_users (',
    '  project_id INTEGER NOT NULL,',
    '  username TEXT NOT NULL,',
    '  is_admin INTEGER NOT NULL DEFAULT FALSE,',
    '  FOREIGN KEY(project_id) REFERENCES projects(id),',
    '  FOREIGN KEY(username) REFERENCES users(username)',
    ') STRICT;'].join(' '));

  await knex.raw([
    'CREATE TABLE buckets (',
    '  id INTEGER PRIMARY KEY,',
    '  project_id INTEGER NOT NULL,',
    '  name TEXT NOT NULL,',
    '  ord INTEGER,',
    '  FOREIGN KEY(project_id) REFERENCES projects(id)',
    ') STRICT;'].join(' '));

  // Bucket order is unique in a project.
  await knex.raw('CREATE UNIQUE INDEX idx_bucket_order ON buckets (project_id, ord);');
  // Bucket name is unique in a project
  await knex.raw('CREATE UNIQUE INDEX idx_bucket_name ON buckets (project_id, name);');

  await knex.raw([
    'CREATE TABLE tasks (',
    '  id INTEGER PRIMARY KEY,',
    '  bucket_id INTEGER NOT NULL,',
    '  ord INTEGER,',
    '  name TEXT NOT NULL,',
    '  description TEXT,',
    '  FOREIGN KEY(bucket_id) REFERENCES buckets(id)',
    ') STRICT;'].join(' '));

  await knex.raw('CREATE UNIQUE INDEX idx_task_order ON tasks (bucket_id, ord);');

  await knex.raw([
    'CREATE TABLE sessions (',
    '  id TEXT PRIMARY KEY,',
    '  expiration INTEGER NOT NULL,',
    '  data TEXT',
    ') STRICT;'].join(' '));

  // Insert admin user
  const initialPw   = generatePassword();
  const passwordVal = await generatePasswordRec(initialPw);
  await knex('users').insert({
    username: 'admin',
    password: passwordVal,
    is_admin: true
  });

  console.log('Admin user created.  Username: admin, password: '+initialPw);
}

export const down = async (knex:any) => {
  await knex.raw('DROP TABLE sessions;');
  await knex.raw('DROP TABLE tasks;');
  await knex.raw('DROP INDEX idx_bucket_order;');
  await knex.raw('DROP TABLE buckets;');
  await knex.raw('DROP TABLE projects;');
  await knex.raw('DROP TABLE users;');
}
