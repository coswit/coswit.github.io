### 为什么需要内存模型

不同处理器的内存模型不同（重排、缓存可见性差异），JMM（Java Memory Model）在它们之上定义**统一的语义**，保证“一次编写，到处正确”：

- **重排序的来源**：编译器优化（指令重排、寄存器分配）、CPU 乱序执行（流水线、推测执行）、缓存/写缓冲——程序观察到的操作顺序可能与代码顺序不同；
- 现代 CPU 的内存层次：每核有自己的寄存器与写缓冲（store buffer），写入先落缓冲再刷主存——**一个核的写，另一个核此刻看不到，是完全正常的**；
- 各平台内存模型的强弱不同：x86 较强——TSO（Total Store Order，全存储排序），仅允许 StoreLoad 一类重排；ARM/POWER 较弱（允许大量重排）。JVM 在弱内存模型平台上要插入**内存屏障（memory barrier/fence）**来兑现 Java 的语义——这也是 volatile 有代价的原因（第 9 篇）。不过原书特意缓和：主流平台上 volatile 读的开销与普通读相当，别凭这个不敢用 volatile（第 9 篇演进注有现代口径）；
- JMM 的核心问题：**在什么条件下，一个线程对内存的写入对其他线程可见**。

**重排序有多真实——连最简单的程序都难推断**（原书 Listing 16.1，两个线程各自写两个变量）：

```java
public class PossibleReordering {
    static int x = 0, y = 0;
    static int a = 0, b = 0;

    public static void main(String[] args) throws InterruptedException {
        Thread one = new Thread(() -> { a = 1; x = b; });
        Thread other = new Thread(() -> { b = 1; y = a; });
        one.start(); other.start();
        one.join(); other.join();
        System.out.println("( " + x + "," + y + ")");
    }
}
```

输出 (1,0)、(0,1)、(1,1) 都好想象（先后完成或交错）；但**它也能输出 (0,0)**——两个线程内的写与读互无数据流依赖，可以被各自重排（即便按序执行，缓存刷写的时机也可能让 B“看到” A 的写以相反顺序发生）。没有同步时枚举可能结果就已经如此困难——**正确同步比推理重排容易得多**。

JMM 为**程序员**定义可见性保证（happens-before），为**编译器/JVM** 划定优化空间——可以在不破坏 happens-before 的前提下任意重排。**你只需要面对 happens-before，不需要面对每种 CPU 的手册。**

### happens-before

**happens-before 是 JMM 的核心。**它想保证的是：*要确保执行动作 B 的线程能看到动作 A 的结果（无论 A、B 是否在同一线程），A 与 B 之间必须存在 happens-before 关系*——反过来说，没有 hb 边就不做任何可见性承诺。它是**偏序关系**（反对称、自反、传递——但并非任意两操作都可比较，不可比较的两操作就是“无同步的并发访问”）。

**happens-before 的完整规则**（原书 8 条）：

1. **程序顺序规则**：单线程内，按程序顺序前面的操作 happens-before 后面的操作。它的规范表述来自 JLS：

> If x and y are actions of the same thread and x comes before y in program order, then hb(x, y).
>
> 如果 x 和 y 是同一线程内的动作，且 x 按程序顺序出现在 y 之前，那么 hb(x, y)。——JLS §17.4.5

（看似废话，实际允许重排——只要不改变单线程语义即可，即 as-if-serial）；

2. **监视器锁规则**：对**同一把**锁，**解锁 happens-before 后续加锁**——这就是“锁保证可见性”的依据（显式 Lock 的加解锁与内置锁内存语义相同）；
3. **volatile 规则**：对**同一 volatile 字段**的写 happens-before 后续对**该字段**的读（hb 只连接同一字段的写与读——原子变量的读写具有与 volatile 相同的内存语义）；
4. **线程启动规则**：Thread.start() 调用 happens-before 新线程内的所有操作（启动前写入的数据，子线程可见）；
5. **线程终止规则**：线程中的所有操作 happens-before 其他线程**检测到它终止**——无论是 join() 成功返回还是 isAlive() 返回 false（子线程的写入，检测到终止后可见）；
6. **中断规则**：调用线程 A 的 interrupt happens-before A 检测到中断（抛出 InterruptedException 或查询 isInterrupted/interrupted）；
7. **终结器规则**：对象构造的结束 happens-before 该对象 finalizer 的开始；
8. **传递性**：A hb B，B hb C ⇒ A hb C。

