import {
  ThriftDocument,
  ThriftStatement,
  Node,
  Token,
  NamespaceScope,
  NamespaceDefinition,
  ConstDefinition,
  TypedefDefinition,
  StructDefinition,
  EnumDefinition,
  UnionDefinition,
  ExceptionDefinition,
  ServiceDefinition,
  FunctionDefinition,
  FieldDefinition,
  EnumMember,
  FieldID,
  Identifier,
  SyntaxType,
  TextLocation,
  DefinitionType,
  FieldType,
  FunctionType,
  FieldRequired,
  BaseType,
  MapType,
  SetType,
  ListType,
  ConstValue,
  ConstMap,
  ConstList,
  IntConstant,
  DoubleConstant,
  PropertyAssignment
} from './types';

import {
  createTextLocation,
  createIdentifier,
  createStringLiteral,
  createBooleanLiteral,
  createIntConstant,
  createDoubleConstant,
  createConstMap,
  createConstList,
  createKeywordFieldType,
  createMapFieldType,
  createSetFieldType,
  createListFieldType,
  creataePropertyAssignment,
  createFieldID
} from './factory';

export class ParseError extends Error {}

export interface Parser {
  parse(): ThriftDocument;
}

function isStatementBeginning(token: Token): boolean {
  switch(token.type) {
    case SyntaxType.NamespaceDefinition:
    case SyntaxType.IncludeDefinition:
    case SyntaxType.ConstDefinition:
    case SyntaxType.StructDefinition:
    case SyntaxType.EnumDefinition:
    case SyntaxType.ExceptionDefinition:
    case SyntaxType.UnionDefinition:
    case SyntaxType.TypedefDefinition:
      return true;

    default:
      return false;
  }
}

// Throw if the given value doesn't exist.
function requireToken<T>(val: T, msg: string): T {
  if (val === null || val === undefined) {
    throw new ParseError(msg);
  }

  return val;
}

