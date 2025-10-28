## 1. using声明
头文件中不应该包含声明，格式：
```cpp
using namespace::name;
```

进行了声明后可以直接访问namespace中的名称，如：

```cpp
#include <iostream>
using std::cout; using std::endl;

int main() {
    cout << "Enter two numbers:" << endl;
    return 0;
}
```
## 2. string标准库

导入：

```cpp
#include <string> 
using std::string;
```
### 2.1 定义及初始化
用=初始化一个变量，执行的是**复制初始化(copy initialization)**，编译器把=右侧的值复制到左侧新建的对象中。不使用等号，则执行**直接初始化(direct initialization)**。

```c
string s1;//默认初始化为空字符串
string s2(s1); //s2是对s1的副本
string s2 = s1; //等价于s2(s1)
string s3("value"); //direct initialization，除了字面值最后的null
string s3 = "value"; 

string s7(10, 'c'); // direct initialization; s7 is cccccccccc
string s8 = string(10, 'c'); // copy initialization; s8 is cccccccccc
string temp(10, 'c'); // temp is cccccccccc
string s8 = temp; // copy temp into s8
```

### 2.2 字符串操作

| Operations     |                                                              |
| -------------- | ------------------------------------------------------------ |
| os<<s          | s写到输出流os，返回os                                        |
| is>>s          | 从is中读取字符串赋给s，字符串以空白格分隔                    |
| getline(is, s) | 从is中读取一行到s，返回is                                    |
| s.empty()      | true /false                                                  |
| s.size()       | Returns the number of characters in s.                       |
| s[n]           | Returns a reference to the char at position n in s; positions start at 0 |
| s1+s2          | Returns a string that is the concatenation of s1 and s2.     |
| s1=s2          | Replaces characters in s1 with a copy of s2.                 |
| s1==s2         | The strings s1 and s2 are equal if they contain the same characters |
| s1!=s2         | Equality is case-sensitive.                                  |
| <,<=,>,>=      | 利用字符在字典中的顺序比较，大小写敏感                       |

读写字符串

```cpp
string s; // empty string
cin >> s; // 将标准输入的内容读取到s中，会自动忽略开头的空白，直到遇见下一处空白
cout << s << endl; // 输出s

string s1, s2;
cin >> s1 >> s2; // read first input into s1, second into s2
cout << s1 << s2 << endl; // write both strings
```
读取未知数量的string对象

```c
int main() {
    string word;
    while (cin >> word) // read until end-of-file
        cout << word << endl; // 逐个输出，每个字符串后面跟一个换行符
}
```
getline读取一整行

```c
int main() {
    string line;
    // read input a line at a time until end-of-file
    while (getline(cin, line))
        cout << line << endl;
    return 0;
}
```
empty 与 size 操作

```c
string line;
// read input a line at a time and discard blank lines
while (getline(cin, line))
    if (!line.empty())
        cout << line << endl;
        
// read input a line at a time and print lines that are longer than 80 characters
while (getline(cin, line))
    if (line.size() > 80) cout << line << endl;  
    
auto len = line.size(); // len has type string::size_type   
```
string函数size返回的类型是`string::size_type` Type，定义在string中，类型为无符号类型值，注意如果比较时：

```c
auto len = line.size(); // len has type string::size_type
//此时如果n是负值int，则判断结果是true
s.size() < n
```
字符串比较

符号 (`==`  `!=`) 比较字符的长度相等且包含字符相同, respectively. 关系符`<, <=, >, >=` 按下面规则比较大小：
- 如果字符长度不同，短字串与长字串的每个位置字符都相同，则短字串小于长字串。
- 如果两个字串对应位置不同，则比较第一个相异字符的大小。
```c
//slang > phrase > str
string str = "Hello";
string phrase = "Hello World"; 
string slang = "Hiya";
```
赋值

```cpp
// st1 内容 cccccccccc; st2是字符串
string st1(10, 'c'), st2;

// assignment: s2内容替换s1，s1、s2都是空串
st1 = st2;  
```

相加，标准库允许把字符或字串字面值转换为string对象，当两者混在一起时，必须保证每个+两侧的运算对象至少有一个string，不能把字面值直接相加。C++中字面值并不是标准string对象。

