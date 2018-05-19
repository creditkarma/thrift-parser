import { ErrorReporter, noopReporter } from './debugger'
import { createScanError, createToken } from './factory'
import { KEYWORDS } from './keywords'
import { SyntaxType, TextLocation, Token } from './types'

function isDigit(value: string): boolean {
    return value >= '0' && value <= '9'
}

function isAlpha(value: string): boolean {
    return (value >= 'a' && value <= 'z') || (value >= 'A' && value <= 'Z')
}

// The first character of an Identifier can be a letter or underscore
function isAlphaOrUnderscore(value: string): boolean {
    return isAlpha(value) || value === '_'
}

function isValidIdentifier(value: string): boolean {
    return isAlphaOrUnderscore(value) || isDigit(value) || value === '.' || value === '-'
}

function isHexDigit(value: string): boolean {
    return (value >= '0' && value <= '9') || (value >= 'A' && value <= 'F') || (value >= 'a' && value <= 'f')
}

function isWhiteSpace(char: string): boolean {
    switch (char) {
        case ' ':
        case '\r':
        case '\t':
        case '\n':
            return true

        default:
            return false
    }
}

class ScanError extends Error {
    public message: string
    public loc: TextLocation
    constructor(msg: string, loc: TextLocation) {
        super(msg)
        this.message = msg
        this.loc = loc
    }
}

export interface Scanner {
    scan(): Array<Token>
    syncronize(): void
}

