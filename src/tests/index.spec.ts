import { assert } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from '../main'
import { ThriftDocument, ThriftErrors } from '../main/types'

function readFixture(name: string): string {
    return fs.readFileSync(
        path.join(__dirname, `./parser/fixtures/${name}.thrift`),
        'utf-8',
    )
}

function loadSolution(name: string): object {
    return JSON.parse(
        fs.readFileSync(
            path.join(__dirname, `./parser/solutions/${name}.solution.json`),
            'utf-8',
        ),
    )
}

function objectify(thrift: ThriftDocument): object {
    return JSON.parse(JSON.stringify(thrift))
}

describe('Thrift Parser', () => {
    it('should return correct errors object for complex file', () => {
        const content: string = readFixture('errors-complex')
        const thrift: ThriftDocument | ThriftErrors = parse(content)

        const expected: any = loadSolution('errors-complex')

        assert.deepEqual(thrift, expected)
    })

    it('should allow disabling the organizer', () => {
        const content: string = readFixture('out-of-order')
        const thrift = parse(content, {
            organize: false,
        }) as ThriftDocument

        const expected: any = loadSolution('out-of-order')

        assert.deepEqual(objectify(thrift), expected)
    })
})
