---
title:  Functions and Program Structure
date:   2019/10/1
description: c语言学习系列（4）
categories:
- 读书笔记
-  C
tags:
-   The C Programming Language
---



### Basics of Functions
earching for the pattern of letters "ould'' in the set of lines
```
 Ah Love! could you and I with Fate conspire
 To grasp this sorry Scheme of Things entire,
 Would not we shatter it to bits -- and then
 Re-mould it nearer to the Heart's Desire!  
```
will produce the output
```
Ah Love! could you and I with Fate conspire
Would not we shatter it to bits -- and then
Re-mould it nearer to the Heart's Desire!
```

The pattern-searching program returns a status from main, the number of matches found. This value is available for use by the environment that called the program



```c
#include <stdio.h>

#define MAXLINE 1000 /* maximum input line length */

int getlinee(char line[], int max);

int strindex(char source[], char searchfor[]);

char pattern[] = "ould";   /* pattern to search for */

/* find all lines matching pattern */
main() {
    char line[MAXLINE];
    int found = 0;
    while (getlinee(line, MAXLINE) > 0)
        if (strindex(line, pattern) >= 0) {
            printf("%s", line);
            found++;
        }
    return found;
}

/* getline:  get line into s, return length */
int getlinee(char s[], int lim) {
    int c, i;
    i = 0;
    while (--lim > 0 && (c = getchar()) != EOF && c != '\n')
        s[i++] = c;
    if (c == '\n')
        s[i++] = c;
    s[i] = '\0';
    return i;
}

/* strindex:  return index of t in s, -1 if none */
int strindex(char s[], char t[]) {
    int i, j, k;
    for (i = 0; s[i] != '\0'; i++) {
        for (j = i, k = 0; t[k] != '\0' && s[j] == t[k]; j++, k++);
        if (k > 0 && t[k] == '\0')
            return i;
    }
    return -1;
}
```

Each function definition has the form
```c
return-type function-name(argument declarations)
{
    declarations and statements
}
```
a minimal function is
```
dummy() {}
```
which does nothing and returns nothing. A do-nothing function like this is sometimes useful as a place holder during program development. If the return type is omitted, int is assumed.

A program is just a set of definitions of variables and functions. Communication between the functions is by arguments and values returned by the functions, and through external variables. The functions can occur in any order in the source file, and the source program can be split into multiple files, so long as no function is split.

The calling function is free to ignore the returned value. It is not illegal, but probably a sign of trouble, if a function returns a value from one place and no value from another. In any case, if a function fails to return a value, its "value'' is certain to be garbage.

The mechanics of how to compile and load a C program that resides on multiple source files vary from one system to the next. On the UNIX system, the cc command does the job.Suppose that the three functions are stored in three files called `main.c, getline.c, and strindex.c`. Then the command
```
cc main.c getline.c strindex.c
```
compiles the three files, placing the resulting object code in files main.o, getline.o, and strindex.o, then loads them all into an executable file called a.out. If there is an error, say in main.c, the file can be recompiled by itself and the result loaded with the previous object files, with the command
```
cc main.c getline.o strindex.o
```
The cc command uses the ".c'' versus ".o'' naming convention to distinguish source files from object files.

### Functions Returning Non-integers
`atof(s)`,(**ascii to floating point numbers**), which converts the string s to its double- precision floating-point equivalent. atof if an extension of `atoi`.It handles an optional sign and decimal point, and the presence or absence of either part or fractional part.

First, atof itself must declare the type of value it returns, since it is not int. The type name precedes the function name:

