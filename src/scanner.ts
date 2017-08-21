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

export class Scanner {
  private source: string;
  private line: number;
  private column: number;
  private startLine: number;
  private startColumn: number;
  private startIndex: number;
  private currentIndex: number;
  private tokens: Array<Token>;

  constructor(src: string) {
    this.source = src;
    this.tokens = [];
    this.line = 1;
    this.column = 1;
    this.currentIndex = 0;
  }

  scan(): Array<Token> {
    while (!this.isAtEnd()) {
      this.startIndex = this.currentIndex;
      this.startLine = this.line;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.startIndex = this.currentIndex;
    this.addToken(SyntaxType.EOF);

    return this.tokens;
  }

  private scanToken(): void {
    const next = this.advance();
    switch (next) {
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break;

      case '\n':
        this.nextLine();
        break;

      case '=':
        this.addToken(SyntaxType.EqualToken);
        break;

      case '(':
        this.addToken(SyntaxType.LeftParenToken);
        break;

      case ')':
        this.addToken(SyntaxType.RightParenToken);
        break;

      case '{':
        this.addToken(SyntaxType.LeftBraceToken);
        break;

      case '}':
        this.addToken(SyntaxType.RightBraceToken);
        break;

      case '[':
        this.addToken(SyntaxType.LeftBracketToken);
        break;

      case ']':
        this.addToken(SyntaxType.RightBracketToken);
        break;

      case ';':
        this.addToken(SyntaxType.SemicolonToken);
        break;

      case ',':
        this.addToken(SyntaxType.CommaToken);
        break;

      // Strings can use single or double quotes
      case '"':
      case '\'':
        this.string();
        break;

      case ':':
        this.addToken(SyntaxType.ColonToken);
        break;

      case '#':
        this.singleLineComment();
        break;

      case '/':
        if (this.peek() === '/') {
          this.singleLineComment();
        }
        else if (this.peek() === '*') {
          this.multilineComment();
        }
        else {
          throw new ScanError(`Unexpected token: ${next}`);
        }
        break;

      case '<':
        this.addToken(SyntaxType.LessThanToken);
        break;

      case '>':
        this.addToken(SyntaxType.GreaterThanToken);
        break;

      case '-':
        this.addToken(SyntaxType.MinusToken);
        break;

      default:
        if (isDigit(next)) {
          this.number();
        }
        else if (isAlphaOrUnderscore(next)) {
          this.identifier();
        }
        else if (isValidIdentifier(next)) {
          throw new ScanError(`Invalid identifier '${next}': Identifiers must begin with a letter or underscore`);
        }
        else {
          throw new ScanError(`Unexpected token: ${next}`);
        }
    }
  }

  private identifier(): void {
    while (!this.isAtEnd() && this.peek() !== '\n' && isValidIdentifier(this.peek())) {
      this.advance();
    }

    const literal: string = this.source.substring(this.startIndex, this.currentIndex);
    const type: SyntaxType = KEYWORDS[literal];

    if (type == null) {
      this.addToken(SyntaxType.Identifier, literal);
    }
    else {
      this.addToken(type, literal);
    }
  }

  private number(): void {
    if (this.current() === '0' && (this.consume('x') || this.consume('X'))) {
      this.hexadecimal();
    } else {
      this.integer();

      if (this.peek() === 'e' || this.peek() === 'E') {
        this.enotation();
      } else if (this.peek() === '.' && isDigit(this.peekNext())) {
        this.float();
      } else {
        this.commitToken(SyntaxType.IntegerLiteral);
      }
    }
  }

  private hexadecimal(): void {
    while(
      !this.isAtEnd() &&
      this.peek() !== '\n' &&
      isHexDigit(this.peek())
    ) {
      this.advance();
    }

    this.commitToken(SyntaxType.HexLiteral);
  }

  private enotation(): void {
    this.consume('e') || this.consume('E');
    this.consume('-') || this.consume('+');
    if (isDigit(this.peek())) {
      this.integer();
      this.commitToken(SyntaxType.ExponentialLiteral);
    } else {
      throw new ScanError(`Invalid use of e-notation`);
    }
  }

  private float(): void {
    this.consume('.');
    this.integer();

    if (this.peek() === 'e' || this.peek() === 'E') {
      this.enotation();
    } else {
      this.commitToken(SyntaxType.FloatLiteral);
    }
  }

  private integer(): void {
    while (
      !this.isAtEnd() &&
      this.peek() !== '\n' &&
      (isDigit(this.peek()))
    ) {
      this.advance();
    }
  }

  private singleLineComment(): void {
    var comment: string = '';
    
    if (this.current() === '#') {
      this.advance();
    } else {
      this.advance();
      this.advance();
    }

    // A comment goes until the end of the line.
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      comment += this.current();
      this.advance();
    }

    comment += this.current();

    this.addToken(SyntaxType.CommentLine, comment.trim());
  }

