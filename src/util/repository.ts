import os from 'node:os';
import { posix as path } from 'node:path';
import { promises as fs } from 'node:fs';
import createDebug from 'debug';
import { AZD_REPOSITORY } from '../constants.js';
import { runCommand } from './command.js';
import { convertPathToPosix } from './file.js';

const debug = createDebug('repository');

export async function isRepositoryDirty(): Promise<boolean> {
  try {
    const output = await runCommand('git status --porcelain');
    return Boolean(output.trim());
  } catch (error_) {
    const error = error_ as Error;
    throw new Error(`Failed to check if repository is clean: ${error.message}`);
  }
}

export async function checkRepositoryDirty(allowUnclean: boolean): Promise<void> {
  if (!allowUnclean && (await isRepositoryDirty())) {
    throw new Error(
      'Your working directory has uncommitted changes.\nPlease commit or stash your changes before running this command.'
    );
  }
}

export async function cloneAzdRepository(): Promise<string> {
  const azdPath = convertPathToPosix(path.join(os.tmpdir(), 'azd'));
  try {
    debug('Cloning azd repo to:', azdPath);
    await fs.rm(azdPath, { recursive: true, force: true });
    await runCommand(`git clone --depth 1 ${AZD_REPOSITORY} ${azdPath}`);
    debug('Cloned azd repo to:', azdPath);
    return azdPath;
  } catch (error) {
    debug('Error cloning azd repo:', error);
    throw new Error('Error cloning azd repo');
  }
}
