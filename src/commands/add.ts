import { promises as fs } from 'node:fs';
import path from 'node:path';
import createDebug from 'debug';
import chalk from 'chalk';
import { type GlobalOptions, getBicepCoreTemplates, getBicepDependencyInfo } from '../core/index.js';
import { askForConfirmation, cloneAzdRepository, ensureDirectory, selectMany } from '../util/index.js';
import { AZD_BICEP_PATH, AZD_INFRA_PATH } from '../constants.js';

const debug = createDebug('add');

export type AddOptions = GlobalOptions;

export async function add(targetPath: string, options: AddOptions) {
  debug('Running command with:', { targetPath, options });
  console.info('Retrieving latest core templates...');

  const azdPath = await cloneAzdRepository();
  // TODO: Terraform support
  const coreTemplates = await getBicepCoreTemplates(azdPath);

  const selected = await selectMany('Select core templates to add', coreTemplates);
  debug('Selected core templates:', selected);

  if (selected.length === 0) {
    console.info('No core templates selected, nothing to add.');
    return;
  }

  const templatesToAdd = await resolveDependencies(selected, azdPath);
  console.info('Resolved core templates with dependencies:');

  const coreTemplateBasePath = path.join(azdPath, AZD_BICEP_PATH);
  for (const template of templatesToAdd) {
    console.info(`- ${template.slice(Math.max(0, coreTemplateBasePath.length + 1))}`);
  }

  if (
    !(
      options.yes ||
      (await askForConfirmation(`Add ${chalk.cyan(templatesToAdd.length)} core template(s) to your project?`))
    )
  ) {
    console.info('Cancelled, no templates added.');
    return;
  }

  await copyCoreTemplates(templatesToAdd, azdPath, targetPath);

  console.info(`Added ${chalk.cyan(templatesToAdd.length)} core templates to your project.`);
}

async function resolveDependencies(selected: string[], azdPath: string): Promise<string[]> {
  const dependencyInfo = await getBicepDependencyInfo(selected, path.join(azdPath, AZD_BICEP_PATH));
  return dependencyInfo.all;
}

async function copyCoreTemplates(selected: string[], azdPath: string, targetPath: string): Promise<void> {
  const copyPromises = selected.map(async (file) => {
    const source = path.join(azdPath, AZD_BICEP_PATH, file);
    const destination = path.join(targetPath, AZD_INFRA_PATH, file);
    debug('Copying:', { source, destination });

    try {
      await ensureDirectory(path.dirname(destination));
      await fs.copyFile(source, destination);
    } catch (error_) {
      const error = error_ as Error;
      throw new Error(`Failed to copy core template ${source} to ${destination}: ${error.message}`);
    }
  });
  await Promise.all(copyPromises);
}