export function createScanner(src: string, report: ErrorReporter = noopReporter) {
    const source: string = src
    const tokens: Array<Token> = []
    let line: number = 1
    let column: number = 1
    let startLine: number = 1
    let startColumn: number = 1
    let startIndex: number = 0
    let currentIndex: number = 0

    function scan(): Array<Token> {
        while (!isAtEnd()) {
            try {
                startIndex = currentIndex
                startLine = line
                startColumn = column
                scanToken()
            } catch (e) {
                report(createScanError(e.message, e.loc))
            }
        }

        startIndex = currentIndex
        addToken(SyntaxType.EOF)

        return tokens
    }

    // Find the beginning of the next word to restart parse after error
    function syncronize(): void {
        while (!isAtEnd() && !isWhiteSpace(current())) {
            advance()
        }
    }

    function scanToken(): void {
        const next = advance()
        switch (next) {
            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace.
                break

            case '\n':
                nextLine()
                break

            case '&':
                // Thirft supports (undocumented by the grammar) a syntax for c-style pointers
                // Pointers are indicated by the '&' token. As these are not relevant to JavaScript we
                // drop them here. This may not be the best thing to do, perhaps should leave them in
                // the parse tree and allow consumers to deal.
                break

            case '=':
                addToken(SyntaxType.EqualToken)
                break

            case '(':
                addToken(SyntaxType.LeftParenToken)
                break

            case ')':
                addToken(SyntaxType.RightParenToken)
                break

            case '{':
                addToken(SyntaxType.LeftBraceToken)
                break

            case '}':
                addToken(SyntaxType.RightBraceToken)
                break

            case '[':
                addToken(SyntaxType.LeftBracketToken)
                break

            case ']':
                addToken(SyntaxType.RightBracketToken)
                break

            case ';':
                addToken(SyntaxType.SemicolonToken)
                break

            case ',':
                addToken(SyntaxType.CommaToken)
                break

            // Strings can use single or double quotes
            case '"':
            case "'":
                string(next)
                break

            case ':':
                addToken(SyntaxType.ColonToken)
                break

            case '#':
                singleLineComment()
                break

            case '/':
                if (peek() === '/') {
                    singleLineComment()
                } else if (peek() === '*') {
                    multilineComment()
                } else {
                    reportError(`Unexpected token: ${next}`)
                }
                break

            case '<':
                addToken(SyntaxType.LessThanToken)
                break

            case '>':
                addToken(SyntaxType.GreaterThanToken)
                break

            case '-':
                if (isDigit(peek())) {
                    number()
                } else {
                    addToken(SyntaxType.MinusToken)
                }
                break

            default:
                if (isDigit(next)) {
                    number()
                } else if (isAlphaOrUnderscore(next)) {
                    identifier()
                } else if (isValidIdentifier(next)) {
                    reportError(
                        `Invalid identifier '${next}': Identifiers must begin with a letter or underscore`,
                    )
                } else {
                    reportError(`Unexpected token: ${next}`)
                }
        }
    }

    function identifier(): void {
        while (!isAtEnd() && peek() !== '\n' && isValidIdentifier(peek())) {
            advance()
        }

        const literal: string = source.substring(startIndex, currentIndex)
        const type: SyntaxType = KEYWORDS[literal]

        if (type == null) {
            addToken(SyntaxType.Identifier, literal)
        } else {
            addToken(type, literal)
        }
    }

    function number(): void {
        if (current() === '0' && (consume('x') || consume('X'))) {
            hexadecimal()
        } else {
            integer()

            if (peek() === 'e' || peek() === 'E') {
                enotation()
            } else if (peek() === '.' && isDigit(peekNext())) {
                float()
            } else {
                commitToken(SyntaxType.IntegerLiteral)
            }
        }
    }

    function hexadecimal(): void {
        while (!isAtEnd() && peek() !== '\n' && isHexDigit(peek())) {
            advance()
        }

        commitToken(SyntaxType.HexLiteral)
    }

    function enotation(): void {
        consume('e') || consume('E')
        consume('-') || consume('+')
        if (isDigit(peek())) {
            integer()
            commitToken(SyntaxType.ExponentialLiteral)
        } else {
            reportError(`Invalid use of e-notation`)
        }
    }

    function float(): void {
        consume('.')
        integer()

        if (peek() === 'e' || peek() === 'E') {
            enotation()
        } else {
            commitToken(SyntaxType.FloatLiteral)
        }
    }

    function integer(): void {
        while (!isAtEnd() && peek() !== '\n' && isDigit(peek())) {
            advance()
        }
    }

    function singleLineComment(): void {
        let comment: string = ''

        while (true) {
            if (
                current() === '\n' ||
                isAtEnd() ||
                (current() !== '/' && current() !== '#' && current() !== ' ')
            ) {
                break
            } else {
                advance()
            }
        }

        if (current() !== '\n') {
            // A comment goes until the end of the line.
            while (peek() !== '\n' && !isAtEnd()) {
                comment += current()
                advance()
            }

            comment += current()
        }

        addToken(SyntaxType.CommentLine, comment.trim())
    }

    function multilineComment(): void {
        let comment: string = ''
        let cursor: number = 0

        while (true) {
            if (
                current() === '\n' ||
                isAtEnd() ||
                (current() !== '/' && current() !== '*' && current() !== ' ')
            ) {
                break
            } else {
                advance()
            }
        }

        while (true) {
            if (current() === '\n') {
                nextLine()
            }

            if (comment.charAt(cursor - 1) === '\n' && (peek() === ' ' || peek() === '*')) {
                /**
                 * We ignore stars and spaces after a new line to normalize comment formatting.
                 * We're only keeping the text of the comment without the extranious formatting.
                 */
            } else {
                comment += current()
                cursor += 1
            }

            advance()

            // A comment goes until we find a comment terminator (*/).
            if ((peek() === '*' && peekNext() === '/') || isAtEnd()) {
                advance()
                advance()
                break
            }
        }

        addToken(SyntaxType.CommentBlock, comment.trim())
    }

    function string(terminator: string): void {
        while (!isAtEnd() && peek() !== terminator) {
            if (peek() === '\n') {
                nextLine()
            }
            if (peek() === '\\') {
                advance()
            }

            advance()
        }

        if (isAtEnd() && previous() !== terminator) {
            reportError(`String must be terminated with ${terminator}`)
        } else {
            // advance past closing "
            advance()
            // We use "+ 1" and "- 1" to remove the quote markes from the string and unsescape escaped terminators
            const literal: string = source.substring(startIndex + 1, currentIndex - 1).replace(/\\(\"|\')/g, '$1')
            addToken(SyntaxType.StringLiteral, literal)
        }
    }

    function consume(text: string): boolean {
        if (peek() === text) {
            advance()
            return true
        }

        return false
    }

    function advance(): string {
        currentIndex++
        column++
        return source.charAt(currentIndex - 1)
    }

    function previous(): string {
        return source.charAt(currentIndex - 2)
    }

    function current(): string {
        return source.charAt(currentIndex - 1)
    }

    function peek(): string {
        return source.charAt(currentIndex)
    }

    function peekNext(): string {
        return source.charAt(currentIndex + 1)
    }

    function nextLine() {
        line++
        column = 1
    }

    function commitToken(type: SyntaxType): void {
        const literal: string = source.substring(startIndex, currentIndex)
        addToken(type, literal)
    }

    function currentLocation(): TextLocation {
        return {
            start: {
                line: startLine,
                column: startColumn,
                index: startIndex,
            },
            end: {
                line,
                column,
                index: currentIndex,
            },
        }
    }

    function addToken(type: SyntaxType, value: string = ''): void {
        const loc: TextLocation = currentLocation()
        tokens.push(createToken(type, value, loc))
    }

    function isAtEnd(): boolean {
        return currentIndex >= source.length
    }

    function reportError(msg: string): void {
        throw new ScanError(msg, currentLocation())
    }

    return {
        scan,
        syncronize,
    }
}
