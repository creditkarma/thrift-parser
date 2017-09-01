export interface Node {
  type: SyntaxType;
}

export interface SyntaxNode extends Node {
  loc: TextLocation;
}

export interface StructLike {
  name: Identifier;
  fields: Array<FieldDefinition>;
  comments: Array<Comment>;
  loc: TextLocation;
}

export interface TextLocation {
  start: TextPosition;
  end: TextPosition;
}

export interface TextPosition {
  line: number;
  column: number;
  index: number;
}

export interface Token extends SyntaxNode {
  text: string;
}

export interface ThriftDocument extends Node {
  type: SyntaxType.ThriftDocument;
  body: Array<ThriftStatement>;
  tokens?: Array<Token>;
}

export type ThriftStatement =
  NamespaceDefinition | IncludeDefinition | CppIncludeDefinition | ConstDefinition |
  StructDefinition | EnumDefinition | ExceptionDefinition | UnionDefinition |
  TypedefDefinition | ServiceDefinition;

export type CommentType =
  SyntaxType.CommentLine | SyntaxType.CommentBlock;

export interface Comment extends SyntaxNode {
  type: CommentType;
  value: string;
}

export interface CommentLine extends Comment {
  type: SyntaxType.CommentLine;
}

export interface CommentBlock extends Comment {
  type: SyntaxType.CommentBlock;
}

export interface PrimarySyntax extends SyntaxNode {
  comments: Array<Comment>;
}

export type FieldType =
  BaseType | ContainerType | Identifier;

export type FunctionType =
  FieldType | VoidType;

export type DefinitionType =
  BaseType | ContainerType

export type KeywordType =
  SyntaxType.StringKeyword | SyntaxType.DoubleKeyword | SyntaxType.BoolKeyword |
  SyntaxType.I8Keyword | SyntaxType.I16Keyword | SyntaxType.I32Keyword |
  SyntaxType.I64Keyword | SyntaxType.BinaryKeyword | SyntaxType.ByteKeyword;

export interface VoidType extends SyntaxNode {
  type: SyntaxType.VoidKeyword;
}

export type ContainerType =
  SetType | MapType | ListType;

export interface BaseType extends SyntaxNode {
 type: KeywordType;
}

export interface SetType extends SyntaxNode {
  type: SyntaxType.SetType;
  valueType: FieldType;
}

export interface ListType extends SyntaxNode {
  type: SyntaxType.ListType;
  valueType: FieldType;
}

export interface MapType extends SyntaxNode {
  type: SyntaxType.MapType;
  keyType: FieldType;
  valueType: FieldType;
}

export type ConstValue =
  Identifier | StringLiteral | IntConstant | DoubleConstant |
  BooleanLiteral | ConstMap | ConstList;

export interface NamespaceDefinition extends PrimarySyntax {
  type: SyntaxType.NamespaceDefinition;
  scope: Identifier;
  name: Identifier;
}

export type NamespaceScope =
  '*' | 'cpp' | 'java' | 'py' | 'perl' | 'rb' | 'cocoa' | 'csharp' | 'js'

export interface ConstDefinition extends PrimarySyntax {
  type: SyntaxType.ConstDefinition;
  name: Identifier;
  fieldType: FieldType;
  initializer: ConstValue;
}

export type FieldRequired =
  'required' | 'optional';

export interface IncludeDefinition extends PrimarySyntax {
  type: SyntaxType.IncludeDefinition;
  path: StringLiteral;
}

export interface CppIncludeDefinition extends PrimarySyntax {
  type: SyntaxType.CppIncludeDefinition;
  path: StringLiteral;
}

export interface InterfaceWithFields extends PrimarySyntax {
  name: Identifier;
  fields: Array<FieldDefinition>;
}

export interface StructDefinition extends InterfaceWithFields {
  type: SyntaxType.StructDefinition;
}

export interface UnionDefinition extends InterfaceWithFields {
  type: SyntaxType.UnionDefinition;
}

export interface ExceptionDefinition extends InterfaceWithFields {
  type: SyntaxType.ExceptionDefinition;
}

export interface FieldDefinition extends PrimarySyntax {
  type: SyntaxType.FieldDefinition;
  name: Identifier;
  fieldID: FieldID;
  fieldType: FieldType;
  requiredness: FieldRequired;
  defaultValue: ConstValue;
}

export interface FieldID extends SyntaxNode {
  type: SyntaxType.FieldID;
  value: number;
}

export interface EnumDefinition extends PrimarySyntax {
  type: SyntaxType.EnumDefinition;
  name: Identifier;
  members: Array<EnumMember>;
}

export interface EnumMember extends PrimarySyntax {
  type: SyntaxType.EnumMember;
  name: Identifier;
  initializer: IntConstant;
}

export interface TypedefDefinition extends PrimarySyntax {
  type: SyntaxType.TypedefDefinition;
  name: Identifier;
  definitionType: DefinitionType;
}

export interface ServiceDefinition extends PrimarySyntax {
  type: SyntaxType.ServiceDefinition;
  name: Identifier;
  extends: Identifier;
  functions: Array<FunctionDefinition>;
}

export interface FunctionDefinition extends PrimarySyntax {
  type: SyntaxType.FunctionDefinition;
  name: Identifier;
  returnType: FunctionType;
  fields: Array<FieldDefinition>;
  throws: Array<FieldDefinition>;
}

export interface ParametersDefinition extends SyntaxNode {
  type: SyntaxType.ParametersDefinition;
  fields: Array<FieldDefinition>;
}

