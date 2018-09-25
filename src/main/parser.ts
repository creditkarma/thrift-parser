import {
  Annotation,
  Annotations,
  Comment,
  ConstDefinition,
  ConstList,
  ConstMap,
  ConstValue,
  DoubleConstant,
  EnumDefinition,
  EnumMember,
  ExceptionDefinition,
  FieldDefinition,
  FieldID,
  FieldRequired,
  FieldType,
  FunctionDefinition,
  FunctionType,
  Identifier,
  IncludeDefinition,
  IntConstant,
  ListType,
  MapType,
  NamespaceDefinition,
  ParametersDefinition,
  PropertyAssignment,
  ServiceDefinition,
  SetType,
  StructDefinition,
  StructLike,
  SyntaxType,
  TextLocation,
  ThriftDocument,
  ThriftStatement,
  ThrowsDefinition,
  Token,
  TypedefDefinition,
  UnionDefinition,
} from './types'

import {
  creataePropertyAssignment,
  createBooleanLiteral,
  createConstList,
  createConstMap,
  createDoubleConstant,
  createExponentialLiteral,
  createFieldID,
  createFloatLiteral,
  createHexLiteral,
  createIdentifier,
  createIntConstant,
  createIntegerLiteral,
  createKeywordFieldType,
  createMapFieldType,
  createParseError,
  createStringLiteral,
  createTextLocation,
} from './factory'

import {
  ErrorReporter,
  noopReporter,
} from './debugger'

export interface Parser {
  parse(): ThriftDocument
  synchronize(): void
}

function isStatementBeginning(token: Token): boolean {
  switch (token.type) {
    case SyntaxType.NamespaceKeyword:
    case SyntaxType.IncludeKeyword:
    case SyntaxType.ConstKeyword:
    case SyntaxType.StructKeyword:
    case SyntaxType.UnionKeyword:
    case SyntaxType.ExceptionKeyword:
    case SyntaxType.ServiceKeyword:
    case SyntaxType.TypedefKeyword:
    case SyntaxType.EnumKeyword:
    return true

    default:
      return false
  }
}

class ParseError extends Error {
  public message: string
  public loc: TextLocation
  constructor(msg: string, loc: TextLocation) {
    super(msg)
    this.message = msg
    this.loc = loc
  }
}

