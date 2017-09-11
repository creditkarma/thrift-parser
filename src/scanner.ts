import { createToken } from './factory';
import { Token, SyntaxType, TextLocation } from './types';
import { KEYWORDS } from './keywords';

function isDigit(value: string): boolean {
  return (
    value >= '0' &&
    value <= '9'
  );
}

function isAlpha(value: string): boolean {
  return (
    (value >= 'a' && value <= 'z') ||
    (value >= 'A' && value <= 'Z')
  );
}

// The first character of an Identifier can be a letter or underscore
function isAlphaOrUnderscore(value: string): boolean {
  return (
    isAlpha(value) ||
    (value === '_')
  );
}

function isAlphaNumeric(value: string): boolean {
  return isDigit(value) || isAlpha(value);
}

function isValidIdentifier(value: string): boolean {
  return (
    isAlphaOrUnderscore(value) ||
    isDigit(value) ||
    (value === '.') ||
    (value === '-')
  );
}

function isHexDigit(value: string): boolean {
  return (
    (value >= '0' && value <= '9') ||
    (value >= 'A' && value <= 'F') ||
    (value >= 'a' && value <= 'f')
  );
}

export class ScanError extends Error {}

export interface Scanner {
  scan(): Array<Token>;
}

export function createScanner(src: string) {
  const source: string = src;
  const tokens: Array<Token> = [];
  var line: number = 1;
  var column: number = 1;
  var startLine: number = 1;
  var startColumn: number = 1;
  var startIndex: number = 0;
  var currentIndex: number = 0;

  function scan(): Array<Token> {
    while (!isAtEnd()) {
      startIndex = currentIndex;
      startLine = line;
      startColumn = column;
      scanToken();
    }

    startIndex = currentIndex;
    addToken(SyntaxType.EOF);

    return tokens;
  }

  function scanToken(): void {
    const next = advance();
    switch (next) {
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break;

      case '\n':
        nextLine();
        break;

      case '&':
        // Thirft supports (undocumented by the grammar) a syntax for c-style pointers
        // Pointers are indicated by the '&' token. As these are not relevant to JavaScript we
        // drop them here. This may not be the best thing to do, perhaps should leave them in
        // the parse tree and allow consumers to deal.
        break;

      case '=':
        addToken(SyntaxType.EqualToken);
        break;

      case '(':
        addToken(SyntaxType.LeftParenToken);
        break;

      case ')':
        addToken(SyntaxType.RightParenToken);
        break;

      case '{':
        addToken(SyntaxType.LeftBraceToken);
        break;

      case '}':
        addToken(SyntaxType.RightBraceToken);
        break;

      case '[':
        addToken(SyntaxType.LeftBracketToken);
        break;

      case ']':
        addToken(SyntaxType.RightBracketToken);
        break;

      case ';':
        addToken(SyntaxType.SemicolonToken);
        break;

      case ',':
        addToken(SyntaxType.CommaToken);
        break;

      // Strings can use single or double quotes
      case '"':
      case '\'':
        string();
        break;

      case ':':
        addToken(SyntaxType.ColonToken);
        break;

      case '#':
        singleLineComment();
        break;

      case '/':
        if (peek() === '/') {
          singleLineComment();
        }
        else if (peek() === '*') {
          multilineComment();
        }
        else {
          throw new ScanError(`Unexpected token: ${next}`);
        }
        break;

      case '<':
        addToken(SyntaxType.LessThanToken);
        break;

      case '>':
        addToken(SyntaxType.GreaterThanToken);
        break;

      case '-':
        addToken(SyntaxType.MinusToken);
        break;

      default:
        if (isDigit(next)) {
          number();
        }
        else if (isAlphaOrUnderscore(next)) {
          identifier();
        }
        else if (isValidIdentifier(next)) {
          throw new ScanError(`Invalid identifier '${next}': Identifiers must begin with a letter or underscore`);
        }
        else {
          throw new ScanError(`Unexpected token: ${next}`);
        }
    }
  }

  function identifier(): void {
    while (!isAtEnd() && peek() !== '\n' && isValidIdentifier(peek())) {
      advance();
    }

    const literal: string = source.substring(startIndex, currentIndex);
    const type: SyntaxType = KEYWORDS[literal];

    if (type == null) {
      addToken(SyntaxType.Identifier, literal);
    }
    else {
      addToken(type, literal);
    }
  }

  function number(): void {
    if (current() === '0' && (consume('x') || consume('X'))) {
      hexadecimal();
    } else {
      integer();

      if (peek() === 'e' || peek() === 'E') {
        enotation();
      } else if (peek() === '.' && isDigit(peekNext())) {
        float();
      } else {
        commitToken(SyntaxType.IntegerLiteral);
      }
    }
  }

  function hexadecimal(): void {
    while(
      !isAtEnd() &&
      peek() !== '\n' &&
      isHexDigit(peek())
    ) {
      advance();
    }

    commitToken(SyntaxType.HexLiteral);
  }

  function enotation(): void {
    consume('e') || consume('E');
    consume('-') || consume('+');
    if (isDigit(peek())) {
      integer();
      commitToken(SyntaxType.ExponentialLiteral);
    } else {
      throw new ScanError(`Invalid use of e-notation`);
    }
  }

  function float(): void {
    consume('.');
    integer();

    if (peek() === 'e' || peek() === 'E') {
      enotation();
    } else {
      commitToken(SyntaxType.FloatLiteral);
    }
  }

  function integer(): void {
    while (
      !isAtEnd() &&
      peek() !== '\n' &&
      (isDigit(peek()))
    ) {
      advance();
    }
  }

  function singleLineComment(): void {
    var comment: string = '';

    if (current() === '#') {
      advance();
    } else {
      advance();
      advance();
    }

    // A comment goes until the end of the line.
    while (peek() !== '\n' && !isAtEnd()) {
      comment += current();
      advance();
    }

    comment += current();

    addToken(SyntaxType.CommentLine, comment.trim());
  }

  function multilineComment(): void {
    var comment: string = '';
    var cursor: number = 0;
    advance();
    advance();

    while (true) {
      if (peek() === '\n') {
        nextLine();
      }

      if (
        comment.charAt(cursor - 1) === '\n' &&
        (peek() === ' ' || peek() === '*')
      ) {
        /**
         * We ignore stars and spaces after a new line to normalize comment formatting.
         * We're only keeping the text of the comment without the extranious formatting.
         */
      } else {
        comment += current();
        cursor += 1;
      }

      advance();

      // A comment goes until we find a comment terminator (*/).
      if ((peek() === '*' && peekNext() === '/') || isAtEnd()) {
        advance();
        advance();
        break;
      }
    }

    addToken(SyntaxType.CommentBlock, comment.trim());
  }

  function string(): void {
    while (
      !isAtEnd() &&
      peek() !== '"' &&
      peek() !== '\''
    ) {
      if (peek() === '\n') {
        nextLine();
      }

      advance();
    }

    if (isAtEnd() && previous() !== '"') {
      throw new ScanError(`Strings must be terminated with '"'`);
    }
    else {
      // advance past closing "
      advance();
      // We use "+ 1" and "- 1" to remove the quote markes from the string
      const literal: string = source.substring(startIndex + 1, currentIndex - 1);
      addToken(SyntaxType.StringLiteral, literal);
    }
  }

  function consume(text: string): boolean {
    if (peek() === text) {
      advance();
      return true;
    }

    return false;
  }

  function advance(): string {
    currentIndex++;
    column++;
    return source.charAt(currentIndex - 1);
  }

  function previous(): string {
    return source.charAt(currentIndex - 2);
  }

  function current(): string {
    return source.charAt(currentIndex - 1);
  }

  function peek(): string {
    return source.charAt(currentIndex);
  }

  function peekNext(): string {
    return source.charAt(currentIndex + 1);
  }

  function nextLine() {
    line++;
    column = 1;
  }

  function commitToken(type: SyntaxType): void {
    const literal: string = source.substring(startIndex, currentIndex);
    addToken(type, literal);
  }

  function addToken(type: SyntaxType, value: string = ''): void {
    const loc: TextLocation = {
      start: {
        line: startLine,
        column: startColumn,
        index: startIndex
      },
      end: {
        line: line,
        column: column,
        index: currentIndex
      }
    };

    tokens.push(createToken(type, value, loc));
  }

  function isAtEnd(): boolean {
    return currentIndex >= source.length;
  }

  return {
    scan
  };
}