```c
#include <ctype.h>

/* atof:  convert string s to double */
double atof(char s[]) {
    double val, power;
    int i, sign;
    for (i = 0; isspace(s[i]); i++)  /* skip white space */
        ;
    sign = (s[i] == '-') ? -1 : 1;
    if (s[i] == '+' || s[i] == '-')
        i++;
    for (val = 0.0; isdigit(s[i]); i++)
        val = 10.0 * val + (s[i] - '0');
    if (s[i] == '.')
        i++;
    for (power = 1.0; isdigit(s[i]); i++) {
        val = 10.0 * val + (s[i] - '0');
        power *= 10;
    }
    return sign * val / power;
}
```
Second, and just as important, the calling routine must know that atof returns a non-int value. One way to ensure this is to declare atof explicitly in the calling routine. The declaration is shown in this primitive calculator (barely adequate for check-book balancing), which reads one number per line, optionally preceded with a sign, and adds them up, printing the running sum after each input:

```c
#include <stdio.h>

#define MAXLINE 100

/* rudimentary calculator */
main() {
    double sum, atof(char []);
    char line[MAXLINE];
    int getline(char line[], int max);
    sum = 0;
    while (getline(line, MAXLINE) > 0)
        printf("\t%g\n", sum += atof(line));
    return 0;
}
```
The declaration
```c
double sum, atof(char []);
```
says that sum is a double variable, and that atof is a function that takes one char[] argument and returns a double.

The function atof must be declared and defined consistently. If `atof` itself and the call to it in main have inconsistent types in the same source file, the error will be detected by the compiler. But if (as is more likely) atof were compiled separately, the mismatch would not be detected, atof would return a double that main would treat as an int, and meaningless answers would result.


### External Variables

**External variables** are defined outside of any function, and are thus potentionally available to many functions. Functions themselves are always external, because C does not allow functions to be defined inside other functions. By default, **external variables and functions** have the property that all references to them by the same name, even from functions compiled separately, are references to the same thing.

If a large number of variables must be shared among functions, external variables are more convenient and efficient than long argument lists.however, this reasoning should be applied with some caution, for it can have a bad effect on program structure, and lead to programs with too many data connections between functions.

External variables are also useful because of their greater scope and lifetime. **Automatic variables** are internal to a function; they come into existence when the function is entered, and disappear when it is left. **External variables, on the other hand, are permanent**, so they can retain values from one function invocation to the next. Thus if two functions must share some data, yet neither calls the other, it is often most convenient if the shared data is kept in external variables rather than being passed in and out via arguments.

The problem is to write a calculator program that provides the operators +, -, * and /. Because it is easier to implement, the calculator will use reverse Polish notation instead of infix. (**Reverse Polish notation** is used by some pocket calculators, and in languages like Forth and Postscript.)
> Reverse Polish notation(逆波兰式,后缀表达式):我们平时写a+b，这是中缀表达式，写成后缀表达式就是：ab+
> (a+b)*c-(a+b)/e的后缀表达式为：ab+c*ab+e/-

an **infix expression** like:
```c
(1 - 2) * (4 + 5)
```
is entered as
```
12-45+*
```


```c
#include <stdio.h>
#include <stdlib.h>  /* for  atof() */

#define MAXOP   100  /* max size of operand or operator */
#define NUMBER  '0'  /* signal that a number was found */

int getop(char []);

void push(double);

double pop(void);

/* reverse Polish calculator */
main() {
    int type;
    double op2;
    char s[MAXOP];
    while ((type = getop(s)) != EOF) {
        switch (type) {
            case NUMBER:
                push(atof(s));
                break;
            case '+':
                push(pop() + pop());
                break;
            case '*':
                push(pop() * pop());
                break;
            case '-':
                op2 = pop();
                push(pop() - op2);
                break;
            case '/':
                op2 = pop();
                if (op2 != 0.0)
                    push(pop() / op2);
                else
                    printf("error: zero divisor\n");
                break;
            case '\n':
                printf("\t%.8g\n", pop());
                break;
            default:
                printf("error: unknown command %s\n", s);
                break;
        }
    }
    return 0;
}
```

