import * as fs from 'fs'
import * as path from 'path'
import { createDebugger, Debugger } from './debugger'
import { organize } from './organizer'
import { createParser, Parser } from './parser'
import { createScanner, Scanner } from './scanner'
import {
  ErrorType,
  SyntaxType,
  ThriftDocument,
  ThriftError,
  ThriftErrors,
  Token,
} from './types'

export * from './types'
export * from './factory'
export { createScanner } from './scanner'
export { createParser } from './parser'

export interface ParseOptions {
  fastFail: boolean
  rootDir: string
  outDir: string
  files: Array<string>
}

export const defaultOptions: ParseOptions = {
  fastFail: false,
  rootDir: '.',
  outDir: '.',
  files: [],
}

export function parseFiles(options: ParseOptions = defaultOptions): Array<ThriftDocument | ThriftErrors> {
  return options.files.map((file: string): ThriftDocument | ThriftErrors => {
    const filePath: string = path.resolve(process.cwd(), options.rootDir, file)
    const content: string = fs.readFileSync(filePath, 'utf-8')
    return parse(content, options)
  })
}

export function parse(source: string, options: ParseOptions = defaultOptions): ThriftDocument | ThriftErrors {
  const debug: Debugger = createDebugger(source)
  const scanner: Scanner = createScanner(source, handleError)
  const tokens: Array<Token> = scanner.scan()

  const parser: Parser = createParser(tokens, handleError)
  const intermediate: ThriftDocument = parser.parse()
  const thrift: ThriftDocument = organize(intermediate)

  /**
   * This is a safe handler for errors that allows the parser and scanner to recover to a
   * reasonable state after an error and continue with the parse. If an error occurs we will
   * not return any output, but using this allows us to catch more errors and report them to
   * the user at once instead of the work flow of find error -> fix error, find error -> fix error.
   *
   * @param err
   */
  function handleError(err: ThriftError): void {
    debug.report(err)
    if (options.fastFail) {
      debug.print()
      throw new Error(err.message)
    } else {
      switch (err.type) {
        case ErrorType.ParseError:
          parser.synchronize()
          break

        case ErrorType.ScanError:
          scanner.syncronize()
          break
      }
    }
  }

  if (debug.hasError()) {
    debug.print()
    return {
      type: SyntaxType.ThriftErrors,
      errors: debug.getErrors(),
    }
  } else {
    return thrift
  }
}
