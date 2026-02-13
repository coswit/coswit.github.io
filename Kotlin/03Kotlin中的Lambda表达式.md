Lambda就是将一段代码传递给其他函数，把代码结构抽取成函数库。

> *Lambda expressions*, or simply *lambdas*, are essentially small chunks of code that can be passed to other functions. With lambdas, you can easily extract common code structures into library functions, and the Kotlin standard library makes heavy use of them. One of the most common uses for lambdas is working with collections.

### 1. 成员引用(member references)

#### 作为函数参数的代码块blocks of code as function parameters

经常需要处理：当发生某个事件，执行某种处理(When an event happens, run this handler);或者将某种操作应用到某个数据结构上(Apply this operation to all elements in a data structure)。在Java旧版本中，通常通过匿名内部类来实现，有了Lambda后，可以进行简化替代。

```JAVA
/* Java */
button.setOnClickListener(new OnClickListener() {
    @Override
    public void onClick(View view) {
        /* actions on click */
    }
```

```kotlin
button.setOnClickListener { /* actions on click */ }
```
函数式编程：把函数当做值来对待，直接进行传递。

> **Functional programming** : the ability to treat functions as values. Instead of declaring a class and passing an instance of that class to a function, you can pass a function directly. With lambda expressions, the code is even more concise. You don’t need to declare a function: instead, you can, effectively, pass a block of code directly as a function parameter.



#### 1.2. 集合

在集合中手动进行搜索：


```kotlin
data class Person(val name: String, val age: Int)

//Searching through a collection manually
fun findTheOldest(people: List<Person>) {
    var maxAge = 0
    var theOldest: Person? = null
    for (person in people) {
        if (person.age > maxAge) {
            maxAge = person.age
            theOldest = person
        }
    }
    println(theOldest)
}

fun main(args: Array<String>) {
    val people = listOf(Person("Alice", 29), Person("Bob", 31))
    findTheOldest(people)
}
```

用lambda在集合中进行搜索：

```kotlin
val people = listOf(Person("Alice", 29), Person("Bob", 31))
println(people.maxBy { it.age })

>>> Person(naem=Bob,age=31)
```

同上述方法一样，使用成员引用(a member reference)进行搜索

```kotlin
println(people.maxBy(Person::age))
```



#### 1.3. 语法(Syntax for lambda expressions)

lambada直接可以将一段行为作为一个值进行传递，也可以将其声明存储到一个变量引用之中。更常见的是直接将其传递给函数。

> As we’ve mentioned, a lambda encodes a small piece of behavior that you can pass around as a value. It can be declared independently and stored in a variable. But more frequently, it’s declared directly when passed to a function.

通过箭头将实参(argument list)与lambda函数体隔开

 <img src="http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/07.jpg" style="zoom:70%;" />

将lambada表达式存储在一个变量中，将这个变量当做普通函数对待：


```kotlin
 val sum = { x: Int, y: Int -> x + y }
 println(sum(1, 2))
 
 >>> 3
```
也可以直接进行调用：

```kotlin
{ println(42) }()
>>> 42
```

但这样的语法毫无可读性，如果需要将一段代码封闭在一个代码块中，可以通过run来执行：

> If you need to enclose a piece of code in a block, you can use the library function run that executes the lambda passed to it:



``` kotlin
 //runs the coed in lambda
 run { println(42) }
```
这种调用和内建语言一样高效，且不会带来运行时的额外开销

> such invocations have no runtime overhead and are as efficient as built-in language constructs

在之前提过的例子中：

```kotlin
val people = listOf(Person("Alice", 29), Person("Bob", 31))
people.maxBy { it.age }
```

如果不适用任何简明语法( without using any syntax shortcuts)来重写的话，可以如下：

```kotlin
people.maxBy({ p: Person -> p.age })
```

花括号(curly braces)中的代码是lambda表达式，作为参数直接传递给函数，接收 `Person`返回`age`。可以对其进行改进：

```kotlin
people.maxBy() { p: Person -> p.age }
```

当lambda为唯一参数时，可简化为：

```kotlin
people.maxBy { p: Person -> p.age }
```



Kotlin中的标准库中定义了`joinToString`函数，可以接收一个附加的函数，将元素转换为字符串：

> This function can be used to convert an element to a string differently than the `toString` function. 



```kotlin
fun main(args: Array<String>) {
    val people = listOf(Person("Alice", 29), Person("Bob", 31))
    val names = people.joinToString(separator = " ",
            transform = { p: Person -> p.name })
    println(names)
}
//Alice Bob
```
将lambda移到括号外：