```c
#define MAXVAL  100  /* maximum depth of val stack */
int sp = 0;          /* next free stack position */
double val[MAXVAL];  /* value stack */
/* push:  push f onto value stack */
void push(double f) {
    if (sp < MAXVAL)
        val[sp++] = f;
    else
        printf("error: stack full, can't push %g\n", f);
}

/* pop:  pop and return top value from stack */
double pop(void) {
    if (sp > 0)
        return val[--sp];
    else {
        printf("error: stack empty\n");
        return 0.0;
    }
}
```

```c
#include <ctype.h>

int getch(void);

void ungetch(int);

/* getop:  get next character or numeric operand */
int getop(char s[]) {
    int i, c;
    while ((s[0] = c = getch()) == ' ' || c == '\t');
    s[1] = '\0';
    if (!isdigit(c) && c != '.')
        return c;      /* not a number */
    i = 0;
    if (isdigit(c))    /* collect integer part */
        while (isdigit(s[++i] = c = getch()));
    if (c == '.')      /* collect fraction part */

        while (isdigit(s[++i] = c = getch()));
    s[i] = '\0';
    if (c != EOF)
        ungetch(c);
    return NUMBER;
}
```
What are `getch` and `ungetch`? It is often the case that a program cannot determine that it has read enough input until it has read too much. One instance is collecting characters that make up a number: until the first non-digit is seen, the number is not complete. But then the program has read one character too far, a character that it is not prepared for.

The problem would be solved if it were possible to "un-read'' the unwanted character. Then, every time the program reads one character too many, it could push it back on the input, so the rest of the code could behave as if it had never been read. Fortunately, it's easy to simulate un-getting a character, by writing a pair of cooperating functions. `getch` delivers the next input character to be considered; `ungetch` will return them before reading new input.

Since the buffer and the index are shared by `getch` and `ungetch` and must retain their values between calls, they must be external to both routines. 
```c
#define BUFSIZE 100
char buf[BUFSIZE];    /* buffer for ungetch */
int bufp = 0;         /* next free position in buf */
int getch(void)  /* get a (possibly pushed-back) character */
{
    return (bufp > 0) ? buf[--bufp] : getchar();
}

void ungetch(int c)   /* push character back on input */
{
    if (bufp >= BUFSIZE)
        printf("ungetch: too many characters\n");
    else
        buf[bufp++] = c;
}
```

### Scope Rules

The functions and external variables that make up a C program need not all be compiled at the same time; the source text of the program may be kept in several files, and previously compiled routines may be loaded from libraries. Among the questions of interest are

- How are declarations written so that variables are properly declared during compilation?
- How are declarations arranged so that all the pieces will be properly connected when the program is loaded?
- How are declarations organized so there is only one copy?
- How are external variables initialized?

The `scope` of a name is the part of the program within which the name can be used. For an **automatic variable** declared at the beginning of a function, the scope is the function in which the name is declared. **Local variables** of the same name in different functions are unrelated. The same is true of the parameters of the function, which are in effect **local variables**.

> 自动变量（Automatic Variable）指的是局部作用域变量，具体来说即是在控制流进入变量作用域时系统自动为其分配存储空间，并在离开作用域时释放空间的一类变量。在许多程序语言中，自动变量与术语“局部变量”（Local Variable）所指的变量实际上是同一种变量，所以通常情况下“自动变量”与“局部变量”是同义的。

The scope of an **external variable** or a function lasts **from the point at which it is declared to the end of the file being compiled**. For example, if  `main, sp, val, push, and pop` are defined in one file, in the order shown above, that is,

```c
   main() { ... }
   int sp = 0;
   double val[MAXVAL];
   void push(double f) { ... }
   double pop(void) { ... }
```
then the variables `sp` and `val` may be used in `push` and `pop` simply by naming them; no further declarations are needed. But these names are not visible in `main`, nor are `push` and `pop` themselves.

On the other hand, if an **external variable** is to be referred to before it is defined, or if it is defined in a different source file from the one where it is being used, then an **extern declaration** is mandatory.

