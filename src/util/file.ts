import { join } from 'node:path';
import fs from 'node:fs/promises';

export type PackageJson = Record<string, any> & {
  name: string;
  version: string;
};

export async function getPackageJson(basePath: string): Promise<PackageJson> {
  const file = await fs.readFile(join(basePath, 'package.json'), 'utf8');
  const package_ = JSON.parse(file) as PackageJson;
  return package_;
}

export async function isDirectory(path: string) {
  try {
    const stat = await fs.lstat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function ensureDirectory(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export async function pathExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readFile(file: string) {
  return fs.readFile(file, 'utf8');
}

export async function readAllFiles(files: string[]) {
  const promises = files.map(async (file) => readFile(file));
  return Promise.all(promises);
}