  private multilineComment(): void {
    var comment: string = '';
    var cursor: number = 0;
    this.advance();
    this.advance();

    while (true) {
      if (this.peek() === '\n') {
        this.nextLine();
      }

      if (
        comment.charAt(cursor - 1) === '\n' &&
        (this.peek() === ' ' || this.peek() === '*')
      ) {
        /**
         * We ignore stars and spaces after a new line to normalize comment formatting.
         * We're only keeping the text of the comment without the extranious formatting.
         */
      } else {
        comment += this.current();
        cursor += 1;
      }

      this.advance();

      // A comment goes until we find a comment terminator (*/).
      if ((this.peek() === '*' && this.peekNext() === '/') || this.isAtEnd()) {
        this.advance();
        this.advance();
        break;
      }
    }

    this.addToken(SyntaxType.CommentBlock, comment.trim());
  }

  private string(): void {
    while (
      !this.isAtEnd() &&
      this.peek() !== '"' &&
      this.peek() !== '\''
    ) {
      if (this.peek() === '\n') {
        this.nextLine();
      }

      this.advance();
    }

    if (this.isAtEnd() && this.previous() !== '"') {
      throw new ScanError(`Strings must be terminated with '"'`);
    }
    else {
      // advance past closing "
      this.advance();
      // We use "+ 1" and "- 1" to remove the quote markes from the string
      const literal: string = this.source.substring(this.startIndex + 1, this.currentIndex - 1);
      this.addToken(SyntaxType.StringLiteral, literal);
    }
  }

  private consume(text: string): boolean {
    if (this.peek() === text) {
      this.advance();
      return true;
    }

    return false;
  }

  private advance(): string {
    this.currentIndex++;
    this.column++;
    return this.source.charAt(this.currentIndex - 1);
  }

  private previous(): string {
    return this.source.charAt(this.currentIndex - 2);
  }

  private current(): string {
    return this.source.charAt(this.currentIndex - 1);
  }

  private peek(): string {
    return this.source.charAt(this.currentIndex);
  }

  private peekNext(): string {
    return this.source.charAt(this.currentIndex + 1);
  }

  private nextLine() {
    this.line++;
    this.column = 0;
  }

  private commitToken(type: SyntaxType): void {
    const literal: string = this.source.substring(this.startIndex, this.currentIndex);
    this.addToken(type, literal);
  }

  private addToken(type: SyntaxType, value: string = ''): void {
    const loc: TextLocation = {
      start: {
        line: this.startLine,
        column: this.startColumn,
        index: this.startIndex
      },
      end: {
        line: this.line,
        column: this.column,
        index: this.currentIndex
      }
    };

    this.tokens.push(createToken(type, value, loc));
  }

  private isAtEnd(): boolean {
    return this.currentIndex >= this.source.length;
  }
}

export function createScanner(src: string): Scanner {
  return new Scanner(src);
}