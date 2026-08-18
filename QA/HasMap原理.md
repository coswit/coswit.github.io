### 概述

HashMap 是一个散列表，存储键值对映射。它根据键的 hashCode 值存储数据，大多数情况下可以直接定位到值，访问速度快，但遍历顺序不确定。最多允许一条记录的键为 null，允许多条记录的值为 null。**非线程安全**：多线程并发写可能导致数据不一致（JDK 7 并发扩容还会导致链表成环死循环），需要线程安全时用 `Collections.synchronizedMap` 包装或直接用 `ConcurrentHashMap`。

三个重要参数：

- **initialCapacity 初始容量（默认 16）**：HashMap 底层是数组 + 链表（或红黑树），数据增多必须扩容；已知数据量时指定合适的初始容量可以避免扩容，提升效率。**实际容量会被 `tableSizeFor()` 向上取整为 2 的幂**。
- **loadFactor 加载因子（默认 0.75）**：哈希表在其容量自动扩容之前"允许多满"的度量。负载因子大 → 扩容概率低、省内存，但链表更长、查询变慢；负载因子小 → 反之。它是时间与空间的折中，一般不需要改，默认值已经比较合适。
- **threshold 阈值**：所能容纳的最大键值对数量，`threshold = capacity × loadFactor`，超过就扩容。注意构造方法里 table 并未初始化（延迟到第一次 put），此时 threshold 暂存的是 `tableSizeFor(initialCapacity)`，put 时才按最终容量重新计算。

### 存储结构：数组 + 链表 + 红黑树

```java
public class HashMap<K,V> extends AbstractMap<K,V> implements Map<K,V>, Cloneable, Serializable {
    /** 默认初始容量 16，必须为 2 的 n 次方 */
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;

    /** 最大容量 2 的 30 次幂 */
    static final int MAXIMUM_CAPACITY = 1 << 30;

    /** 默认负载因子 */
    static final float DEFAULT_LOAD_FACTOR = 0.75f;

    /** 链表转红黑树的阈值：桶中节点数超过 8 时树化 */
    static final int TREEIFY_THRESHOLD = 8;

    /** 红黑树退化为链表的阈值：扩容时桶内节点数小于 6 */
    static final int UNTREEIFY_THRESHOLD = 6;

    /** 树形化要求的最小表容量：表容量 >= 64 才树化，否则优先扩容 */
    static final int MIN_TREEIFY_CAPACITY = 64;

    /** Node 实现了 Map.Entry，本质就是一个键值对 */
    static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;        // 用来定位数组索引位置
        final K key;
        V value;
        Node<K,V> next;        // 链表的下一个 node
        ...
    }

    /** 哈希桶数组，长度总是 2 的幂 */
    transient Node<K,V>[] table;

    /** 实际存储的键值对数量 */
    transient int size;

    /** 结构性修改次数，用于迭代的快速失败（fail-fast） */
    transient int modCount;

    /** 扩容阈值：capacity * loadFactor */
    int threshold;

    /** 负载因子 */
    final float loadFactor;
}
```

- `size` 是实际键值对数量；`modCount` 记录结构变化次数，迭代器用它实现 fail-fast（见 1.Java一 第 26 题）。
- 常规哈希表设计会把桶数取素数以降低冲突（HashTable 初始 11），HashMap 反其道取 2 的幂——是为了**用位运算代替取模、并加速扩容迁移**（见下），同时用扰动函数弥补高位信息损失。

### hash 计算与索引定位

```java
// 二次 hash（扰动函数）：高 16 位异或低 16 位
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

// 通过 hash 找数组索引（等价于 hash % n，但 n 是 2 的幂时位运算更快）
int i = hash & (table.length - 1);
```

- 为什么扰动：索引只用低几位（容量小时 `(n-1)` 高位全 0），直接用 hashCode 会丢掉高位信息；把高位异或进低位后，冲突分布更均匀。
- 为什么容量必须是 2 的幂：`hash & (n-1)` 只有在 n 为 2 的幂时才等价于取模且结果落在数组范围内；扩容 ×2 后，节点新索引只有"原位置"或"原位置 + oldCap"两种（resize 一节）。
- key 为 null 时 hash 固定为 0，永远放在 `table[0]` 的链表上。

### put 的实现

思路：

