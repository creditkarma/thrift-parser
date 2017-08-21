import { ThriftDocument, Token } from './src/types';
import { Scanner, createScanner } from './src/scanner';
import { Parser, createParser } from './src/parser';
import { organize } from './src/organizer';
export * from './src/types';

export function parse(source: string): ThriftDocument {
  console.log('source: ', source);
  var hadError: boolean = false;
  const scanner: Scanner = createScanner(source);
  const tokens: Array<Token> = scanner.scan();

  const parser: Parser = createParser(tokens);
  const intermediate: ThriftDocument = parser.parse();
  const thrift: ThriftDocument = organize(intermediate);

  return thrift;
}

export function report(line: number, column: number, where: string, message: string): void {

}