import { Token } from './src/types';
import { Scanner, createScanner } from './src/scanner';
export * from './src/types';

export function parse(source: string): Array<Token> {
  console.log('source: ', source);
  const scanner: Scanner = createScanner(source);
  const tokens: Array<Token> = scanner.scan();

 return tokens
}