import os from 'node:os';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import createDebug from 'debug';
import chalk from 'chalk';
import { type GlobalOptions } from '../options.js';
import { askForConfirmation, isRepositoryDirty, readFile, runCommand } from '../util/index.js';
import { AZD_BICEP_PATH, AZD_INFRA_PATH, AZD_REPOSITORY } from '../constants.js';
import { type ProjectInfraInfo, getProjectInfraInfo } from '../project.js';

const debug = createDebug('update');

export type UpdateOptions = GlobalOptions & {
  yes: boolean;
};

export enum UpdateAction {
  UpToDate = 'up-to-date',
  ToUpdate = 'update',
  Missing = 'missing'
}

export async function update(targetPath: string, options: UpdateOptions) {
  debug('Running command with:', { targetPath, options });

  const infraInfo = await getProjectInfraInfo(targetPath);
  const azdPath = await getAzdRepoPath(options);
  const updateActions = await compareInfraFiles(infraInfo, azdPath);

  for (let i = 0; i < infraInfo.files.length; i++) {
    const file = path.join(AZD_INFRA_PATH, infraInfo.files[i]);
    const action = updateActions[i];
    switch (action) {
      case UpdateAction.UpToDate: {
        console.info(chalk.gray(`[current] ${file}`));
        break;
      }

      case UpdateAction.ToUpdate: {
        console.info(chalk.yellow(`[update]  ${file}`));
        break;
      }

      case UpdateAction.Missing: {
        console.info(chalk.red(`[missing] ${file}`));
        break;
      }
    }
  }

  console.info();

  if (!updateActions.includes(UpdateAction.ToUpdate)) {
    console.info('No updates required.');
    return;
  }

  if (!(options.yes || (await askForConfirmation('Update files?')))) {
    console.info('Update cancelled.');
    return;
  }

  if (await isRepositoryDirty()) {
    throw new Error('Your working directory has uncommitted changes.\nPlease commit or stash your changes before running this command.');
  }

  const updatePromises = infraInfo.files
    .filter((_, i) => updateActions[i] === UpdateAction.ToUpdate)
    .map(async (file) => updateFile(file, azdPath));

  await Promise.all(updatePromises);

  console.info('Update successful.');
}

async function getAzdRepoPath(_options: UpdateOptions) {
  const azdPath = path.join(os.tmpdir(), 'azd');
  try {
    await fs.rm(azdPath, { recursive: true, force: true });
    await runCommand(`git clone --depth 1 ${AZD_REPOSITORY} ${azdPath}`);
    debug('Cloned azd repo to:', azdPath);
    return azdPath;
  } catch (error) {
    debug('Error cloning azd repo:', error);
    throw new Error('Error cloning azd repo');
  }
}

async function compareInfraFiles(infraInfo: ProjectInfraInfo, azdPath: string): Promise<UpdateAction[]> {
  const updateActions = await Promise.all(
    infraInfo.files.map(async (file) => {
      // TODO: Terraform support
      const coreInfraPath = path.join(azdPath, AZD_BICEP_PATH);
      const azdFile = path.join(coreInfraPath, file);
      const infraFile = path.join(AZD_INFRA_PATH, file);
      return compareFile(infraFile, azdFile);
    })
  );
  return updateActions;
}

async function compareFile(file: string, azdFile: string): Promise<UpdateAction> {
  try {
    const localContent = normalizeContent(await readFile(file));
    const azdContent = normalizeContent(await readFile(azdFile));
    return localContent === azdContent ? UpdateAction.UpToDate : UpdateAction.ToUpdate;
  } catch (error) {
    debug('Error comparing files:', error);
    return UpdateAction.Missing;
  }
}

async function updateFile(file: string, azdPath: string) {
  try {
    // TODO: Terraform support
    const coreInfraPath = path.join(azdPath, AZD_BICEP_PATH);
    const azdFile = path.join(coreInfraPath, file);
    const azdContent = await readFile(azdFile);
    const infraFile = path.join(AZD_INFRA_PATH, file);
    await fs.writeFile(infraFile, azdContent);
    debug(`Updated file ${infraFile} with content from ${azdFile}`);
  } catch (error_) {
    const error = error_ as Error;
    debug(`Error updating file ${file}:`, error);
    throw new Error(`Error updating file ${file}: ${error.message}`);
  }
}

function normalizeContent(content: string): string {
  return content.replaceAll('\r\n', '\n').trim();
}
