import createDebug from 'debug';
import { type GlobalOptions } from '../core/index.js';
import { update } from './update.js';
import { fix } from './fix.js';

const debug = createDebug('update');

export type RefreshOptions = GlobalOptions;

export async function refresh(targetPath: string, options: RefreshOptions) {
  debug('Running command with:', { targetPath, options });

  await update(targetPath, options);
  await fix(targetPath, {
    ...options,
    // Unclean repo already checked by update, and update can make it unclean
    allowUnclean: true
  });
}
