#!/usr/bin/env node
import { parseFiles, ParseOptions } from '../index';
import { resolveOptions } from './resolveOptions';

const cliArgs: Array<string> = process.argv.slice(2);
const options: ParseOptions = resolveOptions(cliArgs);

console.log(JSON.stringify(parseFiles(options), null, 2));