## 高级函数

### 高阶函数的声明

基本格式：

```kotlin
  参数类型		   返回类型
<----------->      <----->
(Int, String)  ->   Unit
```

示例：

```kotlin
val sum = { x: Int, y: Int -> x + y }
val action = { println("print") }
```

简单高阶函数：

```kotlin
fun twoAndThree(operation: (Int, Int) -> Int) {
    val result = operation(2, 3)
    println("The result is $result")
}

fun main(args: Array<String>) {
    twoAndThree { a, b -> a + b }
    twoAndThree { a, b -> a * b }
}
//The result is 5
//The result is 6
```

通过高阶函数来实现filter功能：

```kotlin
fun String.filter(predicate: (Char) -> Boolean): String {
    val sb = StringBuilder()
    for (index in 0 until length) {
        val element = get(index)
        if (predicate(element)) sb.append(element)
    }
    return sb.toString()
}

fun main(args: Array<String>) {
    println("ab1c".filter { it in 'a'..'z' })
}
//abc
```

解释：

```kotlin
   <-接收者类型->     	  <--参数名称-->   <--------------参数为函数类型-------------->
fun   String     .filter(   predicate:     (Char)          ->         Boolean           ): String
									<--函数入参类型-->		<--函数结果返回类型-->
```

### 在Java中使用

```kotlin
/* Kotlin declaration */
fun processTheAnswer(f: (Int) -> Int) {
    println(f(42))
}

/* 在Java8 中 */
>>> processTheAnswer(number -> number + 1);
43    
```
在低版本Java中的使用

```java
 public static void main(String[] args) {
        processTheAnswer(
            new Function1<Integer, Integer>() {
                @Override
                public Integer invoke(Integer number) {
                    System.out.println(number);
                    return number + 1;
                }
            });
    }
```

在Java中使用Kotlin标准库

```java
 public static void main(String[] args) {
        List<String> strings = new ArrayList();
        strings.add("42");
        CollectionsKt.forEach(strings, s -> {
           System.out.println(s);
           return Unit.INSTANCE;//需要显式返回一个Unit类型值
        });
    }
```

### 函数作为参数(Calling functions passed as arguments)

```kotlin
fun <T> Collection<T>.joinToString(
    separator: String = ", ",
    prefix: String = "",
    postfix: String = "",
    transform: (T) -> String = { it.toString() }
): String {
    val result = StringBuilder(prefix)

    for ((index, element) in this.withIndex()) {
        if (index > 0) result.append(separator)
        result.append(transform(element))
    }

    result.append(postfix)
    return result.toString()
}

fun main(args: Array<String>) {
    val letters = listOf("Alpha", "Beta")
    println(letters.joinToString())
    println(letters.joinToString { it.lowercase() })
    println(letters.joinToString(separator = "! ", postfix = "! ", transform = { it.uppercase() }))
}
//Alpha, Beta
//alpha, beta
//ALPHA! BETA!
```

声明的函数类型为可空参数：

```kotlin
fun <T> Collection<T>.joinToString(
    separator: String = ", ",
    prefix: String = "",
    postfix: String = "",
    transform: ((T) -> String)? = null
): String {
    val result = StringBuilder(prefix)
    for ((index, element) in this.withIndex()) {
        if (index > 0) result.append(separator)
        val str = transform?.invoke(element) ?: element.toString()
        result.append(str)
    }

    result.append(postfix)
    return result.toString()
}
```

###  将函数作为参数返回

```kotlin
enum class Delivery { STANDARD, EXPEDITED }
class Order(val itemCount: Int)

fun getShippingCostCalculator(delivery: Delivery): (Order) -> Double {
    if (delivery == Delivery.EXPEDITED) {
        return { order -> 6 + 2.1 * order.itemCount }
    }
    return { order -> 1.2 * order.itemCount }
}

fun main(args: Array<String>) {
    val calculator = getShippingCostCalculator(Delivery.EXPEDITED)
    println("Shipping costs ${calculator(Order(3))}")
}
// Shipping costs 12.3
```