export interface ThrowsDefinition extends SyntaxNode {
  type: SyntaxType.ThrowsDefinition;
  fields: Array<FieldDefinition>;
}

export interface StringLiteral extends SyntaxNode {
  type: SyntaxType.StringLiteral;
  value: string;
}

export interface BooleanLiteral extends SyntaxNode {
  type: SyntaxType.BooleanLiteral;
  value: boolean;
}

export interface IntConstant extends SyntaxNode {
  type: SyntaxType.IntConstant;
  value: number;
}

export interface DoubleConstant extends SyntaxNode {
  type: SyntaxType.DoubleConstant;
  value: number;
}

export interface ConstMap extends SyntaxNode {
  type: SyntaxType.ConstMap;
  properties: Array<PropertyAssignment>;
}

export interface ConstList extends SyntaxNode {
  type: SyntaxType.ConstList;
  elements: Array<ConstValue>;
}

export interface PropertyAssignment extends SyntaxNode {
  type: SyntaxType.PropertyAssignment;
  name: ConstValue;
  initializer: ConstValue;
}

export interface Identifier extends SyntaxNode {
  type: SyntaxType.Identifier;
  value: string;
  loc: TextLocation;
}

export const enum SyntaxType {
  ThriftDocument = 'ThriftDocument',

  Identifier = 'Identifier',
  NamespaceScope = 'NamespaceScope',
  FieldID = 'FieldID',

  // Statements
  NamespaceDefinition = 'NamespaceDefinition',
  IncludeDefinition = 'IncludeDefinition',
  CppIncludeDefinition = 'CppIncludeDefinition',
  ConstDefinition = 'ConstDefinition',
  StructDefinition = 'StructDefinition',
  EnumDefinition = 'EnumDefinition',
  ServiceDefinition = 'ServiceDefinition',
  ExceptionDefinition = 'ExceptionDefinition',
  TypedefDefinition = 'TypedefDefinition',
  UnionDefinition = 'UnionDefinition',

  // Fields
  FieldDefinition = 'FieldDefinition',
  FunctionDefinition = 'FunctionDefinition',
  ParametersDefinition = 'ParametersDefinition',
  ThrowsDefinition = 'ThrowsDefinition',

  // Type Annotations
  FieldType = 'FieldType',
  BaseType = 'BaseType',
  SetType = 'SetType',
  MapType = 'MapType',
  ListType = 'ListType',

    // Values
  ConstValue = 'ConstValue',
  IntConstant = 'IntConstant',
  DoubleConstant = 'DoubleConstant',
  ConstList = 'ConstList',
  ConstMap = 'ConstMap',
  EnumMember = 'EnumMember',

  // Literals
  CommentLine = 'CommentLine',
  CommentBlock = 'CommentBlock',
  StringLiteral = 'StringLiteral',
  NumberLiteral = 'NumberLiteral',
  IntegerLiteral = 'IntegerLiteral',
  FloatLiteral = 'FloatLiteral',
  HexLiteral = 'HexLiteral',
  ExponentialLiteral = 'ExponentialLiteral',
  BooleanLiteral = 'BooleanLiteral',
  PropertyAssignment = 'PropertyAssignment',

  // Tokens
  LeftParenToken = 'LeftParenToken',
  RightParenToken = 'RightParenToken',
  LeftBraceToken = 'LeftBraceToken',
  RightBraceToken = 'RightBraceToken',
  LeftBracketToken = 'LeftBracketToken',
  RightBracketToken = 'RightBracketToken',
  CommaToken = 'CommaToken',
  DotToken = 'DotToken',
  MinusToken = 'MinusToken',
  SemicolonToken = 'SemicolonToken',
  ColonToken = 'ColonToken',
  StarToken = 'StarToken',
  EqualToken = 'EqualToken',
  LessThanToken = 'LessThanToken',
  GreaterThanToken = 'GreaterThanToken',

  // Keywords
  NamespaceKeyword = 'NamespaceKeyword',
  IncludeKeyword = 'IncludeKeyword',
  CppIncludeKeyword = 'CppIncludeKeyword',
  ExceptionKeyword = 'ExceptionKeyword',
  ServiceKeyword = 'ServiceKeyword',
  RequiredKeyword = 'RequiredKeyword',
  OptionalKeyword = 'OptionalKeyword',
  FalseKeyword = 'FalseKeyword',
  TrueKeyword = 'TrueKeyword',
  ConstKeyword = 'ConstKeyword',
  DoubleKeyword = 'DoubleKeyword',
  StructKeyword = 'StructKeyword',
  TypedefKeyword = 'TypedefKeyword',
  UnionKeyword = 'UnionKeyword',
  StringKeyword = 'StringKeyword',
  BinaryKeyword = 'BinaryKeyword',
  BoolKeyword = 'BoolKeyword',
  ByteKeyword = 'ByteKeyword',
  EnumKeyword = 'EnumKeyword',
  SenumKeyword = 'SenumKeyword',
  ListKeyword = 'ListKeyword',
  SetKeyword = 'SetKeyword',
  MapKeyword = 'MapKeyword',
  I8Keyword = 'I8Keyword',
  I16Keyword = 'I16Keyword',
  I32Keyword = 'I32Keyword',
  I64Keyword = 'I64Keyword',
  ThrowsKeyword = 'ThrowsKeyword',
  VoidKeyword = 'VoidKeyword',
  OnewayKeyword = 'OnewayKeyword',

  EOF = 'EOF',
}