```c
string s1 = "hello", s2 = "world"; // no punctuation in s1 or s2
string s3 = s1 + ", " + s2 + '\n';

string s4 = s1 + ", "; // ok: adding a string and a literal
string s5 = "hello" + ", "; // error: no string operand
string s6 = s1 + ", " + "world"; // ok: each + has a string operand
string s7 = "hello" + ", " + s2; // error: can't add string literals
```

### 2.3  string中的字符处理

标准库cctype头文件中的函数含义：

| 函数 | 含义 |
| ---- | ---- |
|isalnum(c) |当c是字母或数字时为真                                                              |
|isalpha(c) |当c是字母时为真                                                                     |
|iscntrl(c) |当c是控制字符时为真                                                                 |
|isdigit(c) |当c是数字时为真                                                                     |
|isgraph(c) |当c不是空格但可打印时为真                                                           |
|islower(c) |当c是小写字母时为真                                                                 |
|isprint(c) |当c是可打印字符时为真(即c是空格或c具有可视形式)                                     |
|ispunct(c) |当c是标点符号时为真(即c不是控制字符、数字、字母、可打空白中的一种）                       |
|isspace(c) | 当c是空白时为真(即c是空格、横向制表符、纵向制表符、回车符、换行符、进纸符中的一种) |
|isupper(c) | 当c是大写字母时为真                                                                |
|isxdigit(c)| 当c是十六进制数字时为真                                                            |
|tolower(c) | 如果c是大写字科，输出对应的小写字母:否则原输出c                                    |
|toupper(c) | 如果c是小写字，输出对应的大写字母；否则原样输出c"                                  |

string遍历后可对字符进行处理：

```c
string s("Hello World!!!");
// punct_cnt has the same type that s.size
decltype(s.size()) punct_cnt = 0;
// count the number of punctuation characters in s
for (auto c:s)  // for every char in s
    if (ispunct(c)) // if the character is punctuation
        ++punct_cnt;// increment the punctuation counter
cout << punct_cnt
     << " punctuation characters in " << s << endl;
     
     
/**
 * 3 punctuation characters in Hello World!!!
 */
```

改变string中的字符

```c
string s("Hello World!!!");
// convert s to uppercase
for (auto &c : s) // for every char in s (note: c is a reference)
    c = toupper(c); // c is a reference, so the assignment changes the char in s
cout << s << endl;

//HELLO WORLD!!!
```
使用string索引改变部分字符值：

```c
 string s("some string");
    if (!s.empty())// make sure there's a character in s[0]
        s[0] = toupper(s[0]);// assign a new value to the first character in
        
 //Some string
```
通过迭代修改部分字符：

```c
string s("some string");
for (decltype(s.size()) index = 0;
     index != s.size() && !isspace(s[index]); ++index)
    s[index] = toupper(s[index]); // capitalize the current character
    //SOME string
```
## 3. 标准vector 

导入：


```cpp
#include <vector> 
using std::vector;
```
vector是模板(template)，而非类型(type)，不存在包含引用的vector。


### 3.1. 初始化
```c
vector<string> svec; //默认初始化，不包含任何元素
vector<int> ivec2(ivec);    //copy element ivec into ivec2
vector<int> ivec3 = ivec;   //copy element ivec into ivec2
vector<string> svec(ivec2); // 类型错误
```

列表初始化

```c
vector<string> articles = {"a", "an", "the"};
vector<string> v1{"a", "an", "the"}; // list initialization
vector<string> v2("a", "an", "the"); // error
```
创建指定数量元素

```c
vector<int> ivec(10, -1); // 10个，每个被初始化为-1
vector<string> svec(10, "hi!"); 
```
可以只指定元素数量，此时会进行值初始化(Value Initialization)，其具体值，如果vector对象的元素类型是内置类型，如int自动设为0，其它类型由类默认初始化。
如果类型不支持默认初始化，则只能使用指定初始化。

```c
vector<int> ivec(10); //10个0
vector<string> svec(10); // 10个空string
vector<int> vi = 10; // error: must use direct initialization to supply a size

vector<int> v2{10}; // 一个10
vector<int> v3(10, 1); // 10个1
vector<int> v4{10, 1}; // v4 has two elements with values 10 and 1

vector<string> v5{"hi"}; // list initialization: v5 has one element
vector<string> v6("hi"); // error: can't construct a vector from a string literal
vector<string> v7{10}; // 有10个默认初始化的元素，提供的值不能用来列表初始化
vector<string> v8{10, "hi"}; // 10个值为hi的元素
```
### 3.2. vector支持的基本操作

| 表3.5:vector支持的操作 |                                                              |
| ---------------------- | ------------------------------------------------------------ |
| v.empty()              | 如果v不含有任何元素，返回真；否则返回假                      |
| v.size()               | 返回v中元素的个数                                            |
| v.push back(t)         | 向v的尾端添加一个值为t的元素                                 |
| v[n]                   | 返回v中第n个位置上元素的引用                                 |
| v1 =v2                 | 用v2中元素的拷贝替换v1中的元素                               |
| vl=(a,b,c..}           | 用列表中元素的拷贝替换v1中的元素                             |
| vl==v2                 | v1和v2相等当且仅当它们的元素数量相同且对应位置的元素值都相同 |
| <,<=,>,>               | 顾名思义，以字典顺序进行比较                                 |
| v.data()               | 返回指向内存数组的直接指针                                   |


`push_back`添加：


```c
vector<int> v2; 
for (int i = 0; i != 100; ++i)
    v2.push_back(i); // append sequential integers to v2
// at end of loop v2 has 100 elements,values 0 ... 99
```

遍历


```c
vector<int> v{1, 2, 3, 4, 5, 6, 7, 8, 9};
for (auto &i : v) // for each element in v (note: i is a reference)
    i *= i; // square the element value
for (auto i : v) // for each element in v
    cout << i << " "; // print the element cout << endl;
```

vector内对象的索引

```c
// 分数统计，各分段的个数: 0--9, 10--19, . .. 90--99, 100
vector<unsigned> scores(11, 0); // 11 buckets, all initially 0
unsigned grade;
while (cin >> grade) { // read the grades
    if (grade <= 100) // handle only valid grades
        ++scores[grade / 10]; // increment the counter for the current cluster
}
```

## 4.迭代器
| 运算符         | 含义                                                         |
| -------------- | ------------------------------------------------------------ |
| *iter          | 返回迭代器iter所指元素的引用                                 |
| iter->mem      | 解引用iter并获取该元素的名为 mem的成员，等价于`(*iter).mem`  |
| ++iter         | 令iter指示容器中的下一个元素                                 |
| --iter         | 令iter指示容器中的上一个元素                                 |
| iterl==  iter2 | 判断两个迭代器是否相等(不相等)，如果两个迭代器指示的是同一个元素或者它们是同一个容器的尾后迭代器，则相等；反之，不相等 |
| iterl!= iter2  |                                                              |
### 4.1. 使用

```c
string s("some string");
if (s.begin() != s.end()) { // make sure s is not empty
    auto it = s.begin(); // it denotes the first character in s
    *it = toupper(*it); // make that character uppercase 
}
//Some string
```

元素移动

```cpp
for (auto it = s.begin(); it != s.end() && !isspace(*it); ++it)
    *it = toupper(*it); // capitalize the current character
```

迭代器类型

```cpp
vector<int>::iterator it; //读写vector<int>中元素
string::iterator it2; //读写string中的字符

vector<int>::const_iterator it3; // 只读
string::const_iterator it4; //  只读
```

begin与end运算符：返回类型由对象是否为常量决定，如果对象只需读无需写，最好用常量类型(const_iterator)。

```c
vector<int> v;
const vector<int> cv;
auto it1 = v.begin(); // it1类型vector<int>::iterator 
auto it2 = cv.begin(); // it2类型vector<int>::const_iterator
```

为了便于专门得到const_iterator类型，C++11引入新函数cbegin和cend

```cpp
auto it = v.cbegin();
```

解引用访问成员操作

```c
(*it).empty() //解引用it，调用对象的empty成员
*it.empty() // error: attempts to fetch the member named empty from it ,but it is an iterator and has no member named empty
```

C++语言定义了**(->)运算符**，把解引用和成员访问结合在一起，`it->mem`和`(*it).mem`相同
```cpp
// print each line in text up to the first blank line
for (auto it = text.cbegin(); it != text.cend() && !it->empty(); ++it)
    cout << *it << endl;
```

### 4.2. 迭代器运算

| 运算            | 含义                                                         |
| --------------- | ------------------------------------------------------------ |
| iter + n        | 迭代器加上一个整数值仍得一个迭代器，迭代器指示的新位置与原来相比向前移动了若干个元素。<br/>更新后的迭代器位置必须表示(denote)在容器内的位置。 |
| iter - n        | 迭代器指示的新位置与原来相比向后移动了若干个元素             |
| iter += n       | 迭代器加法的复合赋值语句，将iter加n的结果赋给iter            |
| iter -= n       | 迭代器减法的复合赋值语句                                     |
| iterl - iter2   | 两个迭代器相减的结果是它们之间的距离                         |
| > 、>= 、< 、<= | 如果一个迭代器的位置在另一个迭代器位置之前，则前者小于后者   |

```c
// 得到中间元素的迭代器 
auto mid = vi.begin() + vi.size() / 2;
```

二分搜索

```c
// text must be sorted
// beg and end will denote the range we're searching
auto beg = text.begin(), end = text.end();
auto mid = text.begin() + (end - beg) / 2; // original midpoint
// souught为查找对象
while (mid != end && *mid != sought) {
    if (sought < *mid)     // is the element we want in the first half?
        end = mid;         // if so, adjust the range to ignore the second half
    else                   // the element we want is in the second half
        beg = mid + 1;     // start looking with the element just after mid
    mid = beg + (end - beg) / 2;  // new midpoint
}
```

## 5. 数组

### 5.1. 定义及初始化

数组是复合类型，数组中的个数也是数组类型的一部分，大小固定，编译时的维度应该是已知的，维度尽量是一个常量表达式。

```cpp
unsigned cnt = 42;          // not a constant expression
constexpr unsigned sz = 42; // constant expression

int arr[10];             // array of ten ints
int *parr[sz];           // array of 42 pointers to int
string bad[cnt];         // bad: cnt is not a constant expression
string strs[get_size()]; // ok if get_size is constexpr, error otherwise
```

显式初始化

```cpp
const unsigned sz = 3;
int ia1[sz] = {0,1,2};        // array of three ints with values 0, 1, 2
int a2[] = {0, 1, 2};         // an array of dimension 3
int a3[5] = {0, 1, 2};        // equivalent to a3[] = {0, 1, 2, 0, 0}
string a4[3] = {"hi", "bye"}; // same as a4[] =  {"hi", "bye", ""}
int a5[2] = {0,1,2};          // error: too many initializers
```

字符数组结尾的空字符

```c
char a1[] = {'C', '+', '+'};       // 列表初始化，没有null空字符
char a2[] = {'C', '+', '+', '\0'}; // list initialization, explicit null
char a3[] = "C++";                 // null terminator added automatically
const char a4[6] = "Daniel";       // error: no space for the null!
```

不能将数组的内容copy给其他数组，也不能为其它数组赋值：

```cpp
int a[] = {0, 1, 2}; 
int a2[] = a;        // error: cannot initialize one array with another
a2 = a;              // error: cannot assign one array to another
```

指针、数组引用：

```cpp
int *ptrs[10];            // 包含10个int指针的数组
int &refs[10] = /* ? */;  //  error: no arrays of references

int arr[10];
int (*Parray)[10] = &arr; //  Parray points to an array of ten ints
int (&arrRef)[10] = arr;  //  arrRef refers to an array of ten ints
```
### 5.2 数组元素的访问

```cpp
// count the number of grades by clusters of ten: 0--9, 10--19, ... 90--99, 100
unsigned scores[11] = {}; // 11 buckets, all value initialized to 0
unsigned grade;
while (cin >> grade) {
    if (grade <= 100)
        ++scores[grade/10]; // increment the counter for the current cluster
}

for (auto i : scores)      // for each counter in scores
    cout << i << " ";      // print the value of that counter
cout << endl;
```

### 5.3. 指针和数组

一般使用取址符获取指向对象的指针，对数组索引获取到指定位置的元素，对数组的元素使用取址符得到指向改元素的指针。

```cpp
string nums[] = {"one", "two", "three"};  // array of strings
string *p = &nums[0];   // p points to the first element in nums
```
在很多使用数组名称的地方，编译器会自动将其替换为一个指向数组首元素的指针：

```cpp
string *p2 = nums;      // 等价于 p2 = &nums[0]
```
大多数时候，使用数组类型的对象其实是使用一个指向该数组首元素的指针：
```cpp
int ia[] = {0,1,2,3,4,5,6,7,8,9}; 
auto ia2(ia); // ia2是一个int*，指向ia的第一个元素
ia2 = 42;     // error: ia2 is a pointer, and we can't assign an int to a pointer
```

上述代码当使用ia作为初始值时，编译器实际执行的初始化是下面的形式：

```cpp
auto ia2(&ia[0]);
```

但是如果使用decltype时，上述转换不会发生，`decltype(ia)`是一个int数组：

```cpp
decltype(ia) ia3 = {0,1,2,3,4,5,6,7,8,9};
ia3 = p;    // error: can't assign an int* to an array
ia3[4] = i; // ok: assigns the value of i to an element in ia3
```

迭代器支持的功能，数组指针也全部支持。迭代遍历，可通过尾元素下一位指针判断：

```cpp
int arr[] = {0,1,2,3,4,5,6,7,8,9};
int *p = arr; // 指向arr第一个元素
++p;          //指向arr[1]

int *e = &arr[10]; // 尾元素下一位的指针
for (int *b = arr; b != e; ++b)
    cout << *b << endl;
```

迭代计算尾指针容易出错，通过C++11引入的begin和end函数。

```cpp
int ia[] = {0,1,2,3,4,5,6,7,8,9}; 
int *beg = std::begin(ia); // 指向首元素的指针
int *last = std::end(ia);  // 指向尾元素的下一位指针

int *pbeg = begin(arr),  *pend = end(arr);
// find the first negative element, stopping if we've seen all the elements
while (pbeg != pend && *pbeg >= 0)
    ++pbeg;
```

指针运算

```cpp
constexpr size_t sz = 5;
int arr[sz] = {1,2,3,4,5};
int *ip = arr;     // int *ip = &arr[0]
int *ip2 = ip + 4; // arr[4]

int *p = arr + sz; // 指向尾元素的下一位，注意不要解引用
int *p2 = arr + 10; // error: arr has only 5 elements; p2 has undefined value
```

两个指针相减结果类型为定义在cstddef头文件中的ptrdiff_t类型，带符号类型。

```cpp
auto n = end(arr) - begin(arr); // n=5,元素的数量
```

两个指针指向同一个元素时，数组遍历可通过指针比较

```cpp
int *b = arr, *e = arr + sz;
while (b < e) {
    // use *b
    ++b;
}
```

指针运算与解引用：

```cpp
int ia[] = {0,2,4,6,8};
int last = *(ia + 4); // ok: initializes last to 8, the value of ia[4]

last = *ia + 4;  // ok: last = 4, equivalent to ia[0] + 4
```

下标(Subscripts)和指针

```cpp
int ia[] = {0,2,4,6,8};

int i = ia[2];  // ia[2]得到(ia + 2)指针指向的元素
int *p = ia;    // p指针指向ia首元素
i = *(p + 2);   // 等价于 i = ia[2]

int *p = &ia[2];  // p指向索引为2的元素
int j = p[1];     // p[1]等价于*(p + 1),或者ia[3]                
int k = p[-2];    // p[-2] 表示ia[0]
```

### 5.4. C风格字符

| C风格字符函数  | 函数                                                |
| -------------- | --------------------------------------------------- |
| strlen(p)      | 返回p长度，不包含结尾空字符                         |
| strcmp(p1, p2) | 字符串比较，相等返回0，p1>p2返回正值，p1<p2返回负值 |
| strcat(p1, p2) | 将p2附加到p1上，返回p1                              |
| strcpy(p1, p2) | 将p2 copy给p1，返回p1                               |

C风格字数组中需以空字符结束(null terminated)`\0`。否则在使用上述函数时会产生异常，如下面示例，strlen函数会不断向前寻找，直到遇到空字符才停下：

```c
char ca[] = {'C', '+', '+'};  // not null terminated
cout << strlen(ca) << endl;   // disaster: ca isn't null terminated
```

字符串比较：在C风格字符串上比较的实际上是指针而非字符串本身，需要使用函数进行比较

```c
string s1 = "A string example";
string s2 = "A different string";
if (s1 < s2)  // false: s2 is less than s1

const char ca1[] = "A string example";
const char ca2[] = "A different string";
//比较的是cons char*
if (ca1 < ca2)  // undefined: compares two unrelated addresses

if (strcmp(ca1, ca2) < 0) // same effect as string comparison s1 < s2
```

连接和copy字符串C风格与标准库也不同，

```cpp
// largeStr 初始化为 s1, a space, 与 s2
string largeStr = s1 + " " + s2;

// disastrous if we miscalculated the size of largeStr
strcpy(largeStr, ca1);     // copies ca1 into largeStr
strcat(largeStr, " ");     // adds a space at the end of largeStr
strcat(largeStr, ca2);     // concatenates ca2 onto largeStr
```

如果是C风格字符相加变成指针相加，是非法的。

### 5.5. 与C风格字符串兼容

```c

```

```c
string s("Hello World");  // s holds Hello World
char *str = s; // error: 不能用string对象直接初始化指向字符的指针
const char *str = s.c_str(); // ok
```

使用数组初始化vector

```c
int int_arr[] = {0, 1, 2, 3, 4, 5};
// ivec has six elements; each is a copy of the corresponding element in int_arr
vector<int> ivec(begin(int_arr), end(int_arr));

// copies three elements: int_arr[1], int_arr[2], int_arr[3]
vector<int> subVec(int_arr + 1, int_arr + 4);
```

## 6. 多维数组

```cpp
int ia[3][4]; // array of size 3; each element is an array of ints of size 4
// array of size 10; each element is a 20-element array whose elements are arrays of 30 ints
int arr[10][20][30] = {0}; // initialize all elements to 0
```

Initializing the Elements of a Multidimensional Array

```cpp
int ia[3][4] = {    // three elements; each element is an array of size 4
    {0, 1, 2, 3},   // initializers for the row indexed by 0
    {4, 5, 6, 7},   // initializers for the row indexed by 1
    {8, 9, 10, 11}  // initializers for the row indexed by 2
};

// equivalent initialization without the optional nested braces for each row
int ia[3][4] = {0,1,2,3,4,5,6,7,8,9,10,11};

// explicitly initialize only element 0 in each row
int ia[3][4] = {{ 0 }, { 4 }, { 8 }};

// explicitly initialize row 0; the remaining elements are value initialized
int ix[3][4] = {0, 3, 6, 9};
```

Subscripting a Multidimensional Array

```cpp
// assigns the first element of arr to the last element in the last row of ia
ia[2][3] = arr[0][0][0];
int (&row)[4] = ia[1]; // binds row to the second four-element array in ia
```

```cpp
constexpr size_t rowCnt = 3, colCnt = 4;
int ia[rowCnt][colCnt];   // 12 uninitialized elements
// for each row
for (size_t i = 0; i != rowCnt; ++i) {
    // for each column within the row
    for (size_t j = 0; j != colCnt; ++j) {
        // assign the element's positional index as its value
        ia[i][j] = i * colCnt + j;
    }
}
```

Using a Range for with Multidimensional Arrays

```cpp
size_t cnt = 0;
for (auto &row : ia)        // for every element in the outer array
    for (auto &col : row) { // for every element in the inner array
        col = cnt;          // give this element the next value
        ++cnt;              // increment cnt
    }
    
for (const auto &row : ia)  // for every element in the outer array
    for (auto col : row)    // for every element in the inner array
        cout << col << endl;    
```

```cpp
for (auto row : ia)
    for (auto col : row)
```

Pointers and Multidimensional Arrays

```cpp
int ia[3][4];     // array of size 3; each element is an array of ints of size 4
int (*p)[4] = ia; // p points to an array of four ints
p = &ia[2];       // p now points to the last element in ia
```

```cpp
// print the value of each element in ia, with each inner array on its own line
// p points to an array of four ints
for (auto p = ia; p != ia + 3; ++p) {
    // q points to the first element of an array of four ints; that is, q points to an int
    for (auto q = *p; q != *p + 4; ++q)
         cout << *q << ' ';
    cout << endl;
}
```

```cpp
// p points to the first array in ia
   for (auto p = begin(ia); p != end(ia); ++p) {
       // q points to the first element in an inner array
       for (auto q = begin(*p); q != end(*p); ++q)
           cout << *q << ' ';   // prints the int value to which q points
   cout << endl;
}
```

```cpp
using int_array = int[4]; // new style type alias declaration; see § 2.5.1 (p. 68)
typedef int int_array[4]; // equivalent typedef declaration; § 2.5.1 (p. 67)
// print the value of each element in ia, with each inner array on its own line
for (int_array *p = ia; p != ia + 3; ++p) {
    for (int *q = *p; q != *p + 4; ++q)
         cout << *q << ' ';
    cout << endl;
}
```
