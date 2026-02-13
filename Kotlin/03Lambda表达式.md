## Lambda表达式

Lambda表达式是一种简洁的匿各函数表示方式，将匿名函数作为参数传递。最初来源于**函数式编程(Functional programming)**：把函数当做值来对待，直接进行传递。

语法(Syntax for lambda expressions)：通过箭头将实参(argument list)与lambda函数体隔开

 <img src="./Kotlin/images/07.jpg"/>

在Java中使用Lambda：

```java
/* Java */
button.setOnClickListener(new OnClickListener() {
    @Override
    public void onClick(View view) {
        /* actions on click */
    }
    
button.setOnClickListener { /* actions on click */ }
```

Java函数式接口，**SAM**：Single abstract methods，只有一个抽象方法， 这种称为函数式接口，或SAM；可把lambda传给SAM：

```java
button.setOnClickListener { /* actions on click */ }
```

用lambda在集合中进行搜索：

```kotlin
data class Person(val name: String, val age: Int)

val people = listOf(Person("Alice", 29), Person("Bob", 31))
println(people.maxBy { it.age })

// 进一步简化：
println(people.maxBy(Person::age))

// 函数定义
public inline fun <T, R : Comparable<R>> Iterable<T>.maxBy(selector: (T) -> R): T? {
    return maxByOrNull(selector)
}

// 完整的匿名函数
people.maxBy(fun(person: Person): Int {
    return person.age
})
```

lambada直接可以将一段行为作为一个值进行传递(encodes a small piece of behavior that you can pass around as a value)，也可以将其声明存储到一个变量引用之中。更常见的是直接将其传递给函数。

将lambada表达式存储在一个变量中：


```kotlin
 val sum = { x: Int, y: Int -> x + y }
 println(sum(1, 2))
```
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

**成员引用 Member references**：

<img src="./Kotlin/images/19.jpg" />

```kotlin
val getAge = Person::age
```

也可以是：

```kotlin
val getAge = { person: Person -> person.age }
```

## 集合的函数式API

functional apis for collections

### filter 

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

### map

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

// 可以简化为
people.map(Person::name)
```

链式调用：

```kotlin
people.filter { it.age > 30 }.map(Person::name)
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

### 集合的判断（all、any、count、find）

条件：检查一个人是否到28岁

```kotlin
data class Person(val name: String, val age: Int)
val canBeInClub27 = { p: Person -> p.age <= 27 }
```

`all`：所有元素都满足条件

```kotlin
val people = listOf(Person("Alice", 27), Person("Bob", 31))
println(people.all(canBeInClub27))
>>> false
```

`any`：至少存在一个满足


```kotlin
fun main(args: Array<String>) {
    val list = listOf(1, 2, 3)
    println(!list.all { it == 3 })
    println(list.any { it != 3 })
}
// true true
```

`count`：有多少个元素满足条件

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

`find`：找到一个满足条件的元素，有则返回第一个元素，没有则返回null，等同于`firstOrNull`：


```kotlin
val people = listOf(Person("Alice", 27), Person("Bob", 31))
println(people.find(canBeInClub27))
>>> Person(name=Alice, age=27)
```

### 分组groupBy

`groupBy`会将集合转换为map分组：

```kotlin
data class Person(val name: String, val age: Int)

fun main(args: Array<String>) {
    val people = listOf(Person("Alice", 31), Person("Bob", 29), Person("Carol", 31))
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

###  flatMap 与 flatten

`flatMap`会先根据给定的函数对每个元素做变换，然后将其合并为一个集合

```kotlin
fun main(args: Array<String>) {
    val strings = listOf("abc", "def")
    println(strings.flatMap { it.toList() })
}
//[a, b, c, d, e, f]
```
执行过程如下：

<img src="./Kotlin/images/14.jpg" />

```kotlin
1. 对 "abc" 应用 it.toList() → ['a', 'b', 'c']
2. 对 "def" 应用 it.toList() → ['d', 'e', 'f']
3. 将所有子列表合并为一个列表 → ['a', 'b', 'c', 'd', 'e', 'f']
```

示例：

```kotlin
class Book(val title: String, val authors: List<String>)

fun main(args: Array<String>) {
    val books = listOf(
        Book("Thursday Next", listOf("Jasper Fforde")),
        Book("Mort", listOf("Terry Pratchett")),
        Book(
            "Good Omens", listOf(
                "Terry Pratchett",
                "Neil Gaiman"
            )
        )
    )
    println(books.flatMap { it.authors }.toSet())
}
//[Jasper Fforde, Terry Pratchett, Neil Gaiman]
```

### sequence

Kotlin中的`sequence`是一种惰性求值集合(lazy collection operations)，类似于Java中的stream，允许以链式操作大量数据，在需要时才计算。

不会输出结果：

```kotlin
fun main(args: Array<String>) {
    listOf(1, 2, 3, 4).asSequence()
            .map { print("map($it) "); it * it }
            .filter { print("filter($it) "); it % 2 == 0 }
}
```
会输出结果：
```kotlin
fun main(args: Array<String>) {
    listOf(1, 2, 3, 4).asSequence()
            .map { print("map($it) "); it * it }
            .filter { print("filter($it) "); it % 2 == 0 }
            .toList()
}
//map(1) filter(1) map(2) filter(4) map(3) filter(9) map(4) filter(16) 
```

使用sequence后，执行过程比较：

```kotlin
 // 只处理了 2 个元素（1 和 2）,没有创建中间列表,内存效率更商
println(listOf(1, 2, 3, 4).asSequence().map { it * it }.find { it > 3 })
//4     

println(listOf(1, 2, 3, 4)
    .map { it * it }      // 先计算所有平方：[1, 4, 9, 16]
    .find { it > 3 })     // 然后在结果中查找：4
```
<img src="./Kotlin/images/16.jpg" />

执行过程优化：

```kotlin
data class Person(val name: String, val age: Int)

fun main(args: Array<String>) {
    val people = listOf(
        Person("Alice", 29),
        Person("Bob", 29), Person("Carol", 21)
    )

    println(
        people.asSequence().map(Person::name).filter { it.length < 4 }.toList()
    )
    
    println(
        people.asSequence().filter { it.name.length < 4 }.map(Person::name).toList()
    )
}
//[Bob]
```
先用`filter`有助于减少变换次数

<img src="./Kotlin/images/08.jpg" />

使用`generateSequence`创建sequence

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



## with与apply

带接收者的lambda(lambdas with receivers)是Kotlin独有的功能，在lambda内调用一个不同对象的方法，无须借助任何额外的限定符。

> a unique feature of Kotlin’s lambdas that isn’t available with Java: the ability to call methods of a different object in the body of a lambda without any additional qualifiers. Such lambdas are called lambdas with receivers. 

### with函数
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

### apply函数

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