1. 对 key 的 hashCode() 做 hash（扰动），再计算 index；
2. 桶为空直接放入；
3. 碰撞则以链表形式挂在桶后（尾插法）；
4. 链表过长（≥ TREEIFY_THRESHOLD）则转红黑树；
5. 节点已存在则替换旧 value（保证 key 唯一）；
6. `size > threshold` 则 resize。

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
               boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    // table 为空（首次 put），先以默认容量扩容初始化
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    // 计算 index，桶为空直接插入
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    else {
        Node<K,V> e; K k;
        // 桶首节点就是要找的 key（先比 hash 再 equals），直接覆盖
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;
        // 桶首是树节点，按红黑树方式插入
        else if (p instanceof TreeNode)
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        // 链表：尾插（JDK 8），遍历找同 key 或追加到尾部
        else {
            for (int binCount = 0; ; ++binCount) {
                if ((e = p.next) == null) {
                    p.next = newNode(hash, key, value, null);
                    // 链表长度达到 8，尝试树化（表容量 < 64 时优先扩容）
                    if (binCount >= TREEIFY_THRESHOLD - 1)
                        treeifyBin(tab, hash);
                    break;
                }
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    break;
                p = e;
            }
        }
        // 找到了已存在的 key：替换 value 并返回旧值
        if (e != null) {
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null)
                e.value = value;
            afterNodeAccess(e);   // LinkedHashMap 的钩子
            return oldValue;
        }
    }
    ++modCount;
    // 超过 loadFactor * currentCapacity 就扩容
    if (++size > threshold)
        resize();
    afterNodeInsertion(evict);
    return null;
}
```

### get 的实现

1. 桶首节点直接命中；
2. 有冲突时用 `key.equals(k)` 查找：树中 O(log n)，链表 O(n)。

```java
public V get(Object key) {
    Node<K,V> e;
    return (e = getNode(hash(key), key)) == null ? null : e.value;
}

