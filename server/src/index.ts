import { consts } from './consts.mjs';
import express, {Request, Response, NextFunction } from 'express';
import cors from 'cors';
import knex from 'knex';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { authenticateUser, isNumeric, isPositiveInteger, canUserModifyProject, canUserModifyTask,
         getTasksForUser,
         generatePasswordRec} from './lib/utils.js';
import session from 'express-session';
import { KnexSessionStore } from './lib/KnexSessionStore.js';
import { SqliteError } from 'better-sqlite3';
import path from 'path';
import type { AddressInfo } from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationPath = path.join(__dirname, 'migrations');
const dbPath = process.env.KANBAN_DB_PATH || path.join(__dirname, 'kanban.db');

const isElectron = !!process.env.IS_ELECTRON;

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

//#region dbh
const db = knex({
  client: consts.DB_TYPE,
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true,
});
//#endregion

//#region argv
if (process.argv.length == 3) {
  switch (process.argv[2].toLowerCase()) {
    case 'rollback':
      await db.migrate.down({directory: migrationPath});
    break;

    default:
      console.log('Unknown argument to service');
    break;
  }

  process.exit(0);
}
//#endregion

//#region migration
console.log('Running migrations...');
await db.migrate.latest({directory: migrationPath});
//#endregion

async function enforceSecurity(req:Request, res:Response, next:NextFunction) {
  // Note that OPTIONS requests do not send credentials so CORS preflight will
  // fail if it is protected, even if the user is logged in, so we'll explicitly
  // allow it here.
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (req.session && req.session.username) {
    // Logged in users have some access
    if (req.session.isAdmin) {
      // Admins can do anything
      return next();
    }

    // Only admin users can access admin API
    if (req.url.indexOf('/api/admin/') === 0) {
      // Non-admin users cannot access admin API
      res.status(403).send('Forbidden');
      return;
    }
    return next();
  } else {
    // Anonymous visitors can only do login and signup tasks
    switch (true) {
      case (req.url === '/'):
      case (req.url === '/index.html'):
      case (req.url.indexOf('/assets/') === 0):
      case (req.url.indexOf('/api/login') === 0):
      case (req.url.indexOf('/api/logout') === 0):
      case (req.url.indexOf('/api/authcheck') === 0):
      case (req.url.indexOf('/api/signup') === 0):
        return next();
      break;

      default:
        res.status(403).send('Forbidden');
        return;
      break;
    }
  }
};

declare module 'express-session' {
  interface SessionData {
    username: string,
    isAdmin: boolean
  }
}

const app = express();
const sessionMiddleware = session({
      store: new KnexSessionStore({
        db: db,
        lifetime: 60 * 60 * 24, // 24h
        table: 'sessions'
      }),
      secret: consts.SECRET,
      saveUninitialized: true,
      resave: false,
      rolling: true,
      name: 'sessionid',
      genid: () => {return uuid()}
    });

//#region middleware
app.use((req, _res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  } else {
    return sessionMiddleware(req, _res, next);
  }
});

if (isElectron) {
  app.use((req, _res, next) => {
    req.session.username = 'admin';
    req.session.isAdmin  = true;
    next();
  });
}
app.use(enforceSecurity);
app.use(cors({origin: consts.ORIGINS, credentials: true}));
app.options('*', cors()); // enable CORS options requests
app.use(express.json());
//#endregion

//#region apiroutes
async function getUserShapeForFrontend(userRec: any) {
  if (userRec) {
    return {
      username: userRec.username,
      isAdmin: userRec.is_admin,
      isElectron: isElectron
    };
  } else {
    throw new Error('No userRec to use');
  }
}

app.get('/api/authcheck', async (req:Request, res:Response) => {
  if (req.session.username) {
    const userRec = await db('users').where({username: req.session.username}).first();
    res.status(200).json(await getUserShapeForFrontend(userRec));
    return;
  } else {
    res.status(401).send('logged out');
    return;
  }
});

