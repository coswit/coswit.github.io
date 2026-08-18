### 为什么需要内存模型

不同处理器的内存模型不同（重排、缓存可见性差异），JMM（Java Memory Model）在它们之上定义**统一的语义**，保证"一次编写，到处正确"：

- **重排序的来源**：编译器优化（指令重排、寄存器分配）、CPU 乱序执行（流水线、推测执行）、缓存/写缓冲——程序观察到的操作顺序可能与代码顺序不同；
- 现代 CPU 的内存层次：每核有自己的寄存器与写缓冲（store buffer），写入先落缓冲再刷主存——**一个核的写，另一个核此刻看不到，是完全正常的**；
- 各平台内存模型的强弱不同：x86 较强（total store order，只允许写读重排一类），ARM/POWER 较弱（允许大量重排）。JVM 在弱内存模型平台上要插入**内存屏障（memory barrier/fence）**来兑现 Java 的语义——这也是 volatile 有代价的原因（第 9 篇）；
- JMM 的核心问题：**在什么条件下，一个线程对内存的写入对其他线程可见**。

JMM 为**程序员**定义可见性保证（happens-before），为**编译器/JVM**划定优化空间——可以在不破坏 happens-before 的前提下任意重排。**你只需要面对 happens-before，不需要面对每种 CPU 的手册。**

### happens-before

**happens-before 是 JMM 的核心：如果 A happens-before B，那么 A 的结果对 B 可见（且 A 的顺序在 B 前）。**它是**偏序关系**（自反、传递，但并非任意两操作都可比较——不可比较的两操作就是"无同步的并发访问"）。

**与程序员相关的 happens-before 规则**：

1. **程序顺序规则**：单线程内，按程序顺序前面的操作 happens-before 后面的操作（看似废话，实际允许重排——只要不改变单线程语义，as-if-serial）；
2. **监视器锁规则**：对同一把锁，**解锁 happens-before 后续加锁**——这就是"锁保证可见性"的依据；
3. **volatile 规则**：volatile 变量的**写 happens-before 后续读**；
4. **线程启动规则**：Thread.start() 之前的操作 happens-before 新线程内的操作（启动前写入的数据，子线程可见）；
5. **线程终止规则**：线程的全部操作 happens-before join() 的返回（子线程的写入，join 后对主线程可见）；
6. **传递性**：A hb B，B hb C ⇒ A hb C；
7. （并发工具补充，juc 全部建立在 hb 之上：Executor 的 submit 前的操作 hb 任务执行；Future.get 前 hb 任务的操作；CountDownLatch/Semaphore 的 release hb acquire；ConcurrentHashMap 的 put hb get；屏障的到达 hb 屏障放行。）

**数据竞争（data race）的定义**：两个**冲突访问**（同一变量、至少一个是写）之间没有 happens-before 排序，程序就存在数据竞争。存在数据竞争的程序，读到的值是"不可预测"的——失效值、部分构造对象都可能。

**正确同步的程序没有数据竞争，且表现得像顺序一致（sequentially consistent）**——这是 JMM 给"写对同步的程序员"的礼物：顺序一致性是个理想化模型（所有操作按某种全局顺序原子生效，每线程内部保持程序顺序），真实硬件不支持它，但正确的同步让你的程序**仿佛**运行在这个模型上，推理时不需要考虑重排。

**解读不加同步的共享变量**：写读之间没有 happens-before 路径时，读线程"什么都有可能看到"（部分构造的对象、旧值、新值——数据竞争）。第 2 篇 NoVisibility 的所有诡异现象都可以用 hb 解释：

- `ready = true` 与 `number = 42` 被重排，或读线程先见 ready 后见 number——两组操作间没有任何 hb 边；
- 加锁/volatile 后，解锁 hb 加锁、volatile 写 hb 读，一切顺序确定。

"画 hb 图"是并发排错的基本功：把读写按线程列出，问"从写到读有没有 hb 路径"——没有就是竞争。

### 安全发布的内存模型解释

第 2 篇"安全发布"的模式全部对应 hb 规则：

| 发布方式 | 依据 |
| --- | --- |
| 静态初始化 `static X x = new X()` | 类初始化由 JVM 锁保护，hb 所有使用者 |
| volatile 字段 | volatile 写 hb 读 |
| final 字段 | 初始化安全性（下节） |
| 锁保护 | 解锁 hb 加锁 |
| 并发容器/BlockingQueue | put hb take |
| Thread.start / 线程池提交 | 启动/提交 hb 任务执行 |

反过来看**不安全发布为什么危险**：构造器里的写字段、发布引用、读者读引用——"写字段 hb 发布 hb 读引用 hb 读字段"这条链必须完整；普通字段写与引用发布之间没有 hb，读线程看到引用非 null 却可能看到字段默认值（第 2 篇的 Holder `n != n`）。

### 初始化安全性（final 字段的特殊保证）

