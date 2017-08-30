import { assert } from 'chai';
import { ParseError, ErrorType } from './types';
import {
  createTextPosition,
  createIdentifier,
  createStringLiteral
} from './factory';
import {
  Debugger,
  FormattedError,
  getSourceLine,
  formatError
} from './debugger';

describe('Debugger', () => {
  describe('getSourceLine', () => {
    it('should get the line of source for a given line number', () => {
      const source: string = `one line\n two line\n three line\n four line\n`;
      const expected: string = ` two line`;
      const actual: string = getSourceLine(2, source);

      assert.equal(actual, expected);
    });

    it('should return null for out-of-bounds line request', () => {
      const source: string = `one line\n two line\n three line\n four line\n`;
      const expected: string = null;
      const actual: string = getSourceLine(21, source);

      assert.equal(actual, expected);
    });
  })

  describe('formatError', () => {
    it('should get the line of source for a given line number', () => {
      const source: string = `
        struct Test {
          1: required i32 field1
          2: required field2
          3: optional double field3
          4: required string field4
        }
      `;
      const parseError: ParseError = {
        type: ErrorType.ParseError,
        message: 'Missing field type',
        loc: {
          start: { line: 4, column: 23, index: 78 },
          end: { line: 4, column: 23, index: 78 }
        }
      };
      const expected: FormattedError = {
        sourceLine: `          2: required field2`,
        locIndicator: `                      ^`,
        line: 4,
        column: 23,
        message: `Missing field type`,
        type: ErrorType.ParseError
      };
      const actual: FormattedError = formatError(parseError, source);

      assert.deepEqual(actual, expected);
    });
  })
});