import { confirm } from '@inquirer/prompts';

export async function askForConfirmation(question: string): Promise<boolean> {
  try {
    return await confirm({ message: question, default: true });
  } catch {
    return false;
  }
}
