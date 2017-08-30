import { lstatSync } from 'fs'

import { ParseOptions } from '../index'

/**
 * --rootDir
 * --fastFail
 */
export function resolveOptions(args: Array<string>): ParseOptions {
  const len: number = args.length;
  let index: number = 0;
  const options: ParseOptions = {
    fastFail: false,
    rootDir: '.',
    files: []
  };

  while (index < len) {
    const next: string = args[index];

    switch (next) {
      case '--rootDir':
        options.rootDir = args[(index + 1)];
        try {
          if (lstatSync(options.rootDir).isDirectory()) {
            index += 2;
            break;
          } else {
            throw new Error(`Provided root directory "${options.rootDir}" isn't a directory`);
          }
        } catch(e) {
          throw new Error(`Provided root directory "${options.rootDir}" doesn't exist`);
        }

      case '--fastFail':
        options.fastFail = args[(index + 1)] === 'true'
        index += 2
        break;

      default:
        if (next.startsWith('--')) {
          throw new Error(`Unknown option provided to generator "${next}"`);
        } else {
          // Assume option is a file to parse
          options.files.push(next);
          index += 1;
        }
    }
  }

  return options
}