```kotlin
people.joinToString(" ") { p: Person -> p.name }
```

括号外与括号内可以进行语法转换。

>  To convert one syntactic form to the other, you can use the actions: “**Move lambda expression out of parentheses**” and “**Move lambda expression into parentheses**.”

可以继续简化为：

```kotlin
people.maxBy { p: Person -> p.age }
people.maxBy { p -> p.age }
```

像这种情况也可能存在编译器不能推断出lambda类型的情况，一般遵循：先不声明类型，编译器报错后再指定。（to always start without the types; if the compiler complains, specify them）

也可以使用默认参数名称`it`代替：

```
people.maxBy { it.age }
```

如果使用变量存储lambda，就无法推断出类型，需要显式指定类型：

```kotlin
>>> val getAge = { p: Person -> p.age }
>>> people.maxBy(getAge)
```

lambda表达式也可以包含更多的语句：

```kotlin
fun main(args: Array<String>) {
    val sum = { x: Int, y: Int ->
       println("Computing the sum of $x and $y...")
       x + y
    }
    println(sum(1, 2))
}

//Computing the sum of 1 and 2...
//3
```

#### 1.4. 作用域 Accessing variables in scope

当在函数内声明一个匿名内部类时，能够在匿名内部类内引用这个函数的参数和局部变量。lambda也可以做同样的事，如果你在函数内部使用了lambda，同样可以使用在lambda之前声明的参数。

> when you declare an anonymous inner class in a function, you can refer to **parameters** and **local variables** of that function from inside the class. With lambdas, you can do exactly the same thing. If you use a lambda in a function, you can access the parameters of that function as well as the local variables declared before the lambda.

我们可以通过`forEach`来观察这种行为：

```kotlin
fun printMessagesWithPrefix(messages: Collection<String>, prefix: String) {
    messages.forEach {
        println("$prefix $it")
    }
}

fun main(args: Array<String>) {
    val errors = listOf("403 Forbidden", "404 Not Found")
    printMessagesWithPrefix(errors, "Error:")
}

//Error: 403 Forbidden
//Error: 404 Not Found
```
Kotlin与Java有很大区别：Kotlin中不仅限于访问final变量，其内部甚至允许访问修改非final变量，这些变量称之为被lambda捕获(*captured* by the lambda)：

```kotlin
fun printProblemCounts(responses: Collection<String>) {
    var clientErrors = 0
    var serverErrors = 0
    responses.forEach {
        if (it.startsWith("4")) {
            clientErrors++
        } else if (it.startsWith("5")) {
            serverErrors++
        }
    }
    println("$clientErrors client errors, $serverErrors server errors")
}

fun main(args: Array<String>) {
    val responses = listOf("200 OK", "418 I'm a teapot","500 Internal Server Error")
    printProblemCounts(responses)
}

>>> 1 client errors, 1 server errors
```

**变量捕捉**(**Capturing a mutable variable**):

Java中只允许捕捉final变量，当你需要捕捉可变变量时，可以使用两种技巧：或者声明一个单元素数组，用来存在可变值；或者创建一个包装类实例，其中存储要改变值的引用。

> Java allows you to capture only final variables. When you want to capture a mutable variable, you can use one of the following tricks: either declare an array of one element in which to store the mutable value, or create an instance of a wrapper class that stores the reference that can be changed.

如果在Kotlin中要显示地使用这些技术，可以如下：

```kotlin
class Ref<T>(var value: T) //模拟捕捉可变变量的类

val counter = Ref(0)
val inc = {counter.value++}
```

在实际代码中，不需要创建这样的包装器，可以直接修改这个参数：

```kotlin
var counter = 0
val inc = { counter++ }
```

此外需要注意，如果lambda被用作事件处理器或者其他异步执行的情况(event handler or is otherwise executed asynchronously),对局部变量的修改只会在lambda执行的时候发生。如下述情况：

```kotlin
fun tryToCountButtonClicks(button: Button): Int {
    var clicks = 0
    button.onClick { clicks++ }
    return clicks
}
```

函数返回始终是0，因为`onClick`是在函数返回之后调用的。

#### 1.5. 成员引用 Member references

当想要作为参数传递的的代码已经被定义为了函数，当然可以传递一个调用这个函数的lambda，但显得有点多余。在kotlin中和Java8一样，可以把函数转换为一个值去传递。使用 `::` 运算符来转换。