export function createParser(tkns: Array<Token>): Parser {
  const tokens: Array<Token> = tkns;
  var currentIndex: number = 0;

  function parse(): ThriftDocument {
    const thrift: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: []
    };

    while (!isAtEnd()) {
      const statement: ThriftStatement = parseStatement();
      if (statement !== null) {
        thrift.body.push(statement);
      }
    }

    return thrift;
  }

  function parseStatement(): ThriftStatement {
    const next: Token = currentToken();
    
    // All Thrift statements must start with one of these types
    switch(next.type) {
      case SyntaxType.NamespaceKeyword:
        return parseNamespace();

      case SyntaxType.ConstKeyword:
        return parseConst();

      case SyntaxType.StructKeyword:
        return parseStruct();

      case SyntaxType.UnionKeyword:
        return parseUnion();

      case SyntaxType.ExceptionKeyword:
        return parseException();

      case SyntaxType.ServiceKeyword:
        return parseService();

      case SyntaxType.TypedefKeyword:
        return parseTypedef();

      case SyntaxType.EnumKeyword:
        return parseEnum();

      case SyntaxType.CommentBlock:
      case SyntaxType.CommentLine:
        advance();
        return null;

      default:
        throw new ParseError(`Invalid start to Thrift statement ${next.text}`);
    }
  }

  // ServiceDefinition → 'service' Identifier ( 'extends' Identifier )? '{' Function* '}'
  function parseService(): ServiceDefinition {
    const keywordToken: Token = advance();
    const idToken: Token = consume(SyntaxType.Identifier);
    requireToken(idToken, `Unable to find identifier for service`);

    const extendsId: Identifier = parseExtends();
    const openBrace: Token = consume(SyntaxType.LeftBraceToken);
    requireToken(openBrace, `Expected opening curly brace`);

    const functions: Array<FunctionDefinition> = parseFunctions();
    const closeBrace: Token = consume(SyntaxType.RightBraceToken);
    requireToken(closeBrace, `Expected closing curly brace`);

    const location: TextLocation = createTextLocation(keywordToken.loc.start, closeBrace.loc.end);

    return {
      type: SyntaxType.ServiceDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      extends: extendsId,
      functions,
      loc: location
    };
  }

  function parseExtends(): Identifier {
    if (checkText('extends')) {
      const keywordToken: Token = advance();
      const idToken: Token = consume(SyntaxType.Identifier);
      requireToken(idToken, `Identifier expected after 'extends' keyword`);

      return createIdentifier(
        idToken.text,
        createTextLocation(keywordToken.loc.start, idToken.loc.end)
      );
    } else {
      return null;
    }
  }

  function parseFunctions(): Array<FunctionDefinition> {
    const functions: Array<FunctionDefinition> = [];

    while (!check(SyntaxType.RightBraceToken)) {
      if (match(SyntaxType.CommentBlock, SyntaxType.CommentLine)) {
        advance();
      } else {
        functions.push(parseFunction());

        if (isStatementBeginning(currentToken())) {
          throw new ParseError(`closing curly brace expected, but new statement found`);
        } else if (check(SyntaxType.EOF)) {
          throw new ParseError(`closing curly brace expected but reached end of file`);
        }
      }
    }

    return functions;
  }

  // Function → 'oneway'? FunctionType Identifier '(' Field* ')' Throws? ListSeparator?
  function parseFunction(): FunctionDefinition {
    const returnType: FunctionType = parseFunctionType();
  
    const idToken: Token = consume(SyntaxType.Identifier);
    requireToken(idToken, `Unable to find function identifier`);
    
    const openParen: Token = consume(SyntaxType.LeftParenToken);
    requireToken(openParen, `Opening parent expected in function definition`);

    const fields: Array<FieldDefinition> = parseParameterFields();
    const closeParen: Token = consume(SyntaxType.RightParenToken);
    requireToken(closeParen, `Closing parent expected in function definition`);

    return {
      type: SyntaxType.FunctionDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      returnType,
      fields,
      throws: [],
      loc: {
        start: returnType.loc.start,
        end: idToken.loc.end
      }
    };
  }

  function parseParameterFields(): Array<FieldDefinition> {
    const fields: Array<FieldDefinition> = [];

    while (!match(SyntaxType.RightParenToken)) {
      readListSeparator();
      fields.push(parseField());

      if (isStatementBeginning(currentToken())) {
        throw new ParseError(`closing paren brace expected, but new statement found`);
      } else if (check(SyntaxType.EOF)) {
        throw new ParseError(`closing paren brace expected but reached end of file`);
      }
    }

    return fields;
  }

  // Throws → 'throws' '(' Field* ')'
  function parseThrows(): Array<FieldDefinition> {
    if (check(SyntaxType.ThrowsKeyword)) {
      const keywordToken: Token = advance();
      const openParen: Token = consume(SyntaxType.LeftParenToken);
      requireToken(openParen, `opening paren '(' expected`);

      const fields: Array<FieldDefinition> = parseParameterFields();
      const closeParen: Token = consume(SyntaxType.RightParenToken);
      requireToken(closeParen, `closing paren ')' expected`);

      return fields;
    }

    return null;
  }

  // Namespace → 'namespace' ( NamespaceScope Identifier )
  function parseNamespace(): NamespaceDefinition {
    const keywordToken: Token = advance();
    const scope: NamespaceScope = parseNamespaceScope();
    const idToken: Token = consume(SyntaxType.Identifier);
    requireToken(idToken, `Unable to find identifier for namespace`);

    return {
      type: SyntaxType.NamespaceDefinition,
      scope: scope,
      name: createIdentifier(idToken.text, idToken.loc),
      loc: createTextLocation(
        keywordToken.loc.start,
        idToken.loc.end
      )
    }
  }

  // NamespaceScope → '*' | 'cpp' | 'java' | 'py' | 'perl' | 'rb' | 'cocoa' | 'csharp' | 'js'
  function parseNamespaceScope(): NamespaceScope {
    const current: Token = currentToken();
    switch(current.text) {
      case '*':
      case 'js':
      case 'cpp':
      case 'java':
      case 'py':
      case 'perl':
      case 'rb':
      case 'cocoa':
      case 'csharp':
        advance();
        return {
          type: SyntaxType.NamespaceScope,
          value: current.text,
          loc: {
            start: current.loc.start,
            end: current.loc.end
          }
        };

      default:
        throw new ParseError(`Invalid or missing namespace scope`);
    }
  }

  // ConstDefinition → 'const' FieldType Identifier '=' ConstValue ListSeparator?
  function parseConst(): ConstDefinition {
    const keywordToken: Token = advance();
    const fieldType: FieldType = parseFieldType();
    const idToken: Token = advance();
    requireToken(idToken, `const definition must have a name`);

    const initializer: ConstValue = parseValueAssignment();
    requireToken(initializer, `const must be initialized to a value`);

    return {
      type: SyntaxType.ConstDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      fieldType: fieldType,
      loc: {
        start: keywordToken.loc.start,
        end: initializer.loc.end
      },
      initializer: initializer
    };
  }

  function parseValueAssignment(): ConstValue {
    if (check(SyntaxType.EqualToken)) {
      advance();
      return parseValue();
    }

    return null;
  }

  // TypedefDefinition → 'typedef' DefinitionType Identifier
  function parseTypedef(): TypedefDefinition {
    const keywordToken: Token = advance();
    const type: DefinitionType = parseDefinitionType();
    const idToken: Token = consume(SyntaxType.Identifier);
    requireToken(idToken, `typedef is expected to have name and none found`);

    return {
      type: SyntaxType.TypedefDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      definitionType: type,
      loc: {
        start: keywordToken.loc.start,
        end: idToken.loc.end
      }
    };
  }

  // EnumDefinition → 'enum' Identifier '{' EnumMember* '}'
  function parseEnum(): EnumDefinition {
    const keywordToken: Token = advance();
    const idToken: Token = consume(SyntaxType.Identifier);
    requireToken(idToken, `expected identifier for enum definition`);
    
    const openBrace: Token = consume(SyntaxType.LeftBraceToken);
    requireToken(openBrace, `expected opening brace`);
    
    const members: Array<EnumMember> = parseEnumMembers();
    const closeBrace: Token = consume(SyntaxType.RightBraceToken);
    requireToken(closeBrace, `expected closing brace`);

    const loc: TextLocation = {
      start: keywordToken.loc.start,
      end: closeBrace.loc.end
    };

    return {
      type: SyntaxType.EnumDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      members,
      loc
    };
  }

  function parseEnumMembers(): Array<EnumMember> {
    const members: Array<EnumMember> = [];
    while (!check(SyntaxType.RightBraceToken)) {
      if (match(SyntaxType.CommentBlock, SyntaxType.CommentLine)) {
        advance();
      } else {
        members.push(parseEnumMember());

        // consume list separator if there is one
        readListSeparator();
        if (isStatementBeginning(currentToken())) {
          throw new ParseError(`Closing curly brace expected, but new statement found`);
        } else if (check(SyntaxType.EOF)) {
          throw new ParseError(`Closing curly brace expected but reached end of file`);
        }
      }
    }

    return members;
  }

  // EnumMember → (Identifier ('=' IntConstant)? ListSeparator?)*
  function parseEnumMember(): EnumMember {
    const idToken: Token = consume(SyntaxType.Identifier);
    const equalToken: Token = consume(SyntaxType.EqualToken);
    const numToken: Token = consume(SyntaxType.NumberLiteral);
    var loc: TextLocation = null;
    var initializer: IntConstant = null;

    if (numToken !== null) {
      loc = createTextLocation(idToken.loc.start, initializer.loc.end);
      initializer = createIntConstant(parseInt(numToken.text), numToken.loc);
    } else {
      loc = createTextLocation(idToken.loc.start, idToken.loc.end);
    }

    return {
      type: SyntaxType.EnumMember,
      name: createIdentifier(idToken.text, idToken.loc),
      initializer,
      loc
    };
  }

  // StructDefinition → 'struct' Identifier 'xsd_all'? '{' Field* '}'
  function parseStruct(): StructDefinition {
    const keywordToken: Token = advance();
    const idToken: Token = advance();
    const openBrace: Token = consume(SyntaxType.LeftBraceToken);
    requireToken(openBrace, `struct body must begin with opening curly brace`);

    const fields: Array<FieldDefinition> = parseFields();
    const closeBrace: Token = advance();

    return {
      type: SyntaxType.StructDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      fields: fields,
      loc: {
        start: keywordToken.loc.start,
        end: closeBrace.loc.end
      }
    };
  }

  // UnioinDefinition → 'union' Identifier 'xsd_all'? '{' Field* '}'
  function parseUnion(): UnionDefinition {
    const keywordToken: Token = advance();
    const idToken: Token = advance();
    const openBrace: Token = consume(SyntaxType.LeftBraceToken);
    requireToken(openBrace, `union body must begin with opening curly brace`);

    const fields: Array<FieldDefinition> = parseFields();
    const closeBrace: Token = advance();

    return {
      type: SyntaxType.UnionDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      fields: fields.map((next: FieldDefinition) => {
        // As per the Thrift spec, all union fields are optional
        next.requiredness = 'optional';
        return next;
      }),
      loc: {
        start: keywordToken.loc.start,
        end: closeBrace.loc.end
      }
    };
  }

  // ExceptionDefinition → 'exception' Identifier '{' Field* '}'
  function parseException(): ExceptionDefinition {
    const keywordToken: Token = advance();
    const idToken: Token = advance();
    const openBrace: Token = consume(SyntaxType.LeftBraceToken);
    requireToken(openBrace, `exception body must begin with opening curly brace '{'`);

    const fields: Array<FieldDefinition> = parseFields();
    const closeBrace: Token = advance();
    requireToken(closeBrace, `exception body must end with a closing curly brace '}'`)

    return {
      type: SyntaxType.ExceptionDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      fields: fields,
      loc: {
        start: keywordToken.loc.start,
        end: closeBrace.loc.end
      }
    };
  }

  function parseFields(): Array<FieldDefinition> {
    const fields: Array<FieldDefinition> = [];

    while (!check(SyntaxType.RightBraceToken)) {
      if (match(SyntaxType.CommentBlock, SyntaxType.CommentLine)) {
        advance();
      } else {
        fields.push(parseField());

        if (isStatementBeginning(currentToken())) {
          throw new ParseError(`closing curly brace expected, but new statement found`);
        } else if (check(SyntaxType.EOF)) {
          throw new ParseError(`closing curly brace expected but reached end of file`);
        }
      }
    }

    return fields;
  }

  // Field → FieldID? FieldReq? FieldType Identifier ('= ConstValue)? XsdFieldOptions ListSeparator?
  function parseField(): FieldDefinition {
    const startPos: TextLocation = currentToken().loc;
    const fieldID: FieldID = parseFieldId();
    const fieldRequired: FieldRequired = parserequireTokendness();
    const fieldType: FieldType = parseFieldType();
    const idToken: Token = consume(SyntaxType.Identifier);
    requireToken(idToken, `Unable to find identifier for field`);

    const defaultValue: ConstValue = parseValueAssignment();
    const listSeparator: Token = readListSeparator();
    const endPos: TextLocation = (listSeparator !== null) ? listSeparator.loc : (defaultValue !== null) ? defaultValue.loc : idToken.loc;
    const location: TextLocation = createTextLocation(startPos.start, endPos.end);

    return {
      type: SyntaxType.FieldDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      fieldID: fieldID,
      fieldType: fieldType,
      requiredness: fieldRequired,
      defaultValue: defaultValue,
      loc: location
    };
  }

  // ListSeparator → ',' | ';'
  function readListSeparator(): Token {
    const current: Token = currentToken();
    if (match(SyntaxType.CommaToken, SyntaxType.SemicolonToken)) {
      return advance();
    }

    return null;
  }

  // FieldrequireTokend → 'requireTokend' | 'optional'
  function parserequireTokendness(): FieldRequired {
    const current: Token = currentToken();
    if (current.text === 'required' || current.text === 'optional') {
      advance();
      return current.text;
    }

    return null;
  }

  // FieldID → IntConstant ':'
  function parseFieldId(): FieldID {
    if (
      currentToken().type === SyntaxType.IntegerLiteral &&
      peek().type === SyntaxType.ColonToken
    ) {
      const fieldIDToken: Token = advance();
      const colonToken: Token = advance();

      // return value of number token
      return createFieldID(
        parseInt(fieldIDToken.text),
        createTextLocation(fieldIDToken.loc.start, colonToken.loc.end)
      );
    } else {
      return null
    }
  }

  function parseValue(): ConstValue {
    const next: Token = advance();
    switch(next.type) {
      case SyntaxType.StringLiteral:
        return createStringLiteral(next.text, next.loc);

      case SyntaxType.IntegerLiteral:
      case SyntaxType.HexLiteral:
        return createIntConstant(parseInt(next.text), next.loc);

      case SyntaxType.FloatLiteral:
      case SyntaxType.ExponentialLiteral:
        return createDoubleConstant(parseFloat(next.text), next.loc);

      case SyntaxType.TrueKeyword:
        return createBooleanLiteral(true, next.loc);

      case SyntaxType.FalseKeyword:
        return createBooleanLiteral(false, next.loc);

      case SyntaxType.LeftBraceToken:
        return parseMapValue();

      case SyntaxType.LeftBracketToken:
        return parseListValue();

      default:
        return null;
    }
  }

  // ConstMap → '{' (ConstValue ':' ConstValue ListSeparator?)* '}'
  function parseMapValue(): ConstMap {
    // The parseValue method has already advanced the cursor
    const startPos: TextLocation = currentToken().loc;
    const properties: Array<PropertyAssignment> = readMapValues();
    const closeBrace: Token = consume(SyntaxType.RightBraceToken);
    requireToken(closeBrace, `Closing brace missing from map definition`);

    const endPos: TextLocation = closeBrace.loc;
    const location: TextLocation = {
      start: startPos.start,
      end: endPos.end
    };
    
    return createConstMap(properties, location);
  }

  // ConstList → '[' (ConstValue ListSeparator?)* ']'
  function parseListValue(): ConstList {
    // The parseValue method has already advanced the cursor
    const startPos: TextLocation = currentToken().loc;
    const elements: Array<ConstValue> = readListValues();
    const closeBrace: Token = consume(SyntaxType.RightBracketToken);
    requireToken(closeBrace, `Closing square-bracket missing from list definition`);
    const endPos: TextLocation = closeBrace.loc;

    return createConstList(elements, {
      start: startPos.start,
      end: endPos.end
    });
  }

  function readMapValues(): Array<PropertyAssignment> {
    const properties: Array<PropertyAssignment> = [];
    while (true) {
      const key: ConstValue = parseValue();
      const semicolon: Token = consume(SyntaxType.ColonToken);
      requireToken(semicolon, `Semicolon expected after key in map property assignment`);
      const value: ConstValue = parseValue();

      properties.push(creataePropertyAssignment(key, value, {
        start: key.loc.start,
        end: value.loc.end
      }));

      if (check(SyntaxType.CommaToken)) {
        advance()
      } else {
        break;
      }
    }

    return properties;
  }

  function readListValues(): Array<ConstValue> {
    const elements: Array<ConstValue> = [];
    while (true) {
      elements.push(parseValue());

      if (match(SyntaxType.CommaToken, SyntaxType.SemicolonToken)) {
        advance();
      } else {
        break;
      }
    }
    return elements;
  }

  // FunctionType → FieldType | 'void'
  function parseFunctionType(): FunctionType {
    const typeToken: Token = currentToken();
    switch (typeToken.type) {
      case SyntaxType.VoidKeyword:
        advance();
        return {
          type: SyntaxType.VoidKeyword,
          loc: typeToken.loc
        };

      default:
        return parseFieldType();
    }
  }

  // FieldType → Identifier | BaseType | ContainerType
  function parseFieldType(): FieldType {
    const typeToken: Token = currentToken();
    switch (typeToken.type) {
      case SyntaxType.Identifier:
        advance();
        return createIdentifier(typeToken.text, typeToken.loc);

      default:
        return parseDefinitionType();
    }
  }

  // DefinitionType → BaseType | ContainerType
  function parseDefinitionType(): DefinitionType {
    const typeToken: Token = advance();
    switch(typeToken.type) {
      case SyntaxType.BoolKeyword:
      case SyntaxType.StringKeyword:
      case SyntaxType.I8Keyword:
      case SyntaxType.I16Keyword:
      case SyntaxType.I32Keyword:
      case SyntaxType.I64Keyword:
      case SyntaxType.DoubleKeyword:
        return createKeywordFieldType(typeToken.type, typeToken.loc);

      case SyntaxType.MapKeyword:
        return parseMapType();

      case SyntaxType.ListKeyword:
        return parseListType();

      case SyntaxType.SetKeyword:
        return parseSetType();

      default:
        throw new ParseError(`FieldType expected`);
    }
  }

  // MapType → 'map' CppType? '<' FieldType ',' FieldType '>'
  function parseMapType(): MapType {
    const openBracket: Token = consume(SyntaxType.LessThanToken);
    requireToken(openBracket, `map needs to defined contained types`);

    const keyType: FieldType = parseFieldType();
    const commaToken: Token = consume(SyntaxType.CommaToken);
    requireToken(commaToken, `comma expedted to separate map types <key, value>`);

    const valueType: FieldType = parseFieldType();
    const closeBracket: Token = consume(SyntaxType.GreaterThanToken);
    requireToken(closeBracket, `map needs to defined contained types`);

    const location: TextLocation = {
      start: openBracket.loc.start,
      end: closeBracket.loc.end
    };

    return createMapFieldType(keyType, valueType, location);
  }

  // SetType → 'set' CppType? '<' FieldType '>'
  function parseSetType(): SetType {
    const openBracket: Token = consume(SyntaxType.LessThanToken);
    requireToken(openBracket, `map needs to defined contained types`);

    const valueType: FieldType = parseFieldType();
    const closeBracket: Token = consume(SyntaxType.GreaterThanToken);
    requireToken(closeBracket, `map needs to defined contained types`);

    return {
      type: SyntaxType.SetType,
      valueType: valueType,
      loc: {
        start: openBracket.loc.start,
        end: closeBracket.loc.end
      }
    };
  }

  // ListType → 'list' '<' FieldType '>' CppType?
  function parseListType(): ListType {
    const openBracket: Token = consume(SyntaxType.LessThanToken);
    requireToken(openBracket, `map needs to defined contained types`);

    const valueType: FieldType = parseFieldType();
    const closeBracket: Token = consume(SyntaxType.GreaterThanToken);
    requireToken(closeBracket, `map needs to defined contained types`);

    return {
      type: SyntaxType.ListType,
      valueType: valueType,
      loc: {
        start: openBracket.loc.start,
        end: closeBracket.loc.end
      }
    };
  }

  function currentToken(): Token {
    return tokens[currentIndex];
  }

  function previousToken(): Token {
    return tokens[currentIndex - 1];
  }

  function peek(): Token {
    return tokens[currentIndex + 1];
  }

  function peekNext(): Token {
    return tokens[currentIndex + 2];
  }

  // Does the current token match one in a list of types
  function match(...types: Array<SyntaxType>): boolean {
    for (let i = 0; i < types.length; i++) {
      if (check(types[i])) {
        return true;
      }
    }

    return false;
  }

  // Does the current token match the given type
  function check(type: SyntaxType): boolean {
    if (isAtEnd()) {
      return false;
    }

    return type === currentToken().type;
  }

  // Does the current token match the given text
  function checkText(text: string): boolean {
    if (isAtEnd()) {
      return false;
    }

    return text === currentToken().text;
  }

  // requireToken the current token to match given type and advance, otherwise return null
  function consume(type: SyntaxType): Token {
    if (check(type)) {
      return advance();
    }

    return null;
  }

  function consumeText(text: string): Token {
    if (checkText(text)) {
      return advance();
    }

    return null;
  }

  // Move the cursor forward and return the previous token
  function advance(): Token {
    if (!isAtEnd()) {
      currentIndex += 1;
    }

    return previousToken();
  }

  function isAtEnd(): boolean {
    return (
      currentIndex >= tokens.length ||
      currentToken().type === SyntaxType.EOF
    );
  }

  return {
    parse
  };
}