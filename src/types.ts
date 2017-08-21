export interface Node {
  type: SyntaxType;
}

export interface SyntaxNode extends Node {
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

export const enum SyntaxType {
  Identifier = 'Identifier',

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