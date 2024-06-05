import { runCommand } from "./command.js";

export async function isRepositoryDirty(): Promise<boolean> {
  try {
    const output = await runCommand('git status --porcelain');
    return Boolean(output.trim());
  } catch (error_) {
    const error = error_ as Error;
    throw new Error(`Failed to check if repository is clean: ${error.message}`);
  }
}
