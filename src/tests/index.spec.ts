import { assert } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from '../main'
import { ThriftDocument, ThriftErrors } from '../main/types'

function readFixture(name: string): string {
    return fs.readFileSync(path.join(__dirname, `./parser/fixtures/${name}.thrift`), 'utf-8')
}

function loadSolution(name: string): object {
    return JSON.parse(fs.readFileSync(path.join(__dirname, `./parser/solutions/${name}.solution.json`), 'utf-8'))
}

describe('Thrift Parser', () => {
    it('should return correct errors object for complex file', () => {
        const content: string = readFixture('errors-complex')
        const thrift: ThriftDocument | ThriftErrors = parse(content)

        const expected: any = loadSolution('errors-complex')

        assert.deepEqual(thrift, expected)
    })
})