（另有一个隐含前提：volatile 写与读的“后续”之所以有定义，是因为所有同步动作（加解锁、volatile 读写、线程启动/JOIN 等）之间存在**全序**（synchronization order）——hb 是偏序，同步动作之间是全序。）

**数据竞争（data race）的定义**：两个**冲突访问**（同一变量、至少一个是写）之间没有 happens-before 排序，程序就存在数据竞争。存在数据竞争的程序，读到的值是“不可预测”的——失效值、部分构造对象都可能出现。

（并发工具补充——juc 全部建立在 hb 之上：Executor 的 submit 前的操作 hb 任务执行；Future.get 前 hb 任务的操作；CountDownLatch 的 countDown hb await 返回、Semaphore 的 release hb acquire；ConcurrentHashMap 的 put hb get；屏障的到达 hb 屏障放行。）

**借助同步（piggybacking）**：hb 的强度允许“搭便车”——把程序顺序规则与其他排序规则（通常是监视器锁或 volatile 规则）组合起来，为**本来没有专门保护**的变量提供可见性。原书的例子是 FutureTask 的内部实现：结果 result 不是 volatile，但 innerSet 先写 result 再 releaseShared（写 volatile 状态），innerGet 先 acquireShared 再读 result——程序顺序规则 + volatile 规则传递性地给 result 排了序，省一次 volatile。**这是脆弱的高级技巧**，对语句顺序极度敏感，只该留给 ReentrantLock 这类最底层的类；但它有一个日常形态——通过 BlockingQueue 安全发布对象，正是借助队列内部的同步（入队 hb 出队）来保证可见性。

**正确同步的程序没有数据竞争，且表现得像顺序一致（sequentially consistent）**——这是 JMM 给“写对了同步的程序员”的礼物：顺序一致性是个理想化模型（所有操作按某种全局顺序原子生效，每个线程内部保持程序顺序），没有任何现代多处理器提供顺序一致性，**JMM 本身也不提供**——它是正确同步换来的：程序正确同步，才能“仿佛”运行在这个模型上，推理时不需要考虑重排。

**解读不加同步的共享变量**：写读之间没有 happens-before 路径时，读线程“什么都有可能看到”（部分构造的对象、旧值、新值——数据竞争）。第 2 篇 NoVisibility 的所有诡异现象都可以用 hb 解释：

- `ready = true` 与 `number = 42` 被重排，或读线程先见 ready 后见 number——两组操作间没有任何 hb 边；
- 加锁/volatile 后，解锁 hb 加锁、volatile 写 hb 读，一切顺序确定。

“画 hb 图”是并发排错的基本功：把读写按线程列出，问“从写到读有没有 hb 路径”——没有就是竞争。

### 安全发布的内存模型解释

第 2 篇“安全发布”的模式全部对应 hb 规则：

| 发布方式 | 依据 |
| --- | --- |
| 静态初始化 `static X x = new X()` | 类初始化由 JVM 锁保护，hb 所有使用者 |
| volatile 字段 | volatile 写 hb 读 |
| final 字段 | 初始化安全性（下节） |
| 锁保护 | 解锁 hb 加锁 |
| 并发容器/BlockingQueue | put hb take |
| Thread.start / 线程池提交 | 启动/提交 hb 任务执行 |

所有安全发布共用同一条链式结构——“对象状态初始化完成 hb 引用发布 hb 读方读取状态”，任何一个环节缺了 happens-before 边，链条就断：

```mermaid
flowchart LR
    subgraph W [写线程]
      s1[初始化对象状态] --> s2[发布引用<br>volatile 写或解锁]
    end
    s2 == happens-before ==> r1
    subgraph R [读线程]
      r1[读到非空引用] --> r2[读到的状态必然完整]
    end
```