app.post('/api/login', async (req:Request, res:Response) => {
  const genericFailureMessage = 'Login failed';
  try {
    if (req.body.username && req.body.password) {
      const userRec = await db('users').where({username: req.body.username}).first();

      if (!userRec) {
        throw new Error(genericFailureMessage);
      }

      if (!await authenticateUser(userRec.password, req.body.password)) {
        throw new Error(genericFailureMessage);
      }

      req.session.username = req.body.username;
      req.session.isAdmin  = userRec.is_admin;

      res.status(200).json(await getUserShapeForFrontend(userRec));
      return;

    } else {
      throw new Error(genericFailureMessage);
    }
  } catch(e) {
    console.log(e);
    res.status(401).send(genericFailureMessage);
    return;
  }
});

app.post('/api/logout', async (req:Request, res:Response) => {
  try {

    req.session.destroy(() => {});
    res.clearCookie('sessionid');
    res.status(200).send('ok');
    return;

  } catch(e) {
    console.log(e);
    res.status(500).send('Failed to log out');
  }
});

app.get('/api/projects/', async (req:Request, res:Response) => {
  try {
    if (req.session.username) {
      const projects = await db('projects')
        .join('project_users', 'projects.id', 'project_users.project_id')
        .select('projects.id', 'projects.name')
        .where('project_users.username', '=', req.session.username)
        .orderBy('projects.name');
      res.status(200).json(projects);
      return;
    } else {
      res.status(403).send('Unauthorized');
      return;
    }
  } catch (e) {
    throw new Error('Failed fetching projects');
  }
});

app.put('/api/projects/:projectName', async (req:Request, res:Response) => {
  try {
    const newProjectName = req.params.projectName.trim();
    if (!newProjectName) {
      res.status(400).send('Project name cannot be empty or 100% whitespace.');
      return;
    }

    await db.transaction(async(trx) => {
      const projectId = await db('projects').transacting(trx).insert({name: newProjectName, owner: req.session.username}, ['id']);
      await db('project_users').transacting(trx).insert({
        project_id: projectId[0].id,
        username: req.session.username,
        is_admin: true
      })

      // add default buckets
      let bucketNum = 0;
      for (const bucket of consts.BUCKETS) {
        bucketNum++;
        await db('buckets').transacting(trx).insert({
          project_id: projectId[0].id,
          name: bucket,
          ord: bucketNum
        });
      }

      await trx.commit();
    });
    res.status(200).send('ok');
    return;

  } catch (e) {
    console.log('Failed adding new project: ' + e);

    const errResponse = {
      msg: 'Failed adding new project',
      detail: 'Unknown error'
    };

    if (typeof e === 'string') {
      errResponse.detail = e;
    } else if (e instanceof SqliteError) {
      switch (e.code) {
        case 'SQLITE_CONSTRAINT_UNIQUE':
          errResponse.detail = 'Project name already exists.  Project names must be unique!';
        break;

        default:
          errResponse.detail = e.code;
        break;
      }
    } else if (e instanceof Error) {
      errResponse.detail = e.message;
    }

    res.status(500).json(errResponse);
    return;
  }
});

app.put('/api/task/:projectId', async (req:Request, res:Response) => {
  try {
    if ((!req.body.name) || (!req.body.name.trim())) {
      throw new Error('Task name is required');
    }

    if ((!req.params.projectId) || (!req.params.projectId) || (!isPositiveInteger(req.params.projectId))) {
      throw new Error('Invalid project ID: ' + req.params.projectId);
    }

    if (!await canUserModifyProject(db, req, req.params.projectId)) {
      res.status(400).send('Not authorized');
      return;
    }

    const bucketIdRow = await db('buckets').select('buckets.id as id').where({project_id: req.params.projectId})
      .orderBy('ord', 'asc')
      .limit(1)
      .first();
    if (!bucketIdRow) {
      throw new Error('Project has no buckets');
    }
    const bucketId = bucketIdRow.id;

    await db.transaction(async(trx) => {
      let maxOrd = 1;
      const maxOrdRow = await db('tasks').transacting(trx).max('ord as maxord').where({bucket_id: bucketId}).first();
      if (maxOrdRow) {
        maxOrd = maxOrdRow.maxord + 1;
      }

      await db('tasks').transacting(trx).insert({
        bucket_id: bucketId,
        ord: maxOrd,
        name: req.body.name,
        description: req.body.description
      });

      await trx.commit();
    });
    res.status(200).send('ok');
    return;

  } catch (e) {
    console.log('Failed adding new task to project: ' + e);

    const errResponse = {
      msg: 'Failed adding new task to project',
      detail: 'Unknown error'
    };

    if (typeof e === 'string') {
      errResponse.detail = e;
    } else if (e instanceof SqliteError) {
      errResponse.detail = e.code;
    } else if (e instanceof Error) {
      errResponse.detail = e.message;
    }

    res.status(500).json(errResponse);
    return;
  }
});

