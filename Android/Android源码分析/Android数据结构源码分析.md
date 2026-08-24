## 1. SparseArray

SparseArray 是 Android 针对「int → object」映射的内存优化实现:**用两个平行数组(mKeys/mValues)替代 HashMap 的 Entry 数组,避免了 int 自动装箱成 Integer 的开销**。key 数组始终保持有序,查找依赖二分查找。

> 下文摘录的是 **SparseArrayCompat** 的代码——它与 SparseArray 算法完全一致,只是不依赖框架内部类、可用在非 Android 环境(如单元测试);分析结论对两者同样成立。

```java
public class SparseArrayCompat<E> implements Cloneable {
    private static final Object DELETED = new Object();
    private boolean mGarbage = false;

    private int[] mKeys;
    private Object[] mValues;
    private int mSize;


    public SparseArrayCompat() {
            this(10);
        }

   public SparseArrayCompat(int initialCapacity) {
        if (initialCapacity == 0) {
            mKeys =  ContainerHelpers.EMPTY_INTS;
            mValues =  ContainerHelpers.EMPTY_OBJECTS;
        } else {
            initialCapacity =  ContainerHelpers.idealIntArraySize(initialCapacity);
            mKeys = new int[initialCapacity];
            mValues = new Object[initialCapacity];
        }
        mSize = 0;
    }

}
```

### put:二分查找定位

```java
 public void put(int key, E value) {
        int i =  ContainerHelpers.binarySearch(mKeys, mSize, key);

        if (i >= 0) {
            // key 已存在,直接覆盖
            mValues[i] = value;
        } else {
            // 二分查找未命中返回的是 插入点取反(~i),再取反即插入位置
            i = ~i;

            // 插入位置恰好是个已删除(DELETED)的槽位,直接复用,避免移动数组
            if (i < mSize && mValues[i] == DELETED) {
                mKeys[i] = key;
                mValues[i] = value;
                return;
            }

            if (mGarbage && mSize >= mKeys.length) {
                gc();

                // Search again because indices may have changed.
                i = ~ ContainerHelpers.binarySearch(mKeys, mSize, key);
            }

            if (mSize >= mKeys.length) {
                int n =  ContainerHelpers.idealIntArraySize(mSize + 1);

                int[] nkeys = new int[n];
                Object[] nvalues = new Object[n];

                // Log.e("SparseArray", "grow " + mKeys.length + " to " + n);
                System.arraycopy(mKeys, 0, nkeys, 0, mKeys.length);
                System.arraycopy(mValues, 0, nvalues, 0, mValues.length);

                mKeys = nkeys;
                mValues = nvalues;
            }

            // 插入点之后的所有元素整体后移一位,保持 key 有序
            if (mSize - i != 0) {
                // Log.e("SparseArray", "move " + (mSize - i));
                System.arraycopy(mKeys, i, mKeys, i + 1, mSize - i);
                System.arraycopy(mValues, i, mValues, i + 1, mSize - i);
            }

            mKeys[i] = key;
            mValues[i] = value;
            mSize++;
        }
    }
```

几个关键设计:

- **延迟删除**:remove 时只把 mValues[i] 置为 DELETED 标记并置 mGarbage=true,不立即压缩数组;等到 put 需要扩容时才执行 gc() 把空洞紧缩,摊销删除成本
- **capacity 取整**:idealIntArraySize 把容量规整为 2 的幂减 12,与 VM 的内存分配对齐

```java
class ContainerHelpers {
     static final int[] EMPTY_INTS = new int[0];
     static final Object[] EMPTY_OBJECTS = new Object[0];

    public static int idealIntArraySize(int need) {
        return idealByteArraySize(need * 4) / 4;
    }

    public static int idealByteArraySize(int need) {
        for (int i = 4; i < 32; i++)
            if (need <= (1 << i) - 12)
                return (1 << i) - 12;

        return need;
    }

}
```

### 与 HashMap 的取舍

| | SparseArray | HashMap |
| --- | --- | --- |
| key 类型 | int(免装箱) | Integer 等对象(key 自动装箱) |
| 查找 | 二分查找 O(log n) | 哈希 O(1) |
| 内存占用 | 小(两个平行数组) | 大(Entry、哈希表) |
| 适用场景 | Android 内存敏感、数据量不大(几百~几千) | 大数据量、需要 O(1) |

数据量大时二分查找+插入移动数组的成本会超过哈希,所以 SparseArray 适合小规模映射。

## 2. ArrayList

```java
public class ArrayList<E> extends AbstractList<E> implements List<E>{
      private static final int DEFAULT_CAPACITY = 10;
      private static final Object[] EMPTY_ELEMENTDATA = {};
      private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
      transient Object[] elementData;

      private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

      public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            throw new IllegalArgumentException("Illegal Capacity: "+ initialCapacity);
        }
    }

     public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }

}
```

### add 与扩容

```java
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    elementData[size++] = e;
    return true;
}


private void ensureCapacityInternal(int minCapacity) {
    // 无参构造首次 add 时,取默认容量 10 与所需容量的较大值
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    ensureExplicitCapacity(minCapacity);
}

private void ensureExplicitCapacity(int minCapacity) {
    modCount++;//见AbstractList
    // overflow-conscious code
    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}

private void grow(int minCapacity) {
    // overflow-conscious code
    int oldCapacity = elementData.length;
    // 新容量 = 旧容量 * 1.5(右移一位)
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    // minCapacity is usually close to size, so this is a win:
    elementData = Arrays.copyOf(elementData, newCapacity);
}

private static int hugeCapacity(int minCapacity) {
    if (minCapacity < 0) // overflow
        throw new OutOfMemoryError();
    return (minCapacity > MAX_ARRAY_SIZE) ? Integer.MAX_VALUE : MAX_ARRAY_SIZE;
}
```

扩容策略:**每次扩为原容量的 1.5 倍**(oldCapacity + oldCapacity >> 1),越过 MAX_ARRAY_SIZE(Integer.MAX_VALUE - 8)时上限 Integer.MAX_VALUE。无参构造的 ArrayList 首次 add 才分配容量 10(懒分配)。

### AbstractList:modCount

```java
public abstract class AbstractList<E> extends AbstractCollection<E> implements List<E> {
    protected transient int modCount = 0;
}
```

modCount 记录结构性修改次数,迭代器遍历时校验它,被并发修改即抛 ConcurrentModificationException——即 fail-fast 机制。
