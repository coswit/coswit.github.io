---
title:  Control Flow
date:   2019/9/22
description: c语言学习系列（3）
categories:
- 读书笔记
-  C
tags:
-   The C Programming Language
---


### Statements and Blocks

An expression such as` x = 0` or `i++` or `printf(...)` becomes a **statement** when it is followed by a semicolon, as in
```c
   x = 0;
   i++;
   printf(...);
```
In C, the **semicolon** is a statement terminator, rather than a separator as it is in languages like Pascal.
Braces { and } are used to group declarations and statements together into a **compound statement**, or **block**, so that they are syntactically equivalent to a single statement.

### If-Else

Since an **if** tests the numeric value of an expression, certain coding shortcuts are possible. 
```c
if (expression)
```
instead of
```c
if (expression != 0)
```

the else part of an `if-else` is optional,there is an ambiguity when an `else if` omitted from a nested `if` sequence. This is resolved by associating the `else` with the closest previous `else`-less if.



```c
if (n > 0)
       if (a > b)
          z = a; 
       else
          z = b;
```
the else goes to the inner if.If that isn't what you want, braces must be used to force the proper association:

```c
if (n > 0) {
       if (a > b)
       z = a;
 }
else
z = b
```

```c
 if (n > 0)
        for (i = 0; i < n; i++)
            if (s[i] > 0) {
                printf("...");
                return i;
            } 
    else
        printf("error -- n is negative\n");
```
The indentation shows unequivocally what you want, but the compiler doesn't get the message, and associates the else with the inner if. This kind of bug can be hard to find; it's a good idea to use braces when there are nested ifs.

### Else-If
```c
if (expression) 
    statement
else if (expression)
    statement
else if (expression) 
    statement
```
Binary search
```c
/* binsearch:  find x in v[0] <= v[1] <= ... <= v[n-1] */
int binsearch(int x, int v[], int n) {
    int low, high, mid;
    low = 0;
    high = n - 1;
    while (low <= high) {
        mid = (low + high) / 2;
        if (x < v[mid])
            high = mid + 1;
        else if (x > v[mid])
            low = mid + 1;
        else    /* found match */
            return mid;
    }
    return -1;   /* no match */
}
```
### Switch
```c
#include <stdio.h>

main()  /* count digits, white space, others */
{
    int c, i, nwhite, nother, ndigit[10];
    nwhite = nother = 0;
    for (i = 0; i < 10; i++)
        ndigit[i] = 0;
    while ((c = getchar()) != EOF) {
        switch (c) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                ndigit[c - '0']++;
                break;
            case ' ':
            case '\n':
            case '\t':
                nwhite++;
                break;
            default:
                nother++;
                break;
        }
    }
    printf("digits =");
    for (i = 0; i < 10; i++)
        printf(" %d", ndigit[i]);
    printf(", white space = %d, other = %d\n",
           nwhite, nother);
    return 0;
}
```

### Loops - While and For
```c
for (expr1; expr2; expr3)
    statement
```
is equivalent to
```c
expr1;
while (expr2) {
    statement
    expr3; 
}
```
The for is preferable when there is a simple initialization and increment since it keeps the loop control statements close together and visible at the top of the loop. This is most obvious in
```c
 for (i = 0; i < n; i++)
       ...
```
which is the C idiom for processing the first n elements of an array, the analog of the Fortran DO loop or the Pascal for. The analogy is not perfect, however, since the index variable i retains its value when the loop terminates for any reason. Because the components of the for are arbitrary expressions, for loops are not restricted to arithmetic progressions. Nonetheless, it is bad style to force unrelated computations into the initialization and increment of a for, which are better reserved for loop control operations.

```c
#include <ctype.h>

/* atoi:  convert s to integer; version 2 */
int atoi(char s[]) {
    int i, n, sign;
    for (i = 0; isspace(s[i]); i++)  /* skip white space */
        ;
    sign = (s[i] == '-') ? -1 : 1;
    if (s[i] == '+' || s[i] == '-')  /* skip sign */
        i++;
    for (n = 0; isdigit(s[i]); i++)
        n = 10 * n + (s[i] - '0');
    return sign * n;
}
```
The standard library provides a more elaborate function strtol for conversion of strings to long integers; see Section 5 of Appendix B.

