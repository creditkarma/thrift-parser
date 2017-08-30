import {
  Token,
  Comment,
  Identifier,
  FieldType,
  FieldRequired,
  FieldID,
  PropertyAssignment,
  BaseType,
  MapType,
  SetType,
  ListType,
  SyntaxType,
  KeywordType,
  ConstValue,
  StringLiteral,
  IntConstant,
  DoubleConstant,
  BooleanLiteral,
  ConstMap,
  ConstList,
  TextLocation,
  TextPosition,
  StructDefinition,
  FieldDefinition,
  FunctionType,
  ParseError,
  ScanError,
  ThriftError,
  ErrorType
} from './types';

export function createParseError(message: string, loc: TextLocation): ParseError {
  return {
    type: ErrorType.ParseError,
    message,
    loc
  };
}

export function createScanError(message: string, loc: TextLocation): ScanError {
  return {
    type: ErrorType.ScanError,
    message,
    loc
  };
}

export function createTextLocation(start: TextPosition, end: TextPosition): TextLocation {
  return { start, end };
}

export function createTextPosition(line: number, column: number, index: number): TextPosition {
  return { line, column, index };
}

export function createToken(type: SyntaxType, text: string, loc: TextLocation): Token {
  return { type, text, loc };
}

export function createIdentifier(value: string, loc: TextLocation): Identifier {
  return { type: SyntaxType.Identifier, value, loc };
}

export function creataePropertyAssignment(name: ConstValue, initializer: ConstValue, loc: TextLocation): PropertyAssignment {
  return {
    type: SyntaxType.PropertyAssignment,
    name,
    initializer,
    loc
  };
}

export function createFieldDefinition(
  name: Identifier,
  fieldID: FieldID,
  requiredness: FieldRequired,
  fieldType: FunctionType,
  loc: TextLocation,
  defaultValue: ConstValue = null,
  comments: Array<Comment> = []
): FieldDefinition {
  return {
    type: SyntaxType.FieldDefinition,
    name,
    fieldID,
    requiredness,
    fieldType,
    defaultValue,
    comments,
    loc
  };
}

export function createFieldID(value: number, loc: TextLocation): FieldID {
  return {
    type: SyntaxType.FieldID,
    value,
    loc
  };
}

export function createStructDefinition(
  name: Identifier,
  fields: Array<FieldDefinition>,
  loc: TextLocation,
  comments: Array<Comment> = []
): StructDefinition {
  return {
    type: SyntaxType.StructDefinition,
    name,
    fields,
    comments,
    loc
  };
}

export function createStringLiteral(value: string, loc: TextLocation): StringLiteral {
  return {
    type: SyntaxType.StringLiteral,
    value,
    loc
  };
}

export function createIntConstant(value: number, loc: TextLocation): IntConstant {
  return { type: SyntaxType.IntConstant, value, loc };
}

export function createDoubleConstant(value: number, loc: TextLocation): DoubleConstant {
  return { type: SyntaxType.DoubleConstant, value, loc };
}

export function createBooleanLiteral(value: boolean, loc: TextLocation): BooleanLiteral {
  return { type: SyntaxType.BooleanLiteral, value, loc };
}

export function createKeywordFieldType(type: KeywordType, loc: TextLocation): BaseType {
  return { type, loc };
}

export function createMapFieldType(keyType: FieldType, valueType: FieldType, loc: TextLocation): MapType {
  return {
    type: SyntaxType.MapType,
    keyType,
    valueType,
    loc
  };
}

export function createSetFieldType(valueType: FieldType, loc: TextLocation): SetType {
  return {
    type: SyntaxType.SetType,
    valueType,
    loc
  };
}

export function createListFieldType(valueType: FieldType, loc: TextLocation): ListType {
  return {
    type: SyntaxType.ListType,
    valueType,
    loc
  };
}

export function createConstMap(properties: Array<PropertyAssignment>, loc: TextLocation): ConstMap {
  return {
    type: SyntaxType.ConstMap,
    properties,
    loc
  };
}

export function createConstList(elements: Array<ConstValue>, loc: TextLocation): ConstList {
  return {
    type: SyntaxType.ConstList,
    elements,
    loc
  };
}