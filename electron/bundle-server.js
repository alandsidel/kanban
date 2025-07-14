import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function bundleServer() {
  try {
    console.log('Preparing server bundle...');

    // Ensure server-build directory exists
    if (!existsSync('server-build')) {
      mkdirSync('server-build', { recursive: true });
    }

    // Copy the built server files
    await copyServerFiles();

    // Copy ALL node_modules (let Electron handle it)
    await copyAllNodeModules();

    // Rebuild native modules for Electron
    await rebuildForElectron();

    console.log('Server prepared successfully!');

  } catch (error) {
    console.error('Server preparation failed:', error);
    process.exit(1);
  }
}

async function rebuildForElectron() {
  console.log('Rebuilding native modules for Electron...');

  try {
    execSync('npm rebuild --runtime=electron --target=37.2.0 --disturl=https://electronjs.org/headers --build-from-source', {
      cwd: resolve(__dirname, 'server-build'),
      stdio: 'inherit'
    });
    console.log('Native modules rebuilt successfully');
  } catch (error) {
    console.error('Failed to rebuild native modules:', error);
    throw error;
  }
}

async function copyServerFiles() {
  console.log('Copying server files...');

  const serverSource = resolve(__dirname, '../server/build');
  const serverTarget = resolve(__dirname, 'server-build');

  if (existsSync(serverSource)) {
    await copyDirectory(serverSource, serverTarget);
    console.log('Server files copied successfully');
  } else {
    throw new Error('Server build directory not found. Run server build first.');
  }
}

async function copyAllNodeModules() {
  console.log('Copying all node_modules...');

  const nodeModulesSource = resolve(__dirname, '../server/node_modules');
  const nodeModulesTarget = resolve(__dirname, 'server-build/node_modules');

  if (existsSync(nodeModulesSource)) {
    await copyDirectory(nodeModulesSource, nodeModulesTarget);
    console.log('All node_modules copied successfully');
  }

  // Copy package.json
  const serverPackageJson = JSON.parse(readFileSync(resolve(__dirname, '../server/package.json'), 'utf8'));
  const bundledPackageJson = {
    "name": "kanban-server-bundled",
    "version": "1.0.0",
    "type": "module",
    "main": "index.js",
    "dependencies": serverPackageJson.dependencies
  };

  writeFileSync(
    resolve(__dirname, 'server-build/package.json'),
    JSON.stringify(bundledPackageJson, null, 2)
  );
}

async function copyDirectory(source, target) {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  const items = readdirSync(source);
  for (const item of items) {
    const sourcePath = join(source, item);
    const targetPath = join(target, item);

    if (statSync(sourcePath).isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

bundleServer();
