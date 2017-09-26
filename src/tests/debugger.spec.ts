import { assert } from 'chai'
import {
  createDebugger,
  Debugger,
  FormattedError,
} from '../main/debugger'
import { ErrorType, ParseError } from '../main/types'

describe('Debugger', () => {
  it('report method should format errors', () => {
    const source: string = `
      struct Test {
        1: required i32 field1
        2: required field2
        3: optional double field3
        4: required string field4
      }
    `
    const debug: Debugger = createDebugger(source)
    const parseError: ParseError = {
      type: ErrorType.ParseError,
      message: 'Missing field type',
      loc: {
        start: { line: 4, column: 21, index: 78 },
        end: { line: 4, column: 21, index: 78 },
      },
    }
    debug.report(parseError)
    const expected: FormattedError = {
      sourceLine: `        2: required field2`,
      locIndicator: `                    ^`,
      line: 4,
      column: 21,
      message: `Missing field type`,
      type: ErrorType.ParseError,
    }
    const actual: FormattedError =  debug.getFormattedErrors()[0]

    assert.deepEqual(actual, expected)
  })
})
