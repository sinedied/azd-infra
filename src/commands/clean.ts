import { promises as fs } from 'node:fs';
import path from 'node:path';
import createDebug from 'debug';
import chalk from 'chalk';
import { type GlobalOptions, getProjectInfraInfo, getBicepDependencyInfo, dependencyUsedBy } from '../core/index.js';
import {
  askForConfirmation,
  checkRepositoryDirty,
  cloneAzdRepository,
  pathExists,
  removeFirstPosixPathSegment
} from '../util/index.js';
import { AZD_BICEP_CORE_PATH, AZD_INFRA_PATH } from '../constants.js';

const debug = createDebug('update');

export type CleanOptions = GlobalOptions & {
  yes: boolean;
};

export async function clean(targetPath: string, options: CleanOptions) {
  debug('Running command with:', { targetPath, options });

  const infraInfo = await getProjectInfraInfo(targetPath);
  const dependencyInfo = await getBicepDependencyInfo(infraInfo.files);

  console.info(`Found ${dependencyInfo.all.length} infra modules.`);

  if (dependencyInfo.missing.length === 0 && dependencyInfo.unused.length === 0) {
    console.info('No unused or missing modules found, all good!');
    return;
  }

  if (dependencyInfo.missing.length > 0) {
    console.info(chalk.red('\nMissing modules:'));
    for (const file of dependencyInfo.missing)
      console.info(`- ${file} [used by ${dependencyUsedBy(file, dependencyInfo.graph).join(', ')}]`);
  }

  if (dependencyInfo.unused.length > 0) {
    console.info(chalk.yellow('\nUnused modules:'));
    for (const file of dependencyInfo.unused) console.info(`- ${file}`);
  }

  if (!(options.yes || (await askForConfirmation('Add/remove files?')))) {
    console.info('Clean up cancelled.');
    return;
  }

  await checkRepositoryDirty();
  await fixMissingModules(targetPath, dependencyInfo.missing);
  await removeUnusedModules(targetPath, dependencyInfo.unused);

  console.info('Clean up completed.');
}

async function fixMissingModules(targetPath: string, missingModules: string[]) {
  console.info('\nAdding missing modules...');
  const azdPath = await cloneAzdRepository();

  for (const missingModule of missingModules) {
    if (!missingModule.startsWith(`${AZD_INFRA_PATH}/${AZD_BICEP_CORE_PATH}/`)) {
      console.info(chalk.yellow(`Skipping non-core module: ${missingModule}`));
      continue;
    }

    const source = path.join(azdPath, removeFirstPosixPathSegment(missingModule));
    const target = path.join(targetPath, missingModule);

    if (!(await pathExists(source))) {
      console.info(chalk.red(`Missing core module does not exists: ${missingModule}`));
      continue;
    }

    try {
      await fs.copyFile(source, target);
      console.info(chalk.green(`Added missing module: ${missingModule}`));
    } catch (error_) {
      const error = error_ as Error;
      throw new Error(`Failed to add missing module ${missingModule}: ${error.message}`);
    }
  }
}

async function removeUnusedModules(targetPath: string, unusedModules: string[]) {
  console.info('\nRemoving unused modules...');

  for (const unusedModule of unusedModules) {
    const target = path.join(targetPath, unusedModule);

    try {
      await fs.rm(target);
      console.info(chalk.green(`Removed unused module: ${unusedModule}`));
    } catch (error_) {
      const error = error_ as Error;
      throw new Error(`Failed to remove unused module ${unusedModule}: ${error.message}`);
    }
  }
}
