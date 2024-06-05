import path from 'node:path';
import createDebug from 'debug';
import glob from 'fast-glob';
import { AZD_BICEP_CORE_GLOBS, AZD_BICEP_PATH, AZD_INFRA_PATH } from '../constants.js';
import { deepClone, pathExists, readFile } from '../util/index.js';
import { type DependencyInfo, isDependencyUsed } from './dependency.js';

const debug = createDebug('bicep');
const bicepModuleRegex = /module\s+[\w_]+\s+'(.+)'/g;

export async function getBicepDependencyInfo(
  files: string[],
  basePath: string = AZD_INFRA_PATH
): Promise<DependencyInfo> {
  const bicepFiles = files.filter((file) => file.endsWith('.bicep')).map((file) => path.join(basePath, file));

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
  deps.unused = await findUnusedDependencies(deps.all, deps.graph);

  debug('Dependency info:', deps);

  return deps;
}

async function findUnusedDependencies(files: string[], graph: Record<string, string[]>) {
  const unused = new Set<string>();
  const usedGraph = deepClone(graph);
  let hasChanged = true;

  // Keep iterating until no more changes are made,
  // as removing one dependency might make another unused
  while (hasChanged) {
    hasChanged = false;

    for (const file of files) {
      if (unused.has(file)) {
        continue;
      }

      if (!isDependencyUsed(file, usedGraph) && !file.endsWith('main.bicep')) {
        debug(`Found new unused dependency: ${file}`);
        unused.add(file);
        hasChanged = true;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete usedGraph[file];
      }
    }
  }

  return [...unused];
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

export async function getBicepCoreTemplates(azdPath: string) {
  const coreInfraPath = path.join(azdPath, AZD_BICEP_PATH);
  const coreFiles = await glob(AZD_BICEP_CORE_GLOBS, { cwd: coreInfraPath });
  debug('Found core template files:', coreFiles);

  return coreFiles;
}
