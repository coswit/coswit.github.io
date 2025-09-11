
### Getting Started

```C
#include <stdio.h>
main()
   {
     printf("hello, world\n");
}
```

- #include <stdio.h>
tells the compiler to include information about the standard input/output library;

|  ||
|-- | --|
| #include <stdio.h> | include information about standard library |
| main()  |define a function called main that received no argument values |
| printf("hello, world\n");  |  main calls library function printf to print this sequence of characters \n represents the newline character |
| { }  | statements of main are enclosed in braces|

|  ||
|-- | --|
| \n | newline character, which when printed advances the output to the left margin on the next line.|
| \t  | for tab|
| \b  |for backspace |



### Variables and Arithmetic Expressions

uses the formula ![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/c/02.png)

| Fahrenheit |Celsius |
|--|--|
|0 |	-17 |
|20	| -6 |
|40|	4 |
|60	|15 |
|80	| 26 |
|100	|37 |
|120	| 48  |
|140	|60 |
|160	|71 |
|180	|82 |
|200	|93 |
|220	|104 |
|240	|115 |
|260	|126 |
|280	|137 |
|300	|148 |

```c
#include <stdio.h>

/* print Fahrenheit-Celsius table
    for fahr = 0, 20, ..., 300 */
main() {
    int fahr, celsius;
    int lower, upper, step;
    lower = 0;
    upper = 300;
    step = 20;
/* lower limit of temperature scale */
/* upper limit */
/* step size */
    fahr = lower;
    while (fahr <= upper) {
        celsius = 5 * (fahr - 32) / 9;
        printf("%d\t%d\n", fahr, celsius);
        fahr = fahr + step;
    }
}
```
C provides several other data types:

|  | | range (depends on the machine you are using) |
|--|--| --|
| int |  integers | 16-bits ints, which lie between -32768 and +32767|
|float | floating point |
| char | character - a single byte |
| short | short integer |
| long | long integer |
| double | double-precision floating point |

 `printf` is a general-purpose output formatting function, each **%** indicating where one of the other (second, third, ...) arguments is to be substituted, and in what form it is to be printed. For instance, %d specifies an integer argument.

 By the way, **printf** is not part of the C language; there is no input or output defined in C itself. **printf** is just a useful function from the standard library of functions that are normally accessible to C programs. The behaviour of printf is defined in the ANSI standard, however, so its properties should be the same with any compiler and library that conforms to the standard.

```c
#include <stdio.h>
   /* print Fahrenheit-Celsius table
       for fahr = 0, 20, ..., 300; floating-point version */
main() {
    float fahr, celsius;
    float lower, upper, step;
    lower = 0;
    upper = 300;
    step = 20;
/* lower limit of temperatuire scale */
/* upper limit */
/* step size */
    fahr = lower;
    while (fahr <= upper) {
        celsius = (5.0 / 9.0) * (fahr - 32.0);
        printf("%3.0f %6.1f\n", fahr, celsius);
        fahr = fahr + step;
    }
}
```

 The printf conversion specification **%3.0f** says that a floating-point number (here fahr) is to be printed at least three characters wide, with no decimal point and no fraction digits. **%6.1f** describes another number (celsius) that is to be printed at least six characters wide, with 1 digit after the decimal point. 

 Width and precision may be omitted from a specification: **%6f** says that the number is to be at least six characters wide; **%.2f** specifies two characters after the decimal point, but the width is not constrained; and **%f** merely says to print the number as floating point.

|  ||
|--|--|
| %d | print as decimal integer |
| %6d | print as decimal integer, at least 6 characters wide |
| %f | print as floating point |
| %6f | print as floating point, at least 6 characters wide |
| %.2f | print as floating point, 2 characters after decimal point |
| %6.2f | print as floating point, at least 6 wide and 2 after decimal point |
| %o  | for octal |
| %x | for hexadecimal |
| %c  | for character, |
| %s | for character string |
|  %% | for itself |

