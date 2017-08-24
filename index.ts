import { ThriftDocument, Token } from './src/types';
import { Scanner, createScanner } from './src/scanner';
import { Parser, createParser } from './src/parser';
import { organize } from './src/organizer';

export * from './src/types';
export { createScanner } from './src/scanner';
export { createParser } from './src/parser';

export function parse(source: string): ThriftDocument {
  const scanner: Scanner = createScanner(source);
  const tokens: Array<Token> = scanner.scan();

  const parser: Parser = createParser(tokens);
  const intermediate: ThriftDocument = parser.parse();
  const thrift: ThriftDocument = organize(intermediate);

  return thrift;
}