The advantages of keeping loop control centralized are even more obvious when there are several nested loops. The following function is a Shell sort for sorting an array of integers. The basic idea of this sorting algorithm, which was invented in 1959 by D. L. Shell.
```c
/* shellsort:  sort v[0]...v[n-1] into increasing order */
void shellsort(int v[], int n) {
    int gap, i, j, temp;
    for (gap = n / 2; gap > 0; gap /= 2)
        for (i = gap; i < n; i++)
            for (j = i - gap; j >= 0 && v[j] > v[j + gap]; j -= gap) {
                temp = v[j];
                v[j] = v[j + gap];
                v[j + gap] = temp;
            }

}
```

One final C operator is the comma ",'', which most often finds use in the for statement. A pair of expressions separated by a comma is evaluated left to right, and the type and value of the result are the type and value of the right operand.

```c
#include <string.h>

/* reverse:  reverse string s in place */
void reverse(char s[]) {
    int c, i, j;
    for (i = 0, j = strlen(s) - 1; i < j; i++, j--) {
        c = s[i];
        s[i] = s[j];
        s[j] = c;
    }
}
```
The commas that separate function arguments, variables in declarations, etc., are not comma operators, and do not guarantee left to right evaluation.

Comma operators should be used sparingly. The most suitable uses are for constructs strongly related to each other, as in the for loop in reverse, and in macros where a multistep computation has to be a single expression. A comma expression might also be appropriate for the exchange of elements in reverse, where the exchange can be thought of a single operation:
```c
  for (int i = 0, j = strlen(s) - 1; i < j; i++, j--)
        c = s[i], s[i] = s[j], s[j] = c;
```

### Loops - Do-While
 the do-while, tests at the bottom after making each pass through the loop body; the body is always executed at least once.
```c
do
    statement 
while (expression);
```
The statement is executed, then expression is evaluated. If it is true, statement is evaluated again, and so on. When the expression becomes false, the loop terminates.

```c
/* itoa:  convert n to characters in s */
void itoa(int n, char s[]) {
    int i, sign;
    if ((sign = n) < 0)  /* record sign */
        n = -n;          /* make n positive */
    i = 0;
    do {      /* generate digits in reverse order */
        s[i++] = n % 10 + '0'; /*getnextdigit*/
    } while ((n /= 10) > 0);
    if (sign < 0)
        s[i++] = '-';
    s[i] = '\0';
    reverse(s);
}
```
The do-while is necessary, or at least convenient, since at least one character must be installed in the array s, even if n is zero. 


### Break and Continue
The break statement provides an early exit from for, while, and do, just as from switch. A break causes the innermost enclosing loop or switch to be exited immediately.
```c
/* trim:  remove trailing blanks, tabs, newlines */
int trim(char s[]) {
    int n;
    for (n = strlen(s) - 1; n >= 0; n--)
        if (s[n] != ' ' && s[n] != '\t' && s[n] != '\n')
            break;
    s[n + 1] = '\0';
    return n;
}

```
The continue statement is related to break, but less often used; it causes the next iteration of the enclosing for, while, or do loop to begin. The continue statement applies only to loops, not to switch.

```c
 for (i = 0; i < n; i++)
       if (a[i] < 0)   /* skip negative elements */
           continue;
       ... /* do positive elements */
```

### Goto and labels

there are a few situations where gotos may find a place. The most common is to abandon processing in some deeply nested structure, such as breaking out of two or more loops at once. The break statement cannot be used directly since it only exits from the innermost loop. 

```c
for ( ... )
    for ( ... ) {
        ...
        if (disaster)
} ...
goto error;
   error:
       /* clean up the mess */
```
This organization is handy if the error-handling code is non-trivial, and if errors can occur in several places.


```c
      for (i = 0; i < n; i++)
           for (j = 0; j < m; j++)
               if (a[i] == b[j])
                   goto found;
       /* didn't find any common element */
... found:
       /* got one: a[i] == b[j] */
       ...
```