### Symbolic Constants

One way to deal with magic numbers is to give them meaningful names. A `#define` line defines a **symbolic name** or **symbolic constant** to be a particular string of characters:

```c
#define name replacement list

```

```c
#include <stdio.h>

#define LOWER  0  /* lower limit of table */
#define UPPER  300  /* upper limit */
#define STEP   20 /* step size */

/* print Fahrenheit-Celsius table */
main() {
    int fahr;
    for (fahr = LOWER; fahr <= UPPER; fahr = fahr + STEP)
        printf("%3d %6.1f\n", fahr, (5.0 / 9.0) * (fahr - 32));
}
```
The quantities LOWER, UPPER and STEP are symbolic constants, not variables, so they do not appear in declarations. Symbolic constant names are conventionally written in upper case so they can ber readily distinguished from lower case variable names. Notice that there is no semicolon at the end of a #define line. 

### Character Input and Output

The model of input and output supported by the standard library is very simple. Text input or output, regardless of where it originates or where it goes to, is dealt with as streams of characters. A **text stream** is a sequence of characters divided into lines; each line consists of zero or more characters followed by a newline character. It is the responsibility of the library to make each input or output stream confirm this model; the C programmer using the library need not worry about how lines are represented outside the program.

The standard library provides several functions for reading or writing one character at a time, of which `getchar` and `putchar` are the simplest. Each time it is called, `getchar` reads the next input character from a text stream and returns that as its value. 

```c
c = getchar();
```
the variable c contains the next character of input.
```c
putchar(c);
```
The function `putchar` prints a character each time it is called.


#### File Copying
```c
#include <stdio.h>

/* copy input to output; 1st version  */
main() {
    int c;
    c = getchar();
    while (c != EOF) {
        putchar(c);
        c = getchar();
    }
}
```
The problem is distinguishing the end of input from valid data. The solution is that getchar returns a distinctive value when there is no more input, a value that cannot be confused with any real character. This value is called **EOF**, for `end of file`. We must declare c to be a type big enough to hold any value that getchar returns. We can't use char since c must be big enough to hold **EOF** in addition to any possible char. Therefore we use int.

**EOF** is an integer defined in <stdio.h>, but the specific numeric value doesn't matter as long as it is not the same as any char value. By using the symbolic constant, we are assured that nothing in the program depends on the specific numeric value.

```c
#include <stdio.h>
main() {
    int c;
    while ((c = getchar())!=EOF){
        putchar(c);
    }
}
```
The precedence of `!=` is higher than that of `=` , which means that in the absence of parentheses the relational test `!=` would be done before the assignment `=`. So the statement

```c
c = getchar() != EOF
```
is equivalent to

```c
 c = (getchar() != EOF)
```
This has the undesired effect of setting c to 0 or 1, depending on whether or not the call of
getchar returned end of file.

#### Character Counting

```c
#include <stdio.h>
/* count characters in input; 1st version */
main() {
    long nc;
    nc = 0;
    while (getchar() != EOF)
        ++nc;
    printf("%ld\n", nc);
}
```
The conversion specification `%ld` tells printf that the corresponding argument is a long integer.

```c
#include <stdio.h>

/* count characters in input; 2nd version */
main() {
    double nc;
    for (nc = 0; getchar() != EOF; ++nc)
        ;
    printf("%.0f\n", nc);
}
```
printf uses `%f` for both float and double; `%.0f` suppresses the printing of the decimal point and the fraction part, which is zero.

The body of this for loop is empty, because all the work is done in the test and increment parts. But the grammatical rules of C require that a for statement have a body. The isolated semicolon, called a `null statement`, is there to satisfy that requirement. We put it on a separate line to make it visible.


#### Line Counting
```c
#include <stdio.h>

/* count lines in input */
main() {
    int c, nl;
    nl = 0;
    while ((c = getchar()) != EOF)
        if (c == '\n')
            ++nl;
    printf("%d\n", nl);
}
```
`\n` stands for the value of the newline character, which is 10 in ASCII. You should note carefully that `'\n'` is a single character, and in expressions is just an integer; on the other hand, `'\n'` is a string constant that happens to contain only one character. 

