typedef i32 IntegerWithAnnotation ( annotation = "foo" )
typedef i32 IntegerWithTwoAnnotations ( foo, bar, annotation = "foo", another.annotation = "bar" )
typedef i32 IntegerWithFormattedAnnotations (
  foo,
  annotation = "foo",
  another.annotation = "bar"
)
typedef i32 ( another.annotation = "bar" ) annotatedType
typedef AnnotatedEnum ( another.annotation = "bar" ) annotatedIdentifier
typedef i32 IntegerWithTightlyFormattedAnnotations (annotation="foo",foo,bar,another.annotation="bar")
const i32 ConstantWithAnnotation = 9853 ( annotation = "foo", another.annotation = "bar" )

enum AnnotatedEnum {
  ONE = 1 ( annotation = "foo" ),
  TWO ( annotation = "foo", another.annotation = "bar" )
} ( annotation = "foo" )

struct Work {
  1: i32 num1 = 0 ( annotation = "foo" ),
  2: i32 ( annotation = "foo" ) num2,
  3: list<i32 ( annotation = "foo" )> ( annotation = "foo" ) myList ( annotation = "foo" ),
  4: map<i64 ( annotation = "foo" ), i64 ( annotation = "foo" )> ( annotation = "foo" ) myMap ( annotation = "foo" ),
  5: set<i32 ( annotation = "foo" )> ( annotation = "foo" ) mySet ( annotation = "foo" ),
  6: Operation op ( annotation = "foo", another.annotation = "bar" )
} ( annotation = "foo", another.annotation = "bar" )

service Calculator extends shared.SharedService {
   i32 funcWithAnnotation(1:MyInteger num1) throws (1: Exception1 user_exception, 2: Exception2 system_exception) ( annotation = "foo" ),
   oneway void funcWithAnotherAnnotation(1:i32 num1) ( annotation = "foo" )
} (
  annotation = "foo",
  another.annotation = "bar"
)
