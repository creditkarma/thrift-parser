import { assert } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { createScanner, Scanner } from '../../main/scanner'
import { Token } from '../../main/types'

function loadSource(name: string): string {
    return fs.readFileSync(path.join(__dirname, `./fixtures/${name}.txt`), 'utf-8')
}

function loadSolution(name: string): object {
    return JSON.parse(fs.readFileSync(path.join(__dirname, `./solutions/${name}.solution.json`), 'utf-8'))
}

describe('Scanner', () => {
    it('should correctly recognize floats', () => {
        const content = loadSource('floats')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('floats')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly recognize strings with double quotes', () => {
        const content = loadSource('double-quotes')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('double-quotes')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly recognize strings with single quotes', () => {
        const content = loadSource('single-quotes')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('single-quotes')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly recognize hex values', () => {
        const content = loadSource('hex')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('hex')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly recognize e-notation', () => {
        const content = loadSource('e-notation')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('e-notation')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly recognize more complex e-notation', () => {
        const content = loadSource('e-notation-complex')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('e-notation-complex')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly return the tokens for a struct', () => {
        const content: string = loadSource('struct')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('struct')

        assert.deepEqual(tokens, expected)
    })

    it(`should remove pointer syntax '&' from the list of tokens`, () => {
        const content: string = loadSource('struct-pointer')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('struct-pointer')

        assert.deepEqual(tokens, expected)
    })

    it(`should correctly handle single-line comments with '//'`, () => {
        const content: string = loadSource('comment-line')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('comment-line')

        assert.deepEqual(tokens, expected)
    })

    it(`should correctly handle single-line comments with '#'`, () => {
        const content: string = loadSource('comment-pound')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('comment-pound')

        assert.deepEqual(tokens, expected)
    })

    it(`should correctly handle an empty comment line`, () => {
        const content: string = loadSource('comment-empty')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('comment-empty')

        assert.deepEqual(tokens, expected)
    })

    it(`should correctly handle multi-line comments with '/* ... */'`, () => {
        const content: string = loadSource('comment-block')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('comment-block')

        assert.deepEqual(tokens, expected)
    })

    it(`should correctly handle empty multi-line comments`, () => {
        const content: string = loadSource('comment-block-empty')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('comment-block-empty')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly return tokens for a simple const', () => {
        const content = loadSource('const-string')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('const-string')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly handle assignment to a negative number', () => {
        const content = loadSource('const-number')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('const-number')

        assert.deepEqual(tokens, expected)
    })

    it('should correctly handle assignment to hex values', () => {
        const content = loadSource('const-hex')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const expected: any = loadSolution('const-hex')

        assert.deepEqual(tokens, expected)
    })
})