app.get('/api/buckets/:projectId', async (req:Request, res:Response) => {
  try {
    if (req.session.username) {
      const buckets = await getTasksForUser(db, req.params.projectId, req.session.username);

      res.status(200).json(buckets);
      return;
    } else {
      res.status(400).send('Not authorized');
      return;
    }
  } catch (e) {
    console.log(e);
    res.status(500).send('Failed fetching buckets');
    return;
  }
});

app.post('/api/movetask/:taskId/:fromBucketId/:toBucketId', async (req:Request, res:Response) => {
  try {
    /**
      Need to ensure a few things.

      - The bucket IDs are legitimate.
      - The taskID is legitimate.
      - User is logged in.
      - The bucket IDs are in the same project.
      - The user is allowed to modify the project.

    */

    if ((!isNumeric(req.params.taskId) || !isNumeric(req.params.fromBucketId) || !isNumeric(req.params.toBucketId))){
      res.status(400).send('Improper parameters');
      return;
    }

    if (req.session.username) {
      const projectIdA = (await db('buckets')
        .select('buckets.project_id AS projectId')
        .innerJoin('tasks', 'buckets.id', 'tasks.bucket_id')
        .where('tasks.id', '=', req.params.taskId)
        .andWhere('tasks.bucket_id', '=', req.params.fromBucketId)
        .first())?.projectId;

      const projectIdB = (await db('buckets')
        .select('buckets.project_id AS projectId')
        .where('buckets.id', '=', req.params.toBucketId)
        .first())?.projectId;

      if (projectIdA !== projectIdB) {
        res.status(400).send('Cannot move a task from one project to another');
        return;
      }

      if (!await canUserModifyProject(db, req, projectIdA)) {
        res.status(400).send('Not authorized');
        return;
      }

      await db('tasks')
        .update({bucket_id: req.params.toBucketId})
        .where({id: req.params.taskId})
        .andWhere({bucket_id: req.params.fromBucketId});

      res.status(200).json(await getTasksForUser(db, projectIdA, req.session.username));
      return;
    } else {
      res.status(400).send('Not authorized');
      return;
    }
  } catch (e) {
    console.log(e);
    res.status(500).send('Failed to move task');
    return;
  }
});

app.delete('/api/task/:fromBucketId/:taskId', async (req:Request, res:Response) => {
  try {
    if (req.session.username) {
      const projectId = (await db('buckets')
        .select('buckets.project_id AS projectId')
        .innerJoin('tasks', 'buckets.id', 'tasks.bucket_id')
        .where('tasks.id', '=', req.params.taskId)
        .andWhere('tasks.bucket_id', '=', req.params.fromBucketId)
        .first())?.projectId;

      if (!projectId) {
        res.status(400).send('Cannot delete a task from a different project');
        return;
      }

      if (!await canUserModifyProject(db, req, projectId)) {
        res.status(400).send('Not authorized');
        return;
      }

      await db('tasks')
        .where({id: req.params.taskId})
        .andWhere({bucket_id: req.params.fromBucketId})
        .delete();

      res.status(200).json(await getTasksForUser(db, projectId, req.session.username));
      return;
    }
    res.status(400).send('Not authorized');
    return;
  } catch (e) {
    console.log(e);
    res.status(500).send('Failed to move task');
    return;
  }
});

