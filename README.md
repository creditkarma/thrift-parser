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

## Viewing with ASTExplorer

ASTExplorer is a web app for visualizing ASTs. You type source. It shows you the resulting syntax tree based on the parser you've selected. I've included the integrations for this parser. To get that up and running you'll need to clone ASTExplorer.

```
$ git clone https://github.com/fkling/astexplorer.git
$ cd astexplorer
$ git submodule update --init
$ cd website/
```

In another terminal window, (until we publish this parser) you'll need to npm link to get things to work.

From the root directory of this parser, where the package.json is...

```
$ npm link
```

Then back in your terminal for ASTExplorer (from astexplorer/website)...

```
$ npm link @creditkarma/thrift-parser
```

Cool, now we need to copy some stuff into the ASTExplorer project.

If the ASTExplorer project and the @creditkarma/thrift-parser project are siblings you can type this into the temrinal (from astexplorer/website)...

```
$ cp -r ../../thrift-parser/astexplorer/thrift ./src/parsers/thrift
```

You'll now need to build ASTExplorer and start the server

```
$ npm run build
$ npm start
```

By default this will start ASTExplorer on localhost:8080

There is a dropdown to select the language you want to use, choose 'Thrift IDL'