typedef i32 IntegerWithAnnotation ( annotation = "foo" )
typedef i32 IntegerWithTwoAnnotations ( annotation = "foo", another.annotation = "bar" )
typedef i32 IntegerWithFormattedAnnotations (
  annotation = "foo",
  another.annotation = "bar"
)
typedef i32 IntegerWithTightlyFormattedAnnotations (annotation="foo",another.annotation="bar")
const i32 ConstantWithAnnotation = 9853 ( annotation = "foo", another.annotation = "bar" )

enum AnnotatedEnum {
  ONE = 1 ( annotation = "foo" ),
  TWO ( annotation = "foo", another.annotation = "bar" )
} ( annotation = "foo" )

struct Work {
  1: i32 num1 = 0 ( annotation = "foo" ),
  2: Operation op ( annotation = "foo", another.annotation = "bar" )
} ( annotation = "foo", another.annotation = "bar" )

service Calculator extends shared.SharedService {
   i32 funcWithAnnotation(1:MyInteger num1) throws (1: Exception1 user_exception, 2: Exception2 system_exception) ( annotation = "foo" ),
   oneway void funcWithAnotherAnnotation(1:i32 num1) ( annotation = "foo" )
} (
  annotation = "foo",
  another.annotation = "bar"
)