#### Word Counting
The fourth in our series of useful programs counts lines, words, and characters, with the loose definition that a word is any sequence of characters that does not contain a blank, tab or newline. This is a bare-bones version of the UNIX program wc.

```c
#include <stdio.h>

#define IN   1  /* inside a word */
#define OUT  0  /* outside a word */

/* count lines, words, and characters in input */
main() {
    int c, nl, nw, nc, state;
    state = OUT;
    nl = nw = nc = 0;
    while ((c = getchar()) != EOF) {
        ++nc;
        if (c == '\n')
            ++nl;
        if (c == ' ' || c == '\n' || c == '\t')
            state = OUT;
        else if (state == OUT) {
            state = IN;
            ++nw;
        }
    }
    printf("%d %d %d\n", nl, nw, nc);
}
```
### Arrays
```c
#include <stdio.h>

/* count digits, white space, others */
main() {
    int c, i, nwhite, nother;
    int ndigit[10];
    nwhite = nother = 0;
    for (i = 0; i < 10; ++i)
        ndigit[i] = 0;
    while ((c = getchar()) != EOF)
        if (c >= '0' && c <= '9')
            ++ndigit[c - '0'];
        else if (c == ' ' || c == '\n' || c == '\t')
            ++nwhite;
        else
            ++nother;
    printf("digits =");
    for (i = 0; i < 10; ++i)
        printf(" %d", ndigit[i]);
    printf(", white space = %d, other = %d\n", nwhite, nother);
}
```

### Functions
A function provides a convenient way to encapsulate some computation, which can then be used without worrying about its implementation. With properly designed functions, it is possible to ignore how a job is done; knowing what is done is sufficient. 

```c
#include <stdio.h>

int power(int m, int n);

/* test power function */
main() {
    int i;
    for (i = 0; i < 10; ++i)
        printf("%d %d %d\n", i, power(2, i), power(-3, i));
    return 0;
}

/* power:  raise base to n-th power; n >= 0 */
int power(int base, int n) {
    int i, p;
    p = 1;
    for (i = 1; i <= n; ++i)
        p = p * base;
    return p;
}
```
### Arguments - Call by Value
In C the called function cannot directly alter a variable in the calling function; it can only alter its private temporary copy.

Call by value is an asset, however, not a liability. It usually leads to more compact programs with fewer extraneous variables, because parameters can be treated as conveniently initialized local variables in the called routine. 
```c
#include <stdio.h>

int power(int m, int n);

main() {
    int i;
    for (i = 0; i < 10; ++i)
        printf("%d %d %d\n", i, power(2, i), power(-3, i));
    return 0;
}
int power(int base, int n) {
    int p;
    for (p = 1; n > 0; --n)
        p = p * base;
    return p;
}
```

The parameter n is used as a temporary variable, and is counted down (a for loop that runs backwards) until it becomes zero; there is no longer a need for the variable i. Whatever is done to n inside **power** has no effect on the argument that **power** was originally called with.

When necessary, it is possible to arrange for a function to modify a variable in a calling routine. The caller must provide `the address of` the variable to be set (technically a pointer to the variable), and the called function must declare the parameter to be a pointer and access the variable indirectly through it.

The story is different for **arrays**. When the name of an array is used as an argument, the value passed to the function is the location or address of the beginning of the array - there is no copying of array elements. By subscripting this value, the function can access and alter any argument of the array. 

### Character Arrays