It is important to distinguish between the **declaration of an external variable** and its **definition**. A **declaration** announces the properties of a variable (primarily its type); a **definition** also causes storage to be set aside. If the lines

```c
 int sp;
 double val[MAXVAL];
```
appear outside of any function, they define the **external variables** `sp` and `val`, cause storage to be set aside, and **also serve as the declarations for the rest of that source file**. On the other hand, the lines

```c
 extern int sp;
 extern double val[];
```
**declare** for the rest of the source file that `sp` is an int and that `val` is a double array (whose size is determined elsewhere), but they **do not create the variables or reserve storage** for them.

There must be only **one definition of an external variable** among all the files that make up the source program; other files may contain **extern declarations** to access it. (There may also be extern declarations in the file containing the definition.) **Array sizes must be specified with the definition**, but are optional with an extern declaration.

Initialization of an external variable goes only with the definition.

Although it is not a likely organization for this program, the functions `push` and `pop` could be defined in one file, and the variables `val` and `sp` defined and initialized in another. Then these definitions and declarations would be necessary to tie them together:

- in file1:

```c
extern int sp;
extern double val[];
void push(double f) { ... }
double pop(void) { ... }
```
- in file2:

```c
int sp = 0;
double val[MAXVAL];
```

Because the **extern declarations** in `file1` lie ahead of and outside the function definitions, they apply to all functions; one set of declarations suffices for all of `file1`. This same organization would also bee needed if the definition of `sp` and `val` followed their use in one file.

### Header Files

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/c/03.png)

- calc.h
```c
#define NUMBER  '0'
void push(double);
double pop(void);
int getop(char []);
int getch(void);
void ungetch(int);

```
- main.c
```c
#include <stdio.h>
#include <stdlib.h>
#include "calc.h"
/* reverse Polish calculator */
#define MAXOP   100  /* max size of operand or operator */
main() {
    int type;
    double op2;
    char s[MAXOP];
    while ((type = getop(s)) != EOF) {
        switch (type) {
            case NUMBER:
                push(atof(s));
                break;
            case '+':
                push(pop() + pop());
                break;
            case '*':
                push(pop() * pop());
                break;
            case '-':
                op2 = pop();
                push(pop() - op2);
                break;
            case '/':
                op2 = pop();
                if (op2 != 0.0)
                    push(pop() / op2);
                else
                    printf("error: zero divisor\n");
                break;
            case '\n':
                printf("\t%.8g\n", pop());
                break;
            default:
                printf("error: unknown command %s\n", s);
                break;
        }
    }
    return 0;
}
```
- getop.c
```c
#include <stdio.h>
#include <ctype.h>
#include "calc.h"

/* getop:  get next character or numeric operand */
int getop(char s[]) {
    int i, c;
    while ((s[0] = c = getch()) == ' ' || c == '\t');
    s[1] = '\0';
    if (!isdigit(c) && c != '.')
        return c;      /* not a number */
    i = 0;
    if (isdigit(c))    /* collect integer part */
        while (isdigit(s[++i] = c = getch()));
    if (c == '.')      /* collect fraction part */

        while (isdigit(s[++i] = c = getch()));
    s[i] = '\0';
    if (c != EOF)
        ungetch(c);
    return NUMBER;
}
```
- stack.c
```c
#include <stdio.h>
#include "calc.h"
#define MAXVAL  100  /* maximum depth of val stack */
int sp = 0;          /* next free stack position */
double val[MAXVAL];  /* value stack */
/* push:  push f onto value stack */
void push(double f) {
    if (sp < MAXVAL)
        val[sp++] = f;
    else
        printf("error: stack full, can't push %g\n", f);
}

/* pop:  pop and return top value from stack */
double pop(void) {
    if (sp > 0)
        return val[--sp];
    else {
        printf("error: stack empty\n");
        return 0.0;
    }
}
```
- getch.c
```c
#include <stdio.h>
#define BUFSIZE 100
char buf[BUFSIZE];    /* buffer for ungetch */
int bufp = 0;         /* next free position in buf */
int getch(void)  /* get a (possibly pushed-back) character */
{
    return (bufp > 0) ? buf[--bufp] : getchar();
}

void ungetch(int c)   /* push character back on input */
{
    if (bufp >= BUFSIZE)
        printf("ungetch: too many characters\n");
    else
        buf[bufp++] = c;
}
```


