import { assert } from 'chai';
import { createScanner, Scanner } from './scanner';
import { Token, SyntaxType } from './types';

describe('Scanner', () => {
  it('should correctly recognize floats', () => {
    const content = `
      5.12
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.FloatLiteral,
        text: '5.12',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 11,
            index: 11
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 16
          },
          end: {
            line: 3,
            column: 5,
            index: 16
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });
  
  it('should correctly recognize strings with double quotes', () => {
    const content = `
      "this is a test"
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.StringLiteral,
        text: 'this is a test',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 23,
            index: 23
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 28
          },
          end: {
            line: 3,
            column: 5,
            index: 28
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it('should correctly recognize strings with single quotes', () => {
    const content = `
      'this is a test'
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.StringLiteral,
        text: 'this is a test',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 23,
            index: 23
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 28
          },
          end: {
            line: 3,
            column: 5,
            index: 28
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });
  
  it('should correctly recognize hex values', () => {
    const content = `
      0xfff
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.HexLiteral,
        text: '0xfff',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 12,
            index: 12
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 17
          },
          end: {
            line: 3,
            column: 5,
            index: 17
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });
  
  it('should correctly recognize e-notation', () => {
    const content = `
      5e6
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.ExponentialLiteral,
        text: '5e6',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 10,
            index: 10
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 15
          },
          end: {
            line: 3,
            column: 5,
            index: 15
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it('should correctly recognize more complex e-notation', () => {
    const content = `
      5.2e-6
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.ExponentialLiteral,
        text: '5.2e-6',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 13,
            index: 13
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 18
          },
          end: {
            line: 3,
            column: 5,
            index: 18
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it('should correctly return the tokens for a struct', () => {
    const content: string = `
      struct MyStruct {
        1: required i32 id
      }
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.StructKeyword,
        text: 'struct',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 13,
            index: 13
          }
        }
      },
      {
        type: SyntaxType.Identifier,
        text: 'MyStruct',
        loc: {
          start: {
            line: 2,
            column: 14,
            index: 14
          },
          end: {
            line: 2,
            column: 22,
            index: 22
          }
        }
      },
      {
        type: SyntaxType.LeftBraceToken,
        text: '',
        loc: {
          start: {
            line: 2,
            column: 23,
            index: 23
          },
          end: {
            line: 2,
            column: 24,
            index: 24
          }
        }
      },
      {
        type: SyntaxType.IntegerLiteral,
        text: '1',
        loc: {
          start: {
            line: 3,
            column: 9,
            index: 33
          },
          end: {
            line: 3,
            column: 10,
            index: 34
          }
        }
      },
      {
        type: SyntaxType.ColonToken,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 10,
            index: 34
          },
          end: {
            line: 3,
            column: 11,
            index: 35
          }
        }
      },
      {
        type: SyntaxType.RequiredKeyword,
        text: 'required',
        loc: {
          start: {
            line: 3,
            column: 12,
            index: 36
          },
          end: {
            line: 3,
            column: 20,
            index: 44
          }
        }
      },
      {
        type: SyntaxType.I32Keyword,
        text: 'i32',
        loc: {
          start: {
            line: 3,
            column: 21,
            index: 45
          },
          end: {
            line: 3,
            column: 24,
            index: 48
          }
        }
      },
      {
        type: SyntaxType.Identifier,
        text: 'id',
        loc: {
          start: {
            line: 3,
            column: 25,
            index: 49
          },
          end: {
            line: 3,
            column: 27,
            index: 51
          }
        }
      },
      {
        type: SyntaxType.RightBraceToken,
        text: '',
        loc: {
          start: {
            line: 4,
            column: 7,
            index: 58
          },
          end: {
            line: 4,
            column: 8,
            index: 59
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 5,
            column: 4,
            index: 64
          },
          end: {
            line: 5,
            column: 5,
            index: 64
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it(`should correctly handle single-line comments with '//'`, () => {
    const content: string = `
      // This is a struct
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.CommentLine,
        text: 'This is a struct',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 26,
            index: 26
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 31
          },
          end: {
            line: 3,
            column: 5,
            index: 31
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it(`should correctly handle single-line comments with '#'`, () => {
    const content: string = `
      # This is a struct
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.CommentLine,
        text: 'This is a struct',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 25,
            index: 25
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 30
          },
          end: {
            line: 3,
            column: 5,
            index: 30
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it(`should correctly handle multi-line comments with '/* ... */'`, () => {
    const content: string = `
      /* This is a struct
       * it does things
       */
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.CommentBlock,
        text: 'This is a struct\n it does things',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 4,
            column: 11,
            index: 60
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 5,
            column: 4,
            index: 65
          },
          end: {
            line: 5,
            column: 5,
            index: 65
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it('should correctly return tokens for a simple const', () => {
    const content = `
      const string test = 'hello world'
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.ConstKeyword,
        text: 'const',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 12,
            index: 12
          }
        }
      },
      {
        type: SyntaxType.StringKeyword,
        text: 'string',
        loc: {
          start: {
            line: 2,
            column: 13,
            index: 13
          },
          end: {
            line: 2,
            column: 19,
            index: 19
          }
        }
      },
      {
        type: SyntaxType.Identifier,
        text: 'test',
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
      {
        type: SyntaxType.EqualToken,
        text: '',
        loc: {
          start: {
            line: 2,
            column: 25,
            index: 25
          },
          end: {
            line: 2,
            column: 26,
            index: 26
          }
        }
      },
      {
        type: SyntaxType.StringLiteral,
        text: 'hello world',
        loc: {
          start: {
            line: 2,
            column: 27,
            index: 27
          },
          end: {
            line: 2,
            column: 40,
            index: 40
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 45
          },
          end: {
            line: 3,
            column: 5,
            index: 45
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });

  it('should correctly handle assignment to hex values', () => {
    const content = `
      const i32 test = 0xf
    `;
    const scanner: Scanner = createScanner(content);
    const tokens: Array<Token> = scanner.scan();

    const expected: Array<Token> = [
      {
        type: SyntaxType.ConstKeyword,
        text: 'const',
        loc: {
          start: {
            line: 2,
            column: 7,
            index: 7
          },
          end: {
            line: 2,
            column: 12,
            index: 12
          }
        }
      },
      {
        type: SyntaxType.I32Keyword,
        text: 'i32',
        loc: {
          start: {
            line: 2,
            column: 13,
            index: 13
          },
          end: {
            line: 2,
            column: 16,
            index: 16
          }
        }
      },
      {
        type: SyntaxType.Identifier,
        text: 'test',
        loc: {
          start: {
            line: 2,
            column: 17,
            index: 17
          },
          end: {
            line: 2,
            column: 21,
            index: 21
          }
        }
      },
      {
        type: SyntaxType.EqualToken,
        text: '',
        loc: {
          start: {
            line: 2,
            column: 22,
            index: 22
          },
          end: {
            line: 2,
            column: 23,
            index: 23
          }
        }
      },
      {
        type: SyntaxType.HexLiteral,
        text: '0xf',
        loc: {
          start: {
            line: 2,
            column: 24,
            index: 24
          },
          end: {
            line: 2,
            column: 27,
            index: 27
          }
        }
      },
      {
        type: SyntaxType.EOF,
        text: '',
        loc: {
          start: {
            line: 3,
            column: 4,
            index: 32
          },
          end: {
            line: 3,
            column: 5,
            index: 32
          }
        }
      }
    ];

    assert.deepEqual(tokens, expected);
  });
});