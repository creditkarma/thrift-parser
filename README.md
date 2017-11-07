# TypeScript Thrift Parser

A parser for Thrift written in TypeScript. The resulting AST can be used to codegen JavaScript from a Thrift file, or just to inspect the Thrift structure.

## Usage

```js
import { parse, ThriftDocument } from '@creditkarma/thrift-parser'


const rawThrift: string =`
  struct MyStruct {
    1: required i32 id
  }
`;

const thriftAST: ThriftDocument = parse(rawThrift);
```

You can also use Thrift Parser from the command line or npm scripts. When using from the command line the generated AST is saved to file as JSON.

```sh
$ thrift-parser --rootDir thrift --outDir thrift-json --fastFail false some_file.thrift
```

In this usage there are three options:

* --rootDir: where to initiate file search and save
* --outDir: relative to rootDir where to save output files
* --fastFail: If true fail on first error encountered

### Build

```sh
$ npm install
$ npm run build
```

### Test

```sh
$ npm test
```

## AST Structure

The root of the returned AST is either a ThriftDocument (successful parse) or a ThriftErrors (unsuccessful parse).

### ThriftDocument

```typescript
{
  type: "ThriftDocument",
  body: Array<ThriftStatement>
}
```

### ThriftErrors

```typescript
{
  type: "ThriftErrors",
  errors: Array<ThriftError>
}
```

#### ThriftError

A descriptor of what went wrong while parsing the specified Thrift source.

```typescript
{
  type: "ParseError" | "ScanError",
  message: string,
  loc: TextLocation
}
```

### Thrift Statements

Thrift Statements represent each of the main constructs that can be defined in Thrift source.

#### NamespaceDefinition

```
namespace <identifier> <identifier>
```

```typescript
{
  type: "NamespaceDefinition",
  scope: Identifier,
  name: Identifier
}
```

#### IncludeDefinition

```
include '<path>'"
```

```typescript
{
  type: "IncludeDefinition",
  path: StringLiteral
}
```

#### TypedefDefinition

```
typedef <field-type> <identifier>
```

```typescript
{
  type: "TypedefDefinition",
  name: Identifier,
  definitionType: FieldType
}
```

#### ConstDefinition

```
const <field-type> <identifier> = <initializer>
```

```typescript
{
  type: "ConstDefinition",
  name: Identifier,
  fieldType: FieldType,
  initializer: ConstValue,
}
```

#### EnumDefinition

```
enum <identifier> { <members> }
```

```typescript
{
  type: "EnumDefinition",
  name: Identifier,
  members: Array<EnumMember>
}
```

#### StructDefinition

```
struct <identifier> { <fields> }
```

```typescript
{
  type: "StructDefinition",
  name: Identifier,
  fields: Array<FieldDefinition>
}
```

#### UnionDefinition

```
union <identifier> { <fields> }
```

```typescript
{
  type: "UnionDefinition",
  name: Identifier,
  fields: Array<FieldDefinition>
}
```

#### ExceptionDefinition

```
exception <identifier> { <fields> }
```

```typescript
{
  type: "ExceptionDefinition",
  name: Identifier,
  fields: Array<FieldDefinition>
}
```

#### ServiceDefinition

```
service <identifier> (extends <identifier>)? { <functions> }
```

```typescript
{
  type: "ServiceDefinition",
  name: Identifier,
  extends: Identifier | null,
  functions: Array<FunctionDefinition>
}
```

## Viewing with ASTExplorer

ASTExplorer is a web app for visualizing ASTs. You type source. It shows you the resulting syntax tree based on the parser you've selected. I've included the integrations for this parser. To get that up and running you'll need to clone ASTExplorer.

```sh
$ git clone https://github.com/fkling/astexplorer.git
$ cd astexplorer/website
$ npm install
```

In another terminal window, (until we publish this parser) you'll need to npm link to get things to work.

From the root directory of this parser, where the package.json is...

```sh
$ npm link
```

Then back in your terminal for ASTExplorer (from astexplorer/website)...

```sh
$ npm link @creditkarma/thrift-parser
```

Cool, now we need to copy some stuff into the ASTExplorer project.

If the ASTExplorer project and the @creditkarma/thrift-parser project are siblings you can type this into the temrinal (from astexplorer/website)...

```sh
$ cp -r ../../thrift-parser/astexplorer/thrift ./src/parsers/thrift
```

You'll now need to build ASTExplorer and start the server

```sh
$ npm run build
$ npm start
```

By default this will start ASTExplorer on localhost:8080

There is a dropdown to select the language you want to use, choose 'Thrift IDL'

Note: I have had some trouble getting `npm run build` to work. However, the watch build is much more reliable.

```sh
$ npm run watch
```

Then in another terminal window run `start`.

```sh
$ npm start
```

## Contributing

For more information about contributing new features and bug fixes, see our [Contribution Guidelines](https://github.com/creditkarma/CONTRIBUTING.md).
External contributors must sign Contributor License Agreement (CLA)

## License

This project is licensed under [Apache License Version 2.0](./LICENSE)