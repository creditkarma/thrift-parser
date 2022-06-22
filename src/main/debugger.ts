import * as os from 'os'
import { ErrorType, TextLocation, ThriftError } from './types'

export type ErrorReporter = (err: ThriftError) => void

export interface Debugger {
    report: ErrorReporter
    hasError(): boolean
    getErrors(): Array<ThriftError>
    getFormattedErrors(): Array<FormattedError>
    print(): void
}

export interface FormattedError {
    sourceLine: string
    locIndicator: string
    line: number
    column: number
    message: string
    type: ErrorType
}

export function noopReporter(err: ThriftError): void {
    throw new Error(`${err.type}: Line: ${err.loc.start.line}: ${err.message}`)
}

function padLeft(num: number, str: string): string {
    while (str.length < num) {
        str = ' ' + str
    }
    return str
}

function indicatorForLocaction(loc: TextLocation): string {
    const indicator: string = padLeft(loc.start.column, '^')
    return indicator
}

function padStart(length: number, str: string): string {
    let paddedStr: string = str
    while (length--) {
        paddedStr = ' ' + paddedStr
    }

    return paddedStr
}

function errorType(type: ErrorType): string {
    switch (type) {
        case ErrorType.ParseError:
            return 'Parse Error:'

        case ErrorType.ScanError:
            return 'Scan Error:'
    }
}

export function createDebugger(source: string): Debugger {
    const sourceLines: Array<string> = source.split(os.EOL)
    const formattedErrors: Array<FormattedError> = []
    const rawErrors: Array<ThriftError> = []

    function getSourceLine(lineNumber: number): string {
        return sourceLines[lineNumber - 1]
    }

    function formatError(err: ThriftError): FormattedError {
        return {
            sourceLine: getSourceLine(err.loc.start.line),
            locIndicator: indicatorForLocaction(err.loc),
            line: err.loc.start.line,
            column: err.loc.start.column,
            message: err.message,
            type: err.type,
        }
    }

    return {
        hasError(): boolean {
            return formattedErrors.length > 0
        },

        getErrors(): Array<ThriftError> {
            return rawErrors
        },

        getFormattedErrors(): Array<FormattedError> {
            return formattedErrors
        },

        report(err: ThriftError): void {
            const formattedError: FormattedError = formatError(err)
            formattedErrors.push(formattedError)
            rawErrors.push(err)
        },

        print(): void {
            console.log(
                `Parse Failure: ${formattedErrors.length} errors found:`,
            )
            console.log()
            formattedErrors.forEach((err: FormattedError): void => {
                const prefix: string = `${err.line} | `

                console.log()
                console.log(`${errorType(err.type)}\n`)
                console.log(`Message: ${err.message}`)
                console.log()
                console.log(`${prefix}${err.sourceLine}`)
                console.log(padStart(prefix.length, err.locIndicator))
                console.log()
            })
        },
    }
}