**hb 的承诺比“安全发布”更强**：安全发布只保证看到 X 发布时的状态；hb 链还保证**看到发布方在交接之前做过的一切**（not only does B see X in the state that A left it, but B sees everything A did before the handoff）。那为什么第 2 篇通篇讲 @GuardedBy 与安全发布、而不直接教 hb？——hb 作用在单条内存访问的粒度上，是“并发汇编语言（concurrency assembly language）”；安全发布/所有权交接才贴近程序设计的抽象层次。日常按安全发布设计，排错时用 hb 分析。

反过来看**不安全发布为什么危险**：构造器里的写字段、发布引用、读者读引用——上面那条链必须完整；普通字段写与引用发布之间没有 hb，读线程看到引用非 null 却可能看到字段默认值（第 2 篇的 Holder `n != n`）。

### 初始化安全性（final 字段的特殊保证）

**正确构造（this 不逸出）下，final 字段的值对所有线程无需同步即可见**，且通过 final 字段可达的其他对象（如 final 引用指向的对象内容）也可见。机制上：构造器内对 final 字段（及经由其可达的对象）的写入，在**构造完成时被“冻结（frozen）”**——JMM 禁止把构造过程与“首次加载该对象引用”重排序，读到引用就必然看到冻结后的状态。

```java
// final 字段：构造完成后，其他线程看到的 v 一定是 42，data 的内容也完整可见
class X {
    final int v;
    final Object[] data;
    X() { v = 42; data = new Object[]{ "a", "b" }; }
}
// 前提：构造期间 this 没有逸出（逸出会撕毁一切保证）
```

**限制**：只覆盖构造期——“不可变”（final 且构造后不再改）才安全；非 final 字段不受保护；逸出破坏保证；**final 字段后续被改（反射/序列化的漏洞）不属于正常语义**。

一个反直觉的推论（原书原话）：*UnsafeLazyInitialization is actually safe if Resource is immutable*——**若 Resource 不可变，无同步的懒加载其实也是安全的**（初始化安全性覆盖了数据竞争下的发布），尽管它仍可能创建多个实例。

这解释了**不可变对象可以被自由共享**（第 2 篇）的底层原理——final + 不逸出 = JMM 担保的免同步发布。原书的 SafeStates 示例把边界标得很清楚：final HashSet 在构造器里填好、构造后只读，即使经数据竞争发布（公有静态字段、不安全懒加载）也安全——但三件小事立刻毁掉它：states 不是 final、构造器以外的方法修改其内容、构造期间 this 逸出。

**一个有趣的合法案例——String.hashCode 的良性竞争**（原书外补充）：String 不可变，但 hash 字段非 final（惰性计算）。多线程同时算 hash 是“竞争”，但**写是幂等的**（每次算出的值相同），读到的要么是 0（没算）要么是正确值——永远正确。这叫**良性竞争（benign race）**：仅当“竞争的所有可能交错都产生正确结果”才合法，极其罕见且难以证明——**不要模仿**，业务代码里有更便宜的懒加载手段。

### 发布没有 happens-before 的对象 = 危险

反例（第 2 篇）：非同步的公有静态字段发布可变对象——读线程可能看到：

1. 引用为 null（还没写引用）；
2. 引用非 null 但字段是默认值/旧值（引用先于状态到达）；
3. 部分构造状态。

**一切“看似不可能”的并发怪象，都能在 JMM 找到解释。**

### 双重检查锁（DCL）——反面教材

DCL 是“想少加一次锁”的产物，也是 JMM 最著名的反面教材：

```java
// 有问题的 DCL：没有 volatile 的“懒加载单例”
private static Resource resource;
public static Resource getInstance() {
    if (resource == null) {                             // 第一次检查：无锁读！（数据竞争）
        synchronized (DoubleCheckedLocking.class) {
            if (resource == null)                       // 第二次检查：加锁
                resource = new Resource();              // “分配→初始化→发布引用”可能被重排！
        }
    }
    return resource;
}
```

两个致命点：

