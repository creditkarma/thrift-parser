
typedef i32 MyInteger
const i32 INT32CONSTANT = 9853
const string STRINGCONSTANT = 'hello world'

enum Operation {
  ADD = 1,
  MULTIPLY
}

struct Work {
  1: i32 num1 = 0 ( annotation = "foo" ),
  2: Operation op,
}

service Calculator extends shared.SharedService {
   i32 add(1:MyInteger num1, 2:i32 num2),
   oneway void zip(1:i32 vasia)

}
