/**
 * Multiline typedef
 * comment
 */
typedef i32 MyInteger

/**
 * Const1 comment
 */
const i32 INT32CONSTANT = 9853

// Const2 comment
const string STRINGCONSTANT = 'hello world'

/**
 * Enum comment
 */
enum Operation {
  ADD = 1,
  // Enum field comment
  MULTIPLY
}

/**
 * Struct comment
 */
struct Work {
  1: i32 num1 = 0,
  // Struct field comment
  2: Operation op,
}

/**
 * Service comment
 */
service Calculator extends shared.SharedService {

  /**
   * Function 1 comment
   */

   i32 add(1:MyInteger num1, 2:i32 num2),

   /**
   * Function 2 comment
   */
   oneway void zip(1:i32 vasia)

}

/**
 * Ignored comment
 */