**正确构造（this 不逸出）下，final 字段的值对所有线程无需同步即可见**，且通过 final 字段可达的其他对象（如 final 引用指向的对象内容）也可见——这是 JVM 唯一"免同步的可见性保证"：

```java
// final 字段：构造完成后，其他线程看到的 v 一定是 42，data 的内容也完整可见
class X { final int v; final Object[] data; X() { v = 42; data = ...; } }
// 前提：构造期间 this 没有逸出（逸出会撕毁一切保证）
```

**限制**：只覆盖构造期——"不可变"（final 且构造后不再改）才安全；非 final 字段不受保护；逸出破坏保证；**final 字段后续被改（反射/序列化的漏洞）不属于正常语义**。

这解释了：**不可变对象可以被自由共享**（第 2 篇）的底层原理——final + 不逸出 = JMM 担保的免同步发布。

**一个有趣的合法案例——String.hashCode 的良性竞争**：String 不可变，但 hash 字段非 final（惰性计算）。多线程同时算 hash 是"竞争"，但**写是幂等的**（每次算出的值相同），读到的要么是 0（没算）要么是正确值——永远正确。这叫**良性竞争（benign race）**：仅当"竞争的所有可能交错都产生正确结果"才合法，极其罕见且难以证明——**不要模仿**，业务代码里有更便宜的懒加载手段。

### 发布没有 happens-before 的对象 = 危险

反例（第 2 篇）：非同步的公有静态字段发布可变对象——读线程可能看到：

1. 引用为 null（还没写引用）；
2. 引用非 null 但字段是默认值/旧值（引用先于状态到达）；
3. 部分构造状态。

**一切"看似不可能"的并发怪象，都能在 JMM 找到解释。**

### 双重检查锁（DCL）——反面教材

DCL 是"想少加一次锁"的产物，也是 JMM 最著名的反面教材：

```java
// 有问题的 DCL：没有 volatile 的"懒加载单例"
private static Resource resource;
public static Resource getInstance() {
    if (resource == null) {                  // 第一次检查：无锁读！（数据竞争）
        synchronized (Box.class) {
            if (resource == null)            // 第二次检查：加锁
                resource = new Resource();   // "分配→初始化→发布引用"可能被重排！
        }
    }
    return resource;
}
```

两个致命点：

1. **无锁的第一次读**是数据竞争——读到非 null 不代表看到完整对象；
2. `resource = new Resource()` 的"初始化"与"引用赋值"可能重排（构造未完成，引用已发布）——另一个线程第一次检查通过，拿到**半成品**。

**修复一**：`volatile static Resource resource`——volatile 写 hb 读，发布安全（JDK 5 起 volatile 语义被 JSR-133 加强后才成立——古老的"加 volatile 也没用"的说法是 Java 5 之前的历史）。

**修复二（更好）——静态 Holder 类**，利用 JVM 的类初始化保证：

```java
// JVM 保证类初始化的线程安全：ResourceHolder 的初始化在首次使用时由 JVM 锁保护地执行
private static class ResourceHolder {
    static final Resource resource = new Resource();   // 静态初始化 = 安全发布
}
public static Resource getResource() { return ResourceHolder.resource; }
```

DCL 的教训：**微优化同步之前先测量**；现代 JVM 上正确的单例方案（Holder / 枚举 / 直接饿汉）都比 DCL 简单且快。

### JVM 内部与元层面

- JMM 定义了 volatile、锁、final 的语义，也约束了 JVM 的优化空间（不能把同步语义优化掉）；hb 之外的自由度全部留给性能；
- **happens-before 的一致性约束**：读不允许"凭空造值"（out-of-thin-air 保证）——读到的一定是某个线程真写过的值/默认值，杜绝了最疯狂的推测执行；
- JIT 对同步的优化：锁消除（逃逸分析证明无竞争则删掉锁）、锁粗化（相邻同步块合并）——都不改变 hb 语义。

### 全书主线回顾

1. **共享可变状态才需要同步**（第 2~4 篇的锁、可见性、封闭、不可变、委托）；
2. **善用高层结构**（第 4~7 篇：并发容器、Executor、正确的取消、任务编排）；
3. **警惕活跃性问题**（第 8 篇：死锁、饥饿、活锁）；
4. **性能要测量**（第 9 篇：Amdahl、减少锁竞争）；
5. **底层是 JMM**（本篇）：happens-before 是一切可见性判断的准绳。

全书的方法论一句话：**用不可变与封闭消灭共享，用高层结构消灭手工同步，剩下的共享可变状态用最小而精确的同步保护——并永远能答出"凭什么这条路径是安全的"。**

> 【演进】JMM 自 JSR-133（Java 5）定型以来语义稳定。Java 9 的 VarHandle 把内存序（plain/opaque/acquire/release/volatile）显式暴露给库作者；虚拟线程不改内存模型（只改调度）。看懂 happens-before，Java 并发的"为什么"就都通了。
