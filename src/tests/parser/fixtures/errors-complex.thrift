namespace java com.company.complex.errors

/*
 * This is a test of
 * a more complex file
 *
 * with errors
 */


struct SimpleInvoice {
    1: required string    amount
    2: required string    currency
}

struct Url {
    1: required string discriminator
    2: required bool authenticate
    3: required string url
}

struct EmptyStruct {
    // literally empty.
}
struct BillingAmount {
    1: required string type
    2: required string amount
    3: required string subtext
    4: optional double numericAmount
}
struct StructWithComment {
    # might be smart to reuse whatever is the source of app/packages/schema/graphql/offers/OffersDataTypeLib.graphql
    1: required list<string> bullet
    2: required list<string> pill
}

struct StructWithLineComments {
    1: required string type
    2: optional double numericAmount # this is sometimes false
    3: optional string amount   # this is sometimes null
}

struct StructWithCommentedField {
    1: required i32 count # i32 or i64?
    2: required double actualAverage
    3: required i32 average
    4: required string url
    // 5: optional string reviews
}

#struct CompletelyCommentedStruct {
#        #"loanRate": 5.49,
#        #"loanTerm": 36,
#        #"type": "PersonalLoan"
#}

/*
 * TODO: Complete structure
 */
struct AnotherStruct {
    1: required string     discriminator
    2: required string     trackingType
    3: required i32        id # i32 or i64?
    4: required string     providerId
    5: required bool       featured
    6: required i32        amount # i32 or i64?
    7: required double     monthlyPayment
    8: required i32        term # i32 or i64?
    9: required string     subType
    10: required bool      prequalified
    11: required double    totalInterest
    12: required bool      isHighCostLoan
    13: required bool      isMarketingOffer
    14: optional string    title
}

struct StructWithErrors {
    1: optional list<>  whatType
    2: optional list<OfferGroup> missingType
}

# TODO: Check if this can be deprecated entirely from the payload.
struct ConfigStruct {
    1: required string    configType
}