```kotlin
data class Person(val firstName: String, val lastName: String, val phoneNumber: String?)
class ContactListFilters {
    var prefix: String = ""
    var onlyWithPhoneNumber: Boolean = false

    fun getPredicate(): (Person) -> Boolean {
        val startsWithPrefix = { p: Person ->
            p.firstName.startsWith(prefix) || p.lastName.startsWith(prefix)
        }
        if (!onlyWithPhoneNumber) {
            return startsWithPrefix
        }
        return { startsWithPrefix(it) && it.phoneNumber != null }
    }
}

fun main(args: Array<String>) {
    val contacts = listOf(
        Person("Dmitry", "Jemerov", "123-4567"),
        Person("Svetlana", "Isakova", null)
    )
    val contactListFilters = ContactListFilters()
    with(contactListFilters) {
        prefix = "Dm"
        onlyWithPhoneNumber = true
    }
    println(contacts.filter(contactListFilters.getPredicate()))
}
//[Person(firstName=Dmitry, lastName=Jemerov, phoneNumber=123-4567)]
```

### 通过lambda消除重复代码

数据定义：

```kotlin
// 站点访问数据
data class SiteVisit(val path: String, val duration: Double, val os: OS)
enum class OS { WINDOWS, LINUX, MAC, IOS, ANDROID }

val log = listOf(
    SiteVisit("/", 34.0, OS.WINDOWS),
    SiteVisit("/", 22.0, OS.MAC),
    SiteVisit("/login", 12.0, OS.WINDOWS),
    SiteVisit("/signup", 8.0, OS.IOS),
    SiteVisit("/", 16.3, OS.ANDROID)
)
```

1. 通过硬编码(hardcoded filters)来实现相应功能：

```kotlin
val averageWindowsDuration = log.filter { it.os == OS.WINDOWS }.map(SiteVisit::duration).average()

fun main(args: Array<String>) {
    println(averageWindowsDuration)
}
// 23.0
```

将相应代码提取到扩展函数中：

```kotlin
fun List<SiteVisit>.averageDurationFor(os: OS) = filter { it.os == os }.map(SiteVisit::duration).average()

fun main(args: Array<String>) {
    println(log.averageDurationFor(OS.WINDOWS))
    println(log.averageDurationFor(OS.MAC))
}
// 23.0 22.0
```
2. 硬编码(hardcoded filters)来实现复杂功能

```kotlin
val averageMobileDuration = log.filter { it.os in setOf(OS.IOS, OS.ANDROID) }.map(SiteVisit::duration).average()

fun main(args: Array<String>) {
    println(averageMobileDuration)
}
// 12.15
```
通过高阶函数来去除重复代码：

```kotlin
fun List<SiteVisit>.averageDurationFor(predicate: (SiteVisit) -> Boolean) =
    filter(predicate).map(SiteVisit::duration).average()

fun main(args: Array<String>) {
    println(log.averageDurationFor { it.os in setOf(OS.ANDROID, OS.IOS) }) // 12.15
    println(log.averageDurationFor { it.os == OS.IOS && it.path == "/signup" }) // 8.0
}
```
## 内联函数

### 2. inline functions: removing the overhead of lambdas

You’ve probably noticed that the shorthand syntax for passing a lambda as an argument to a function in Kotlin looks similar to the syntax of regular statements such as **if** and **for**. 

lambdas are normally compiled to anonymous classes. But that means every time you use a lambda expression, an extra class is created; and if the lambda captures some variables, then a new object is created on every invocation. This introduces runtime overhead, causing an implementation that uses a lambda to be less efficient than a function that executes the same code directly.

Could it be possible to tell the compiler to generate code that’s as efficient as a Java statement and yet lets you extract the repeated logic into a library function? Indeed, the Kotlin compiler allows you to do that. If you mark a function with the inline modifier, the compiler won’t generate a function call when this function is used and instead will replace every call to the function with the actual code implementing the function. Let’s explore how that works in detail and look at specific examples.

#### 2.1. How inlining works

-  Defining an inline function

```kotlin
inline fun <T> synchronized(lock: Lock, action: () -> T): T {
    lock.lock()
    try {
        return action()
    }
    finally {
        lock.unlock()
    }
}

val l = Lock()
synchronized(l) {
    // ...
}
```


```kotlin
fun foo(l: Lock) {
    println("Before sync")
    synchronized(l) {
        println("Action")
    }
    println("After sync")
}
```
![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/41.jpg)


