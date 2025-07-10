import * as scryptMcf from 'scrypt-mcf'
import { Request } from 'express';
import knex from 'knex';

export function generatePassword(len:number = 12):string {
  const pwchars = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '`0123456789-=',
    '~!@#$%^&*()_+',
    '[]{}|;\':",./<>?'
  ].join('').split('');

  let ret = '';

  while (len > 0){
    len--;

    // Math.random() is not cryptographically secure.
    ret += pwchars[Math.floor(Math.random() * pwchars.length)];
  }

  return ret;
}

export async function generatePasswordRec(password:string):Promise<string> {
  return await scryptMcf.hash(password);
}

export async function authenticateUser(mcfString:string, password:string):Promise<boolean> {
  return await scryptMcf.verify(password, mcfString);
}

export function isNumeric(val: any): boolean {
  return !isNaN(parseFloat(val)) && isFinite(val);
}

export function isPositiveInteger(val: any): boolean {
  if (isNumeric(val)) {
    if (val > 0) {
      if (parseFloat(val) === Math.floor(val)) {
        return true;
      }
    }
  }
  return false;
}

export async function canUserModifyProject(db:knex.Knex<any, unknown[]>, req: Request, projectId: string): Promise<boolean> {
  const c = await db('project_users')
    .count('username as cnt')
    .where({ username: req.session.username, project_id: projectId })
    .first();
  return c ? c.cnt == 1 : false;
}

export async function canUserModifyTask(db:knex.Knex<any, unknown[]>, req: Request, taskId: string): Promise<boolean> {
  const c = await db('project_users')
    .innerJoin('buckets', 'buckets.project_id', 'project_users.project_id')
    .innerJoin('tasks', 'tasks.bucket_id', 'buckets.id')
    .count('username as cnt')
    .where({ username: req.session.username })
    .andWhere({ 'tasks.id': taskId })
    .first();
  return c ? c.cnt == 1 : false;
}

export async function getTasksForUser(db:knex.Knex<any, unknown[]>, projectId: string, username: string): Promise<any[]> {
  const buckets = await db('buckets')
    .join('projects', 'projects.id', 'buckets.project_id')
    .join('project_users', 'projects.id', 'project_users.project_id')
    .select('buckets.id', 'buckets.name', 'buckets.ord')
    .where('project_users.username', '=', username)
    .andWhere('projects.id', '=', projectId)
    .orderBy('buckets.ord');

  for (const bucket of buckets) {
    bucket.tasks = await db('tasks')
      .select('tasks.id', 'tasks.name', 'tasks.description')
      .where({ bucket_id: bucket.id })
      .orderBy('tasks.ord');
  }

  return buckets;
}
