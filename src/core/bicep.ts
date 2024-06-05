import path from 'node:path';
import createDebug from 'debug';
import { AZD_INFRA_PATH } from '../constants.js';
import { pathExists, readFile } from '../util/index.js';
import { type DependencyInfo, isDependencyUsed } from './dependency.js';

const debug = createDebug('bicep');
const bicepModuleRegex = /module\s+[\w_]+\s+'(.+)'/g;

export async function getBicepDependencyInfo(files: string[]): Promise<DependencyInfo> {
  const bicepFiles = files.filter((file) => file.endsWith('.bicep')).map((file) => path.join(AZD_INFRA_PATH, file));

  const deps: DependencyInfo = {
    graph: {},
    all: [],
    missing: [],
    unused: []
  };
  const allFiles = new Set(bicepFiles);
  const unresolvedFiles = new Set(bicepFiles);

  while (unresolvedFiles.size > 0) {
    const file = path.posix.normalize(unresolvedFiles.values().next().value as string);

    // Check for missing files
    if (!(await pathExists(file))) {
      deps.missing.push(file);
      unresolvedFiles.delete(file);
      debug(`File not found for dependency: ${file}`);
      continue;
    }

    // Find dependencies
    const dependencies = await getBicepDependencies(file);
    deps.graph[file] = dependencies;
    unresolvedFiles.delete(file);
    for (const dependency of dependencies) {
      allFiles.add(dependency);

      if (!deps.graph[dependency]) {
        unresolvedFiles.add(dependency);
      }
    }
  }

  deps.all = [...allFiles];

  // Find unused dependencies
  for (const file of allFiles) {
    if (!isDependencyUsed(file, deps.graph) && !file.endsWith('main.bicep')) {
      deps.unused.push(file);
    }
  }

  debug('Dependency info:', deps);

  return deps;
}

async function getBicepDependencies(file: string): Promise<string[]> {
  const dependencies: string[] = [];
  const content = await readFile(file);

  let match;
  while ((match = bicepModuleRegex.exec(content)) !== null) {
    const modulePath = path.posix.join(path.posix.dirname(file), match[1]);
    dependencies.push(path.posix.normalize(modulePath));
    debug(`Found dependency in file ${file}: ${modulePath}`);
  }

  // Make sure dependencies are unique
  return [...new Set(dependencies)];
}