export function createParser(tokens: Array<Token>, report: ErrorReporter = noopReporter): Parser {
  let comments: Array<Comment> = []
  let currentIndex: number = 0

  // PUBLIC
  function parse(): ThriftDocument {
    const thrift: ThriftDocument = {
      type: SyntaxType.ThriftDocument,
      body: [],
    }

    while (!isAtEnd()) {
      try {
        const statement: ThriftStatement = parseStatement()
        if (statement !== null) {
          thrift.body.push(statement)
        }
      } catch (e) {
        report(createParseError(e.message, e.loc))
      }
    }

    return thrift
  }

  // Finds the beginning of the next statement so we can continue parse after error.
  function synchronize(): void {
    while (!isAtEnd() && !isStatementBeginning(currentToken())) {
      advance()
    }
  }

  function parseStatement(): ThriftStatement {
    const next: Token = currentToken()

    // All Thrift statements must start with one of these types
    switch (next.type) {
      case SyntaxType.NamespaceKeyword:
        return parseNamespace()

      case SyntaxType.IncludeKeyword:
        return parseInclude()

      case SyntaxType.ConstKeyword:
        return parseConst()

      case SyntaxType.StructKeyword:
        return parseStruct()

      case SyntaxType.UnionKeyword:
        return parseUnion()

      case SyntaxType.ExceptionKeyword:
        return parseException()

      case SyntaxType.ServiceKeyword:
        return parseService()

      case SyntaxType.TypedefKeyword:
        return parseTypedef()

      case SyntaxType.EnumKeyword:
        return parseEnum()

      case SyntaxType.CommentBlock:
      case SyntaxType.CommentLine:
        consumeComments()
        return null

      default:
        reportError(`Invalid start to Thrift statement ${next.text}`)
    }
  }

  // IncludeDefinition → 'include' StringLiteral
  function parseInclude(): IncludeDefinition {
    const keywordToken: Token = consume(SyntaxType.IncludeKeyword)
    const pathToken: Token = consume(SyntaxType.StringLiteral)
    requireValue(pathToken, `Include statement must include a path as string literal`)

    return {
      type: SyntaxType.IncludeDefinition,
      path: createStringLiteral(pathToken.text, pathToken.loc),
      comments: getComments(),
      loc: createTextLocation(keywordToken.loc.start, pathToken.loc.end),
    }
  }

  // ServiceDefinition → 'service' Identifier ( 'extends' Identifier )? '{' Function* '} Annotations?'
  function parseService(): ServiceDefinition {
    const leadingComments: Array<Comment> = getComments()
    const keywordToken: Token = consume(SyntaxType.ServiceKeyword)
    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Unable to find identifier for service`)

    const extendsId: Identifier = parseExtends()
    const openBrace: Token = consume(SyntaxType.LeftBraceToken)
    requireValue(openBrace, `Expected opening curly brace`)

    const functions: Array<FunctionDefinition> = parseFunctions()
    const closeBrace: Token = consume(SyntaxType.RightBraceToken)
    requireValue(closeBrace, `Expected closing curly brace`)

    const annotations: Annotations | undefined = parseAnnotations()

    const location: TextLocation = createTextLocation(keywordToken.loc.start, closeBrace.loc.end)

    return {
      type: SyntaxType.ServiceDefinition,
      name: createIdentifier(nameToken.text, nameToken.loc),
      extends: extendsId,
      functions,
      annotations,
      comments: leadingComments,
      loc: location,
    }
  }

  function parseExtends(): Identifier {
    if (checkText('extends')) {
      const keywordToken: Token = consume(SyntaxType.ExtendsKeyword)
      const nameToken: Token = consume(SyntaxType.Identifier)
      requireValue(nameToken, `Identifier expected after 'extends' keyword`)

      return createIdentifier(
        nameToken.text,
        createTextLocation(keywordToken.loc.start, nameToken.loc.end),
      )
    } else {
      return null
    }
  }

  function parseFunctions(): Array<FunctionDefinition> {
    const functions: Array<FunctionDefinition> = []

    while (!check(SyntaxType.RightBraceToken)) {
      if (check(SyntaxType.CommentBlock, SyntaxType.CommentLine)) {
        advance()
      } else {
        functions.push(parseFunction())

        if (isStatementBeginning(currentToken())) {
          reportError(`Closing curly brace expected, but new statement found`)
        } else if (check(SyntaxType.EOF)) {
          reportError(`Closing curly brace expected but reached end of file`)
        }
      }
    }

    return functions
  }

  // Function → 'oneway'? FunctionType Identifier '(' Field* ')' Throws? Annotations? ListSeparator?
  function parseFunction(): FunctionDefinition {
    const leadingComments: Array<Comment> = getComments()
    const onewayToken: Token = consume(SyntaxType.OnewayKeyword)
    const returnType: FunctionType = parseFunctionType()

    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Unable to find function identifier`)

    const params: ParametersDefinition = parseParameterFields()
    requireValue(params, `List of zero or more fields expected`)

    const throws: ThrowsDefinition = parseThrows()

    const annotations: Annotations | undefined = parseAnnotations()

    const listSeparator: Token = readListSeparator()
    const endLoc: TextLocation = (
      (listSeparator !== null) ?
        listSeparator.loc :
        (throws !== null) ?
          throws.loc :
          params.loc
    )

    return {
      type: SyntaxType.FunctionDefinition,
      name: createIdentifier(nameToken.text, nameToken.loc),
      returnType,
      fields: params.fields,
      throws: (throws !== null) ? throws.fields : [],
      annotations,
      comments: leadingComments,
      oneway: (onewayToken !== null),
      modifiers: (
        (onewayToken !== null) ?
          [ onewayToken ] :
          []
      ),
      loc: {
        start: returnType.loc.start,
        end: endLoc.end,
      },
    }
  }

  function parseParameterFields(): ParametersDefinition {
    const fields: Array<FieldDefinition> = []
    const openParen: Token = consume(SyntaxType.LeftParenToken)
    requireValue(openParen, `Opening paren expected to start list of fields`)

    while (!check(SyntaxType.RightParenToken)) {
      readListSeparator()
      fields.push(parseField())

      if (isStatementBeginning(currentToken())) {
        reportError(`Closing paren ')' expected, but new statement found`)
      } else if (check(SyntaxType.EOF)) {
        reportError(`Closing paren ')' expected but reached end of file`)
      }
    }

    const closeParen: Token = consume(SyntaxType.RightParenToken)
    requireValue(closeParen, `Closing paren expected to end list of fields`)

    return {
      type: SyntaxType.ParametersDefinition,
      fields,
      loc: {
        start: openParen.loc.start,
        end: closeParen.loc.end,
      },
    }
  }

  // Throws → 'throws' '(' Field* ')'
  function parseThrows(): ThrowsDefinition {
    if (check(SyntaxType.ThrowsKeyword)) {
      const keywordToken: Token = consume(SyntaxType.ThrowsKeyword)
      const params: ParametersDefinition = parseParameterFields()

      return {
        type: SyntaxType.ThrowsDefinition,
        fields: params.fields,
        loc: {
          start: keywordToken.loc.start,
          end: params.loc.end,
        },
      }
    }

    return null
  }

  // Namespace → 'namespace' ( NamespaceScope Identifier )
  function parseNamespace(): NamespaceDefinition {
    const keywordToken: Token = consume(SyntaxType.NamespaceKeyword)
    const scopeToken: Token = consume(SyntaxType.Identifier)
    requireValue(scopeToken, `Unable to find scope identifier for namespace`)

    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Unable to find name identifier for namespace`)

    return {
      type: SyntaxType.NamespaceDefinition,
      scope: createIdentifier(scopeToken.text, scopeToken.loc),
      name: createIdentifier(nameToken.text, nameToken.loc),
      comments: getComments(),
      loc: createTextLocation(
        keywordToken.loc.start,
        nameToken.loc.end,
      ),
    }
  }

  // ConstDefinition → 'const' FieldType Identifier '=' ConstValue Annotations? ListSeparator?
  function parseConst(): ConstDefinition {
    const leadingComments: Array<Comment> = getComments()
    const keywordToken: Token = consume(SyntaxType.ConstKeyword)
    const fieldType: FieldType = parseFieldType()
    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Const definition must have a name`)

    const initializer: ConstValue = parseValueAssignment()
    requireValue(initializer, `Const must be initialized to a value`)

    const annotations: Annotations | undefined = parseAnnotations()
    readListSeparator()

    return {
      type: SyntaxType.ConstDefinition,
      name: createIdentifier(nameToken.text, nameToken.loc),
      fieldType,
      initializer,
      annotations,
      comments: leadingComments,
      loc: {
        start: keywordToken.loc.start,
        end: initializer.loc.end,
      },
    }
  }

  function parseValueAssignment(): ConstValue {
    if (check(SyntaxType.EqualToken)) {
      advance()
      return parseValue()
    }

    return null
  }

  // Annotations → '(' Annotation* ')'
  function parseAnnotations(): Annotations | undefined {
    if (check(SyntaxType.LeftParenToken)) {

      const annotations: Array<Annotation> = []
      const startToken = advance()
      while (!check(SyntaxType.RightParenToken)) {
          annotations.push(parseAnnotation())
      }
      const endToken = advance()
      return {
        annotations,
        type: SyntaxType.Annotations,
        loc: createTextLocation( startToken.loc.start, endToken.loc.end),
      }
    }

    return undefined
  }

  // Annotation → Identifier ('=' StringLiteral)? ListSeparator?
  function parseAnnotation(): Annotation {
    const nameToken: Token = requireValue(consume(SyntaxType.Identifier), `Annotation must have a name`)
    let valueToken: Token | undefined
    if (check(SyntaxType.EqualToken)) {
      advance()
      valueToken = requireValue(consume(SyntaxType.StringLiteral), `Annotation must have a value`)
    }

    readListSeparator()

    return {
      type: SyntaxType.Annotation,
      name: createIdentifier(nameToken.text, nameToken.loc),
      value: valueToken ? createStringLiteral(valueToken.text, valueToken.loc) : undefined,
      loc: createTextLocation(nameToken.loc.start, (valueToken || nameToken).loc.end),
    }
  }

  // TypedefDefinition → 'typedef' FieldType Identifier
  function parseTypedef(): TypedefDefinition {
    const keywordToken: Token = consume(SyntaxType.TypedefKeyword)
    const type: FieldType = parseFieldType()
    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Typedef is expected to have name and none found`)

    const leadingComments: Array<Comment> = getComments()

    const annotations: Annotations | undefined = parseAnnotations()

    return {
      type: SyntaxType.TypedefDefinition,
      name: createIdentifier(nameToken.text, nameToken.loc),
      definitionType: type,
      annotations,
      comments: leadingComments,
      loc: {
        start: keywordToken.loc.start,
        end: nameToken.loc.end,
      },
    }
  }

  // EnumDefinition → 'enum' Identifier '{' EnumMember* '} Annotations?'
  function parseEnum(): EnumDefinition {
    const leadingComments: Array<Comment> = getComments()
    const keywordToken: Token = consume(SyntaxType.EnumKeyword)
    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Expected identifier for enum definition`)

    const openBrace: Token = consume(SyntaxType.LeftBraceToken)
    requireValue(openBrace, `Expected opening brace`)

    const members: Array<EnumMember> = parseEnumMembers()
    const closeBrace: Token = consume(SyntaxType.RightBraceToken)
    requireValue(closeBrace, `Expected closing brace`)

    const annotations: Annotations | undefined = parseAnnotations()

    const loc: TextLocation = {
      start: keywordToken.loc.start,
      end: closeBrace.loc.end,
    }

    return {
      type: SyntaxType.EnumDefinition,
      name: createIdentifier(nameToken.text, nameToken.loc),
      members,
      annotations,
      comments: leadingComments,
      loc,
    }
  }

  function parseEnumMembers(): Array<EnumMember> {
    const members: Array<EnumMember> = []
    while (!check(SyntaxType.RightBraceToken)) {
      if (check(SyntaxType.CommentBlock, SyntaxType.CommentLine)) {
        advance()
      } else {
        members.push(parseEnumMember())

        // consume list separator if there is one
        readListSeparator()
        if (isStatementBeginning(currentToken())) {
          reportError(`Closing curly brace expected, but new statement found`)
        } else if (check(SyntaxType.EOF)) {
          reportError(`Closing curly brace expected but reached end of file`)
        }
      }
    }

    return members
  }

  // EnumMember → (Identifier ('=' IntConstant)? Annotations? ListSeparator?)*
  function parseEnumMember(): EnumMember {
    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `EnumMember must have identifier`)

    let loc: TextLocation = null
    let initializer: IntConstant = null
    if (consume(SyntaxType.EqualToken) !== null) {
      const numToken: Token = consume(SyntaxType.IntegerLiteral, SyntaxType.HexLiteral)
      requireValue(numToken, `Equals token "=" must be followed by an Integer`)
      initializer = parseIntValue(numToken)
      loc = createTextLocation(nameToken.loc.start, initializer.loc.end)
    }
    else {
      loc = createTextLocation(nameToken.loc.start, nameToken.loc.end)
    }

    const annotations: Annotations | undefined = parseAnnotations()

    return {
      type: SyntaxType.EnumMember,
      name: createIdentifier(nameToken.text, nameToken.loc),
      initializer,
      annotations,
      comments: getComments(),
      loc,
    }
  }

  // StructLike → ('struct' | 'union' | 'exception') Identifier 'xsd_all'? '{' Field* '} Annotations?'
  function parseStructLikeInterface(): StructLike {
    const leadingComments: Array<Comment> = getComments()
    const keywordToken: Token = consume(SyntaxType.StructKeyword, SyntaxType.UnionKeyword, SyntaxType.ExceptionKeyword)
    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Struct-like must have an identifier`)

    const openBrace: Token = consume(SyntaxType.LeftBraceToken)
    requireValue(openBrace, `Struct-like body must begin with opening curly brace '{'`)

    const fields: Array<FieldDefinition> = parseFields()
    const closeBrace: Token = consume(SyntaxType.RightBraceToken)
    requireValue(closeBrace, `Struct-like body must end with a closing curly brace '}'`)

    const annotations: Annotations | undefined = parseAnnotations()

    return {
      name: createIdentifier(nameToken.text, nameToken.loc),
      fields,
      annotations,
      comments: leadingComments,
      loc: {
        start: keywordToken.loc.start,
        end: closeBrace.loc.end,
      },
    }
  }

  // StructDefinition → 'struct' Identifier 'xsd_all'? '{' Field* '} Annotations?'
  function parseStruct(): StructDefinition {
    const parsedData: StructLike = parseStructLikeInterface()

    return {
      type: SyntaxType.StructDefinition,
      name: parsedData.name,
      fields: parsedData.fields,
      annotations: parsedData.annotations,
      comments: parsedData.comments,
      loc: parsedData.loc,
    }
  }

  // UnioinDefinition → 'union' Identifier 'xsd_all'? '{' Field* '} Annotations?'
  function parseUnion(): UnionDefinition {
    const parsedData: StructLike = parseStructLikeInterface()

    return {
      type: SyntaxType.UnionDefinition,
      name: parsedData.name,
      fields: parsedData.fields.map((next: FieldDefinition) => {
        // As per the Thrift spec, all union fields are optional
        next.requiredness = 'optional'
        return next
      }),
      annotations: parsedData.annotations,
      comments: parsedData.comments,
      loc: parsedData.loc,
    }
  }

  // ExceptionDefinition → 'exception' Identifier '{' Field* '} Annotations?'
  function parseException(): ExceptionDefinition {
    const parsedData: StructLike = parseStructLikeInterface()

    return {
      type: SyntaxType.ExceptionDefinition,
      name: parsedData.name,
      fields: parsedData.fields,
      annotations: parsedData.annotations,
      comments: parsedData.comments,
      loc: parsedData.loc,
    }
  }

  function parseFields(): Array<FieldDefinition> {
    const fields: Array<FieldDefinition> = []

    while (!check(SyntaxType.RightBraceToken)) {
      if (check(SyntaxType.CommentBlock, SyntaxType.CommentLine)) {
        advance()
      } else {
        fields.push(parseField())

        if (isStatementBeginning(currentToken())) {
          reportError(`Closing curly brace expected, but new statement found`)
        } else if (check(SyntaxType.EOF)) {
          reportError(`Closing curly brace expected but reached end of file`)
        }
      }
    }

    return fields
  }

  // Field → FieldID? FieldReq? FieldType Identifier ('= ConstValue)? XsdFieldOptions Annotations? ListSeparator?
  function parseField(): FieldDefinition {
    const startLoc: TextLocation = currentToken().loc
    const fieldID: FieldID = parseFieldId()
    const fieldRequired: FieldRequired = parserequireValuedness()
    const fieldType: FieldType = parseFieldType()
    const nameToken: Token = consume(SyntaxType.Identifier)
    requireValue(nameToken, `Unable to find identifier for field`)

    const defaultValue: ConstValue = parseValueAssignment()
    const annotations: Annotations | undefined = parseAnnotations()
    const listSeparator: Token = readListSeparator()

    const endLoc: TextLocation = (
      (listSeparator !== null) ?
        listSeparator.loc :
        (defaultValue !== null) ?
          defaultValue.loc :
          nameToken.loc
    )
    const location: TextLocation = createTextLocation(startLoc.start, endLoc.end)

    return {
      type: SyntaxType.FieldDefinition,
      name: createIdentifier(nameToken.text, nameToken.loc),
      fieldID,
      fieldType,
      requiredness: fieldRequired,
      defaultValue,
      comments: getComments(),
      annotations,
      loc: location,
    }
  }

  // ListSeparator → ',' | ';'
  function readListSeparator(): Token {
    if (check(SyntaxType.CommaToken, SyntaxType.SemicolonToken)) {
      return advance()
    }

    return null
  }

  // FieldRequired → 'required' | 'optional'
  function parserequireValuedness(): FieldRequired {
    const current: Token = currentToken()
    if (current.text === 'required' || current.text === 'optional') {
      advance()
      return current.text
    }

    return null
  }

  // FieldID → IntConstant ':'
  function parseFieldId(): FieldID {
    if (
      currentToken().type === SyntaxType.IntegerLiteral &&
      peek().type === SyntaxType.ColonToken
    ) {
      const fieldIDToken: Token = consume(SyntaxType.IntegerLiteral)
      const colonToken: Token = consume(SyntaxType.ColonToken)

      // return value of number token
      return createFieldID(
        parseInt(fieldIDToken.text),
        createTextLocation(fieldIDToken.loc.start, colonToken.loc.end),
      )
    } else {
      return null
    }
  }

  // ConstValue → Literal | ConstMap | ConstList
  function parseValue(): ConstValue {
    const next: Token = advance()
    switch (next.type) {
      case SyntaxType.Identifier:
        return createIdentifier(next.text, next.loc)

      case SyntaxType.StringLiteral:
        return createStringLiteral(next.text, next.loc)

      case SyntaxType.IntegerLiteral:
      case SyntaxType.HexLiteral:
        return parseIntValue(next)

      case SyntaxType.FloatLiteral:
      case SyntaxType.ExponentialLiteral:
        return parseDoubleValue(next)

      case SyntaxType.TrueKeyword:
        return createBooleanLiteral(true, next.loc)

      case SyntaxType.FalseKeyword:
        return createBooleanLiteral(false, next.loc)

      case SyntaxType.LeftBraceToken:
        return parseMapValue()

      case SyntaxType.LeftBracketToken:
        return parseListValue()

      default:
        return null
    }
  }

  function parseIntValue(token: Token): IntConstant {
    switch (token.type) {
      case SyntaxType.IntegerLiteral:
        return createIntConstant(
          createIntegerLiteral(token.text, token.loc),
          token.loc,
        )

      case SyntaxType.HexLiteral:
        return createIntConstant(
          createHexLiteral(token.text, token.loc),
          token.loc,
        )

      default:
        reportError(`IntConstant expected but found: ${token.type}`)
    }
  }

  function parseDoubleValue(token: Token): DoubleConstant {
    switch (token.type) {
      case SyntaxType.FloatLiteral:
        return createDoubleConstant(
          createFloatLiteral(token.text, token.loc),
          token.loc,
        )

      case SyntaxType.ExponentialLiteral:
        return createDoubleConstant(
          createExponentialLiteral(token.text, token.loc),
          token.loc,
        )

      default:
        reportError(`DoubleConstant expected but found: ${token.type}`)
    }
  }

  // ConstMap → '{' (ConstValue ':' ConstValue ListSeparator?)* '}'
  function parseMapValue(): ConstMap {
    // The parseValue method has already advanced the cursor
    const startLoc: TextLocation = currentToken().loc
    const properties: Array<PropertyAssignment> = check(SyntaxType.RightBraceToken) ? [] : readMapValues()
    const closeBrace: Token = consume(SyntaxType.RightBraceToken)
    requireValue(closeBrace, `Closing brace missing from map definition`)

    const endLoc: TextLocation = closeBrace.loc
    const location: TextLocation = {
      start: startLoc.start,
      end: endLoc.end,
    }

    return createConstMap(properties, location)
  }

  // ConstList → '[' (ConstValue ListSeparator?)* ']'
  function parseListValue(): ConstList {
    // The parseValue method has already advanced the cursor
    const startLoc: TextLocation = currentToken().loc
    const elements: Array<ConstValue> = check(SyntaxType.RightBracketToken) ? [] : readListValues()
    const closeBrace: Token = consume(SyntaxType.RightBracketToken)
    requireValue(closeBrace, `Closing square-bracket missing from list definition`)
    const endLoc: TextLocation = closeBrace.loc

    return createConstList(elements, {
      start: startLoc.start,
      end: endLoc.end,
    })
  }

  function readMapValues(): Array<PropertyAssignment> {
    const properties: Array<PropertyAssignment> = []
    while (true) {
      const key: ConstValue = parseValue()
      const semicolon: Token = consume(SyntaxType.ColonToken)
      requireValue(semicolon, `Semicolon expected after key in map property assignment`)
      const value: ConstValue = parseValue()

      properties.push(creataePropertyAssignment(key, value, {
        start: key.loc.start,
        end: value.loc.end,
      }))

      if (check(SyntaxType.CommaToken)) {
        advance()
      } else {
        break
      }
    }

    return properties
  }

  function readListValues(): Array<ConstValue> {
    const elements: Array<ConstValue> = []
    while (true) {
      elements.push(parseValue())

      if (check(SyntaxType.CommaToken, SyntaxType.SemicolonToken)) {
        advance()
      } else {
        break
      }
    }
    return elements
  }

  // FunctionType → FieldType | 'void'
  function parseFunctionType(): FunctionType {
    const typeToken: Token = consume(SyntaxType.VoidKeyword)
    if (typeToken !== null) {
      return {
        type: SyntaxType.VoidKeyword,
        loc: typeToken.loc,
      }
    } else {
      return parseFieldType()
    }
  }

  // FieldType → Identifier | BaseType | ContainerType
  function parseFieldType(): FieldType {
    const typeToken: Token = advance()
    switch (typeToken.type) {
      case SyntaxType.Identifier:
        return createIdentifier(typeToken.text, typeToken.loc, parseAnnotations())

      case SyntaxType.MapKeyword:
        return parseMapType()

      case SyntaxType.ListKeyword:
        return parseListType()

      case SyntaxType.SetKeyword:
        return parseSetType()

      case SyntaxType.BinaryKeyword:
      case SyntaxType.BoolKeyword:
      case SyntaxType.ByteKeyword:
      case SyntaxType.StringKeyword:
      case SyntaxType.I8Keyword:
      case SyntaxType.I16Keyword:
      case SyntaxType.I32Keyword:
      case SyntaxType.I64Keyword:
      case SyntaxType.DoubleKeyword:
        return createKeywordFieldType(typeToken.type, typeToken.loc, parseAnnotations())

      default:
        reportError(`FieldType expected but found: ${typeToken.type}`)
    }
  }

  // MapType → 'map' CppType? '<' FieldType ',' FieldType '>'
  function parseMapType(): MapType {
    const openBracket: Token = consume(SyntaxType.LessThanToken)
    requireValue(openBracket, `Map needs to defined contained types`)

    const keyType: FieldType = parseFieldType()
    const commaToken: Token = consume(SyntaxType.CommaToken)
    requireValue(commaToken, `Comma expected to separate map types <key, value>`)

    const valueType: FieldType = parseFieldType()
    const closeBracket: Token = consume(SyntaxType.GreaterThanToken)
    requireValue(closeBracket, `Map needs to defined contained types`)

    const location: TextLocation = {
      start: openBracket.loc.start,
      end: closeBracket.loc.end,
    }

    return createMapFieldType(keyType, valueType, location, parseAnnotations())
  }

  // SetType → 'set' CppType? '<' FieldType '>'
  function parseSetType(): SetType {
    const openBracket: Token = consume(SyntaxType.LessThanToken)
    requireValue(openBracket, `Map needs to defined contained types`)

    const valueType: FieldType = parseFieldType()
    const closeBracket: Token = consume(SyntaxType.GreaterThanToken)
    requireValue(closeBracket, `Map needs to defined contained types`)

    return {
      type: SyntaxType.SetType,
      valueType,
      loc: {
        start: openBracket.loc.start,
        end: closeBracket.loc.end,
      },
      annotations: parseAnnotations(),
    }
  }

  // ListType → 'list' '<' FieldType '>' CppType?
  function parseListType(): ListType {
    const openBracket: Token = consume(SyntaxType.LessThanToken)
    requireValue(openBracket, `Map needs to defined contained types`)

    const valueType: FieldType = parseFieldType()
    const closeBracket: Token = consume(SyntaxType.GreaterThanToken)
    requireValue(closeBracket, `Map needs to defined contained types`)

    return {
      type: SyntaxType.ListType,
      valueType,
      loc: {
        start: openBracket.loc.start,
        end: closeBracket.loc.end,
      },
      annotations: parseAnnotations(),
    }
  }

  function parseCommentBlock(rawValue: string): string {
    let comment: string = ''
    let index: number = 0
    let cursor: number = 0
    let current: string = rawValue[index]

    while (true) {
      if (
        current === '\n' ||
        index >= rawValue.length ||
        (current !== '/' && current !== '*' && current !== ' ')
      ) {
        break
      } else {
        index += 1
        current = rawValue[index]
      }
    }

    while (true) {
      if (
        comment.charAt(cursor - 1) === '\n' &&
        (rawValue[(index + 1)] === ' ' || rawValue[(index + 1)] === '*')
      ) {
      /**
       * We ignore stars and spaces after a new line to normalize comment formatting.
       * We're only keeping the text of the comment without the extranious formatting.
       */
      } else {
        comment += current
        cursor += 1
      }

      index += 1
      current = rawValue[index]

      // A comment goes until we find a comment terminator (*/).
      if (rawValue[(index + 1)] === '*' && rawValue[(index + 2)] === '/') {
        index += 1
        index += 1
        break
      } else if (index >= rawValue.length) {
        break
      }
    }

    return comment.trim()
  }

  function consumeComments(): void {
    while (true) {
      const next: Token = tokens[currentIndex]
      switch (next.type) {
        case SyntaxType.CommentBlock:
          comments.push({
            type: next.type,
            value: parseCommentBlock(next.text).split('\n'),
            rawValue: next.text,
            loc: next.loc,
          })
          currentIndex++
          break

        case SyntaxType.CommentLine:
          comments.push({
            type: next.type,
            value: next.text,
            loc: next.loc,
          })
          currentIndex++
          break

        default:
          return
      }
    }
  }

  function currentToken(): Token {
    consumeComments()
    return tokens[currentIndex]
  }

  function previousToken(): Token {
    return tokens[currentIndex - 1]
  }

  function peek(): Token {
    return tokens[currentIndex + 1]
  }

  // Does the current token match the given type
  function check(...types: Array<SyntaxType>): boolean {
    for (const type of types) {
      if (type === currentToken().type) {
        return true
      }
    }

    return false
  }

  // Does the current token match the given text
  function checkText(...strs: Array<string>): boolean {
    for (const str of strs) {
      if (str === currentToken().text) {
        return true
      }
    }

    return false
  }

  // requireToken the current token to match given type and advance, otherwise return null
  function consume(...types: Array<SyntaxType>): Token {
    for (const type of types) {
      if (check(type)) {
        return advance()
      }
    }

    return null
  }

  // Move the cursor forward and return the previous token
  function advance(): Token {
    if (!isAtEnd()) {
      currentIndex += 1
    }

    return previousToken()
  }

  function isAtEnd(): boolean {
    return (
      currentIndex >= tokens.length ||
      currentToken().type === SyntaxType.EOF
    )
  }

  function getComments(): Array<Comment> {
    const current: Array<Comment> = comments
    comments = []
    return current
  }

  function reportError(msg: string): void {
    throw new ParseError(msg, previousToken().loc)
  }

  // Throw if the given value doesn't exist.
  function requireValue<T>(val: T, msg: string): T {
    if (val === null || val === undefined) {
      reportError(msg)
    }

    return val
  }

  return {
    parse,
    synchronize,
  }
}
