import {
    ConstDefinition,
    CppIncludeDefinition,
    EnumDefinition,
    ExceptionDefinition,
    IncludeDefinition,
    NamespaceDefinition,
    ServiceDefinition,
    StructDefinition,
    SyntaxType,
    ThriftDocument,
    TypedefDefinition,
    UnionDefinition,
} from './types'

export function organize(raw: ThriftDocument): ThriftDocument {
    const namespaces: Array<NamespaceDefinition> = []
    const includes: Array<IncludeDefinition> = []
    const cppIncludes: Array<CppIncludeDefinition> = []
    const constants: Array<ConstDefinition> = []
    const enums: Array<EnumDefinition> = []
    const typedefs: Array<TypedefDefinition> = []
    const structs: Array<StructDefinition> = []
    const unions: Array<UnionDefinition> = []
    const exceptions: Array<ExceptionDefinition> = []
    const services: Array<ServiceDefinition> = []

    for (const next of raw.body) {
        switch (next.type) {
            case SyntaxType.NamespaceDefinition:
                namespaces.push(next)
                break

            case SyntaxType.IncludeDefinition:
                includes.push(next)
                break

            case SyntaxType.CppIncludeDefinition:
                cppIncludes.push(next)
                break

            case SyntaxType.CppIncludeDefinition:
                // We're not generating C++
                break

            case SyntaxType.ConstDefinition:
                constants.push(next)
                break

            case SyntaxType.EnumDefinition:
                enums.push(next)
                break

            case SyntaxType.StructDefinition:
                structs.push(next)
                break

            case SyntaxType.UnionDefinition:
                unions.push(next)
                break

            case SyntaxType.ExceptionDefinition:
                exceptions.push(next)
                break

            case SyntaxType.TypedefDefinition:
                typedefs.push(next)
                break

            case SyntaxType.ServiceDefinition:
                services.push(next)
                break

            default:
                const msg: never = next
                throw new Error(`Unexpected statement type found: ${msg}`)
        }
    }

    return {
        type: SyntaxType.ThriftDocument,
        body: [
            ...namespaces,
            ...includes,
            ...cppIncludes,
            ...enums,
            ...typedefs,
            ...constants,
            ...structs,
            ...unions,
            ...exceptions,
            ...services,
        ],
        tokens: raw.tokens,
    }
}
