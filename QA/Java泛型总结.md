## 一、为什么需要泛型

泛型（Generics）是 JDK 5 引入的特性，本质是**类型参数化**——把操作的类型写成参数，使用时再指定。

没有泛型时的集合只能按 Object 处理：

```java
List list = new ArrayList();
list.add("hello");
list.add(123);              // 编译不报错
String s = (String) list.get(1);  // 运行时 ClassCastException
```

泛型带来的好处：

- **编译期类型检查**：类型错误在编译期就暴露，而不是运行时才抛 ClassCastException；
- **消除强制类型转换**：取出的值天然就是指定类型；
- **代码复用**：一套算法 / 容器适配所有类型（`List<String>`、`List<Integer>` 共用同一套代码）。

## 二、泛型的三种用法

**1. 泛型类**

```java
public class Box<T> {
    private T value;
    public void set(T value) { this.value = value; }
    public T get() { return value; }
}
```

**2. 泛型接口**

```java
public interface Comparable<T> {
    int compareTo(T o);
}

// 实现类指定具体类型，或继续泛型化
class Person implements Comparable<Person> { ... }
class MyList<E> implements List<E> { ... }
```

**3. 泛型方法**

```java
// <T> 声明在返回类型之前，与类是否泛型无关
public static <T> T first(List<T> list) {
    return list.get(0);
}

// 静态方法不能使用类上声明的类型参数，但可以自己声明
class Box<T> {
    // public static void foo(T t) {}   // 编译错误
    public static <E> void bar(E e) {}  // 正确
}
```

补充：

- 类型参数命名约定：T（Type）、E（Element）、K / V（Key / Value）、R（Return）、N（Number）；
- 类型边界：`<T extends Number>` 限制 T 必须是 Number 的子类型，之后就可以调用 Number 的方法；
- 多重边界：`<T extends Number & Comparable<T>>`，第一个可以是类，后面只能接口，擦除后保留第一个边界。

## 三、类型擦除（核心原理）

**Java 的泛型只存在于编译期，运行时会被擦除为原始类型（raw type）**：无边界时擦成 Object，有边界时擦成第一个边界。这也是"伪泛型"称呼的由来（对比 C# / Kotlin 的具体化泛型）。

```java
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
System.out.println(a.getClass() == b.getClass()); // true，运行时都是 ArrayList

// Object o = new ArrayList<String>();
// if (o instanceof List<String>) {}   // 编译错误，运行时没有泛型信息
// if (o instanceof List<?>) {}        // 可以
```

编译器在擦除的同时做了两件事：

- 在使用泛型变量的地方**自动插入强制转换**（`list.get(i)` 编译后就是 `(String) list.get(i)`）；
- 生成**桥方法**（bridge method）保证继承泛型类 / 接口后多态仍然成立。

### 擦除带来的限制（高频考点）

| 限制 | 原因 / 绕法 |
| --- | --- |
| 不能 `new T()`、`new T[]`、`T.class` | 运行时不知道 T 是什么；传入 `Class<T>` 参数或工厂对象代替 |
| 类型实参不能是基本类型 | `List<int>` 不行，擦除后是 Object 装不下基本类型；用 `List<Integer>` 自动装箱 |
| 静态成员不能用类的类型参数 | 类型参数随实例存在，静态成员属于类；静态方法可以自己声明 `<T>` |
| 不能创建泛型数组 | `new List<String>[10]` 编译错误（数组协变 + 擦除会破坏类型安全）；绕法 `(T[]) new Object[n]` |
| 泛型类不能继承 Throwable，catch 不能用泛型 | 异常匹配发生在运行时，那时泛型已被擦除 |
| 仅类型参数不同的方法不能构成重载 | `f(List<String>)` 与 `f(List<Integer>)` 擦除后签名都是 `f(List)`，编译报错 |

### 运行时还能拿到泛型吗

能拿到**签名中声明的泛型**（字段、方法参数 / 返回值的泛型会保留在 class 文件的 Signature 属性里）：

