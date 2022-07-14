import {
    Annotations,
    BaseType,
    BooleanLiteral,
    Comment,
    ConstList,
    ConstMap,
    ConstValue,
    DoubleConstant,
    ErrorType,
    ExponentialLiteral,
    FieldDefinition,
    FieldID,
    FieldRequired,
    FieldType,
    FloatLiteral,
    FunctionType,
    HexLiteral,
    Identifier,
    IntConstant,
    IntegerLiteral,
    KeywordType,
    ListType,
    MapType,
    NamespaceScope,
    ParseError,
    PropertyAssignment,
    ScanError,
    SetType,
    StringLiteral,
    StructDefinition,
    SyntaxType,
    TextLocation,
    TextPosition,
    Token,
} from './types'

export function createParseError(
    message: string,
    loc: TextLocation,
): ParseError {
    return {
        type: ErrorType.ParseError,
        message,
        loc,
    }
}

export function createScanError(message: string, loc: TextLocation): ScanError {
    return {
        type: ErrorType.ScanError,
        message,
        loc,
    }
}

export function createTextLocation(
    start: TextPosition,
    end: TextPosition,
): TextLocation {
    return { start, end }
}

export function createTextPosition(
    line: number,
    column: number,
    index: number,
): TextPosition {
    return { line, column, index }
}

export function createToken(
    type: SyntaxType,
    text: string,
    loc: TextLocation,
): Token {
    return { type, text, loc }
}

export function createIdentifier(
    value: string,
    loc: TextLocation,
    annotations?: Annotations,
): Identifier {
    return { type: SyntaxType.Identifier, value, loc, annotations }
}

export function createNamespaceScope(
    value: string,
    loc: TextLocation,
): NamespaceScope {
    return { type: SyntaxType.NamespaceScope, value, loc }
}

export function creataePropertyAssignment(
    name: ConstValue,
    initializer: ConstValue,
    loc: TextLocation,
): PropertyAssignment {
    return {
        type: SyntaxType.PropertyAssignment,
        name,
        initializer,
        loc,
    }
}

export function createFieldDefinition(
    name: Identifier,
    fieldID: FieldID,
    requiredness: FieldRequired,
    fieldType: FunctionType,
    loc: TextLocation,
    defaultValue: ConstValue | null = null,
    annotations?: Annotations,
    comments: Array<Comment> = [],
): FieldDefinition {
    return {
        type: SyntaxType.FieldDefinition,
        name,
        fieldID,
        requiredness,
        fieldType,
        defaultValue,
        annotations,
        comments,
        loc,
    }
}

export function createFieldID(value: number, loc: TextLocation): FieldID {
    return {
        type: SyntaxType.FieldID,
        value,
        loc,
    }
}

export function createStructDefinition(
    name: Identifier,
    fields: Array<FieldDefinition>,
    loc: TextLocation,
    comments: Array<Comment> = [],
): StructDefinition {
    return {
        type: SyntaxType.StructDefinition,
        name,
        fields,
        comments,
        loc,
    }
}

export function createStringLiteral(
    value: string,
    loc: TextLocation,
): StringLiteral {
    return {
        type: SyntaxType.StringLiteral,
        value,
        loc,
    }
}

export function createIntegerLiteral(
    value: string,
    loc: TextLocation,
): IntegerLiteral {
    return { type: SyntaxType.IntegerLiteral, value, loc }
}

export function createHexLiteral(value: string, loc: TextLocation): HexLiteral {
    return { type: SyntaxType.HexLiteral, value, loc }
}

export function createFloatLiteral(
    value: string,
    loc: TextLocation,
): FloatLiteral {
    return { type: SyntaxType.FloatLiteral, value, loc }
}

export function createExponentialLiteral(
    value: string,
    loc: TextLocation,
): ExponentialLiteral {
    return { type: SyntaxType.ExponentialLiteral, value, loc }
}

export function createIntConstant(
    value: IntegerLiteral | HexLiteral,
    loc: TextLocation,
): IntConstant {
    return { type: SyntaxType.IntConstant, value, loc }
}

export function createDoubleConstant(
    value: FloatLiteral | ExponentialLiteral,
    loc: TextLocation,
): DoubleConstant {
    return { type: SyntaxType.DoubleConstant, value, loc }
}

export function createBooleanLiteral(
    value: boolean,
    loc: TextLocation,
): BooleanLiteral {
    return { type: SyntaxType.BooleanLiteral, value, loc }
}

export function createKeywordFieldType(
    type: KeywordType,
    loc: TextLocation,
    annotations?: Annotations,
): BaseType {
    return { type, loc, annotations }
}

export function createMapFieldType(
    keyType: FieldType,
    valueType: FieldType,
    loc: TextLocation,
    annotations?: Annotations,
): MapType {
    return {
        type: SyntaxType.MapType,
        keyType,
        valueType,
        loc,
        annotations,
    }
}

export function createSetFieldType(
    valueType: FieldType,
    loc: TextLocation,
    annotations?: Annotations,
): SetType {
    return {
        type: SyntaxType.SetType,
        valueType,
        loc,
        annotations,
    }
}

export function createListFieldType(
    valueType: FieldType,
    loc: TextLocation,
    annotations?: Annotations,
): ListType {
    return {
        type: SyntaxType.ListType,
        valueType,
        loc,
        annotations,
    }
}

export function createConstMap(
    properties: Array<PropertyAssignment>,
    loc: TextLocation,
): ConstMap {
    return {
        type: SyntaxType.ConstMap,
        properties,
        loc,
    }
}

export function createConstList(
    elements: Array<ConstValue>,
    loc: TextLocation,
): ConstList {
    return {
        type: SyntaxType.ConstList,
        elements,
        loc,
    }
}
