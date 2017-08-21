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

export class Parser {
  private tokens: Token[];
  private currentIndex: number;

  constructor(tokens: Array<Token>) {
    this.tokens = tokens;
    this.currentIndex = 0;
  }

  parse(): ThriftDocument {
    const thrift: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: []
    };

    while (!this.isAtEnd()) {
      const statement: ThriftStatement = this.parseStatement();
      if (statement !== null) {
        console.log('statement: ', statement);
        thrift.body.push(statement);
      }
    }

    return thrift;
  }

  private parseStatement(): ThriftStatement {
    const next: Token = this.currentToken();
    console.log('next: ', next);
    // All Thrift statements must start with one of these types
    switch(next.type) {
      case SyntaxType.NamespaceKeyword:
        return this.parseNamespace();

      case SyntaxType.ConstKeyword:
        return this.parseConst();

      case SyntaxType.StructKeyword:
        return this.parseStruct();

      case SyntaxType.UnionKeyword:
        return this.parseUnion();

      case SyntaxType.ExceptionKeyword:
        return this.parseException();

      case SyntaxType.ServiceKeyword:
        return this.parseService();

      case SyntaxType.TypedefKeyword:
        return this.parseTypedef();

      case SyntaxType.EnumKeyword:
        return this.parseEnum();

      case SyntaxType.CommentBlock:
      case SyntaxType.CommentLine:
        this.advance();
        return null;

      default:
        throw new ParseError(`Invalid start to Thrift statement ${next.text}`);
    }
  }

  private isStatementBeginning(): boolean {
    switch(this.currentToken().type) {
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

  // ServiceDefinition → 'service' Identifier ( 'extends' Identifier )? '{' Function* '}'
  private parseService(): ServiceDefinition {
    const keywordToken: Token = this.advance();
    const idToken: Token = this.consume(SyntaxType.Identifier);
    this.require(idToken, `Unable to find identifier for service`);

    const extendsId: Identifier = this.parseExtends();
    const openBrace: Token = this.consume(SyntaxType.LeftBraceToken);
    this.require(openBrace, `Expected opening curly brace`);

    const functions: Array<FunctionDefinition> = this.parseFunctions();
    const closeBrace: Token = this.consume(SyntaxType.RightBraceToken);
    this.require(closeBrace, `Expected closing curly brace`);

    const location: TextLocation = createTextLocation(keywordToken.loc.start, closeBrace.loc.end);

    return {
      type: SyntaxType.ServiceDefinition,
      name: createIdentifier(idToken.text, idToken.loc),
      extends: extendsId,
      functions,
      loc: location
    };
  }

  private parseExtends(): Identifier {
    if (this.checkText('extends')) {
      const keywordToken: Token = this.advance();
      const idToken: Token = this.consume(SyntaxType.Identifier);
      this.require(idToken, `Identifier expected after 'extends' keyword`);

      return createIdentifier(
        idToken.text,
        createTextLocation(keywordToken.loc.start, idToken.loc.end)
      );
    } else {
      return null;
    }
  }

  private parseFunctions(): Array<FunctionDefinition> {
    const functions: Array<FunctionDefinition> = [];

    while(true) {
      functions.push(this.parseFunction());

      if (this.check(SyntaxType.RightBraceToken)) {
        break;
      } else if (this.isStatementBeginning()) {
        throw new ParseError(`closing curly brace expected, but new statement found`);
      } else if (this.check(SyntaxType.EOF)) {
        throw new ParseError(`closing curly brace expected but reached end of file`);
      }
    }

    return functions;
  }

  // Function → 'oneway'? FunctionType Identifier '(' Field* ')' Throws? ListSeparator?
  private parseFunction(): FunctionDefinition {
    const returnType: FunctionType = this.parseFunctionType();
  
    const idToken: Token = this.consume(SyntaxType.Identifier);
    this.require(idToken, `Unable to find function identifier`);
    
    const openParen: Token = this.consume(SyntaxType.LeftParenToken);
    this.require(openParen, `Opening parent expected in function definition`);

    const fields: Array<FieldDefinition> = this.parseParameterFields();
    const closeParen: Token = this.consume(SyntaxType.RightParenToken);
    this.require(closeParen, `Closing parent expected in function definition`);

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

  private parseParameterFields(): Array<FieldDefinition> {
    const fields: Array<FieldDefinition> = [];

    while(!this.match(SyntaxType.RightParenToken)) {
      this.readListSeparator();
      fields.push(this.parseField());

      if (this.isStatementBeginning()) {
        throw new ParseError(`closing paren brace expected, but new statement found`);
      } else if (this.check(SyntaxType.EOF)) {
        throw new ParseError(`closing paren brace expected but reached end of file`);
      }
    }

    return fields;
  }

  // Throws → 'throws' '(' Field* ')'
  private parseThrows(): Array<FieldDefinition> {
    if (this.check(SyntaxType.ThrowsKeyword)) {
      const keywordToken: Token = this.advance();
      const openParen: Token = this.consume(SyntaxType.LeftParenToken);
      this.require(openParen, `opening paren '(' expected`);

      const fields: Array<FieldDefinition> = this.parseParameterFields();

      const closeParen: Token = this.consume(SyntaxType.RightParenToken);
      this.require(closeParen, `closing paren ')' expected`);

      return fields;
    }

    return null;
  }

  // Namespace → 'namespace' ( NamespaceScope Identifier )
  private parseNamespace(): NamespaceDefinition {
    const keywordToken: Token = this.advance();
    const scope: NamespaceScope = this.parseNamespaceScope();
    const idToken: Token = this.consume(SyntaxType.Identifier);
    this.require(idToken, `Unable to find identifier for namespace`);

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
  private parseNamespaceScope(): NamespaceScope {
    const currentToken: Token = this.currentToken();
    switch(currentToken.text) {
      case '*':
      case 'js':
      case 'cpp':
      case 'java':
      case 'py':
      case 'perl':
      case 'rb':
      case 'cocoa':
      case 'csharp':
        this.advance();
        return {
          type: SyntaxType.NamespaceScope,
          value: currentToken.text,
          loc: {
            start: currentToken.loc.start,
            end: currentToken.loc.end
          }
        };

      default:
        throw new ParseError(`Invalid or missing namespace scope`);
    }
  }

  // ConstDefinition → 'const' FieldType Identifier '=' ConstValue ListSeparator?
  private parseConst(): ConstDefinition {
    const keywordToken: Token = this.advance();
    const fieldType: FieldType = this.parseFieldType();
    const idToken: Token = this.advance();
    this.require(idToken, `const definition must have a name`);
    const initializer: ConstValue = this.parseValueAssignment();
    this.require(initializer, `const must be initialized to a value`);

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

  private parseValueAssignment(): ConstValue {
    if (this.check(SyntaxType.EqualToken)) {
      this.advance();
      return this.parseValue();
    }

    return null;
  }

  // TypedefDefinition → 'typedef' DefinitionType Identifier
  private parseTypedef(): TypedefDefinition {
    const keywordToken: Token = this.advance();
    const type: DefinitionType = this.parseDefinitionType();
    const idToken: Token = this.consume(SyntaxType.Identifier);
    this.require(idToken, `typedef is expected to have name and none found`);


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
  private parseEnum(): EnumDefinition {
    const keywordToken: Token = this.advance();
    const idToken: Token = this.consume(SyntaxType.Identifier);
    this.require(idToken, `expected identifier for enum definition`);
    
    const openBrace: Token = this.consume(SyntaxType.LeftBraceToken);
    this.require(openBrace, `expected opening brace`);
    
    const members: Array<EnumMember> = this.parseEnumMembers();
    const closeBrace: Token = this.consume(SyntaxType.RightBraceToken);
    this.require(closeBrace, `expected closing brace`);

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

  private parseEnumMembers(): Array<EnumMember> {
    const members: Array<EnumMember> = [];
    while (this.check(SyntaxType.Identifier)) {
      members.push(this.parseEnumMember());
      if (this.match(SyntaxType.CommaToken, SyntaxType.SemicolonToken)) {
        this.advance();
      }
    }

    return members;
  }

  // EnumMember → (Identifier ('=' IntConstant)? ListSeparator?)*
  private parseEnumMember(): EnumMember {
    const idToken: Token = this.consume(SyntaxType.Identifier);
    const equalToken: Token = this.consume(SyntaxType.EqualToken);
    const numToken: Token = this.consume(SyntaxType.NumberLiteral);
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
  private parseStruct(): StructDefinition {
    const keywordToken: Token = this.advance();
    const idToken: Token = this.advance();
    const openBrace: Token = this.consume(SyntaxType.LeftBraceToken);
    this.require(openBrace, `struct body must begin with opening curly brace`);

    const fields: Array<FieldDefinition> = this.parseFields();
    const closeBrace: Token = this.advance();

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
  private parseUnion(): UnionDefinition {
    const keywordToken: Token = this.advance();
    const idToken: Token = this.advance();
    const openBrace: Token = this.consume(SyntaxType.LeftBraceToken);
    this.require(openBrace, `union body must begin with opening curly brace`);

    const fields: Array<FieldDefinition> = this.parseFields();
    const closeBrace: Token = this.advance();

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
  private parseException(): ExceptionDefinition {
    const keywordToken: Token = this.advance();
    const idToken: Token = this.advance();
    const openBrace: Token = this.consume(SyntaxType.LeftBraceToken);
    this.require(openBrace, `exception body must begin with opening curly brace '{'`);

    const fields: Array<FieldDefinition> = this.parseFields();
    const closeBrace: Token = this.advance();
    this.require(closeBrace, `exception body must end with a closing curly brace '}'`)

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

  private parseFields(): Array<FieldDefinition> {
    const fields: Array<FieldDefinition> = [];

    while(!this.check(SyntaxType.RightBraceToken)) {
      fields.push(this.parseField());

      if (this.isStatementBeginning()) {
        throw new ParseError(`closing curly brace expected, but new statement found`);
      } else if (this.check(SyntaxType.EOF)) {
        throw new ParseError(`closing curly brace expected but reached end of file`);
      }
    }

    return fields;
  }

  // Field → FieldID? FieldReq? FieldType Identifier ('= ConstValue)? XsdFieldOptions ListSeparator?
  private parseField(): FieldDefinition {
    const startPos: TextLocation = this.currentToken().loc;
    const fieldID: FieldID = this.parseFieldId();
    const fieldRequired: FieldRequired = this.parseRequiredness();
    const fieldType: FieldType = this.parseFieldType();
    const idToken: Token = this.consume(SyntaxType.Identifier);
    this.require(idToken, `Unable to find identifier for field`);

    const defaultValue: ConstValue = this.parseValueAssignment();
    const listSeparator: Token = this.readListSeparator();
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
  private readListSeparator(): Token {
    const currentToken: Token = this.currentToken();
    if (this.match(SyntaxType.CommaToken, SyntaxType.SemicolonToken)) {
      this.advance();
      return currentToken;
    }

    return null;
  }

  // FieldRequired → 'required' | 'optional'
  private parseRequiredness(): FieldRequired {
    const currentToken: Token = this.currentToken();
    if (currentToken.text === 'required' || currentToken.text === 'optional') {
      this.advance();
      return currentToken.text;
    }

    return null;
  }

  // FieldID → IntConstant ':'
  private parseFieldId(): FieldID {
    if (
      this.currentToken().type === SyntaxType.IntegerLiteral &&
      this.peek().type === SyntaxType.ColonToken
    ) {
      const fieldIDToken: Token = this.advance();
      const colonToken: Token = this.advance();

      // return value of number token
      return createFieldID(
        parseInt(fieldIDToken.text),
        createTextLocation(fieldIDToken.loc.start, colonToken.loc.end)
      );
    } else {
      return null
    }
  }

  private parseValue(): ConstValue {
    const next: Token = this.advance();
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
        return this.parseMapValue();

      case SyntaxType.LeftBracketToken:
        return this.parseListValue();

      default:
        return null;
    }
  }

  // ConstMap → '{' (ConstValue ':' ConstValue ListSeparator?)* '}'
  private parseMapValue(): ConstMap {
    // The parseValue method has already advanced the cursor
    const startPos: TextLocation = this.currentToken().loc;
    const properties: Array<PropertyAssignment> = this.readMapValues();
    const closeBrace: Token = this.consume(SyntaxType.RightBraceToken);
    this.require(closeBrace, `Closing brace missing from map definition`);

    const endPos: TextLocation = closeBrace.loc;
    const location: TextLocation = {
      start: startPos.start,
      end: endPos.end
    };
    
    return createConstMap(properties, location);
  }

  // ConstList → '[' (ConstValue ListSeparator?)* ']'
  private parseListValue(): ConstList {
    // The parseValue method has already advanced the cursor
    const startPos: TextLocation = this.currentToken().loc;
    const elements: Array<ConstValue> = this.readListValues();
    const closeBrace: Token = this.consume(SyntaxType.RightBracketToken);
    this.require(closeBrace, `Closing square-bracket missing from list definition`);
    const endPos: TextLocation = closeBrace.loc;

    return createConstList(elements, {
      start: startPos.start,
      end: endPos.end
    });
  }

  private readMapValues(): Array<PropertyAssignment> {
    const properties: Array<PropertyAssignment> = [];
    while (true) {
      const key: ConstValue = this.parseValue();
      const semicolon: Token = this.consume(SyntaxType.ColonToken);
      this.require(semicolon, `Semicolon expected after key in map property assignment`);
      const value: ConstValue = this.parseValue();

      properties.push(creataePropertyAssignment(key, value, {
        start: key.loc.start,
        end: value.loc.end
      }));

      if (this.check(SyntaxType.CommaToken)) {
        this.advance()
      } else {
        break;
      }
    }

    return properties;
  }

  private readListValues(): Array<ConstValue> {
    const elements: Array<ConstValue> = [];
    while(true) {
      elements.push(this.parseValue());

      if (this.check(SyntaxType.CommaToken) || this.check(SyntaxType.SemicolonToken)) {
        this.advance();
      } else {
        break;
      }
    }
    return elements;
  }

  // FunctionType → FieldType | 'void'
  private parseFunctionType(): FunctionType {
    const typeToken: Token = this.currentToken();
    switch (typeToken.type) {
      case SyntaxType.VoidKeyword:
        this.advance();
        return {
          type: SyntaxType.VoidKeyword,
          loc: typeToken.loc
        };

      default:
        return this.parseFieldType();
    }
  }

  // FieldType → Identifier | BaseType | ContainerType
  private parseFieldType(): FieldType {
    const typeToken: Token = this.currentToken();
    switch (typeToken.type) {
      case SyntaxType.Identifier:
        this.advance();
        return createIdentifier(typeToken.text, typeToken.loc);

      default:
        return this.parseDefinitionType();
    }
  }

  // DefinitionType → BaseType | ContainerType
  private parseDefinitionType(): DefinitionType {
    const typeToken: Token = this.advance();
    switch(typeToken.type) {
      case SyntaxType.BoolKeyword:
      case SyntaxType.StringKeyword:
      case SyntaxType.I8Keyword:
      case SyntaxType.I16Keyword:
      case SyntaxType.I32Keyword:
      case SyntaxType.I64Keyword:
        return createKeywordFieldType(typeToken.type, typeToken.loc);

      case SyntaxType.MapKeyword:
        return this.parseMapType();

      case SyntaxType.ListKeyword:
        return this.parseListType();

      case SyntaxType.SetKeyword:
        return this.parseSetType();

      default:
        throw new ParseError(`FieldType expected`);
    }
  }

  // MapType → 'map' CppType? '<' FieldType ',' FieldType '>'
  private parseMapType(): MapType {
    const openBracket: Token = this.consume(SyntaxType.LessThanToken);
    this.require(openBracket, `map needs to defined contained types`);

    const keyType: FieldType = this.parseFieldType();
    const commaToken: Token = this.consume(SyntaxType.CommaToken);
    this.require(commaToken, `comma expedted to separate map types <key, value>`);

    const valueType: FieldType = this.parseFieldType();
    const closeBracket: Token = this.consume(SyntaxType.GreaterThanToken);
    this.require(closeBracket, `map needs to defined contained types`);

    const location: TextLocation = {
      start: openBracket.loc.start,
      end: closeBracket.loc.end
    };

    return createMapFieldType(keyType, valueType, location);
  }

  // SetType → 'set' CppType? '<' FieldType '>'
  private parseSetType(): SetType {
    const openBracket: Token = this.consume(SyntaxType.LessThanToken);
    this.require(openBracket, `map needs to defined contained types`);

    const valueType: FieldType = this.parseFieldType();
    const closeBracket: Token = this.consume(SyntaxType.GreaterThanToken);
    this.require(closeBracket, `map needs to defined contained types`);

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
  private parseListType(): ListType {
    const openBracket: Token = this.consume(SyntaxType.LessThanToken);
    this.require(openBracket, `map needs to defined contained types`);

    const valueType: FieldType = this.parseFieldType();
    const closeBracket: Token = this.consume(SyntaxType.GreaterThanToken);
    this.require(closeBracket, `map needs to defined contained types`);

    return {
      type: SyntaxType.ListType,
      valueType: valueType,
      loc: {
        start: openBracket.loc.start,
        end: closeBracket.loc.end
      }
    };
  }

  private currentToken(): Token {
    return this.tokens[this.currentIndex];
  }

  private previousToken(): Token {
    return this.tokens[this.currentIndex - 1];
  }

  private peek(): Token {
    return this.tokens[this.currentIndex + 1];
  }

  private peekNext(): Token {
    return this.tokens[this.currentIndex + 2];
  }

  // Does the current token match one in a list of types
  private match(...types: Array<SyntaxType>): boolean {
    for (let i = 0; i < types.length; i++) {
      if (this.check(types[i])) {
        return true;
      }
    }

    return false;
  }

  // Does the current token match the given type
  private check(type: SyntaxType): boolean {
    if (this.isAtEnd()) {
      return false;
    }

    return type === this.currentToken().type;
  }

  // Does the current token match the given text
  private checkText(text: string): boolean {
    if (this.isAtEnd()) {
      return false;
    }

    return text === this.currentToken().text;
  }

  // Throw if the given value doesn't exist.
  private require<T>(val: T, msg: string): T {
    if (val === null || val === undefined) {
      throw new ParseError(msg);
    }

    return val;
  }

  // Require the current token to match given type and advance, otherwise return null
  private consume(type: SyntaxType): Token {
    if (this.check(type)) {
      return this.advance();
    }

    return null;
  }

  private consumeText(text: string): Token {
    if (this.checkText(text)) {
      return this.advance();
    }

    return null;
  }

  // Move the cursor forward and return the previous token
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.currentIndex += 1;
    }

    return this.previousToken();
  }

  private isAtEnd(): boolean {
    return (
      this.currentIndex >= this.tokens.length ||
      this.currentToken().type === SyntaxType.EOF
    );
  }
}

export function createParser(tokens: Array<Token>): Parser {
  return new Parser(tokens);
}