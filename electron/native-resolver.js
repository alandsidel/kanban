import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createNativeRequire(serverDir) {
  const require = createRequire(import.meta.url);
  const nodeModulesPath = join(serverDir, 'node_modules');

  return function nativeRequire(moduleName) {
    try {
      // Try to require from the bundled node_modules
      return require(join(nodeModulesPath, moduleName));
    } catch (error) {
      // Fallback to regular require
      return require(moduleName);
    }
  };
}
