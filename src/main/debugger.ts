import { ThriftError, ErrorType, TextLocation } from './types'

export interface ErrorReporter {
  (err: ThriftError): void;
}

export interface Debugger {
  hasError(): boolean;
  report: ErrorReporter;
  print(): void;
}

export interface FormattedError {
  sourceLine: string;
  locIndicator: string;
  line: number;
  column: number;
  message: string;
  type: ErrorType;
}

export function noopReporter(err: ThriftError): void {
  throw new Error(`${err.type}: Line: ${err.loc.start.line}: ${err.message}`);
}

export function getSourceLine(line: number, source: string): string {
  var currentIndex: number = 0;
  var currentLine: number = 1;
  var currentText: string = '';

  while (currentLine <= line) {
    if (currentIndex < source.length) {
      let nextChar: string = source.charAt(currentIndex++);
      if (nextChar === '\n') {
        currentLine++;
        if (currentLine <= line) {
          currentText = '';
        }
      } else {
        currentText += nextChar;
      }
    } else {
      return null;
    }
  }

  return currentText
}

function padLeft(num: number, str: string): string {
  while (str.length < num) {
    str = ' ' + str;
  }
  return str;
}

function indicatorForLocaction(loc: TextLocation): string {
  var indicator: string = padLeft(loc.start.column, '^');
  return indicator;
}

export function formatError(err: ThriftError, source: string): FormattedError {
  return {
    sourceLine: getSourceLine(err.loc.start.line, source),
    locIndicator: indicatorForLocaction(err.loc),
    line: err.loc.start.line,
    column: err.loc.start.column,
    message: err.message,
    type: err.type
  };
}

function padStart(length: number, str: string): string {
  var paddedStr: string = str;
  while (length--) {
    paddedStr = ' ' + paddedStr;
  }

  return paddedStr;
}

function errorType(type: ErrorType): string {
  switch(type) {
    case ErrorType.ParseError:
      return 'Parse Error:';

    case ErrorType.ScanError:
      return 'Scan Error:';
  }
}

export function createDebugger(source: string): Debugger {
  var errors: Array<FormattedError> = [];

  return {
    hasError(): boolean {
      return errors.length > 0;
    },

    report(err: ThriftError): void {
      const formattedError: FormattedError = formatError(err, source);
      errors.push(formattedError);
    },

    print(): void {
      console.log(`Parse Failure: ${errors.length} errors found:`);
      console.log();
      errors.forEach((err: FormattedError): void => {
        const prefix: string = `${err.line} | `;

        console.log();
        console.log(`${errorType(err.type)}\n`);
        console.log(`Message: ${err.message}`);
        console.log();
        console.log(`${prefix}${err.sourceLine}`);
        console.log(padStart(prefix.length, err.locIndicator));
        console.log();
      })
    }
  };
}