![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/42.jpg)

In this case, the lambda’s code isn’t available at the site where the inline function is called, and therefore it isn’t inlined. Only the body of the synchronized function is inlined; the lambda is called as usual. The runUnderLock function will be compiled to bytecode similar to the following function:

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/44.jpg)

#### 2.2. Restrictions on inline functions

Due to the way inlining is performed, not every function that uses lambdas can be inlined. When the function is inlined, the body of the lambda expression that’s passed as an argument is substituted directly into the resulting code. That restricts the possible uses of the corresponding parameter in the function body. If this parameter is called, such code can be easily inlined. But if the parameter is stored somewhere for further use, the code of the lambda expression can’t be inlined, because there must be an object that contains this code.

#### 2.3. Inlining collection operations

- Filtering a collection using a lambda
```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun main(args: Array<String>) {
    println(people.filter { it.age < 30 })
}
//[Person(name=Alice, age=29)]
```

-  Filtering a collection manually
```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun main(args: Array<String>) {
    println(people.filter { it.age > 30 }
                  .map(Person::name))
}
```

#### 2.4. Deciding when to declare functions as inline

Now that you’ve learned about the benefits of the inline keyword, you might want to start using inline throughout your codebase, trying to make it run faster. As it turns out, this isn’t a good idea. Using the inline keyword is likely to improve performance only with functions that take lambdas as arguments; all other cases require additional measuring and investigation.

#### 2.5. Using inlined lambdas for resource management

One common pattern where lambdas can remove duplicate code is resource management: acquiring a resource before an operation and releasing it afterward. Resource here can mean many different things: a file, a lock, a database transaction, and so on. The standard way to implement such a pattern is to use a `try/finally` statement in which the resource is acquired before the try block and released in the `finally` block.

The Kotlin standard library defines another function called `withLock`, which has a more idiomatic API for the same task: it’s an extension function on the Lock interface. 

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/38.jpg)


```java
static String readFirstLineFromFile(String path) throws IOException {
    try (BufferedReader br =
                   new BufferedReader(new FileReader(path))) {
        return br.readLine();
    }
}
```

```kotlin
fun readFirstLineFromFile(path: String): String {
    BufferedReader(FileReader(path)).use { br ->
        return br.readLine()
    }
}
```

### 3. control flow in higher-order functions

```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun lookForAlice(people: List<Person>) {
    for (person in people) {
        if (person.name == "Alice") {
            println("Found!")
            return
        }
    }
    println("Alice is not found")
}

fun main(args: Array<String>) {
    lookForAlice(people)
}

```

```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun lookForAlice(people: List<Person>) {
    people.forEach {
        if (it.name == "Alice") {
            println("Found!")
            return
        }
    }
    println("Alice is not found")
}

fun main(args: Array<String>) {
    lookForAlice(people)
}
// Found!
```
If you use the return keyword in a lambda, it returns from the function in which you called the lambda, not just from the lambda itself. Such a return statement is called a non-local return, because it returns from a larger block than the block containing the return statement.

#### 3.2. Returning from lambdas: return with a label
To distinguish a local return from a non-local one, you use labels. You can label a lambda expression from which you want to return, and then refer to this label after the return keyword.

- Using a local return with a label

```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun lookForAlice(people: List<Person>) {
    people.forEach label@{
        if (it.name == "Alice") return@label
    }
    println("Alice might be somewhere")
}

fun main(args: Array<String>) {
    lookForAlice(people)
}
```

```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun lookForAlice(people: List<Person>) {
    people.forEach {
        if (it.name == "Alice") return@forEach
    }
    println("Alice might be somewhere")
}

fun main(args: Array<String>) {
    lookForAlice(people)
}
```

```kotlin
fun main(args: Array<String>) {
    println(StringBuilder().apply sb@{
       listOf(1, 2, 3).apply {
           this@sb.append(this.toString())
       }
    })
}
// [1, 2, 3]
```

#### 3.3. Anonymous functions: local returns by default
```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun lookForAlice(people: List<Person>) {
    people.forEach(fun (person) {
        if (person.name == "Alice") return
        println("${person.name} is not Alice")
    })
}

fun main(args: Array<String>) {
    lookForAlice(people)
}
```

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/43.jpg)
