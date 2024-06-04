import path from 'node:path';
import createDebug from 'debug';
import glob from 'fast-glob';
import { AZD_BICEP_CORE_GLOBS, AZD_INFRA_PATH } from './constants.js';
import { pathExists } from './util/index.js';

const debug = createDebug('project');

export type ProjectInfraInfo = {
  type: 'bicep' | 'terraform';
  files: string[];
};

export async function getProjectInfraInfo(targetPath: string): Promise<ProjectInfraInfo> {
  debug('Getting project info for path:', targetPath);

  const azureYamlPath = path.join(targetPath, 'azure.yaml');
  if (!(await pathExists(azureYamlPath))) {
    throw new Error('Not an AZD project: missing azure.yaml');
  }

  const infraPath = path.join(targetPath, AZD_INFRA_PATH);
  if (!(await pathExists(infraPath))) {
    throw new Error('Not an AZD project: missing infra folder');
  }

  const mainBicepPath = path.join(infraPath, 'main.bicep');
  if (!(await pathExists(mainBicepPath))) {
    throw new Error('No main.bicep file found: only Bicep infrastructure is currently supported');
  }

  const files = await glob(AZD_BICEP_CORE_GLOBS, { cwd: infraPath });
  debug('Found files:', files);

  return {
    type: 'bicep',
    files
  };
}