### Static Variables

The variables `sp` and `val` in `stack.c`, and `buf` and `bufp` in `getch.c`, are for the private use of the functions in their respective source files, and are not meant to be accessed by anything else. The `static` declaration, applied to an **external variable or function, limits the scope of that object to the rest of the source file being compiled**. **External static** thus provides a way to hide names like `buf` and `bufp` in the `getch-ungetch` combination, which must be external so they can be shared, yet which should not be visible to users of `getch` and `ungetch`.


`Static` storage is specified by prefixing the normal declaration with the word static. If **the two routines and the two variables are compiled in one file**, as in
```c
 static char buf[BUFSIZE];  /* buffer for ungetch */
 static int bufp = 0;       /* next free position in buf */
 int getch(void) { ... }
 void ungetch(int c) { ... }
```
then no other routine will be able to access `buf` and `bufp`, and those names will not conflict with the same names in other files of the same program. In the same way, the variables that `push` and `pop` use for stack manipulation can be hidden, by declaring `sp` and `val` to be static.

The **external static** can be applied to functions as well. Normally, function names are global, visible to any part of the entire program. If a function is declared **static**, however, its name is invisible outside of the file in which it is declared.

The **static** declaration can also be applied to internal variables. **Internal static** variables are local to a particular function just as automatic variables are, but unlike automatics, they remain in existence rather than coming and going each time the function is activated. This means that **internal static** variables provide private, permanent storage within a single function.

### Register Variables
A **register declaration** advises the compiler that the variable in question will be heavily used. The idea is that **register variables** are to be **placed in machine registers**, which may result in smaller and faster programs. But compilers are free to ignore the advice.

```c
 register int  x;
 register char c;
```
The `register` declaration can only be applied to **automatic variables** and to **the formal parameters of a function**. In this later case, it looks like:

```c
 f(register unsigned m, register long n)
   {
       register int i;
... }
```
In practice, there are restrictions on **register variables**, reflecting the realities of underlying hardware. Only a few variables in each function may be kept in registers, and only certain types are allowed. Excess register declarations are harmless, however, since the word register is ignored for excess or disallowed declarations. And it is not possible to take the address of a register variable , regardless of whether the variable is actually placed in a register. The specific restrictions on number and types of register variables vary from machine to machine.

### Block Structure

C is not a **block-structured language** , because functions may not be defined within other functions. On the other hand, **variables can be defined in a block-structured fashion within a function**. Declarations of variables (including initializations) may follow the left brace that introduces any compound statement, not just the one that begins a function. Variables declared in this way hide any identically named variables in outer blocks, and remain in existence until the matching right brace. For example, in

```c
if (n > 0) {
    int i; /*declare a new i*/
    for (i = 0; i < n; i++)
        ...
}
```
the scope of the variable i is the "true'' branch of the if; **this i is unrelated to any i outside the block.** An **automatic variable** declared and initialized in a block is initialized each time the block is entered.

**Automatic variables**, including formal parameters, also **hide external variables and functions of the same name**.
```c
int x; int y;
f(double x)
{
double y;
}
```
then within the function f, occurrences of x refer to the parameter, which is a double; outside f, they refer to the external int. The same is true of the variable y.

As a matter of style, it's best to avoid variable names that conceal names in an outer scope; the potential for confusion and error is too great.

### Initialization

