---
title:  Types, Operators and Expressions
date:   2019/9/18
description: c语言学习系列（2）
categories:
- 读书笔记
-  C
tags:
-   The C Programming Language
---





- **Variables** and **constants** are the basic data objects manipulated in a program. 
- **Declarations** list the variables to be used, and state what type they have and perhaps what their initial values are. 
- **Operators** specify what is to be done to them. 
- **Expressions** combine variables and constants to produce new values. 
- **The type of an object** determines the set of values it can have and what operations can be performed on it.

### Variable Names

- Names are made up of letters and digits; the first character must be a letter. 
- The underscore ` _ ` counts as a letter; it is sometimes useful for improving the readability of long variable names.
-  Don't begin variable names with underscore, however, since library routines often use such names. 
-  Upper and lower case letters are distinct, so x and X are two different names. Traditional C practice is to use lower case for variable names, and all upper case for symbolic constants.
-  Keywords like `if, else, int, float`, etc., are reserved: you can't use them as variable names. They must be in lower case.



### Data Types and Sizes

| | a few basic data types in C |
|--|-- |
|char | a single byte, capable of holding one character in the local character set |
| int |an integer, typically reflecting the natural size of integers on the host machine  |
| float | single-precision floating point |
| double | double-precision floating point |

**short** and **long** apply to integers,**short** is often 16 bits long, and **int** either 16 or 32 bits. 
```c
short int sh;
long int counter;
```