> You’ve seen how lambdas allow you to pass **a block of code** as a parameter to a function. But what if the code that you need to pass as a parameter is already defined as a function? Of course, you can pass a lambda that calls that function, but doing so is somewhat redundant. Can you pass the function directly?
>
> In Kotlin, just like in Java 8, you can do so if you convert the function to a value. You use the `::` operator for that:



```kotlin
val getAge = Person::age
```

这种表达式称为成员引用(Member reference syntax):

<img src="http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/19.jpg" style="zoom:70%;" />

也可以是：

```kotlin
val getAge = { person: Person -> person.age }
```

成员引用和调用该函数的lambda具有一样的类型，可以互换使用：

> A member reference has the same type as a lambda that calls that function, so you can use the two interchangeably



```kotlin
people.maxBy(Person::age)
```

也可以引用顶层函数，`::salute`当作参数传给函数`run`，来调用相应的函数：


```kotlin
fun salute() = println("Salute!")

fun main(args: Array<String>) {
    run(::salute)
}
>>> Salute!
```

将lambda委托给一个接收多个参数的函数：

```kotlin
    val action= {person:Person,message:String ->
        sendEmail(person,message)
    }
    
    fun sendEmail(person: Person, message: String) {}
```

也可以简化为：

```kotlin
val nextAction=::sendEmail
```

通过构造方法引用(**constructor reference**)来延迟对象的实例化：

> You can store or postpone the action of creating an instance of a class using a **constructor reference**. The constructor reference is formed by specifying the class name after the double colons



```kotlin
data class Person(val name: String, val age: Int)

fun main(args: Array<String>) {
    val createPerson = ::Person
    val p = createPerson("Alice", 29)
    println(p)
}
>>> Person(name=Alice, age=29)
```
同样的方式也可以用于扩展函数：
```kotlin
fun Person.isAdult() = age >= 21
val predicate = Person::isAdult

val p = createPerson("Alice", 29)
val isAdult = predicate.invoke(p)
println(isAdult)
>>> true
```

### 2. 集合的函数式API：functional apis for collections

#### 2.1.  filter 与 map

filter函数可以从集合中移除不想要的元素，但不会改变这些元素：

```kotlin
fun main(args: Array<String>) {
    val list = listOf(1, 2, 3, 4)
    println(list.filter { it % 2 == 0 })
}
//[2, 4]
```

```kotlin
data class Person(val name: String, val age: Int)

fun main(args: Array<String>) {
    val people = listOf(Person("Alice", 29), Person("Bob", 31))
    println(people.filter { it.age > 30 })
}
//[Person(name=Bob, age=31)]
```

map函数把集合中每一个元素应用到给定的函数，并将结果搜集到一个新的集合中：

```kotlin
fun main(args: Array<String>) {
    val list = listOf(1, 2, 3, 4)
    println(list.map { it * it })
}
//[1, 4, 9, 16]
```
只需要一个人名的列表：
```kotlin
data class Person(val name: String, val age: Int)

fun main(args: Array<String>) {
    val people = listOf(Person("Alice", 29), Person("Bob", 31))
    println(people.map { it.name })
}
//[Alice, Bob]
```

可以简化：

```
people.map(Person::name)
```

链式调用实现，取出年龄超出30的人的名字：

```kotlin
>>> people.filter { it.age > 30 }.map(Person::name)
[Bob]
```

找出这个分组中所有年龄最大的人：

```kotlin
val p2:List<Person> = people.filter { it.age == people.maxBy(Person::age)?.age }
println(p2)

>>> [Person(name=Bob, age=31)]
```

上述代码在查询时会进行重复查询，若集合中有100个人，寻找过程会执行100遍。可以改进为：

```kotlin
val maxAge = people.maxBy(Person::age)?.age
val p3 = people.filter { it.age == maxAge }
```

对map集合也可使用类似操作，`filterKeys`与 `mapKeys` 、`filterValues` 与 `mapValues`对键、值进行相应操作。


```kotlin
fun main(args: Array<String>) {
    val numbers = mapOf(0 to "zero", 1 to "one")
    println(numbers.mapValues { it.value.toUpperCase() })
}
//{0=ZERO, 1=ONE}
```

#### 2.2. 集合的判断（all、any、count、find）

“all”, “any”, “count”, and “find”: applying a predicate to a collection

检查一个人是否到28岁”

```kotlin
data class Person(val name: String, val age: Int)
val canBeInClub27 = { p: Person -> p.age <= 27 }
```

all：所有元素都满足条件
```kotlin
val people = listOf(Person("Alice", 27), Person("Bob", 31))
println(people.all(canBeInClub27))
>>> false
```

