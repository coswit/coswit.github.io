### 为什么需要内存模型

不同处理器的内存模型不同（重排、缓存可见性差异），JMM（Java Memory Model）在它们之上定义**统一的语义**，保证"一次编写，到处正确"：

- **重排序的来源**：编译器优化、CPU 乱序执行、缓存/写缓冲——程序观察到的操作顺序可能与代码顺序不同；
- JMM 的核心问题：**在什么条件下，一个线程对内存的写入对其他线程可见**。

### happens-before

**happens-before 是 JMM 的核心：如果 A happens-before B，那么 A 的结果对 B 可见（且 A 的顺序在 B 前）。**

**与程序员相关的 happens-before 规则**：

1. **程序顺序规则**：单线程内，按程序顺序前面的操作 happens-before 后面的操作（看似废话，实际允许重排——只要不改变单线程语义，as-if-serial）；
2. **监视器锁规则**：对同一把锁，**解锁 happens-before 后续加锁**——这就是"锁保证可见性"的依据；
3. **volatile 规则**：volatile 变量的**写 happens-before 后续读**；
4. **线程启动规则**：Thread.start() 之前的操作 happens-before 新线程内的操作（启动前写入的数据，子线程可见）；
5. **线程终止规则**：线程的全部操作 happens-before join() 的返回（子线程的写入，join 后对主线程可见）；
6. **传递性**：A hb B，B hb C ⇒ A hb C；
7. （并发工具补充：Executor 的 submit 前的操作 hb 任务执行；Future.get 前 hb 任务的操作；CountDownLatch/Semaphore 的 release hb acquire；ConcurrentHashMap 的 put hb get。）

**解读不加同步的共享变量**：写读之间没有 happens-before 路径时，读线程"什么都有可能看到"（部分构造的对象、旧值、新值——数据竞争 data race）。第 3 章 NoVisibility 的所有诡异现象都可以用 hb 解释。

### 安全发布的内存模型解释

第 3 章"安全发布"的模式全部对应 hb 规则：

| 发布方式 | 依据 |
| --- | --- |
| 静态初始化 `static X x = new X()` | 类初始化由 JVM 锁保护，hb 所有使用者 |
| volatile 字段 | volatile 写 hb 读 |
| final 字段 | 初始化安全性（下节） |
| 锁保护 | 解锁 hb 加锁 |
| 并发容器/BlockingQueue | put hb take |

### 初始化安全性（final 字段的特殊保证）

**正确构造（this 不逸出）下，final 字段的值对所有线程无需同步即可见**，且引用的所有通过 final 达到的对象也可见——这是 JVM 唯一"免同步的可见性保证"：

```java
// final 字段：构造完成后，其他线程看到的 x 一定是 42，sb 的内容也完整可见
class X { final int v; final Object[] data; X() { v = 42; data = ...; } }
```

**限制**：只保证"不可变"状态（final 且构造后不变才安全）。对象逸出（构造未完成就发布）会破坏该保证；非 final 字段不受保护。

这解释了：**不可变对象可以被自由共享**（第 3 章）的底层原理——final + 不逸出 = JMM 担保的免同步发布。

### 发布没有 happens-before 的对象 = 危险

反例（第 3 章）：非同步的公有静态字段发布可变对象——读线程可能看到：

1. 引用为 null（还没写引用）；
2. 引用非 null 但字段是默认值/旧值（引用先于状态到达）；
3. 部分构造状态。

**一切"看似不可能"的并发怪象，都能在 JMM 找到解释。**

### JVM 内部与元层面

- JMM 定义了 volatile、锁、final 的语义，也约束了 JVM 的优化空间（不能把同步语义优化掉）；
- 双重检查锁（DCL）的教训：没有 volatile 的 DCL 是坏的（引用可见 ≠ 状态可见），带 volatile 的 DCL 才正确（JDK 5 后）——更简单的替代是静态 Holder 类（类初始化保证）；
- **指令重排的可见例子**：懒加载单例的"分配 → 初始化 → 赋引用"可能被重排成"分配 → 赋引用 → 初始化"，另一个线程拿到未初始化完的实例。

### 全书主线回顾

1. **共享可变状态才需要同步**（第 2~4 章的锁、可见性、封闭、不可变、委托）；
2. **善用高层结构**（第 5~8 章：并发容器、Executor、正确的取消、任务编排）；
3. **警惕活跃性问题**（第 10 章：死锁、饥饿、活锁）；
4. **性能要测量**（第 11 章：Amdahl、减少锁竞争）；
5. **底层是 JMM**（第 16 章）：happens-before 是一切可见性判断的准绳。

> 【演进】JMM 自 JSR-133（Java 5）定型以来语义稳定。Java 9 的 VarHandle 把内存序（plain/opaque/acquire/release/volatile）显式暴露给库作者；虚拟线程不改内存模型（只改调度）。看懂 happens-before，Java 并发的"为什么"就都通了。