The qualifier `signed` or `unsigned` may be applied to `char` or any `integer`. `unsigned numbers` are always positive or zero, and obey the laws of arithmetic modulo `2^n`, where n is the number of bits in the type. So, for instance, if chars are 8 bits, `unsigned char` variables have values between 0 and 255, while `signed chars` have values between -128 and 127 (in a two's complement machine.) Whether plain chars are signed or unsigned is machine-dependent, but printable characters are always positive.

The type `long double` specifies extended-precision floating point. As with integers, the sizes of floating-point objects are implementation-defined; float, double and long double could represent one, two or three distinct sizes.

### Constants

| |  |
|--|-- |
| int | 1234  |
| long constant | 123456789L 123456789l |
|Unsigned constants | with a terminal **u** or **U**, **ul** or **UL** indicates unsigned long  |
|Floating-point constants | a decimal point (123.4) or an exponent (1e-2) ,The suffixes f or F indicate a float constant; l or L indicate a long double. |
| octal | A leading 0 (zero) on an integer constant  |
| hexadecimal |   a leading 0x or 0X ,hexadecimal constants may also be followed by L to make them long and `U` to make them `unsigned` , 0XFUL is an unsigned long constant with value 15 decimal. |
|A `character constant` is an integer |  'x' , written as one character within single quotes |

Certain characters can be represented in character and string constants by escape sequences like  `\n` (newline); 
an arbitrary byte-sized bit pattern can be specified by
```c
'\ooo'
```
where `ooo` is one to three octal digits (0...7) or by

```c
'\xhh'
```
where hh is one or more hexadecimal digits (0...9, a...f, A...F). 

```c
 #define VTAB '\013' /* ASCII vertical tab */
 #define BELL '\007'  /* ASCII bell character */
```
or, in hexadecimal,
```c
   #define VTAB '\xb'  /* ASCII vertical tab */
   #define BELL '\x7' /* ASCII bell character */
```

| | The complete set of escape sequences |
|--|-- |
|\a  | alert (bell) character |
| \b | backspace |
| \f | formfeed |
| \n | newline |
| \r | carriage return |
| \t | horizontal tab |
| \v | vertical tab |
| `\\` | backslash |
| `\?` | question mark|
| ` \` ` | single quote|
| `\"` |  double quote|
| \ooo|  octal number|
| \xhh | hexadecimal number  |

The character constant `'\0'` represents the character with value zero, the `null` character. `'\0'` is often written instead of 0 to emphasize the character nature of some expression, but the numeric value is just 0.

String constants can be concatenated at compile time:

```
 "hello, " "world"
```
is equivalent to

```
 "hello, world"
```


Technically, a string constant is an array of characters. The internal representation of a string has a null character `'\0'` at the end, so the physical storage required is one more than the number of characters written between the quotes. This representation means that there is no limit to how long a string can be, but programs must scan a string completely to determine its length. The standard library function `strlen(s)` returns the length of its character string argument s, excluding the terminal `'\0'`.

```c
/* strlen:  return length of s */
int strlen(char s[]) {
    int i;
    while (s[i] != '\0')
        ++i;
    return i;
}
```

Be careful to distinguish between **a character constant** and **a string** that contains a single character: **'x'** is not the same as **"x"**. The former is an integer, used to produce the numeric value of the letter x in the machine's character set. The latter is an array of characters that contains one character (the letter x) and a '\0'.

```c
enum boolean { NO, YES };
```

The first name in an enum has value 0, the next 1, and so on, unless explicit values are specified. If not all values are specified, unspecified values continue the progression from the last specified value, as the second of these examples:

```c
enum escapes { BELL = '\a', BACKSPACE = '\b', TAB = '\t',
                  NEWLINE = '\n', VTAB = '\v', RETURN = '\r' };

 enum months { JAN = 1, FEB, MAR, APR, MAY, JUN,
                 JUL, AUG, SEP, OCT, NOV, DEC };
                       /* FEB = 2, MAR = 3, etc. */
```

### Declarations
A declaration specifies a type, and contains a list of one or more variables of that type, as in

```c
 int  lower, upper, step;
 char c, line[1000];
```
If the variable in question is not automatic, the initialization is done once only, conceptionally before the program starts executing, and the initializer must be a constant expression. An explicitly initialized automatic variable is initialized each time the function or block it is in is entered; the initializer may be any expression. External and static variables are initialized to zero by default. Automatic variables for which is no explicit initializer have undefined (i.e., garbage) values.

The qualifier `const` can be applied to the declaration of any variable to specify that its value will not be changed. For an array, the const qualifier says that the elements will not be altered.
```c
   const double e = 2.71828182845905;
   const char msg[] = "warning: ";
```
The const declaration can also be used with array arguments, to indicate that the function does not change that array:
```
int strlen(const char[]);
```
The result is implementation-defined if an attempt is made to change a `const`.

### Arithmetic Operators

The binary arithmetic operators are `+, -, *, /,` and the modulus operator` %`. 

The `%` operator cannot be applied to a **float** or **double**. The direction of truncation for `/` and the sign of the result for `%` are machine-dependent for negative operands, as is the action taken on overflow or underflow.

### Relational and Logical Operators

#### The relational operators 
```
>  >=  <  <=
```
Relational operators have lower precedence than arithmetic operators
```C
i < lim-1
//taken as
i < (lim-1)
```
#### the logical operators
Expressions connected by  ` && or ||` are evaluated left to right, and evaluation stops as soon as the truth or falsehood of the result is known.
```
&& and ||
```

```C
 for (i=0; i < lim-1 && (c=getchar()) != '\n' && c != EOF; ++i)
       s[i] = c;
```
The precedence of `&&` is higher than that of `||`, and both are lower than relational and equality operators,so
```C
i < lim-1 && (c=getchar()) != '\n' && c != EOF
```
need no extra parentheses. But since **the precedence of != is higher than assignment**, parentheses are needed in

The unary negation operator `!` converts a non-zero operand into 0, and a zero operand in 1. 

A common use of ! is in constructions like
```c
if (!valid)
```
rather than
```c
if (valid == 0)
```

### Type Conversions
In general, the only automatic conversions are those that convert a “narrower” operand into a “wider” one without losing information, such as converting an integer into floating point in an expression like f + i. 

A **char** is just a small integer, so **chars** may be freely used in arithmetic expressions.

```c
/* atoi:  convert s to integer */
int atoi(char s[]) {
    int i, n;
    n = 0;
    for (i = 0; s[i] >= '0' && s[i] <= '9'; ++i)
        n = 10 * n + (s[i] - '0');
    return n;
}
```
the expression
```c
s[i] - '0'
```
gives the numeric value of the character stored in **s[i]**, because the values of '0', '1', etc., form a contiguous increasing sequence.

```c
/* lower:  convert c to lower case; ASCII only */
int lower(int c)
{
    if (c >= 'A' && c <= 'Z')
        return c + 'a' - 'A';
    else
        return c;
}
```
This works for ASCII because corresponding upper case and lower case letters are a fixed distance apart as numeric values and each alphabet is contiguous -- there is nothing but letters between A and Z. 

The standard header `<ctype.h>`, described in Appendix B, defines a family of functions that provide tests and conversions that are independent of character set.
```c
#include <ctype.h>


 c >= '0' && c <= '9'
 // can be replaced by
 isdigit(c)
```

There is one subtle point about the conversion of characters to integers. The language does not specify whether variables of type char are signed or unsigned quantities. **When a char is converted to an int, can it ever produce a negative integer?** The answer varies from machine to machine, reflecting differences in architecture. On some machines a char whose leftmost bit is 1 will be converted to a negative integer (“sign extension''). On others, a char is promoted to an int by adding zeros at the left end, and thus is always positive.

The definition of C guarantees that any character in the machine's standard printing character set will never be negative, so these characters will always be positive quantities in expressions. But arbitrary bit patterns stored in character variables may appear to be negative on some machines, yet positive on others. For portability, specify signed or unsigned if non- character data is to be stored in char variables.

Relational expressions like `i > j` and logical expressions connected by `&&` and `||` are defined to have value 1 if true, and 0 if false. Thus the assignment
```
d = c >= '0' && c <= '9'
```
sets d to 1 if c is a digit, and 0 if not. However, functions like isdigit may return any non- zero value for true. In the test part of if, while, for, etc., ”true'' just means “non-zero'', so this makes no difference.

If there are no unsigned operands, however, the following informal set of rules will suffice:

- If either operand is long double, convert the other to long double.
- Otherwise, if either operand is double, convert the other to double.
- Otherwise, if either operand is float, convert the other to float.
- Otherwise, convert char and short to int.
- Then, if either operand is long, convert the other to long.

Notice that floats in an expression are not automatically converted to double; this is a change from the original definition. In general, mathematical functions like those in `<math.h>` will use double precision. The main reason for using float is to save storage in large arrays, or, less often, to save time on machines where double-precision arithmetic is particularly expensive.

Conversion rules are more complicated when unsigned operands are involved. The problem is that comparisons between signed and unsigned values are machine-dependent, because they depend on the sizes of the various integer types. 
> For example, suppose that int is 16 bits and long is 32 bits.Then -1L < 1U, because 1U, which is an unsigned int, is promoted to a signed long. But -1L > 1UL because -1L is promoted to unsigned long and thus appears to be a large positive number.

A **character** is converted to an **integer**, either by sign extension or not, as described above.
**Longer integers** are converted to shorter ones or to chars by dropping the excess high-order bits.

```c
int i; 
char c;
i = c; 
c = i;
```
the value of c is unchanged. This is true whether or not sign extension is involved. Reversing the order of assignments might lose information, however.

If `x is float and i is int, then x=i and i=x both cause conversions`;floattoint causes truncation of any fractional part. When a double is converted to float, whether the value is rounded or truncated is implementation dependent.

Since an argument of a function call is an expression, type conversion also takes place when arguments are passed to functions. In the absence of a function prototype, char and short become int, and float becomes double. This is why we have declared function arguments to be int and double even when the function is called with char and float.

Finally, explicit type conversions can be forced ("coerced'') in any expression, with a unary operator called a **cast**.
```c
(type name) expression
```
The standard library includes a portable implementation of a pseudo-random number generator and a function for initializing the seed; the former illustrates a cast:
```c
unsigned long int next = 1;

/* rand:  return pseudo-random integer on 0..32767 */
int rand(void) {
    next = next * 1103515245 + 12345;
    return (unsigned int) (next / 65536) % 32768;
}

/* srand:  set seed for rand() */
void srand(unsigned int seed) {
    next = seed;
}
```

### Increment and Decrement Operators

C provides two unusual operators for incrementing and decrementing variables.

```c
n++;
n--;
```

### Bitwise Operators
C provides six operators for bit manipulation; these may only be applied to **integral operands**, that is, `char, short, int, and long`, whether signed or unsigned.

|  | | |
|-- |-- | --|
| & | bitwise AND | mask off some set of bits  |
| `|` |  bitwise inclusive OR |  turn bits on |
| ^ |  bitwise exclusive OR | sets a one in each bit position where its operands have different bits, and zero where they are the same |
| << | leftshift  | * 2^n |
| >>  |right shift | / 2^n |
| ~  | one's complement (unary) | yields the one's complement of an integer; that is, it converts each 1-bit into a 0-bit and vice versa |



|p	| q	| p & q | p `\` q |	p ^ q |
| -- | -- | -- | --| -- |
| 0	| 0 |	0 |	0 |	0 |
| 0	| 1	| 0	| 1	| 1 |
| 1	| 1	| 1 |	1	| 0 |
| 1	| 0	| 0	| 1 |	1 |


```c
// sets to zero all but the low-order 7 bits of n
n = n & 0177;

//sets to one in x the bits that are set to one in SET_ON.
x = x | SET_ON;

int x ,y;
x = 1 ;
y = 2;
//   x & y = 0,  x && y = 1

```

As an illustration of some of the bit operators, consider the function getbits(x,p,n) that returns the (right adjusted) n-bit field of x that begins at position p. We assume that bit position 0 is at the right end and that n and p are sensible positive values. For example, getbits(x,4,3) returns the three bits in positions 4, 3 and 2, right-adjusted.
```c
/* getbits:  get n bits from position p */
unsigned getbits(unsigned x, int p, int n) {
    return (x >> (p + 1 - n)) & ~(~0 << n);
}
```
The expression x >> (p+1-n) moves the desired field to the right end of the word. ~0 is all 1-bits; shifting it left n positions with ~0<<n places zeros in the rightmost n bits; complementing that with ~ makes a mask with ones in the rightmost n bits.

### Assignment Operators and Expressions
The operator `+=` is called an assignment operator.

If **expr1** and **expr2** are expressions, then 
```c
expr1 op= expr2
```
is equivalent to
```c
expr1 = (expr1) op (expr2)
```

```c
x *= y + 1
//means
x = x * (y + 1)
```

```c
/* bitcount:  count 1 bits in x */
int bitcount(unsigned x) {
    int b;
    for (b = 0; x != 0; x >>= 1)
        if (x & 01)
            b++;
    return b;
}
```
assignment operators have the advantage that they correspond better to the way people think. We say "add 2 to i" or "increment i by 2", not "take i, add 2, then put the result back in i". 

### Conditional Expressions
expr1 ? expr2 : expr3

### Precedence and Order of Evaluation
Operators on the same line have the same precedence; rows are in order of decreasing precedence,

| Operators | Associativity |
|-- |-- |
| ()  []  -> . | left to right |
| ! ~  ` ++ `   -- + - * (type)sizeof | right to left |
| * `/` %  | left to right |
|+  - | left to right |
| << >> | left to right |
| < <= > >= | left to right |
| == != | left to right |
| & | left to right |
|  ^ | left to right |
| `|`  | left to right |
|  &&| left to right |
|  `||`| left to right |
| ?: |  right to left |
| = += -= *=  `/=`  %= &= ^=  `|=`  <<= >>=  |  right to left |
| ,  | left to right |

The operators -> and . are used to access members of structures;

Note that the precedence of the bitwise operators &, ^, and | falls below == and !=. This implies that bit-testing expressions like
```c
if ((x & MASK) == 0)
```
must be fully parenthesized to give proper results.

C, like most languages, does not specify the order in which the operands of an operator are
evaluated. (The exceptions are &&, ||, ?:, and `,`.) For example, in a statement like
```c
x = f() + g();
```
f may be evaluated before g or vice versa; thus if either f or g alters a variable on which the other depends, x can depend on the order of evaluation. Intermediate results can be stored in temporary variables to ensure a particular sequence.

Similarly, the order in which function arguments are evaluated is not specified, so the statement
```c
printf("%d %d\n", ++n, power(2, n)); /* WRONG */
```
can produce different results with different compilers, depending on whether n is incremented before power is called. The solution, of course, is to write
```c
++n;
printf("%d %d\n", n, power(2, n));
```

Function calls, nested assignment statements, and increment and decrement operators cause "side effects" - some variable is changed as a by-product of the evaluation of an expression. In any expression involving side effects, there can be subtle dependencies on the order in which variables taking part in the expression are updated. One unhappy situation is typified by the statement
```c
a[i] = i++;
```
The question is whether the subscript is the old value of i or the new. Compilers can interpret this in different ways, and generate different answers depending on their interpretation. 