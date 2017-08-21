import { assert } from 'chai';
import { createScanner, Scanner } from './scanner';
import { createParser, Parser } from './parser';
import { Token, SyntaxType, ThriftDocument } from './types';
import {
  createTextPosition,
  createIdentifier,
  createStringLiteral
} from './factory';

describe('Parser', () => {
  it('should correctly parse the syntax of a typedef definition', () => {
    const content: string = `
      typedef string name
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const parser: Parser = createParser(tokens);
    const thrift: ThriftDocument = parser.parse();

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.TypedefDefinition,
          name: createIdentifier('name', {
            start: { line: 2, column: 21, index: 22 },
            end: { line: 2, column: 25, index: 26 }
          }),
          definitionType: {
            type: SyntaxType.StringKeyword,
            loc: {
              start: { line: 2, column: 14, index: 15 },
              end: { line: 2, column: 20, index: 21 }
            }
          },
          loc: {
            start: { line: 2, column: 6, index: 7 },
            end: { line: 2, column: 25, index: 26 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of a namespace definition', () => {
    const content: string = `
      namespace js test
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const parser: Parser = createParser(tokens);
    const thrift: ThriftDocument = parser.parse();

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.NamespaceDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'test',
            loc: {
              start: {
                line: 2,
                column: 19,
                index: 20
              },
              end: {
                line: 2,
                column: 23,
                index: 24
              }
            }
          },
          scope: {
            type: SyntaxType.NamespaceScope,
            value: 'js',
            loc: {
              start: {
                line: 2,
                column: 16,
                index: 17
              },
              end: {
                line: 2,
                column: 18,
                index: 19
              }
            }
          },
          loc: {
            start: {
              line: 2,
              column: 6,
              index: 7
            },
            end: {
              line: 2,
              column: 23,
              index: 24
            }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of a simple service', () => {
    const content: string = `
      service Test {
        bool test()
      }
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const parser: Parser = createParser(tokens);
    const thrift: ThriftDocument = parser.parse();

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.ServiceDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'Test',
            loc: {
              start: {
                line: 2,
                column: 14,
                index: 15
              },
              end: {
                line: 2,
                column: 18,
                index: 19
              }
            }
          },
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 13, index: 35 },
                end: { line: 3, column: 17, index: 39 }
              }),
              fields: [],
              throws: [],
              returnType: {
                type: SyntaxType.BoolKeyword,
                loc: {
                  start: { line: 3, column: 8, index: 30 },
                  end: { line: 3, column: 12, index: 34 }
                }
              },
              loc: {
                start: { line: 3, column: 8, index: 30 },
                end: { line: 3, column: 17, index: 39 }
              }
            }
          ],
          extends: null,
          loc: {
            start: { line: 2, column: 6, index: 7 },
            end: { line: 4, column: 7, index: 49 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse a service containing a function with custom type', function() {
    const content: string = `
      service Test {
        TestType test()
      }
    `;

    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const parser: Parser = createParser(tokens);
    const thrift: ThriftDocument = parser.parse();

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.ServiceDefinition,
          name: createIdentifier('Test', {
            start: { line: 2, column: 14, index: 15 },
            end: { line: 2, column: 18, index: 19 },
          }),
          extends: null,
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 17, index: 39 },
                end: { line: 3, column: 21, index: 43 }
              }),
              fields: [],
              throws: [],
              returnType: {
                type: SyntaxType.Identifier,
                value: 'TestType',
                loc: {
                  start: { line: 3, column: 8, index: 30 },
                  end: { line: 3, column: 16, index: 38 }
                }
              },
              loc: {
                start: { line: 3, column: 8, index: 30 },
                end: { line: 3, column: 21, index: 43 }
              }
            }
          ],
          loc: {
            start: { line: 2, column: 6, index: 7 },
            end: { line: 4, column: 7, index: 53 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });


  it('parses a service containing a function with arguments with mixed FieldIDs', function() {
    const content: string = `
      service Test {
        void test(string test1, 1: bool test2)
      }
    `;

    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const parser: Parser = createParser(tokens);
    const thrift: ThriftDocument = parser.parse();

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.ServiceDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'Test',
            loc: {
              start: {
                line: 2,
                column: 14,
                index: 15
              },
              end: {
                line: 2,
                column: 18,
                index: 19
              }
            }
          },
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 13, index: 35 },
                end: { line: 3, column: 17, index: 39 }
              }),
              fields: [
                {
                  type: SyntaxType.FieldDefinition,
                  fieldID: null,
                  requiredness: null,
                  defaultValue: null,
                  name: createIdentifier('test1', {
                    start: { line: 3, column: 25, index: 47 },
                    end: { line: 3, column: 30, index: 52 }
                  }),
                  fieldType: {
                    type: SyntaxType.StringKeyword,
                    loc: {
                      start: { line: 3, column: 18, index: 40 },
                      end: { line: 3, column: 24, index: 46 }
                    }
                  },
                  loc: {
                    start: { line: 3, column: 18, index: 40 },
                    end: { line: 3, column: 31, index: 53 }
                  }
                },
                {
                  type: SyntaxType.FieldDefinition,
                  fieldID: {
                    type: SyntaxType.FieldID,
                    value: 1,
                    loc: {
                      start: { line: 3, column: 32, index: 54 },
                      end: { line: 3, column: 34, index: 56 }
                    }
                  },
                  requiredness: null,
                  defaultValue: null,
                  name: createIdentifier('test2', {
                    start: { line: 3, column: 40, index: 62 },
                    end: { line: 3, column: 45, index: 67 }
                  }),
                  fieldType: {
                    type: SyntaxType.BoolKeyword,
                    loc: {
                      start: { line: 3, column: 35, index: 57 },
                      end: { line: 3, column: 39, index: 61 }
                    }
                  },
                  loc: {
                    start: { line: 3, column: 32, index: 54 },
                    end: { line: 3, column: 45, index: 67  }
                  }
                }
              ],
              throws: [],
              returnType: {
                type: SyntaxType.VoidKeyword,
                loc: {
                  start: { line: 3, column: 8, index: 30 },
                  end: { line: 3, column: 12, index: 34 }
                }
              },
              loc: {
                start: { line: 3, column: 8, index: 30 },
                end: { line: 3, column: 17, index: 39 }
              }
            }
          ],
          extends: null,
          loc: {
            start: {
              line: 2,
              column: 6,
              index: 7
            },
            end: {
              line: 4,
              column: 7,
              index: 76
            }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse a simple enum', function() {
    const content: string = `
      enum Test {
        ONE,
        TWO
      }
    `;

    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const parser: Parser = createParser(tokens);
    const thrift: ThriftDocument = parser.parse();

    // console.log(JSON.stringify(thrift, null, 2));

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.EnumDefinition,
          name: createIdentifier('Test', {
            start: { line: 2, column: 11, index: 12 },
            end: { line: 2, column: 15, index: 16 }
          }),
          members: [
            {
              type: SyntaxType.EnumMember,
              name: createIdentifier('ONE', {
                start: { line: 3, column: 8, index: 27 },
                end: { line: 3, column: 11, index: 30 }
              }),
              initializer: null,
              loc: {
                start: { line: 3, column: 8, index: 27 },
                end: { line: 3, column: 11, index: 30 }
              }
            },
            {
              type: SyntaxType.EnumMember,
              name: createIdentifier('TWO', {
                start: { line: 4, column: 8, index: 40 },
                end: { line: 4, column: 11, index: 43 }
              }),
              initializer: null,
              loc: {
                start: { line: 4, column: 8, index: 40 },
                end: { line: 4, column: 11, index: 43 }
              }
            }
          ],
          loc: {
            start: { line: 2, column: 6, index: 7 },
            end: { line: 5, column: 7, index: 51 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });
});