In the absence of explicit initialization, **external and static variables** are guaranteed to be initialized to zero; **automatic and register variables** have undefined (i.e., garbage) initial values.

For **external and static variables**, the initializer must be **a constant expression**; the initialization is done once, conceptionally before the program begins execution.

For **automatic and register variables**, the initializer is not restricted to being a constant: it may be any expression involving previously defined values, even function calls.

An **array** may be initialized by **following its declaration with a list of initializers enclosed in braces** and separated by commas. For example, to initialize an array days with the number of days in each month:
```c
 int days[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 }
```
When the size of the array is omitted, the compiler will compute the length by counting the initializers, of which there are 12 in this case.

If there are fewer initializers for an array than the specified size, the others will be zero for **external, static and automatic variables**. It is an error to have too many initializers. There is no way to specify repetition of an initializer, nor to initialize an element in the middle of an array without supplying all the preceding values as well.

**Character arrays** are a special case of initialization; a string may be used instead of the braces and commas notation:
```c
char pattern = "ould";
```
is a shorthand for the longer but equivalent
```c
char pattern[] = { 'o', 'u', 'l', 'd', '\0' };
```

### Recursion

```c
#include <stdio.h>

/* printd:  print n in decimal */
void printd(int n) {
    if (n < 0) {
        putchar('-');
        n = -n;
    }
    if (n / 10)
        printd(n / 10);
    putchar(n % 10 + '0');
}
```
When a function calls itself recursively, each invocation gets a fresh set of all the automatic variables, independent of the previous set. This in printd(123) the first printd receives the argument n = 123. It passes 12 to a second printd, which in turn passes 1 to a third. The third-level printd prints 1, then returns to the second level. That printd prints 2, then returns to the first level. That one prints 3 and terminates.

```c
/* qsort:  sort v[left]...v[right] into increasing order */
void qsort(int v[], int left, int right) {
    int i, last;
    void swap(int v[], int i, int j);
    if (left >= right) /* do nothing if array contains */
        return;        /* fewer than two elements */
    swap(v, left, (left + right) / 2); /* move partition elem */
    last = left;                     /* to v[0] */
    for (i = left + 1; i <= right; i++)  /* partition */
        if (v[i] < v[left])
            swap(v, ++last, i);
    swap(v, left, last);
    qsort(v, left, last - 1);
    qsort(v, last + 1, right);
}
```

```c
/* swap:  interchange v[i] and v[j] */
void swap(int v[], int i, int j) {
    int temp;
    temp = v[i];
    v[i] = v[j];
    v[j] = temp;
}
```

### The C Preprocessor
C provides certain language facilities by means of a **preprocessor**, which is conceptionally a separate first step in compilation. The two most frequently used features are 
- `#include`: to include the contents of a file during compilation,  
- `#define`: to replace a token by an arbitrary sequence of characters. 

Other features described in this section include **conditional compilation** and **macros with arguments**.

#### File Inclusion

```c
#include "filename"
#include <filename>
```
If **the filename is quoted**, searching for the file typically begins where the source program was found; if it is not found there, or if the name is enclosed in < and >, searching follows an **implementation-defined** rule to find the file. An included file may itself contain `#include` lines.

There are often several `#include` lines at the beginning of a source file, to include common `#define` statements and extern declarations, or to access the function prototype declarations for library functions from headers like `<stdio.h>`. (Strictly speaking, these need not be files; the details of how headers are accessed are implementation-dependent.)

`#include` is the preferred way to tie the declarations together for a large program. It guarantees that all the source files will be supplied with the same definitions and variable declarations, and thus eliminates a particularly nasty kind of bug. Naturally, when an included file is changed, all files that depend on it must be recompiled.

#### Macro Substitution