any：至少存在一个满足


```kotlin
fun main(args: Array<String>) {
    val list = listOf(1, 2, 3)
    println(!list.all { it == 3 })
    println(list.any { it != 3 })
}
// true true
```

count：有多少个元素满足条件

```kotlin
val people = listOf(Person("Alice", 27), Person("Bob", 31))
println(people.count(canBeInClub27))  
>>> 1
```

上述情况当然可以通过如下方法实现：

```kotlin
println(people.filter(canBeInClub27).size)
```

在这种情况下，一个中间集合会被创建，用来存储所有满足条件的元素，count方法只关心匹配元素的数量，不关心元素本身，更高效。



find：找到一个满足条件的元素，有则返回第一个元素，没有则返回null，等同于`firstOrNull`：


```kotlin
val people = listOf(Person("Alice", 27), Person("Bob", 31))
println(people.find(canBeInClub27))
>>> Person(name=Alice, age=27)
```



#### 分组groupBy

 list会转换为map分组：

```kotlin
data class Person(val name: String, val age: Int)

fun main(args: Array<String>) {
    val people = listOf(Person("Alice", 31),
            Person("Bob", 29), Person("Carol", 31))
    println(people.groupBy { it.age })
}

//{31=[Person(name=Alice, age=31), Person(name=Carol, age=31)],
//29=[Person(name=Bob, age=29)]}
```
每一个分组存储在一个列表中，类型是`Map<Int, List<Person>>`

```kotlin
fun main(args: Array<String>) {
    val list = listOf("a", "ab", "b")
    println(list.groupBy(String::first))
}
//{a=[a, ab], b=[b]}
```

first不是String的成员，而是一个扩展

####  flatMap 与 flatten

processing elements in nested collections

flatMap会根据实参给定的函数对集合中的每个元素做变换(或者说映射)，然后把多个列表合并（或者平铺）成一个列表。

> The flatMap function does two things: At first it transforms (or *maps*) each element to a collection according to the function given as an argument, and then it combines (or *flattens*) several lists into one. 



```kotlin
fun main(args: Array<String>) {
    val strings = listOf("abc", "def")
    println(strings.flatMap { it.toList() })
}
//[a, b, c, d, e, f]
```
![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/14.jpg)

```kotlin
class Book(val title: String, val authors: List<String>)

fun main(args: Array<String>) {
    val books = listOf(Book("Thursday Next", listOf("Jasper Fforde")),
                       Book("Mort", listOf("Terry Pratchett")),
                       Book("Good Omens", listOf("Terry Pratchett",
                                                 "Neil Gaiman")))
    println(books.flatMap { it.authors }.toSet())
}
//[Jasper Fforde, Terry Pratchett, Neil Gaiman]
```

### 惰性集合操作 lazy collection operations: sequences
```kotlin
 people.map(Person::name).filter { it.startsWith("A") }
    

people.asSequence()//把初始集合转换为序列
            .map(Person::name)
            .filter { it.startsWith("A") }//序列支持和集合一样的API
            .toList()//把结果序列转换回列表
```

The entry point for lazy collection operations in Kotlin is the **Sequence** interface. The interface represents just that: a sequence of elements that can be enumerated one by one. **Sequence** provides only one method, iterator, that you can use to obtain the values from the sequence.

The strength of the Sequence interface is in the way operations on it are implemented. The elements in a sequence are evaluated lazily. Therefore, you can use sequences to efficiently perform chains of operations on elements of a collection without creating collections to hold intermediate results of the processing.

#### 3.1. Executing sequence operations: intermediate and terminal operations

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/12.jpg)

Intermediate operations are always lazy. Look at this example, where the terminal operation is missing:
```kotlin
fun main(args: Array<String>) {
    listOf(1, 2, 3, 4).asSequence()
            .map { print("map($it) "); it * it }
            .filter { print("filter($it) "); it % 2 == 0 }
}
//
```
Executing this code snippet prints nothing to the console. That means the map and filter transformations are postponed and will be applied only when the result is obtained (that is, when the terminal operation is called):
```kotlin
fun main(args: Array<String>) {
    listOf(1, 2, 3, 4).asSequence()
            .map { print("map($it) "); it * it }
            .filter { print("filter($it) "); it % 2 == 0 }
            .toList()
}
//map(1) filter(1) map(2) filter(4) map(3) filter(9) map(4) filter(16) 
```

```kotlin
 println(listOf(1, 2, 3, 4).asSequence()
            .map { it * it }.find { it > 3 })
//4            
```
![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/16.jpg)