final Node<K,V> getNode(int hash, Object key) {
    Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (first = tab[(n - 1) & hash]) != null) {
        // 桶首节点命中（先比 hash 再 equals）
        if (first.hash == hash &&
            ((k = first.key) == key || (key != null && key.equals(k))))
            return first;
        if ((e = first.next) != null) {
            if (first instanceof TreeNode)
                return ((TreeNode<K,V>)first).getTreeNode(hash, key);
            // 链表遍历
            do {
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    return e;
            } while ((e = e.next) != null);
        }
    }
    return null;
}
```

先比 `hash` 再 `equals` 的原因：hash 相等是 equals 相等的必要条件，hash 不等可直接跳过，省掉昂贵的 equals。

### resize 的实现

扩容触发于 `size > threshold`。简单说就是把桶数组扩大为 2 倍，再把节点迁移到新桶。**迁移不需要重新计算索引**：容量翻倍后，每个节点的新索引只有两种可能——`原索引` 或 `原索引 + oldCap`，取决于 `hash & oldCap` 是否为 0：

```java
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;
    if (oldCap > 0) {
        // 已到最大容量，不再扩容，只放大阈值
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        // 容量、阈值都翻倍
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                 oldCap >= DEFAULT_INITIAL_CAPACITY)
            newThr = oldThr << 1;
    }
    else if (oldThr > 0) // 用构造器传入的初始容量初始化（threshold 暂存着它）
        newCap = oldThr;
    else {               // 无参构造：默认 16 / 12
        newCap = DEFAULT_INITIAL_CAPACITY;
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
    }
    if (newThr == 0) {
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                  (int)ft : Integer.MAX_VALUE);
    }
    threshold = newThr;
    @SuppressWarnings({"rawtypes","unchecked"})
    Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    table = newTab;
    // 迁移旧表
    if (oldTab != null) {
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                // 桶里只有一个节点：直接按新索引放
                if (e.next == null)
                    newTab[e.hash & (newCap - 1)] = e;
                else if (e instanceof TreeNode)
                    // 树节点：split 拆成两棵子树，过小则退化回链表
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                else { // preserve order：拆成 lo/hi 两条链表
                    Node<K,V> loHead = null, loTail = null;
                    Node<K,V> hiHead = null, hiTail = null;
                    Node<K,V> next;
                    do {
                        next = e.next;
                        // hash & oldCap == 0 → 新索引 = 原索引
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null) loHead = e;
                            else loTail.next = e;
                            loTail = e;
                        }
                        // 否则 → 新索引 = 原索引 + oldCap
                        else {
                            if (hiTail == null) hiHead = e;
                            else hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

`hash & oldCap` 判断的原理：容量从 2^n 变成 2^(n+1) 后，索引多参与了一位（第 n 位）。该位为 0 的节点新索引不变；为 1 的恰好等于"原索引 + oldCap"。这就是"容量取 2 的幂"在扩容上的收益——**无需重算 hash，节点要么留原地要么整体平移 oldCap**。lo/hi 两条链尾插法保持相对顺序（JDK 8），修复了 JDK 7 头插法在并发扩容时链表成环的问题（但 HashMap 依然不是线程安全的）。

### size 的实现

size 不是实时遍历计算的，而是 put 新增时递增、remove 时递减——空间换时间。

### JDK 7 与 JDK 8 的主要差异

| 差异点 | JDK 7 | JDK 8 |
| --- | --- | --- |
| 数据结构 | 数组 + 链表 | 数组 + 链表 + 红黑树（链表 ≥8 且容量 ≥64 树化，≤6 退化） |
| 插入方式 | 头插法 | 尾插法（并发扩容不再成环） |
| 节点类型 | Entry | Node（树节点 TreeNode） |
| 扩容迁移 | 重新计算索引（头插倒序） | hash & oldCap 分 lo/hi 链，保持顺序 |
| 初始化 | 构造时估算，inflate 时建表 | 懒加载：首次 put 时 resize 初始化 |

### 常见面试问答

**1. 构造函数中 initialCapacity 与 loadFactor 两个参数怎么理解？**

容量是哈希表中桶的数量；负载因子是哈希表在自动扩容之前允许达到的"满"程度。负载因子越大，空间利用越高但冲突越多（查询变慢）；越小则相反。对迭代性能要求高时，不要把 capacity 设置过大、也不要把 load factor 设置过小。当元素个数超过 `capacity × load factor` 时，容量翻倍。

**2. 为什么容量必须是 2 的整数次幂？**

服务于索引计算 `index = hash & (n-1)`（等价取模但更快），同时保证结果落在数组范围内；扩容时节点的新索引只有"原位"或"原位 + oldCap"两种可能（见 resize 一节）。`tableSizeFor()` 会把传入的初始容量向上取整为 2 的幂。

**3. HashMap 的 key 能用自定义对象吗？**

能，但**必须是不可变的**（或至少保证参与 hash 的字段不变），并且必须正确覆写 `equals()` 和 `hashCode()`——否则用的是 Object 的默认实现（引用比较），相等的两个对象会被当成不同的 key。String、Integer 这类不可变类是首选：天生线程安全、hashCode 可缓存、已规范实现 equals/hashCode。

**4. key 为 null 时怎么查找？**

hash(null) 固定为 0，key 为 null 的键值对永远放在 `table[0]` 的链表上（JDK 8 由 putVal 的 null 分支处理；JDK 7 有专门的 putForNullKey）。

**5. HashMap 与 HashTable 的区别？**

- 线程安全：HashMap 非线程安全（性能高）；HashTable 方法全 synchronized（并发差，已过时）；
- null：HashMap 允许一个 null key 和任意 null value；HashTable 都不允许；
- API：HashMap 用 containsKey/containsValue 取代了 HashTable 的 contains；
- 初始容量与扩容：HashMap 默认 16、扩容 ×2、容量恒为 2 的幂；HashTable 默认 11、扩容 ×2+1（素数思路）；
- 替代品：并发场景用 ConcurrentHashMap（分段锁/CAS），而不是 HashTable。

**6. HashMap 为什么线程不安全？会有什么问题？**

并发 put 可能丢失更新（两个线程同时扩容/写入覆盖）；JDK 7 头插法并发扩容会导致链表成环、后续 get 死循环；迭代期间结构性修改抛 ConcurrentModificationException（fail-fast 是"尽力而为的检测"不是保证）。

### 参考

- [Java-HashMap工作原理及实现](https://yikun.github.io/2015/04/01/Java-HashMap%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86%E5%8F%8A%E5%AE%9E%E7%8E%B0/)
- [HashMap源码设计](https://juejin.cn/post/6909480871917518856)
- [漫画：什么是HashMap？](https://juejin.cn/post/6844903518264885256)
