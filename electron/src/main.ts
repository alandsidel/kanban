import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fork } from 'child_process';
import isDev from 'electron-is-dev';
import log from 'electron-log/main';

// Basic state management
let mainWindow: BrowserWindow | null = null;
let serverProcess: ReturnType<typeof fork> | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: false // Don't show until ready
  });

  mainWindow.loadFile('loading.html');

  mainWindow.once('ready-to-show', () => {
    log.log('Window ready to show');
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      log.log('Terminating server process');
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }
    app.quit();
  });
}

function startServer() {
  if (serverProcess) {
    log.log('Server process already exists, not starting another');
    return;
  }

  const serverDir = isDev
    ? path.join(__dirname, '../server-build')
    : path.join(process.resourcesPath, 'server-build');

  const serverPath = path.join(serverDir, 'index.js');

  log.log('Starting server from:', serverPath);
  log.log('Server directory:', serverDir);

  serverProcess = fork(serverPath, [], {
    silent: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      IS_ELECTRON: '1',
      IS_BUNDLED: 'true',
      NODE_PATH: path.join(serverDir, 'node_modules'),
      KANBAN_DB_PATH: path.join(app.getPath('userData'), 'kanban.db')
    },
    cwd: serverDir
  });

  log.log('Server started, PID ', serverProcess.pid);

  // Pass on server logging, listen for the server port in stdout
  serverProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    log.log('Server output:', output);

    const portMatch = output.match(/Server listening on port (\d+)/);
    if (portMatch && mainWindow) {
      const port = portMatch[1];
      log.log('Server started on port:', port);

      mainWindow?.loadURL(`http://localhost:${port}`);
    }
  });

  // Log any errors
  serverProcess.stderr?.on('data', (data: Buffer) => {
    log.error('Server error:', data.toString());
  });

  // Server exited, display an error message.
  serverProcess.on('close', (code: number) => {
    log.log(`Server process exited with code ${code}`);
    serverProcess = null;
    mainWindow?.loadFile('crashed.html');
  });

  serverProcess.on('error', (error: Error) => {
    log.error('Failed to start server:', error);
    serverProcess = null;
  });
}

// App event handlers
app.on('ready', () => {
  log.log('App ready event fired');
  createWindow();
  startServer();
});

app.on('window-all-closed', () => {
  log.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  log.log('App activated');
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  log.log('App quitting');
  if (serverProcess) {
    log.log('Terminating server process');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
});

// Handle process termination signals
process.on('SIGINT', () => {
  log.log('Received SIGINT');
  app.quit();
});

process.on('SIGTERM', () => {
  log.log('Received SIGTERM');
  app.quit();
});