1. **无锁的第一次读**是数据竞争——读到非 null 不代表看到完整对象；
2. `resource = new Resource()` 的“初始化”与“引用赋值”可能重排（构造未完成，引用已发布）——另一个线程第一次检查通过，拿到**半成品**。

**修复一**：`volatile static Resource resource`——volatile 写 hb 读，发布安全。volatile 这条规则的规范依据：

> A write to a volatile field (§8.3.1.4) happens-before every subsequent read of that field.
>
> 对一个 volatile 字段的写，happens-before 于后续每一次对该字段的读。——JLS §17.4.5

（此修复自 JDK 5 起 volatile 语义被 JSR-133 加强后才真正成立——古老的“加 volatile 也没用”的说法是 Java 5 之前的历史。）

**修复二——同步的懒加载**（Listing 16.4）：getInstance 直接加 synchronized。getInstance 路径本来就短（一次判断加一次可预测分支），调用不频繁时竞争很小、性能足够——别急着上无锁方案。

**修复三——饿汉式**（Listing 16.5）：`private static Resource resource = new Resource();`——静态初始化由 JVM 保证，代价是类加载时就初始化（可能白做）。

**修复四（更好）——静态 Holder 类**，利用 JVM 的类初始化保证：

```java
// JVM 保证类初始化的线程安全：ResourceHolder 的初始化在首次使用时由 JVM 锁保护地执行
private static class ResourceHolder {
    static final Resource resource = new Resource();   // 静态初始化 = 安全发布
}
public static Resource getResource() { return ResourceHolder.resource; }
```

静态初始化为什么免同步：静态初始化器在**类初始化阶段**执行（类加载之后、被任何线程使用之前）；JVM 在类初始化期间持有**初始化锁**（JLS 12.4.2），每个线程首次使用该类时都要先拿到这把锁（至少一次）——因此静态初始化期间的内存写入自动对所有线程可见，**构造与引用都不需要显式同步**。Holder 习语把“饿汉式”与“延迟加载”合二为一：JVM 延迟到首次使用才加载 ResourceHolder。注意例外：免同步只覆盖“构造完成时的状态”——对象若可变，后续读写仍要同步。

DCL 的教训：**微优化同步之前先测量**；现代 JVM 上正确的单例方案（Holder / 枚举 / 直接饿汉）都比 DCL 简单且快。

### JVM 内部与元层面

- JMM 定义了 volatile、锁、final 的语义，也约束了 JVM 的优化空间（不能把同步语义优化掉）；hb 之外的自由度全部留给性能；
- **happens-before 的一致性约束**：读不允许“凭空造值”（out-of-thin-air 保证，原书外补充）——读到的一定是某个线程真写过的值/默认值，杜绝了最疯狂的推测执行；
- JIT 对同步的优化（原书外补充）：锁消除（逃逸分析证明**锁对象不逃逸**、不可能被其他线程访问，才删掉锁——“无竞争”不是判据）、锁粗化（相邻同步块合并）——都不改变 hb 语义。

### 全书主线回顾

1. **共享可变状态才需要同步**（第 2~4 篇的锁、可见性、封闭、不可变、委托）；
2. **善用高层结构**（第 4~7 篇：并发容器、Executor、正确的取消、任务编排）；
3. **警惕活跃性问题**（第 8 篇：死锁、饥饿、活锁）；
4. **性能要测量**（第 9 篇：Amdahl、减少锁竞争）；
5. **底层是 JMM**（本篇）：happens-before 是一切可见性判断的准绳。

全书的方法论一句话：**用不可变与封闭消灭共享，用高层结构消灭手工同步，剩下的共享可变状态用最小而精确的同步保护——并永远能答出“凭什么这条路径是安全的”。**

> 【演进】JMM 自 JSR-133（Java 5）定型以来语义稳定。Java 9 的 VarHandle 把内存序（plain/opaque/acquire/release/volatile）显式暴露给库作者——可以看作 piggybacking 技巧的官方化原语；虚拟线程不改内存模型（只改调度）。看懂 happens-before，Java 并发的“为什么”就都通了。
