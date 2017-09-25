import { SyntaxType } from './types'

export interface KeywordMap {
  [name: string]: SyntaxType
}

export const KEYWORDS: KeywordMap = {
  namespace: SyntaxType.NamespaceKeyword,
  include: SyntaxType.IncludeKeyword,
  cpp_include: SyntaxType.CppIncludeKeyword,
  const: SyntaxType.ConstKeyword,
  struct: SyntaxType.StructKeyword,
  service: SyntaxType.ServiceKeyword,
  extends: SyntaxType.ExtendsKeyword,
  throws: SyntaxType.ThrowsKeyword,
  typedef: SyntaxType.TypedefKeyword,
  union: SyntaxType.UnionKeyword,
  enum: SyntaxType.EnumKeyword,
  senum: SyntaxType.SenumKeyword,
  list: SyntaxType.ListKeyword,
  set: SyntaxType.SetKeyword,
  map: SyntaxType.MapKeyword,
  double: SyntaxType.DoubleKeyword,
  i8: SyntaxType.I8Keyword,
  i16: SyntaxType.I16Keyword,
  i32: SyntaxType.I32Keyword,
  i64: SyntaxType.I64Keyword,
  exception: SyntaxType.ExceptionKeyword,
  bool: SyntaxType.BoolKeyword,
  byte: SyntaxType.ByteKeyword,
  required: SyntaxType.RequiredKeyword,
  optional: SyntaxType.OptionalKeyword,
  string: SyntaxType.StringKeyword,
  true: SyntaxType.TrueKeyword,
  false: SyntaxType.FalseKeyword,
  void: SyntaxType.VoidKeyword,
  oneway: SyntaxType.OnewayKeyword,
}