The functions getline and copy are declared at the beginning of the program, which we assume is contained in one file.
```c
#include <stdio.h>

#define MAXLINE 1000   /* maximum input line length */

int getline(char line[], int maxline);

void copy(char to[], char from[]);

/* print the longest input line */
main() {
    int len;
    int max;
    char line[MAXLINE];
    char longest[MAXLINE]; /* longest line saved here */
/* current line length */
/* maximum length seen so far */
    max = 0;
    while ((len = getline(line, MAXLINE)) > 0)
        if (len > max) {
            max = len;
            copy(longest, line);
        }
    if (max > 0) /*therewasaline*/ printf("%s", longest);
/* current input line */
    return 0;
}

/* getline:  read a line into s, return length  */
int getline(char s[], int lim) {
    int c, i;
    for (i = 0; i < lim - 1 && (c = getchar()) != EOF && c != '\n'; ++i)
        s[i] = c;
    if (c == '\n') {
        s[i] = c;
        ++i;
    }
    s[i] = '\0';
    return i;
}

/* copy:  copy 'from' into 'to'; assume to is big enough */
void copy(char to[], char from[]) {
    int i;
    i = 0;
    while ((to[i] = from[i]) != '\0')
        ++i;
}
```

**getline** puts the character `'\0'` (the null character, whose value is zero) at the end of the array it is creating, to mark the end of the string of characters. This conversion is also used by the C language: when a string constant like
```
"hello\n"
```
appears in a C program, it is stored as an array of characters containing the characters in the string and terminated with a `'\0'` to mark the end.

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/c/01.png)

### External Variables and Scope
As an alternative to automatic variables, it is possible to define variables that are external to all functions, that is, variables that can be accessed by name by any function.Because external variables are globally accessible, they can be used instead of argument lists to communicate data between functions. Furthermore, because external variables remain in existence permanently, rather than appearing and disappearing as functions are called and exited, they retain their values even after the functions that set them have returned.

An external variable must be defined, exactly once, outside of any function; this sets aside storage for it. The variable must also be declared in each function that wants to access it; this states the type of the variable. The declaration may be an explicit extern statement or may be implicit from context. To make the discussion concrete, let us rewrite the longest-line program with `line`, `longest`, and `max` as external variables. This requires changing the calls, declarations, and bodies of all three functions.
```c
#include <stdio.h>

#define MAXLINE 1000
int max;/* maximum input line size */
char line[MAXLINE];/* maximum length seen so far */
char longest[MAXLINE];/* current input line */

int getline(void);

void copy(void);

/* print longest input line; specialized version */
main() {
    int len;
    extern int max;
    extern char longest[];
    max = 0;
    while ((len = getline()) > 0)
        if (len > max) {
            max = len;
            copy();
        }
    if (max > 0) /*therewasaline*/ printf("%s", longest);
    return 0;
}

/* getline:  specialized version */
int getline(void) {
    int c, i;
    extern char line[];
    for (i = 0; i < MAXLINE - 1 &&
            (c = getchar()) != EOF && c != '\n';++i)
    line[i] = c;
    if (c == '\n') {
        line[i] = c;
        ++i;
    }
    line[i] = '\0';
    return i;
}

/* copy: specialized version */
void copy(void) {
    int i;
    extern char line[], longest[];
    i = 0;
    while ((longest[i] = line[i]) != '\0')
        ++i;
}
```
Before a function can use an external variable, the name of the variable must be made known to the function; the declaration is the same as before except for the added keyword `extern`.

The usual practice is to collect `extern` declarations of variables and functions in a separate file, historically called a `header`, that is included by `#include` at the front of each source file. The suffix `.h` is conventional for header names.

You should note that we are using the words **definition** and **declaration** carefully when we refer to external variables in this section.**Definition** refers to the place where the variable is created or assigned storage; **declaration** refers to places where the nature of the variable is stated but no storage is allocated.

By the way, there is a tendency to make everything in sight an `extern` variable because it appears to simplify communications - argument lists are short and variables are always there when you want them. But external variables are always there even when you don't want them. Relying too heavily on external variables is fraught with peril since it leads to programs whose data connections are not all obvious - variables can be changed in unexpected and even inadvertent ways, and the program is hard to modify. 