app.post('/api/task/:taskId', async (req:Request, res:Response) => {
  try {
    if (!req.session.username || !await canUserModifyTask(db, req, req.params.taskId)) {
      res.status(400).send('Not authorized');
      return;
    };

    if ((!req.body.name) || (!req.body.name.trim())) {
      throw new Error('Task name is required');
    }

    const projectId = (await db('project_users')
      .innerJoin('buckets', 'buckets.project_id', 'project_users.project_id')
      .innerJoin('tasks', 'tasks.bucket_id', 'buckets.id')
      .select('buckets.project_id as id')
      .where({username: req.session.username})
      .andWhere({'tasks.id': req.params.taskId})
      .first())?.id;

    if (!projectId) {
      throw new Error('No project found for task');
    }

    await db('tasks')
      .update({
        name: req.body.name.trim(),
        description: req.body.description ? req.body.description.trim() : ''
      })
      .where({id: req.params.taskId});

    res.status(200).json(await getTasksForUser(db, projectId, req.session.username));
    return;

  } catch (e) {
    console.log('Failed updating task: ' + e);

    const errResponse = {
      msg: 'Failed updating task',
      detail: 'Unknown error'
    };

    if (typeof e === 'string') {
      errResponse.detail = e;
    } else if (e instanceof SqliteError) {
      errResponse.detail = e.code;
    } else if (e instanceof Error) {
      errResponse.detail = e.message;
    }

    res.status(500).json(errResponse)
    return;
  }
});
//#endregion

//#region admin api routes
async function getUsers() {
  return await db('users').select('username', 'email', 'is_admin').orderBy('username');
}

app.get('/api/admin/users', async (req:Request, res:Response) => {
  try {
    if (!req.session.isAdmin) {
      res.status(403).send('Forbidden');
      return;
    }

    res.status(200).json(await getUsers());
    return;

  } catch (e) {
    console.log(e);
    res.status(500).send('Failed fetching users');
    return;
  }
});

app.post('/api/admin/users/:username/set-admin/', async (req:Request, res:Response) => {
  try {
    if (!req.session.isAdmin) {
      res.status(403).send('Forbidden');
      return;
    }

    if ((!req.params.username) || (!req.params.username.trim())) {
      throw new Error('Invalid request');
    }

    if (req.params.username.trim() === req.session.username) {
      throw new Error('Cannot toggle own admin status');
    }

    await db('users').update({is_admin: !!req.body.is_admin}).where({username: req.params.username.trim()});
    res.status(200).json(await getUsers());
  } catch (e) {
    console.log(e);
    res.status(500).send('Failed setting admin status');
    return;
  }
});

app.delete('/api/admin/users/:username', async (req:Request, res:Response) => {
  try {
    if (!req.session.isAdmin) {
      res.status(403).send('Forbidden');
      return;
    }

    if ((!req.params.username) || (!req.params.username.trim())) {
      throw new Error('Invalid request');
    }

    if (req.params.username.trim() === req.session.username) {
      throw new Error('Cannot delete self');
    }

    await db('users').delete().where({username: req.params.username.trim()});
    res.status(200).json(await getUsers());
  } catch (e) {
    console.log(e);
    res.status(500).send('Failed to delete user');
    return;
  }
});

app.post('/api/admin/users/:username/set-email', async (req:Request, res:Response) => {
  try {
    if (!req.session.isAdmin) {
      res.status(403).send('Forbidden');
      return;
    }

    const email = req.body.email ? req.body.email.trim() : null;

    await db('users').update({email: email}).where({username: req.params.username.trim()});
    res.status(200).json(await getUsers());
  } catch (e) {
    console.log(e);
    res.status(500).send('Failed to update user');
    return;
  }
});

app.put('/api/admin/users/:username/', async (req:Request, res:Response) => {
  try {
    if (!req.session.isAdmin) {
      res.status(403).send('Forbidden');
      return;
    }

    if ((!req.params.username?.trim()) || (!req.body.password))
    {
      res.status(400).send('Invalid request');
      return;
    }

    const isAdmin  = !!req.body.is_admin;
    const email    = req.body.email ? req.body.email.trim() : null;
    const password = await generatePasswordRec(req.body.password);

    await db('users').insert({username: req.params.username.trim(), is_admin: isAdmin, email: email, password: password});
    res.status(200).json(await getUsers());
  } catch (e) {
    console.log(e);
    res.status(500).send('Failed to create user');
    return;
  }
});
//#endregion

// Serve static files from React build
app.use(express.static(path.join(__dirname, './app/')));

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, './app/index.html'));
});

const server = app.listen(consts.SVC_PORT ? consts.SVC_PORT : 0, () => {
  const addr = server.address();
  if (addr && typeof addr === 'object') {
    const port = (addr as AddressInfo).port;
    console.log('Server listening on port ' + port);
    console.log('Database @ ' + dbPath);
  } else {
    console.log('Cannot determine listening port.');
  }
});