```java
Field field = Person.class.getDeclaredField("names");
ParameterizedType type = (ParameterizedType) field.getGenericType();
type.getActualTypeArguments()[0]; // 拿到 String
```

Gson 的 `TypeToken` 正是利用**匿名子类**在签名里保留泛型，从而在运行时还原 `List<String>` 这类完整类型。局部变量里的泛型则无法获取。

## 四、通配符与 PECS

| 通配符 | 名称 | 能否读取 | 能否写入 | 典型场景 |
| --- | --- | --- | --- | --- |
| `?` | 无界通配符 | 只能读成 Object | 不能写（除 null） | 只关心"是个 List"，如 `list.size()` |
| `? extends T` | 上界通配符（协变） | 可以，读出来是 T | 不能写（除 null） | **生产者**：只从它读数据 |
| `? super T` | 下界通配符（逆变） | 只能读成 Object | 可以写 T 及其子类 | **消费者**：只往它写数据 |

**PECS 原则（Producer Extends, Consumer Super）**：频繁往外读取用 extends，经常往里插入用 super。JDK 中的典型例子：

```java
// src 只被读取（生产者），用 extends；dest 只被写入（消费者），用 super
public static <T> void copy(List<? super T> dest, List<? extends T> src)
```

写入受限的原因：`List<? extends Number>` 可能实际是 `List<Integer>`，编译器无法确定具体类型，索性禁止写入，靠编译期保守检查换取运行时类型安全（QA 第 12 题也是这个问题）。

## 五、泛型的不变性

**泛型默认是不变的（invariant）**：`List<String>` 和 `List<Object>` 是两个毫无继承关系的类型——即使 String 是 Object 的子类。

```java
List<String> strings = new ArrayList<>();
// List<Object> objs = strings;  // 编译错误
strings.add(123);                // 假如允许，这里就能放进 Integer，取出时就会出错
```

对比：**数组是协变的**（`String[]` 可以赋给 `Object[]`），代价是运行时可能抛 ArrayStoreException。泛型选择编译期不变 + 通配符按需"协变（extends）/逆变（super）"，把类型错误拦在编译期。

| 概念 | 含义 | Java 中的体现 |
| --- | --- | --- |
| 不变 | C<A> 与 C<B> 无关，即使 A、B 有继承关系 | 泛型默认行为 |
| 协变 | 方向与继承一致（子→父） | `? extends T`、数组 |
| 逆变 | 方向与继承相反（父→子） | `? super T` |

## 六、常见面试题速答

- **泛型的原理？** 编译期类型检查 + 类型擦除，运行时泛型信息被擦成原始类型。
- **`List<String>` 能存 Integer 吗？** 直接存编译不过；通过原始类型或反射绕过检查后能存进去，取出时会抛 ClassCastException（堆污染，heap pollution）。
- **`List<Object>` 和 `List<String>` 是什么关系？** 没有继承关系，泛型是不变的；需要兼容用 `List<?>`。
- **`List` 和 `List<Object>` 一样吗？** 不一样。前者绕过泛型检查（raw type），后者显式声明装 Object；两者能互相赋值但都会有 unchecked 警告。
- **如何把 `List<Integer>` 转成 `List<Number>`？** 不能直接转，逐个元素复制（或 Stream 收集）。
- **`<T extends A & B>` 合法吗？** 合法，多重边界，擦除后保留 A。
- **为什么静态方法不能引用类的泛型参数？** 类型参数在实例化时才确定，静态成员不依赖实例；静态方法可以自己声明 `<T>`。

## 七、与 Kotlin 泛型的对比

Java 的型变靠使用处通配符（use-site variance），Kotlin 更进一步：

- **声明处型变**：`out T`（协变，只生产）、`in T`（逆变，只消费），如 `List<out E>` 本身就是协变的；
- **星投影**：`List<*>` 对应 Java 的 `List<?>`；
- **具体化类型参数（reified）**：`inline fun <reified T : Any> Gson.fromJson(json)` 配合内联，运行时真的拿得到 T，不需要传 `Class<T>`，也不需要 TypeToken。

详细语法见 [Kotlin 泛型](/Kotlin/07泛型.md)。
