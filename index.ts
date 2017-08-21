import { ThriftDocument, Token } from './src/types';
import { Scanner, createScanner } from './src/scanner';
import { Parser, createParser } from './src/parser';
export * from './src/types';

export function parse(source: string): ThriftDocument {
  console.log('source: ', source);
  var hadError: boolean = false;
  const scanner: Scanner = createScanner(source);
  const tokens: Array<Token> = scanner.scan();

  const parser: Parser = createParser(tokens);
  const thrift: ThriftDocument = parser.parse();

  return thrift;
}