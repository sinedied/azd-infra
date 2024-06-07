import { promises as fs } from 'node:fs';
import { posix as path } from 'node:path';
import createDebug from 'debug';
import chalk from 'chalk';
import { type GlobalOptions, getProjectInfraInfo, getBicepDependencyInfo, dependencyUsedBy } from '../core/index.js';
import {
  askForConfirmation,
  checkRepositoryDirty,
  cloneAzdRepository,
  convertPathToPosix,
  pathExists,
  removeFirstPosixPathSegment
} from '../util/index.js';
import { AZD_BICEP_CORE_PATH, AZD_BICEP_PATH, AZD_INFRA_PATH } from '../constants.js';

const debug = createDebug('update');

export type FixOptions = GlobalOptions;

export async function fix(targetPath: string, options: FixOptions) {
  targetPath = convertPathToPosix(targetPath);
  
  debug('Running command with:', { targetPath, options });
  console.info('Checking your infrastructure for issues...');

  const infraInfo = await getProjectInfraInfo(targetPath);
  const dependencyInfo = await getBicepDependencyInfo(infraInfo.files);

  console.info(`Found ${chalk.cyan(dependencyInfo.all.length)} infra modules.`);

  if (dependencyInfo.missing.length === 0 && dependencyInfo.unused.length === 0) {
    console.info('No unused or missing modules found, all good!');
    return;
  }

  if (dependencyInfo.missing.length > 0) {
    console.info(`Missing modules: ${chalk.red(dependencyInfo.missing.length)}`);
    for (const file of dependencyInfo.missing) {
      console.info(
        `- ${chalk.red(file)}` + chalk.grey(` (used by ${dependencyUsedBy(file, dependencyInfo.graph).join(', ')})`)
      );
    }
  }

  if (dependencyInfo.unused.length > 0) {
    console.info(`Unused modules: ${chalk.yellow(dependencyInfo.unused.length)}`);
    for (const file of dependencyInfo.unused) {
      console.info(`- ${chalk.yellow(file)}`);
    }
  }

  if (!(options.yes || (await askForConfirmation('Add/remove files?')))) {
    console.info('Cancelled, no changes made.');
    return;
  }

  await checkRepositoryDirty(options.allowUnclean);

  if (dependencyInfo.missing.length > 0) {
    await fixMissingModules(targetPath, dependencyInfo.missing);
  }

  if (dependencyInfo.unused.length > 0) {
    await removeUnusedModules(targetPath, dependencyInfo.unused);
  }

  console.info('Fix completed.');
}

async function fixMissingModules(targetPath: string, missingModules: string[]) {
  console.info('Adding missing modules...');
  const azdPath = await cloneAzdRepository();

  for (const missingModule of missingModules) {
    if (!missingModule.startsWith(`${AZD_INFRA_PATH}/${AZD_BICEP_CORE_PATH}/`)) {
      console.info(chalk.yellow(`Skipping non-core module: ${missingModule}`));
      continue;
    }

    const source = path.join(azdPath, AZD_BICEP_PATH, removeFirstPosixPathSegment(missingModule));
    const target = path.join(targetPath, missingModule);
    debug(`Copying missing module from: ${source}`);

    if (!(await pathExists(source))) {
      console.info(chalk.red(`Missing core module does not exists: ${missingModule}`));
      continue;
    }

    try {
      await fs.copyFile(source, target);
      console.info(chalk.green(`Added: ${missingModule}`));
    } catch (error_) {
      const error = error_ as Error;
      throw new Error(`Failed to add missing module ${missingModule}: ${error.message}`);
    }
  }
}

async function removeUnusedModules(targetPath: string, unusedModules: string[]) {
  console.info('Removing unused modules...');

  for (const unusedModule of unusedModules) {
    const target = path.join(targetPath, unusedModule);

    try {
      await fs.rm(target);
      console.info(chalk.green(`Removed: ${unusedModule}`));
    } catch (error_) {
      const error = error_ as Error;
      throw new Error(`Failed to remove unused module ${unusedModule}: ${error.message}`);
    }
  }
}
