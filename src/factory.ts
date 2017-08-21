import {
  Token,
  SyntaxType,
  TextLocation
} from './types';

export function createToken(type: SyntaxType, text: string, loc: TextLocation): Token {
  return { type, text, loc };
}