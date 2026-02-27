## 高级函数(Higher-order functions)

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
                                        <--函数入参类型-->        <--函数结果返回类型-->
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
    // 声明一个带默认值的lambda函数参数
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
    println(
        letters.joinToString(
            separator = "! ",
            postfix = "! ",
            transform = { it.uppercase() }
        )
    )
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

通过函数返回一个新函数：

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

定义返回类型为函数：

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
            // 变量为函数
            return startsWithPrefix
        }
        // lambda函数
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
val averageWindowsDuration = log.filter { it.os == OS.WINDOWS }
    .map(SiteVisit::duration).average()

fun main(args: Array<String>) {
    println(averageWindowsDuration)
}
// 23.0
```

将相应代码提取到扩展函数中：

```kotlin
fun List<SiteVisit>.averageDurationFor(os: OS) = filter { it.os == os }
    .map(SiteVisit::duration).average()


fun main(args: Array<String>) {
    println(log.averageDurationFor(OS.WINDOWS))
    println(log.averageDurationFor(OS.MAC))
}
// 23.0 22.0
```
2. 硬编码(hardcoded filters)来实现复杂功能

```kotlin
val averageMobileDuration = log.filter { it.os in setOf(OS.IOS, OS.ANDROID) }
    .map(SiteVisit::duration).average()

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
## 内联函数(inline function)

lambda函数通常会被编译成匿名类，每调用一次就会创建一个类，运行时会带来额外的开销，可通过`inline`标记为内联函数，使函数调用时编译器不会生成函数调用的代码，而是使用真实代码替换每一次的函数调用。

### 调用过程

定义一个内联函数：

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
```

调用：


```kotlin
fun foo(l: Lock) {
    println("Before sync")
    synchronized(l) {
        println("Action")
    }
    println("After sync")
}
```
编译后会被解析为：

```kotlin
fun foo(l: Lock) {
    println("Before sync")
    l.lock()
    try {
        println("Action")
    }
    finally {
        l.unlock()
    }
    println("After sync")
}
```

### 内联函数的限制

内联函数中的lambda参数不能作为参数传递给其他非内联函数：

```kotlin
fun execute(action: () -> Unit) {  // 普通函数，需要 Lambda 对象
    action()
}

inline fun process(action: () -> Unit) {
    execute(action)  // ❌ 编译错误
                     // action 被内联展开，不再是对象，无法传递
}

// ✅ 解决方案：用 noinline 保留 Lambda 对象
inline fun process(noinline action: () -> Unit) {
    execute(action)  // ✅ noinline 保留了对象形式
}
```

同样也不能存储lambda引用：

```kotlin
val savedActions = mutableListOf<() -> Unit>()

inline fun register(action: () -> Unit) {
    savedActions.add(action)  // ❌ 编译错误，action 已展开，不是对象
    // ✅ 解决方案：noinline
}

inline fun register(noinline action: () -> Unit) {
    savedActions.add(action)  // ✅
}
```

## 高阶函数中的控制流(control flow)

### 非局部返回(non-local return)

在内联的lambda中，return会跨越lambda边界，直接退出外层函数，这种称为**非局部返回(non-local return)**：

```kotlin
inline fun forEach(list: List<Int>, action: (Int) -> Unit) {
    for (item in list) action(item)
}

fun findFirst(): String {
    forEach(listOf(1, 2, 3, 4, 5)) {
        if (it == 3) return "找到了"  // 直接从 findFirst() 返回！
        println(it)
    }
    return "没找到"
}

fun main(args: Array<String>) {
    println(findFirst())
}
// 1 2 找到了
```

非内联lambda函数不允许非局部返回：

```kotlin
fun forEach(list: List<Int>, action: (Int) -> Unit) {
    for (item in list) action(item)
}

fun test() {
    forEach(listOf(1, 2, 3)) {
        if (it == 2) return  // ❌ 编译错误，非内联函数的 Lambda 不允许非局部返回
    }
}
```

### 局部返回(Local  Return)

通过标签实现局部返回：

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
// Alice might be somewhere
```

也可以用函数名作为返回标签：

```kotlin
fun lookForAlice(people: List<Person>) {
    people.forEach {
        if (it.name == "Alice") return@forEach
    }
    println("Alice might be somewhere")
}
```

带标签的this表达式：

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

在匿名函数中使用局部返回：

```kotlin
data class Person(val name: String, val age: Int)
val people = listOf(Person("Alice", 29), Person("Bob", 31))

fun lookForAlice(people: List<Person>) {
    people.forEach(fun (person) {
        if (person.name == "Alice") return // return指向匿名函数
        println("${person.name} is not Alice")
    })
}

fun main(args: Array<String>) {
    lookForAlice(people)
}
// Bob is not Alice
```
