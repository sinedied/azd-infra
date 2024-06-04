import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import debug from 'debug';
import { type Command, program } from 'commander';
import updateNotifier from 'update-notifier';
import chalk from 'chalk';
import { getPackageJson } from './util/index.js';
import { type UpdateOptions, update } from './commands/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function run(arguments_: string[] = process.argv) {
  const package_ = await getPackageJson(join(__dirname, '..'));

  updateNotifier({ pkg: package_ }).notify();

  if (arguments_.includes('--verbose')) {
    debug.enable('*');
  }

  program
    .name(package_.name)
    .description("Manages your Azure Developer CLI projects' infrastructure.")
    .option('--verbose', 'show detailed logs')
    .option('-y, --yes', 'do not ask for confirmation', false)
    .version(package_.version, '-v, --version', 'show the current version')
    .helpCommand(false)
    .configureOutput({
      outputError(message, write) {
        write(chalk.red(message));
      }
    })
    .allowExcessArguments(false);

  program
    .command('update [path]')
    .description('updates infra core templates')
    // .option('--from-repo <path>', 'Use specified AZD repository folder as source')
    .action(async (targetPath: string | undefined, _options: any, command: Command) => {
      targetPath = targetPath?.trim() ?? '.';
      const options: UpdateOptions = command.optsWithGlobals();
      await update(targetPath, options);
    });

  try {
    await program.parseAsync(process.argv);
  } catch (_error: unknown) {
    const error = _error as Error;
    console.error(chalk.red(error.message));
    process.exitCode = 1;
  }
}
