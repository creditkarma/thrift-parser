# TypeScript Thrift Parser

A parser for Thrift written in TypeScript. The resulting AST can be used to codegen JavaScript from a Thrift file, or just to inspect the Thrift structure.

## Usage

```
import { parse, ThriftDocument } from '@creditkarma/thrift-parser'


const rawThrift: string =`
  struct MyStruct {
    1: required i32 id
  }
`;

const thriftAST: ThriftDocument = parse(rawThrift);
```

### Build

```
$ npm install
$ npm run build
```

### Test

```
$ npm test
```