```c
#define name replacement text
```
It calls for a **macro substitution** of the simplest kind - subsequent occurrences of the token `name` will be replaced by the `replacement text`. The `name` in a `#define` has the same form as a variable name; the `replacement text` is arbitrary. Normally the `replacement text` is the rest of the line, but a long definition may be continued onto several lines by placing a \ at the end of each line to be continued. The scope of a name defined with `#define` is from its point of definition to the end of the source file being compiled. A definition may use previous definitions. Substitutions are made only for tokens, and do not take place within quoted strings. For example, if YES is a defined name, there would be no substitution in printf("YES") or in YESMAN.

Any name may be defined with any replacement text.

```c
#define forever for (;;) /* infinite loop */
```
defines a new word, `forever`, for an infinite loop.

```c
#define max(A, B) ((A) > (B) ? (A) : (B))
```
```c
 x = max(p+q, r+s);
```
will be replaced by the line
```c
 x = ((p+q) > (r+s) ? (p+q) : (r+s));
```

If you examine the expansion of `max`, you will notice some pitfalls. **The expressions are evaluated twice**; this is bad if they involve side effects like increment operators or input and output. For instance
```c
max(i++, j++)  /* WRONG */
```

Nonetheless, macros are valuable. One practical example comes from `<stdio.h>`, in which `getchar` and `putchar` are often defined as macros to avoid the run-time overhead of a function call per character processed. The functions in `<ctype.h>` are also usually implemented as macros.

Names may be undefined with `#undef`, usually to **ensure that a routine is really a function, not a macro**:
```c
  #undef getchar
  int getchar(void) { ... }
```
Formal parameters are not replaced within quoted strings. If, however, a parameter name is preceded by a # in the replacement text, the combination will be expanded into a quoted string with the parameter replaced by the actual argument. This can be combined with string concatenation to make, for example, a debugging print macro:

```c
 #define  dprint(expr)   printf(#expr " = %g\n", expr)
```
When this is invoked, as in
```c
dprint(x/y)
```
the macro is expanded into

```c
 printf("x/y" " = &g\n", x/y);
```
and the strings are concatenated, so the effect is
```c
printf("x/y = &g\n", x/y);
```
Within the actual argument, each " is replaced by \" and each \ by \\, so the result is a legal string constant.

The preprocessor operator ## provides a way to concatenate actual arguments during macro expansion. If a parameter in the replacement text is adjacent to a ##, the parameter is replaced by the actual argument, the ## and surrounding white space are removed, and the result is re- scanned. For example, the macro paste concatenates its two arguments:
#define paste(front, back) front ## back so paste(name, 1) creates the token name1.

#### Conditional Inclusion
The `#if` line evaluates a constant integer expression (which may not include sizeof, casts, or enum constants). If the expression is non-zero, subsequent lines until an `#endif` or `#elif` or `#else` are included. (The preprocessor statement #elif is like else-if.) The expression defined(name) in a `#if` is 1 if the name has been defined, and 0 otherwise.

For example, to make sure that the contents of a file hdr.h are included only once, the contents of the file are surrounded with a conditional like this:
```c
   #if !defined(HDR)
   #define HDR
   /* contents of hdr.h go here */
   #endif
```
The first inclusion of `hdr.h` defines the name HDR; subsequent inclusions will find the name defined and skip down to the `#endif`. A similar style can be used to avoid including files multiple times. If this style is used consistently, then each header can itself include any other headers on which it depends, without the user of the header having to deal with the interdependence.

This sequence tests the name SYSTEM to decide which version of a header to include:

```c
  #if SYSTEM == SYSV
       #define HDR "sysv.h"
   #elif SYSTEM == BSD
       #define HDR "bsd.h"
   #elif SYSTEM == MSDOS
       #define HDR "msdos.h"
   #else
       #define HDR "default.h"
   #endif
   #include HDR
```
The #ifdef and #ifndef lines are specialized forms that test whether a name is defined. The first example of #if above could have been written
```c
   #ifndef HDR
   #define HDR
   /* contents of hdr.h go here */
   #endif
```