```kotlin
data class Person(val name: String, val age: Int)

fun main(args: Array<String>) {
    val people = listOf(Person("Alice", 29),
            Person("Bob", 29), Person("Carol", 21))

    println(people.asSequence()
            .map(Person::name)
            .filter { it.length<4 }
            .toList()
    )


    println(people.asSequence()
            .filter { it.name.length<4 }
            .map(Person::name)
            .toList()
    )


}
//[Bob]
```
![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/08.jpg)

#### 3.2. Creating sequences

```kotlin
fun main(args: Array<String>) {
    val naturalNumbers = generateSequence(0) { it + 1 }
    val numbersTo100 = naturalNumbers.takeWhile { it <= 100 }
    println(numbersTo100.sum())
}
//5050
```

```kotlin
fun File.isInsideHiddenDirectory() =
        generateSequence(this) { it.parentFile }.any { it.isHidden }

fun main(args: Array<String>) {
    val file = File("/Users/svtk/.HiddenDir/a.txt")
    println(file.isInsideHiddenDirectory())
}
//true
```

### 4. using java functional interfaces

#### SAM constructors: explicit conversion of lambdas to functional interfaces

A SAM constructor is a compiler-generated function that lets you perform an explicit conversion of a lambda into an instance of a functional interface.
```kotlin
fun createAllDoneRunnable(): Runnable {
    return Runnable { println("All done!") }
}

fun main(args: Array<String>) {
    createAllDoneRunnable().run()
}
//All done!
```

Using a SAM constructor to reuse a listener instance

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/kotlin/15.jpg)



### with与apply

带接收者的lambda(lambdas with receivers):Kotlin独有的功能，在lambda内调用一个不同对象的方法，无须借助任何额外的限定符。

> a unique feature of Kotlin’s lambdas that isn’t available with Java: the ability to call methods of a different object in the body of a lambda without any additional qualifiers. Such lambdas are called lambdas with receivers. 

#### with函数
构建字母表的示例：

```kotlin
fun alphabet(): String {
    val result = StringBuilder()
    for (letter in 'A'..'Z') {
         result.append(letter)
    }
    result.append("\nNow I know the alphabet!")
    return result.toString()
}

fun main(args: Array<String>) {
    println(alphabet())
}

//ABCDEFGHIJKLMNOPQRSTUVWXYZ
//Now I know the alphabet!
```

使用 `with` 来简化：

```kotlin
fun alphabet(): String {
    val stringBuilder = StringBuilder()
    return with(stringBuilder) {
        for (letter in 'A'..'Z') {
            this.append(letter)
        }
        append("\nNow I know the alphabet!")
        this.toString()
    }
}

fun main(args: Array<String>) {
    println(alphabet())
}
```
with看起来像是一种特殊的语法结构，实际上是一个接收两个参数的函数，上述示例中分别是`StringBuilder`与一个lambda。这里是把lambda放到了括号外，使得调用起来看起来像是内建的。可以写成：`with(stringBuilder, { ... })`，可读性会变差。



使用 `with` 与表达式函数体 `expression body` 来进一步简化：

```kotlin
fun alphabet() = with(StringBuilder()) {
    for (letter in 'A'..'Z') {
        append(letter)
    }
    append("\nNow I know the alphabet!")
    toString()
}

fun main(args: Array<String>) {
    println(alphabet())
}
```



假设alphabet是OuterClass的一个方法，可以用`this@OuterClass.toString`来指向需要调用的方法。

#### apply函数

与with基本一样，区别在于apply始终返回作为参数传递时的对象(对象接收者)

>  The apply function works almost exactly the same as `with`; the only difference is that `apply` always returns the object passed to it as an argument (in other words, the receiver object).



```kotlin
fun alphabet() = StringBuilder().apply {
    for (letter in 'A'..'Z') {
        append(letter)
    }
    append("\nNow I know the alphabet!")
}.toString()

fun main(args: Array<String>) {
    println(alphabet())
}
```

 Android中的`TextView`初始化，`TextView`变成了lambda的接收者：

```kotlin
fun createViewWithCustomAttributes(context: Context) =
    TextView(context).apply {
        text = "Sample Text"
        textSize = 20.0
        setPadding(10, 0, 0, 0)
    }
```

使用标准库的 `buildString` 进一步简化调用：

```kotlin
fun alphabet() = buildString {
    for (letter in 'A'..'Z') {
        append(letter)
    }
    append("\nNow I know the alphabet!")
}

fun main(args: Array<String>) {
    println(alphabet())
}
```
