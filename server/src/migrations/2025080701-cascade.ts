/*
  The schema doesn't have the needed ON DELETE CASCADE constraints
  and SQLite doesn't support the complete ALTER TABLE statement, so
  we need to recreate the tables and move the data between them.
*/
export const up = async (knex:any) => {
  await knex.raw('PRAGMA foreign_keys = OFF;');
  await knex.raw('ALTER TABLE projects RENAME TO old_projects');
  await knex.raw([
    'CREATE TABLE projects (',
    '  id INTEGER PRIMARY KEY,',
    '  owner TEXT NOT NULL,',
    '  name TEXT NOT NULL,',
    '  FOREIGN KEY(owner) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO projects SELECT * FROM old_projects');

  await knex.raw('ALTER TABLE buckets RENAME TO old_buckets');
  await knex.raw([
    'CREATE TABLE buckets (',
    '  id INTEGER PRIMARY KEY,',
    '  project_id INTEGER NOT NULL,',
    '  name TEXT NOT NULL,',
    '  ord INTEGER,',
    '  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO buckets SELECT * FROM old_buckets');

  await knex.raw('ALTER TABLE tasks RENAME TO old_tasks');
  await knex.raw([
    'CREATE TABLE tasks (',
    '  id INTEGER PRIMARY KEY,',
    '  bucket_id INTEGER NOT NULL,',
    '  ord INTEGER,',
    '  name TEXT NOT NULL,',
    '  description TEXT,',
    '  FOREIGN KEY(bucket_id) REFERENCES buckets(id) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO tasks SELECT * FROM old_tasks');

  await knex.raw('ALTER TABLE project_users RENAME TO old_project_users');
  await knex.raw([
    'CREATE TABLE project_users (',
    '  project_id INTEGER NOT NULL,',
    '  username TEXT NOT NULL,',
    '  is_admin INTEGER NOT NULL DEFAULT FALSE,',
    '  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,',
    '  FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO project_users SELECT * FROM old_project_users');

  // Drop old tables.
  await knex.raw('DROP TABLE old_project_users');
  await knex.raw('DROP TABLE old_tasks');
  await knex.raw('DROP TABLE old_buckets');
  await knex.raw('DROP TABLE old_projects');

  // Recreate all the old indexes
  await knex.raw('CREATE UNIQUE INDEX idx_project_name ON projects (owner, name);');
  await knex.raw('CREATE UNIQUE INDEX idx_bucket_name ON buckets (project_id, name);');
  await knex.raw('PRAGMA foreign_keys = ON;');
}

export const down = async (knex:any) => {
  await knex.raw('PRAGMA foreign_keys = OFF;');
  await knex.raw('ALTER TABLE projects RENAME TO old_projects');
  await knex.raw([
    'CREATE TABLE projects (',
    '  id INTEGER PRIMARY KEY,',
    '  owner TEXT NOT NULL,',
    '  name TEXT NOT NULL,',
    '  FOREIGN KEY(owner) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO projects SELECT * FROM old_projects');

  await knex.raw('ALTER TABLE buckets RENAME TO old_buckets');
  await knex.raw([
    'CREATE TABLE buckets (',
    '  id INTEGER PRIMARY KEY,',
    '  project_id INTEGER NOT NULL,',
    '  name TEXT NOT NULL,',
    '  ord INTEGER,',
    '  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO buckets SELECT * FROM old_buckets');

  await knex.raw('ALTER TABLE tasks RENAME TO old_tasks');
  await knex.raw([
    'CREATE TABLE tasks (',
    '  id INTEGER PRIMARY KEY,',
    '  bucket_id INTEGER NOT NULL,',
    '  ord INTEGER,',
    '  name TEXT NOT NULL,',
    '  description TEXT,',
    '  FOREIGN KEY(bucket_id) REFERENCES buckets(id) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO tasks SELECT * FROM old_tasks');

  await knex.raw('ALTER TABLE project_users RENAME TO old_project_users');
  await knex.raw([
    'CREATE TABLE project_users (',
    '  project_id INTEGER NOT NULL,',
    '  username TEXT NOT NULL,',
    '  is_admin INTEGER NOT NULL DEFAULT FALSE,',
    '  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,',
    '  FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE',
    ') STRICT;'].join(' '));
  await knex.raw('INSERT INTO project_users SELECT * FROM old_project_users');

  // Drop old tables.
  await knex.raw('DROP TABLE old_project_users');
  await knex.raw('DROP TABLE old_tasks');
  await knex.raw('DROP TABLE old_buckets');
  await knex.raw('DROP TABLE old_projects');

  // Recreate all the old indexes
  await knex.raw('CREATE UNIQUE INDEX idx_project_name ON projects (owner, name);');
  await knex.raw('CREATE UNIQUE INDEX idx_bucket_name ON buckets (project_id, name);');
  await knex.raw('PRAGMA foreign_keys = ON;');
}
