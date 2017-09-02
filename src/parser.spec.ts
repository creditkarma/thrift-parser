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
            start: { line: 2, column: 22, index: 22 },
            end: { line: 2, column: 26, index: 26 }
          }),
          definitionType: {
            type: SyntaxType.StringKeyword,
            loc: {
              start: { line: 2, column: 15, index: 15 },
              end: { line: 2, column: 21, index: 21 }
            }
          },
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 2, column: 26, index: 26 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse a typedef that references an identifier', () => {
    const content: string = `
      typedef MyStruct name
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
            start: { line: 2, column: 24, index: 24 },
            end: { line: 2, column: 28, index: 28 }
          }),
          definitionType: createIdentifier('MyStruct', {
            start: { line: 2, column: 15, index: 15 },
            end: { line: 2, column: 23, index: 23 }
          }),
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 2, column: 28, index: 28 }
          }
        }
      ]
    }

    assert.deepEqual(thrift, expected)
  });

  it('should correctly parse inline block comments', () => {
    const content: string = `
      typedef /* string is name */ string name
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
            start: { line: 2, column: 43, index: 43 },
            end: { line: 2, column: 47, index: 47 }
          }),
          definitionType: {
            type: SyntaxType.StringKeyword,
            loc: {
              start: { line: 2, column: 36, index: 36 },
              end: { line: 2, column: 42, index: 42 }
            }
          },
          comments: [
            {
              type: SyntaxType.CommentBlock,
              value: 'string is name',
              loc: {
                start: {
                  line: 2,
                  column: 15,
                  index: 15
                },
                end: {
                  line: 2,
                  column: 35,
                  index: 35
                }
              }
            }
          ],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 2, column: 47, index: 47 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of an include', () => {
    const content: string = `
      include 'test'
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const parser: Parser = createParser(tokens);
    const thrift: ThriftDocument = parser.parse();

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.IncludeDefinition,
          path: {
            type: SyntaxType.StringLiteral,
            value: 'test',
            loc: {
              start: {
                line: 2,
                column: 15,
                index: 15
              },
              end: {
                line: 2,
                column: 21,
                index: 21
              }
            }
          },
          comments: [],
          loc: {
            start: {
              line: 2,
              column: 7,
              index: 7
            },
            end: {
              line: 2,
              column: 21,
              index: 21
            }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of a namespace definition', () => {
    const content: string = `
      namespace js test
      namespace js.ts test
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
                column: 20,
                index: 20
              },
              end: {
                line: 2,
                column: 24,
                index: 24
              }
            }
          },
          scope: {
            type: SyntaxType.Identifier,
            value: 'js',
            loc: {
              start: {
                line: 2,
                column: 17,
                index: 17
              },
              end: {
                line: 2,
                column: 19,
                index: 19
              }
            }
          },
          comments: [],
          loc: {
            start: {
              line: 2,
              column: 7,
              index: 7
            },
            end: {
              line: 2,
              column: 24,
              index: 24
            }
          }
        },
        {
          type: SyntaxType.NamespaceDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'test',
            loc: {
              start: {
                line: 3,
                column: 23,
                index: 47
              },
              end: {
                line: 3,
                column: 27,
                index: 51
              }
            }
          },
          scope: {
            type: SyntaxType.Identifier,
            value: 'js.ts',
            loc: {
              start: {
                line: 3,
                column: 17,
                index: 41
              },
              end: {
                line: 3,
                column: 22,
                index: 46
              }
            }
          },
          comments: [],
          loc: {
            start: {
              line: 3,
              column: 7,
              index: 31
            },
            end: {
              line: 3,
              column: 27,
              index: 51
            }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of a struct', () => {
    const content: string = `
      struct Test {
        1: required i32 field1
        2: required i64 field2
        3: optional double field3
        4: required string field4
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
          type: SyntaxType.StructDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'Test',
            loc: {
              start: { line: 2, column: 14, index: 14 },
              end: { line: 2, column: 18, index: 18 }
            }
          },
          fields: [
            {
              type: SyntaxType.FieldDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'field1',
                loc: {
                  start: { line: 3, column: 25, index: 45 },
                  end: { line: 3, column: 31, index: 51 }
                }
              },
              fieldID: {
                type: SyntaxType.FieldID,
                value: 1,
                loc: {
                  start: { line: 3, column: 9, index: 29 },
                  end: { line: 3, column: 11, index: 31 }
                }
              },
              fieldType: {
                type: SyntaxType.I32Keyword,
                loc: {
                  start: { line: 3, column: 21, index: 41 },
                  end: { line: 3, column: 24, index: 44 }
                }
              },
              requiredness: 'required',
              defaultValue: null,
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 29 },
                end: { line: 3, column: 31, index: 51 }
              }
            },
            {
              type: SyntaxType.FieldDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'field2',
                loc: {
                  start: { line: 4, column: 25, index: 76 },
                  end: { line: 4, column: 31, index: 82 }
                }
              },
              fieldID: {
                type: SyntaxType.FieldID,
                value: 2,
                loc: {
                  start: { line: 4, column: 9, index: 60 },
                  end: { line: 4, column: 11, index: 62 }
                }
              },
              fieldType: {
                type: SyntaxType.I64Keyword,
                loc: {
                  start: { line: 4, column: 21, index: 72 },
                  end: { line: 4, column: 24, index: 75 }
                }
              },
              requiredness: 'required',
              defaultValue: null,
              comments: [],
              loc: {
                start: { line: 4, column: 9, index: 60 },
                end: { line: 4, column: 31, index: 82 }
              }
            },
            {
              type: SyntaxType.FieldDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'field3',
                loc: {
                  start: { line: 5, column: 28, index: 110 },
                  end: { line: 5, column: 34, index: 116 }
                }
              },
              fieldID: {
                type: SyntaxType.FieldID,
                value: 3,
                loc: {
                  start: { line: 5, column: 9, index: 91 },
                  end: { line: 5, column: 11, index: 93 }
                }
              },
              fieldType: {
                type: SyntaxType.DoubleKeyword,
                loc: {
                  start: { line: 5, column: 21, index: 103 },
                  end: { line: 5, column: 27, index: 109 }
                }
              },
              requiredness: 'optional',
              defaultValue: null,
              comments: [],
              loc: {
                start: { line: 5, column: 9, index: 91 },
                end: { line: 5, column: 34, index: 116 }
              }
            },
            {
              type: SyntaxType.FieldDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'field4',
                loc: {
                  start: { line: 6, column: 28, index: 144 },
                  end: { line: 6, column: 34, index: 150 }
                }
              },
              fieldID: {
                type: SyntaxType.FieldID,
                value: 4,
                loc: {
                  start: { line: 6, column: 9, index: 125 },
                  end: { line: 6, column: 11, index: 127 }
                }
              },
              fieldType: {
                type: SyntaxType.StringKeyword,
                loc: {
                  start: { line: 6, column: 21, index: 137 },
                  end: { line: 6, column: 27, index: 143 }
                }
              },
              requiredness: 'required',
              defaultValue: null,
              comments: [],
              loc: {
                start: { line: 6, column: 9, index: 125 },
                end: { line: 6, column: 34, index: 150 }
              }
            }
          ],
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 7, column: 8, index: 158 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of a struct with commented fields', () => {
    const content: string = `
      struct Test {
        1: required i32 field1,
        # 2: required bool field2,
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
          type: SyntaxType.StructDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'Test',
            loc: {
              start: { line: 2, column: 14, index: 14 },
              end: { line: 2, column: 18, index: 18 }
            }
          },
          fields: [
            {
              type: SyntaxType.FieldDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'field1',
                loc: {
                  start: { line: 3, column: 25, index: 45 },
                  end: { line: 3, column: 31, index: 51 }
                }
              },
              fieldID: {
                type: SyntaxType.FieldID,
                value: 1,
                loc: {
                  start: { line: 3, column: 9, index: 29 },
                  end: { line: 3, column: 11, index: 31 }
                }
              },
              fieldType: {
                type: SyntaxType.I32Keyword,
                loc: {
                  start: { line: 3, column: 21, index: 41 },
                  end: { line: 3, column: 24, index: 44 }
                }
              },
              requiredness: 'required',
              defaultValue: null,
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 29 },
                end: { line: 3, column: 32, index: 52 }
              }
            }
          ],
          comments: [
            {
              type: SyntaxType.CommentLine,
              value: '2: required bool field2,',
              loc: {
                start: {
                  line: 4,
                  column: 9,
                  index: 61
                },
                end: {
                  line: 4,
                  column: 35,
                  index: 87
                }
              }
            }
          ],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 5, column: 8, index: 95 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of an enum', () => {
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

    const expected: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [
        {
          type: SyntaxType.EnumDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'Test',
            loc: {
              start: { line: 2, column: 12, index: 12 },
              end: { line: 2, column: 16, index: 16 }
            }
          },
          members: [
            {
              type: SyntaxType.EnumMember,
              name: {
                type: SyntaxType.Identifier,
                value: 'ONE',
                loc: {
                  start: { line: 3, column: 9, index: 27 },
                  end: { line: 3, column: 12, index: 30 }
                }
              },
              initializer: null,
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 27 },
                end: { line: 3, column: 12, index: 30 }
              }
            },
            {
              type: SyntaxType.EnumMember,
              name: {
                type: SyntaxType.Identifier,
                value: 'TWO',
                loc: {
                  start: { line: 4, column: 9, index: 40 },
                  end: { line: 4, column: 12, index: 43 }
                }
              },
              initializer: null,
              comments: [],
              loc: {
                start: { line: 4, column: 9, index: 40 },
                end: { line: 4, column: 12, index: 43 }
              }
            }
          ],
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 5, column: 8, index: 51 }
          }
        }
      ]
    }

    assert.deepEqual(thrift, expected)
  });

  it('should correctly parse an enum with field commented out', function() {
    const content: string = `
      enum Test {
        ONE,
        # TWO
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
          type: SyntaxType.EnumDefinition,
          name: createIdentifier('Test', {
            start: { line: 2, column: 12, index: 12 },
            end: { line: 2, column: 16, index: 16 }
          }),
          members: [
            {
              type: SyntaxType.EnumMember,
              name: createIdentifier('ONE', {
                start: { line: 3, column: 9, index: 27 },
                end: { line: 3, column: 12, index: 30 }
              }),
              initializer: null,
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 27 },
                end: { line: 3, column: 12, index: 30 }
              }
            }
          ],
          comments: [
            {
              type: SyntaxType.CommentLine,
              value: 'TWO',
              loc: {
                start: {
                  line: 4,
                  column: 9,
                  index: 40
                },
                end: {
                  line: 4,
                  column: 14,
                  index: 45
                }
              }
            }
          ],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 5, column: 8, index: 53 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of an enum with initialized member', () => {
    const content: string = `
      enum Test {
        ONE = 2,
        TWO
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
          type: SyntaxType.EnumDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'Test',
            loc: {
              start: { line: 2, column: 12, index: 12
              },
              end: { line: 2, column: 16, index: 16 }
            }
          },
          members: [
            {
              type: SyntaxType.EnumMember,
              name: {
                type: SyntaxType.Identifier,
                value: 'ONE',
                loc: {
                  start: { line: 3, column: 9, index: 27 },
                  end: { line: 3, column: 12, index: 30 }
                }
              },
              initializer: {
                type: SyntaxType.IntConstant,
                value: 2,
                loc: {
                  start: { line: 3, column: 15, index: 33 },
                  end: { line: 3, column: 16, index: 34 }
                }
              },
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 27 },
                end: { line: 3, column: 16, index: 34 }
              }
            },
            {
              type: SyntaxType.EnumMember,
              name: {
                type: SyntaxType.Identifier,
                value: 'TWO',
                loc: {
                  start: { line: 4, column: 9, index: 44 },
                  end: { line: 4, column: 12, index: 47 }
                }
              },
              initializer: null,
              comments: [],
              loc: {
                start: { line: 4, column: 9, index: 44 },
                end: { line: 4, column: 12, index: 47 }
              }
            }
          ],
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 5, column: 8, index: 55 }
          }
        }
      ]
    }

    assert.deepEqual(thrift, expected)
  });

  it('should correctly parse the syntax of an enum with member initialized to hex value', () => {
    const content: string = `
      enum Test {
        ONE = 0xaf,
        TWO
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
          type: SyntaxType.EnumDefinition,
          name: {
            type: SyntaxType.Identifier,
            value: 'Test',
            loc: {
              start: { line: 2, column: 12, index: 12
              },
              end: { line: 2, column: 16, index: 16 }
            }
          },
          members: [
            {
              type: SyntaxType.EnumMember,
              name: {
                type: SyntaxType.Identifier,
                value: 'ONE',
                loc: {
                  start: { line: 3, column: 9, index: 27 },
                  end: { line: 3, column: 12, index: 30 }
                }
              },
              initializer: {
                type: SyntaxType.IntConstant,
                value: 175,
                loc: {
                  start: { line: 3, column: 15, index: 33 },
                  end: { line: 3, column: 19, index: 37 }
                }
              },
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 27 },
                end: { line: 3, column: 19, index: 37 }
              }
            },
            {
              type: SyntaxType.EnumMember,
              name: {
                type: SyntaxType.Identifier,
                value: 'TWO',
                loc: {
                  start: { line: 4, column: 9, index: 47 },
                  end: { line: 4, column: 12, index: 50 }
                }
              },
              initializer: null,
              comments: [],
              loc: {
                start: { line: 4, column: 9, index: 47 },
                end: { line: 4, column: 12, index: 50 }
              }
            }
          ],
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 5, column: 8, index: 58 }
          }
        }
      ]
    }

    assert.deepEqual(thrift, expected)
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
              start: { line: 2, column: 15, index: 15 },
              end: { line: 2, column: 19, index: 19 }
            }
          },
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 14, index: 35 },
                end: { line: 3, column: 18, index: 39 }
              }),
              fields: [],
              throws: [],
              returnType: {
                type: SyntaxType.BoolKeyword,
                loc: {
                  start: { line: 3, column: 9, index: 30 },
                  end: { line: 3, column: 13, index: 34 }
                }
              },
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 30 },
                end: { line: 3, column: 20, index: 41 }
              }
            }
          ],
          extends: null,
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 4, column: 8, index: 49 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse a service where functions are separated by commas or semicolons', () => {
    const content: string = `
      service Test {
        bool ping()
        bool foo();
        string dang(),
        i32 ding()
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
                column: 15,
                index: 15
              },
              end: {
                line: 2,
                column: 19,
                index: 19
              }
            }
          },
          extends: null,
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'ping',
                loc: {
                  start: {
                    line: 3,
                    column: 14,
                    index: 35
                  },
                  end: {
                    line: 3,
                    column: 18,
                    index: 39
                  }
                }
              },
              returnType: {
                type: SyntaxType.BoolKeyword,
                loc: {
                  start: {
                    line: 3,
                    column: 9,
                    index: 30
                  },
                  end: {
                    line: 3,
                    column: 13,
                    index: 34
                  }
                }
              },
              fields: [],
              throws: [],
              comments: [],
              loc: {
                start: {
                  line: 3,
                  column: 9,
                  index: 30
                },
                end: {
                  line: 3,
                  column: 20,
                  index: 41
                }
              }
            },
            {
              type: SyntaxType.FunctionDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'foo',
                loc: {
                  start: {
                    line: 4,
                    column: 14,
                    index: 55
                  },
                  end: {
                    line: 4,
                    column: 17,
                    index: 58
                  }
                }
              },
              returnType: {
                type: SyntaxType.BoolKeyword,
                loc: {
                  start: {
                    line: 4,
                    column: 9,
                    index: 50
                  },
                  end: {
                    line: 4,
                    column: 13,
                    index: 54
                  }
                }
              },
              fields: [],
              throws: [],
              comments: [],
              loc: {
                start: {
                  line: 4,
                  column: 9,
                  index: 50
                },
                end: {
                  line: 4,
                  column: 20,
                  index: 61
                }
              }
            },
            {
              type: SyntaxType.FunctionDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'dang',
                loc: {
                  start: {
                    line: 5,
                    column: 16,
                    index: 77
                  },
                  end: {
                    line: 5,
                    column: 20,
                    index: 81
                  }
                }
              },
              returnType: {
                type: SyntaxType.StringKeyword,
                loc: {
                  start: {
                    line: 5,
                    column: 9,
                    index: 70
                  },
                  end: {
                    line: 5,
                    column: 15,
                    index: 76
                  }
                }
              },
              fields: [],
              throws: [],
              comments: [],
              loc: {
                start: {
                  line: 5,
                  column: 9,
                  index: 70
                },
                end: {
                  line: 5,
                  column: 23,
                  index: 84
                }
              }
            },
            {
              type: SyntaxType.FunctionDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'ding',
                loc: {
                  start: {
                    line: 6,
                    column: 13,
                    index: 97
                  },
                  end: {
                    line: 6,
                    column: 17,
                    index: 101
                  }
                }
              },
              returnType: {
                type: SyntaxType.I32Keyword,
                loc: {
                  start: {
                    line: 6,
                    column: 9,
                    index: 93
                  },
                  end: {
                    line: 6,
                    column: 12,
                    index: 96
                  }
                }
              },
              fields: [],
              throws: [],
              comments: [],
              loc: {
                start: {
                  line: 6,
                  column: 9,
                  index: 93
                },
                end: {
                  line: 6,
                  column: 19,
                  index: 103
                }
              }
            }
          ],
          comments: [],
          loc: {
            start: {
              line: 2,
              column: 7,
              index: 7
            },
            end: {
              line: 7,
              column: 8,
              index: 111
            }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of a service with commented functions', () => {
    const content: string = `
      service Test {
        bool test()
        # void ping()
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
              start: { line: 2, column: 15, index: 15 },
              end: { line: 2, column: 19, index: 19 }
            }
          },
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 14, index: 35 },
                end: { line: 3, column: 18, index: 39 }
              }),
              fields: [],
              throws: [],
              returnType: {
                type: SyntaxType.BoolKeyword,
                loc: {
                  start: { line: 3, column: 9, index: 30 },
                  end: { line: 3, column: 13, index: 34 }
                }
              },
              comments: [
                {
                  type: SyntaxType.CommentLine,
                  value: 'void ping()',
                  loc: {
                    start: {
                      line: 4,
                      column: 9,
                      index: 50
                    },
                    end: {
                      line: 4,
                      column: 22,
                      index: 63
                    }
                  }
                }
              ],
              loc: {
                start: { line: 3, column: 9, index: 30 },
                end: { line: 3, column: 20, index: 41 }
              }
            }
          ],
          extends: null,
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 5, column: 8, index: 71 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse complex commenting', () => {
    const content: string = `
      // This service does nothing
      /*
       * This is a multi-line
       * comment for testing
       */
      /*
       Another muliti-line
       comment for testing
       */
      service Test {
        bool /* should this be required? */ ping()
        # bool foo();
        // string dang(),
        i32 ding()
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
                line: 9,
                column: 15,
                index: 201
              },
              end: {
                line: 9,
                column: 19,
                index: 205
              }
            }
          },
          extends: null,
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'ping',
                loc: {
                  start: {
                    line: 10,
                    column: 45,
                    index: 252
                  },
                  end: {
                    line: 10,
                    column: 49,
                    index: 256
                  }
                }
              },
              returnType: {
                type: SyntaxType.BoolKeyword,
                loc: {
                  start: {
                    line: 10,
                    column: 9,
                    index: 216
                  },
                  end: {
                    line: 10,
                    column: 13,
                    index: 220
                  }
                }
              },
              fields: [],
              throws: [],
              comments: [
                {
                  type: SyntaxType.CommentBlock,
                  value: 'should this be required?',
                  loc: {
                    start: {
                      line: 10,
                      column: 14,
                      index: 221
                    },
                    end: {
                      line: 10,
                      column: 44,
                      index: 251
                    }
                  }
                },
                {
                  type: SyntaxType.CommentLine,
                  value: 'bool foo();',
                  loc: {
                    start: {
                      line: 11,
                      column: 9,
                      index: 267
                    },
                    end: {
                      line: 11,
                      column: 22,
                      index: 280
                    }
                  }
                },
                {
                  type: SyntaxType.CommentLine,
                  value: 'string dang(),',
                  loc: {
                    start: {
                      line: 12,
                      column: 9,
                      index: 289
                    },
                    end: {
                      line: 12,
                      column: 26,
                      index: 306
                    }
                  }
                }
              ],
              loc: {
                start: {
                  line: 10,
                  column: 9,
                  index: 216
                },
                end: {
                  line: 10,
                  column: 51,
                  index: 258
                }
              }
            },
            {
              type: SyntaxType.FunctionDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'ding',
                loc: {
                  start: {
                    line: 13,
                    column: 13,
                    index: 319
                  },
                  end: {
                    line: 13,
                    column: 17,
                    index: 323
                  }
                }
              },
              returnType: {
                type: SyntaxType.I32Keyword,
                loc: {
                  start: {
                    line: 13,
                    column: 9,
                    index: 315
                  },
                  end: {
                    line: 13,
                    column: 12,
                    index: 318
                  }
                }
              },
              fields: [],
              throws: [],
              comments: [],
              loc: {
                start: {
                  line: 13,
                  column: 9,
                  index: 315
                },
                end: {
                  line: 13,
                  column: 19,
                  index: 325
                }
              }
            }
          ],
          comments: [
            {
              type: SyntaxType.CommentLine,
              value: 'This service does nothing',
              loc: {
                start: {
                  line: 2,
                  column: 7,
                  index: 7
                },
                end: {
                  line: 2,
                  column: 35,
                  index: 35
                }
              }
            },
            {
              type: SyntaxType.CommentBlock,
              value: 'This is a multi-line\n comment for testing',
              loc: {
                start: {
                  line: 3,
                  column: 7,
                  index: 42
                },
                end: {
                  line: 5,
                  column: 11,
                  index: 113
                }
              }
            },
            {
              type: SyntaxType.CommentBlock,
              value: 'Another muliti-line\n comment for testing',
              loc: {
                start: {
                  line: 6,
                  column: 7,
                  index: 120
                },
                end: {
                  line: 8,
                  column: 11,
                  index: 186
                }
              }
            }
          ],
          loc: {
            start: {
              line: 9,
              column: 7,
              index: 193
            },
            end: {
              line: 14,
              column: 8,
              index: 333
            }
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
            start: { line: 2, column: 15, index: 15 },
            end: { line: 2, column: 19, index: 19 },
          }),
          extends: null,
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 18, index: 39 },
                end: { line: 3, column: 22, index: 43 }
              }),
              fields: [],
              throws: [],
              returnType: {
                type: SyntaxType.Identifier,
                value: 'TestType',
                loc: {
                  start: { line: 3, column: 9, index: 30 },
                  end: { line: 3, column: 17, index: 38 }
                }
              },
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 30 },
                end: { line: 3, column: 24, index: 45 }
              }
            }
          ],
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 4, column: 8, index: 53 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('should correctly parse the syntax of a service containing a function that throws', () => {
    const content: string = `
      service Test {
        bool test() throws (1: Exception1 user_exception, 2: Exception2 system_exception)
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
              start: { line: 2, column: 15, index: 15 },
              end: { line: 2, column: 19, index: 19 }
            }
          },
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 14, index: 35 },
                end: { line: 3, column: 18, index: 39 }
              }),
              fields: [],
              throws: [
                {
                  type: SyntaxType.FieldDefinition,
                  name: {
                    type: SyntaxType.Identifier,
                    value: 'user_exception',
                    loc: {
                      start: {
                        line: 3,
                        column: 43,
                        index: 64
                      },
                      end: {
                        line: 3,
                        column: 57,
                        index: 78
                      }
                    }
                  },
                  fieldID: {
                    type: SyntaxType.FieldID,
                    value: 1,
                    loc: {
                      start: {
                        line: 3,
                        column: 29,
                        index: 50
                      },
                      end: {
                        line: 3,
                        column: 31,
                        index: 52
                      }
                    }
                  },
                  fieldType: {
                    type: SyntaxType.Identifier,
                    value: 'Exception1',
                    loc: {
                      start: {
                        line: 3,
                        column: 32,
                        index: 53
                      },
                      end: {
                        line: 3,
                        column: 42,
                        index: 63
                      }
                    }
                  },
                  requiredness: null,
                  defaultValue: null,
                  comments: [],
                  loc: {
                    start: {
                      line: 3,
                      column: 29,
                      index: 50
                    },
                    end: {
                      line: 3,
                      column: 58,
                      index: 79
                    }
                  }
                },
                {
                  type: SyntaxType.FieldDefinition,
                  name: {
                    type: SyntaxType.Identifier,
                    value: 'system_exception',
                    loc: {
                      start: {
                        line: 3,
                        column: 73,
                        index: 94
                      },
                      end: {
                        line: 3,
                        column: 89,
                        index: 110
                      }
                    }
                  },
                  fieldID: {
                    type: SyntaxType.FieldID,
                    value: 2,
                    loc: {
                      start: {
                        line: 3,
                        column: 59,
                        index: 80
                      },
                      end: {
                        line: 3,
                        column: 61,
                        index: 82
                      }
                    }
                  },
                  fieldType: {
                    type: SyntaxType.Identifier,
                    value: 'Exception2',
                    loc: {
                      start: {
                        line: 3,
                        column: 62,
                        index: 83
                      },
                      end: {
                        line: 3,
                        column: 72,
                        index: 93
                      }
                    }
                  },
                  requiredness: null,
                  defaultValue: null,
                  comments: [],
                  loc: {
                    start: {
                      line: 3,
                      column: 59,
                      index: 80
                    },
                    end: {
                      line: 3,
                      column: 89,
                      index: 110
                    }
                  }
                }
              ],
              returnType: {
                type: SyntaxType.BoolKeyword,
                loc: {
                  start: { line: 3, column: 9, index: 30 },
                  end: { line: 3, column: 13, index: 34 }
                }
              },
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 30 },
                end: { line: 3, column: 90, index: 111 }
              }
            }
          ],
          extends: null,
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 4, column: 8, index: 119 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });

  it('parses a service that extends another service', function() {
    const content: string = `
      service ServiceTwo extends ServiceOne {
        void test()
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
            value: 'ServiceTwo',
            loc: {
              start: {
                line: 2,
                column: 15,
                index: 15
              },
              end: {
                line: 2,
                column: 25,
                index: 25
              }
            }
          },
          extends: {
            type: SyntaxType.Identifier,
            value: 'ServiceOne',
            loc: {
              start: {
                line: 2,
                column: 26,
                index: 26
              },
              end: {
                line: 2,
                column: 44,
                index: 44
              }
            }
          },
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: {
                type: SyntaxType.Identifier,
                value: 'test',
                loc: {
                  start: {
                    line: 3,
                    column: 14,
                    index: 60
                  },
                  end: {
                    line: 3,
                    column: 18,
                    index: 64
                  }
                }
              },
              returnType: {
                type: SyntaxType.VoidKeyword,
                loc: {
                  start: {
                    line: 3,
                    column: 9,
                    index: 55
                  },
                  end: {
                    line: 3,
                    column: 13,
                    index: 59
                  }
                }
              },
              fields: [],
              throws: [],
              comments: [],
              loc: {
                start: {
                  line: 3,
                  column: 9,
                  index: 55
                },
                end: {
                  line: 3,
                  column: 20,
                  index: 66
                }
              }
            }
          ],
          comments: [],
          loc: {
            start: {
              line: 2,
              column: 7,
              index: 7
            },
            end: {
              line: 4,
              column: 8,
              index: 74
            }
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
              start: { line: 2, column: 15, index: 15 },
              end: { line: 2, column: 19, index: 19 }
            }
          },
          functions: [
            {
              type: SyntaxType.FunctionDefinition,
              name: createIdentifier('test', {
                start: { line: 3, column: 14, index: 35 },
                end: { line: 3, column: 18, index: 39 }
              }),
              fields: [
                {
                  type: SyntaxType.FieldDefinition,
                  fieldID: null,
                  requiredness: null,
                  defaultValue: null,
                  name: createIdentifier('test1', {
                    start: { line: 3, column: 26, index: 47 },
                    end: { line: 3, column: 31, index: 52 }
                  }),
                  fieldType: {
                    type: SyntaxType.StringKeyword,
                    loc: {
                      start: { line: 3, column: 19, index: 40 },
                      end: { line: 3, column: 25, index: 46 }
                    }
                  },
                  comments: [],
                  loc: {
                    start: { line: 3, column: 19, index: 40 },
                    end: { line: 3, column: 32, index: 53 }
                  }
                },
                {
                  type: SyntaxType.FieldDefinition,
                  fieldID: {
                    type: SyntaxType.FieldID,
                    value: 1,
                    loc: {
                      start: { line: 3, column: 33, index: 54 },
                      end: { line: 3, column: 35, index: 56 }
                    }
                  },
                  requiredness: null,
                  defaultValue: null,
                  name: createIdentifier('test2', {
                    start: { line: 3, column: 41, index: 62 },
                    end: { line: 3, column: 46, index: 67 }
                  }),
                  fieldType: {
                    type: SyntaxType.BoolKeyword,
                    loc: {
                      start: { line: 3, column: 36, index: 57 },
                      end: { line: 3, column: 40, index: 61 }
                    }
                  },
                  comments: [],
                  loc: {
                    start: { line: 3, column: 33, index: 54 },
                    end: { line: 3, column: 46, index: 67  }
                  }
                }
              ],
              throws: [],
              returnType: {
                type: SyntaxType.VoidKeyword,
                loc: {
                  start: { line: 3, column: 9, index: 30 },
                  end: { line: 3, column: 13, index: 34 }
                }
              },
              comments: [],
              loc: {
                start: { line: 3, column: 9, index: 30 },
                end: { line: 3, column: 47, index: 68 }
              }
            }
          ],
          extends: null,
          comments: [],
          loc: {
            start: { line: 2, column: 7, index: 7 },
            end: { line: 4, column: 8, index: 76 }
          }
        }
      ]
    };

    assert.deepEqual(thrift, expected);
  });
});