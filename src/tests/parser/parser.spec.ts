import { assert } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { createParser, Parser } from '../../main/parser'
import { createScanner, Scanner } from '../../main/scanner'
import { ThriftDocument, Token } from '../../main/types'

function loadSource(name: string): string {
    return fs.readFileSync(
        path.join(__dirname, `./fixtures/${name}.thrift`),
        'utf-8',
    )
}

function loadSolution(name: string): object {
    return JSON.parse(
        fs.readFileSync(
            path.join(__dirname, `./solutions/${name}.solution.json`),
            'utf-8',
        ),
    )
}

function objectify(thrift: ThriftDocument): object {
    return JSON.parse(JSON.stringify(thrift))
}

describe('Parser', () => {
    it('should parse complex.thrift', () => {
        const content: string = loadSource('complex')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()
        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        // This AST is large, but it contains 38 statements
        assert.deepEqual(thrift.body.length, 38)
    })

    it('should correctly parse the syntax of a const list', () => {
        const content: string = loadSource('const-list')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('const-list')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a const map', () => {
        const content: string = loadSource('const-map')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('const-map')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse a value initialized to a negative number', () => {
        const content: string = loadSource('const-i32')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('const-i32')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a typedef definition', () => {
        const content: string = loadSource('typedef')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('typedef')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse a typedef that references an identifier', () => {
        const content: string = loadSource('typedef-identifier')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('typedef-identifier')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse inline block comments', () => {
        const content: string = loadSource('typedef-commented')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('typedef-commented')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of an include', () => {
        const content: string = loadSource('include')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('include')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a namespace definition', () => {
        const content: string = loadSource('namespace')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('namespace')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a struct', () => {
        const content: string = loadSource('struct')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('struct')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the consts and typedefs with trailing-comma', () => {
        const content: string = loadSource('trailing-semi-colon')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('trailing-semi-colon')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of an exception', () => {
        const content: string = loadSource('exception')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('exception')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a struct with commented fields', () => {
        const content: string = loadSource('struct-commented')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('struct-commented')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a struct with initializers', () => {
        const content: string = loadSource('struct-initializers')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('struct-initializers')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of an enum', () => {
        const content: string = loadSource('enum')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('enum')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse an enum with field commented out', () => {
        const content: string = loadSource('enum-commented')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('enum-commented')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of an enum with initialized member', () => {
        const content: string = loadSource('enum-initializers')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('enum-initializers')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of an enum with member initialized to hex value', () => {
        const content: string = loadSource('enum-hex')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('enum-hex')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a simple service', () => {
        const content: string = loadSource('service')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a service with mixed oneway functions', () => {
        const content: string = loadSource('service-oneway')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service-oneway')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse a service where functions are separated by commas or semicolons', () => {
        const content: string = loadSource('service-separators')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service-separators')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a service with commented functions', () => {
        const content: string = loadSource('service-commented')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service-commented')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse complex commenting', () => {
        const content: string = loadSource('complex-comments')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('complex-comments')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse a service containing a function with custom type', () => {
        const content: string = loadSource('service-custom')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service-custom')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse the syntax of a service containing a function that throws', () => {
        const content: string = loadSource('service-throws')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service-throws')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('parses a service that extends another service', () => {
        const content: string = loadSource('service-extends')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service-extends')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('parses a service containing a function with arguments with mixed FieldIDs', () => {
        const content: string = loadSource('service-fieldids')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('service-fieldids')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse an empty list', () => {
        const content: string = loadSource('list-empty')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('list-empty')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse an empty map', () => {
        const content: string = loadSource('map-empty')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('map-empty')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse binary type', () => {
        const content: string = loadSource('const-binary')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('const-binary')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should map comments correctly', () => {
        const content: string = loadSource('comments-mapping')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('comments-mapping')

        assert.deepEqual(objectify(thrift), expected)
    })

    it('should correctly parse annotations', () => {
        const content: string = loadSource('annotations')
        const scanner: Scanner = createScanner(content)
        const tokens: Array<Token> = scanner.scan()

        const parser: Parser = createParser(tokens)
        const thrift: ThriftDocument = parser.parse()

        const expected: any = loadSolution('annotations')

        assert.deepEqual(objectify(thrift), expected)
    })
})
