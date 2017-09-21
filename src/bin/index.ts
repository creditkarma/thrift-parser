#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import { mkdir } from './mkdir';
import { parseFiles, ParseOptions, ThriftDocument } from '../index';
import { resolveOptions } from './resolveOptions';

const cliArgs: Array<string> = process.argv.slice(2);
const options: ParseOptions = resolveOptions(cliArgs);

parseFiles(options).forEach((ast: ThriftDocument, index: number): void => {
  const json: string = JSON.stringify(ast, null, 2);
  const file: string = options.files[index];
  const outDir: string = path.resolve(process.cwd(), options.rootDir, options.outDir);
  const outFile: string = path.resolve(outDir, file.replace('.thrift', '.json'));

  // Verify output directory exists, create if it doesn't
  mkdir(path.dirname(outFile));

  // Write json to file
  fs.writeFileSync(outFile, json, 'utf-8');
});