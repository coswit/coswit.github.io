# Structural Patterns（结构型模式）

> Intent 中文以中译本《设计模式：可复用面向对象软件的基础（典藏版）》（机械工业出版社）译法为准。

结构型模式关注**如何组合类与对象**以获得更大的结构：一类用继承来组合接口或实现（class pattern，如 Adapter 的类适配器），另一类用对象组合来组合出新的功能（object pattern）。

7 个结构型模式：Adapter、Bridge、Composite、Decorator、Facade、Flyweight、Proxy。

> 类图为 mermaid。Sample Code 依据原书代码示例摘编：保留主干与推进顺序，代码与解说交替；原书为 C++/Smalltalk，一般以 Java 摘编呈现，Java 无法忠实表达的场合（如 Adapter 的多重继承）保留原书 C++ 代码。更多 Java 示例见上级目录《设计模式之二：Structural Pattern》。

## Adapter（别名 Wrapper）

> 将一个类的接口转换成客户希望的另外一个接口。Adapter 模式使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。
>
> Convert the interface of a class into another interface clients expect.

### Motivation

图形编辑器统一用 `Shape` 接口操纵所有图元（`boundingBox`、`createManipulator`……）。现在编辑器要支持文本，而显示与编辑文本的能力早已存在于界面工具包的 `TextView` 中——直接复用它最理想。问题在于 TextView 的接口与 Shape 不兼容：它不是图元，不按 Shape 的协议响应请求。

那就改 TextView 让它实现 Shape？不可行也不合适：TextView 属于工具包，我们控制不了（甚至拿不到源码），也不该为了某个编辑器的特殊需要去改动一个通用组件。Adapter 模式的做法是引入第三者 `TextShape`：它实现 Shape 接口，把收到的 Shape 请求**转换**成 TextView 能理解的操作，由 TextView 完成实际工作。编辑器从此把文本当普通 Shape 对待，TextView 一行不改。

TextShape 实现这种转换有两条路，对应 Adapter 的两种形态：

* **class adapter**：多重继承——同时继承 Adaptee（TextView）获得现成实现、继承 Target（Shape）接口获得编辑器所需的多态类型。C++ 用多重继承直接表达；Java 没有类的多重继承，但"继承 Adaptee + 实现 Target 接口"组合起来表达的是同一个结构
* **object adapter**：组合——只实现 Target 接口，内部持有一个 Adaptee 引用，把请求转发给它。因为引用声明为 Adaptee 类型而非某个具体子类，一个适配器实例就能配合 Adaptee 及其所有子类工作

适配不是简单转发，常常要做接口之间的**换算**——例如 `Shape#boundingBox` 需要 `bottomLeft`、`topRight` 两个点，而 TextView 提供的是 `origin()`（原点）与 `extent()`（宽高），适配器要把后者换算成前者（见 Sample Code）。

### Applicability

* 想使用一个现有的类，但它的接口不符合你的需要
* 想创建一个可复用的类，能与无关的、事先无法预见的类（即接口不一定兼容的类）协作
* 想同时使用某个已有类层次中的**多个子类**——用 class adapter 就得为每个子类派生一个适配器子类，不现实；object adapter 持有 Adaptee（父类）引用，一个适配器就能适配全部子类
* 大量使用第三方库的应用，会用 adapter 作为应用与第三方库之间的中间层来解耦。这样换库时只需为新库写一个 adapter，无需改动应用代码

### Structure（object adapter）

```mermaid
classDiagram
    class Client
    class Target {
        <<interface>>
        +request()
    }
    class Adapter {
        -adaptee Adaptee
        +request()
    }
    class Adaptee {
        +specificRequest()
    }
    Client --> Target : 依赖目标接口
    Target <|.. Adapter
    Adapter --> Adaptee : 翻译并转发
```

class adapter 的结构（Java 中以"继承 Adaptee + 实现 Target 接口"表达多重继承）：

```mermaid
classDiagram
    class Target {
        <<interface>>
        +request()
    }
    class Adaptee {
        +specificRequest()
    }
    class Adapter {
        +request()
    }
    Target <|.. Adapter
    Adaptee <|-- Adapter : 继承获得实现
    note for Adapter "request 内部直接调用继承来的 specificRequest"
```

### Participants

* **Target**：Client 使用的领域相关接口
* **Client**：与符合 Target 接口的对象协作
* **Adaptee**：被适配的已有接口（需要被转换的类）
* **Adapter**：把 Adaptee 的接口适配成 Target 接口

### Collaborations

Client 在 Adapter 实例上调用 Target 操作；Adapter 把该请求转换为对 Adaptee 相应操作的调用，由 Adaptee 完成实际工作。

### Consequences

class adapter：

* 绑定到具体 Adaptee 类，无法适配 Adaptee 的子类
* Adapter 可以覆盖 Adaptee 的行为
* 只引入一个对象，无额外间接

object adapter：

* 一个 Adapter 可以适配多个 Adaptee（Adaptee 本体及其子类），还可以一次性为它们添加功能
* 更难覆盖 Adaptee 的行为（需要派生 Adaptee 再让 Adapter 引用派生类）

> Adapter 只转换接口而不增加功能，化解的是「Adaptee 不该改、Client 依赖的 Target 接口又是既定」的两难。

### Implementation（书中亮点：Pluggable Adapter）

* **Pluggable Adapter（可插拔适配器）**：让 Adapter 不写死对 Adaptee 的调用。三种手段——
  1. 用**抽象操作**：Adapter 声明抽象方法，由子类提供与 Adaptee 的实际绑定
  2. 用**委托对象**：Adapter 把"取数据/发请求"委托给内部的 delegate，换 delegate 即换被适配者
  3. **参数化的适配**：调用方传入"该调用 Adaptee 的什么操作"的信息
* **Two-way adapter（双向适配器）**：同时实现 Target 与 Adaptee 两个接口，可站在任一侧使用——依赖多重继承（class adapter）

### Sample Code（Shape 与 TextView，原书 C++ 摘编）

先看 Target 与 Adaptee——编辑器统一操纵 Shape，而文本显示能力已在工具包的 TextView 里：

```cpp
class Shape {                                      // Target：编辑器的统一图元接口
public:
    virtual void BoundingBox(Point& bottomLeft, Point& topRight) const;
    virtual bool IsEmpty() const;
    virtual Manipulator* CreateManipulator() const;
};

class TextView {                                   // Adaptee：工具包已有类
public:
    TextView();                                    // 创建并不便宜：建缓冲、查字形表……
    void GetOrigin(Coord& x, Coord& y) const;
    void GetExtent(Coord& width, Coord& height) const;
    virtual bool IsEmpty() const;
};
```

对象适配器：TextShape 实现 Shape、持有 TextView。构造函数只做一件事——保存 Adaptee 指针，适配器从不重新实现 TextView 的功能：

```cpp
class TextShape : public Shape {
public:
    TextShape(TextView*);
    virtual void BoundingBox(Point& bottomLeft, Point& topRight) const;
    virtual bool IsEmpty() const;
    virtual Manipulator* CreateManipulator() const;
private:
    TextView* _text;
};

TextShape::TextShape(TextView* t) { _text = t; }
```

BoundingBox 完成接口之间的换算——Shape 要两点坐标，TextView 给的是原点加宽高：

```cpp
void TextShape::BoundingBox(Point& bottomLeft, Point& topRight) const {
    Coord bottom, left, width, height;
    _text->GetOrigin(left, bottom);
    _text->GetExtent(width, height);
    bottomLeft = Point(left, bottom);
    topRight = Point(left + width, bottom + height);   // 换算：适配 ≠ 转发
}

bool TextShape::IsEmpty() const {                    // 语义一致的操作：纯转发
    return _text->IsEmpty();
}

Manipulator* TextShape::CreateManipulator() const {  // Target 有而 Adaptee 没有：
    return new TextManipulator(this);                // 适配器自己补上
}
```

类适配器改为多重继承——同时继承 TextView（拿实现）与 Shape（拿接口），这正是 Java 表达不了的形态：

```cpp
class TextShape : public TextView, public Shape {
public:
    TextShape(TextView*);
    virtual void BoundingBox(Point& bottomLeft, Point& topRight) const;
    virtual bool IsEmpty() const;
    virtual Manipulator* CreateManipulator() const;
};

void TextShape::BoundingBox(Point& bottomLeft, Point& topRight) const {
    Coord bottom, left, width, height;
    GetOrigin(left, bottom);                        // 继承来的 TextView 操作，直接调用
    GetExtent(width, height);
    bottomLeft = Point(left, bottom);
    topRight = Point(left + width, bottom + height);
}

bool TextShape::IsEmpty() const {
    return TextView::IsEmpty();                     // 两个基类都声明了 IsEmpty，
}                                                   // 用域运算符消歧并复用 Adaptee 的实现
```

聪明的适配器。GetOrigin/GetExtent 这类查询最终要落到窗口系统，代价不小；聪明的 TextShape 可以缓存换算结果、只在文本变化后才重算：

```cpp
void TextShape::BoundingBox(Point& bottomLeft, Point& topRight) const {
    if (!_cacheValid) {
        // 重新执行上面的换算，把结果存进 _bottomLeft/_topRight；
        // 何时失效需要 TextView 额外告知——这正是代价所在
        _cacheValid = true;
    }
    bottomLeft = _bottomLeft;
    topRight = _topRight;
}
```

但这笔交易有代价：想知道缓存何时失效，适配器必须从 Adaptee 获取**额外信息**（文本是否变化过），因此更了解 Adaptee 的内部状态，耦合变紧。机械的适配简单且通用（换一个 TextView 子类照样工作），聪明的适配省运行时开销但与具体 Adaptee 绑定得更死——把适配做到什么粒度，是设计 Adapter 时真正要回答的问题。

最后看客户侧：编辑器始终面向 Shape 编程，用哪种适配器它都无感知。

```cpp
Shape* textShape = new TextShape(new TextView);
textShape->BoundingBox(bottomLeft, topRight);
```

### 现代对应

`java.util.Arrays#asList()`、`java.io.InputStreamReader/OutputStreamWriter`（字节流接口 ↔ 字符流接口）。

### Related Patterns

与 **Bridge** 结构相似但意图不同：Bridge 事先把抽象与实现分离以便独立变化，Adapter 事后让不相关的东西协同；与 **Decorator** 比，Decorator 不改接口只加职责，Adapter 改接口；与 **Proxy** 比，Proxy 保持接口不变、代表真实对象。

## Bridge（别名 Handle/Body）

> 将抽象部分与它的实现部分分离，使它们可以独立地变化。
>
> Decouple an abstraction from its implementation so that the two can vary independently.

### Motivation

Window 抽象要在 X Window System 与 Presentation Manager 两个平台上实现，又有 IconWindow、TransientWindow 等扩展。用继承会得到 2×N 的类组合（类爆炸）。解法：把"平台实现"维度抽出来——`Window`（Abstraction，含扩展子类）只持有 `WindowImp`（Implementor）接口，XWindowImp/PMWindowImp 各自实现；两个层次独立扩展，运行期还能换实现。

### Applicability

* 不希望在抽象与其实现之间有永久的静态绑定（如运行期选择实现）
* 抽象与实现都应可通过子类化扩展，且二者可独立变化
* 实现的改变不应对客户产生影响（实现细节对客户透明）
* 想在多个对象间共享一个实现
* 需要在两个独立维度上扩展类层次（避免 n×m 类爆炸）

### Structure

```mermaid
classDiagram
    class Abstraction {
        <<abstract>>
        -imp Implementor
        +operation()
    }
    class RefinedAbstraction {
        +operation()
    }
    class Implementor {
        <<interface>>
        +operationImpl()
    }
    class ConcreteImplementorA {
        +operationImpl()
    }
    class ConcreteImplementorB {
        +operationImpl()
    }
    Abstraction <|-- RefinedAbstraction
    Abstraction o--> Implementor : 组合而非继承
    Implementor <|.. ConcreteImplementorA
    Implementor <|.. ConcreteImplementorB
```

### Participants

* **Abstraction**：定义抽象类接口，维护对 Implementor 的引用
* **RefinedAbstraction**：扩展 Abstraction
* **Implementor**：定义实现类接口（不必与 Abstraction 接口一致，通常只提供原语操作）
* **ConcreteImplementor**：实现 Implementor 接口，定义具体实现

### Collaborations

Abstraction 把客户请求转发给 Implementor 对象完成；Abstraction 高层策略，Implementor 底层细节。

### Consequences

* **接口与实现分离**：实现不绑定在接口上，可实现"运行期切换实现"，对客户隐藏实现细节（平台 API 等）
* **提高可扩展性**：两个层次独立扩展，新增 RefinedAbstraction 或 ConcreteImplementor 互不影响
* **实现细节对客户透明**（hiding implementation），实现可在多个对象间共享

### Implementation

* **只有一个 Implementor 时**值不值得做 Bridge？值得——分离本身就是解耦，日后加实现无需改动抽象侧
* **创建正确的 Implementor**：Abstraction 构造时选择并装配 Implementor；若 Abstraction 不知道具体实现，可用 Abstract Factory 创建
* **共享 Implementor**：多个 Abstraction 实例可引用同一 Implementor（引用计数管理生命期）
* C++ 中可用 **private 继承**复用 Implementor 的机制而不暴露其接口

### Sample Code（Window 与 WindowImp，Java 摘编）

实现维度先行：WindowImp 只声明平台相关的原语操作，X 与 PM 各给一份实现——每份实现内部转调各自平台库（Xlib 的 `XDrawString`、Presentation Manager 的 `GpiText`）：

```java
interface WindowImp {
    void deviceText(String text, int x, int y);
    void deviceRect(int x1, int y1, int x2, int y2);
}

class XWindowImp implements WindowImp {            // ConcreteImplementor A
    public void deviceText(String text, int x, int y) {
        System.out.println("XWindow 绘制文本: " + text);        // 实际转调 Xlib
    }
    public void deviceRect(int x1, int y1, int x2, int y2) { }
}
class PMWindowImp implements WindowImp {           // ConcreteImplementor B
    public void deviceText(String text, int x, int y) {
        System.out.println("PM 窗口绘制文本: " + text);          // 实际转调 Presentation Manager
    }
    public void deviceRect(int x1, int y1, int x2, int y2) { }
}
```

抽象维度：Window 只持有 WindowImp 引用，高层操作转手交给它。imp 的装配由窗口系统在初始化时完成（原书由 toolkit 层的工厂决定，这里示意）：

```java
class Window {
    protected WindowImp imp;                       // 组合而非继承：实现维度整体可换

    protected Window() {
        this.imp = WindowSystemFactory.current().createWindowImp();
    }

    void drawText(String text, int x, int y) {     // 高层语义
        imp.deviceText(text, x, y);                // 转发给实现维度的原语
    }

    void drawRect(Point p1, Point p2) {
        WindowImp wi = imp;
        wi.deviceRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y),
                      Math.max(p1.x, p2.x), Math.max(p1.y, p2.y));  // 角点次序归一后转发
    }
}
```

窗口语义的扩展落在 Window 子类——IconWindow 画图标边框，全程只用抽象侧的操作，不含一行平台代码：

```java
class IconWindow extends Window {
    private final String iconName = "close-icon";

    void drawContents() {
        drawText(iconName, 0, 0);                  // 复用抽象侧的高层操作
        drawRect(new Point(0, 0), new Point(16, 16));  // 边框：同样只走抽象侧
    }
}
```

两个维度从此独立扩展：新增平台 = 新增一个 WindowImp；新增窗口种类 = 新增一个 Window 子类。2 个平台 × 3 种窗口只需要 2 + 3 个类，而不是 2 × 3 = 6 个。

### 现代对应

JDBC：`Connection/Statement`（抽象侧）与各数据库 Driver（实现侧）分离，新增数据库实现不影响抽象侧 API。

### Related Patterns

**Abstract Factory** 可用来创建并配置一对 Bridge 的两侧；与 **Adapter** 的区别——Adapter 事后让无关类协同，Bridge 事先分离抽象与实现。

## Composite

> 将对象组合成树形结构以表示「部分—整体」的层次结构。Composite 使客户对单个对象和复合对象的使用具有一致性。
>
> Compose objects into tree structures to represent part-whole hierarchies.

### Motivation

图形编辑器里图元（直线、多边形、文本）与图组（Picture，本身可再嵌套图组）应有一致的操作（draw、resize、reorder）。解法：定义 `Graphic` 抽象，`Picture` 实现 Graphic 并**持有 Graphic 子节点列表**，把请求转发（forward）给所有孩子——递归组合出任意深度。

### Applicability

* 想表示对象的「部分—整体」层次结构
* 希望客户忽略组合对象与单个对象的差别，统一使用层次中的所有对象

### Structure

```mermaid
classDiagram
    class Component {
        <<abstract>>
        +operation()
        +add(Component)
        +remove(Component)
        +getChild(int) Component
    }
    class Leaf {
        +operation()
    }
    class Composite {
        -children List~Component~
        +operation()
        +add(Component)
        +remove(Component)
        +getChild(int) Component
    }
    class Client
    Component <|-- Leaf
    Component <|-- Composite
    Composite o-- Component : 递归持有子节点
    Client --> Component : 统一对待叶与容器
```

### Participants

* **Component**：为 Leaf 与 Composite 声明公共接口；可为管理子节点等操作声明默认行为
* **Leaf**：叶子对象，无孩子
* **Composite**：容器，存储子 Component，实现与孩子相关的操作
* **Client**：通过 Component 接口统一操作

### Collaborations

客户请求到达 Composite 时，Composite 把请求转发给它的子节点并可能附加前后处理；递归到 Leaf 为止。

### Consequences

* **定义了包含基本对象与组合对象的类层次**：基本对象可以组合成复合对象，复合对象又可以再组合——递归嵌套
* **简化客户代码**：客户统一面向 Component，无需区分叶与容器
* **易于增加新组件类型**：新 Leaf/Composite 无需改动现有代码
* **使设计过于一般化**：很难"限制"组合的成分类型（无法在编译期保证某容器只含某类叶子），需要运行期检查

### Implementation（关键权衡：透明性 vs 安全性）

* **在哪声明孩子管理操作（add/remove/getChild）**——本模式最经典的权衡：
  * 放在 **Component**：对客户**透明**（统一接口），但对 Leaf 来说不安全（空实现或抛异常）
  * 只放在 **Composite**：**安全**（类型保证），但客户必须区分对待、丧失透明性
  * 书中倾向透明性（牺牲安全），这是设计权衡而非定论
* **显式父指针**：子节点持父引用便于 `Parent()` 上溯；变更时须维护一致性
* **共享组件**：孩子常被多方共享，配合 **Flyweight**；父指针与共享冲突（谁的父亲？）
* **最大化 Component 接口 vs 单一职责**：接口塞入过多子类操作会污染叶子；可用"缺省失败（报错）"的折中
* **孩子顺序**：需要有序遍历时让孩子列表维护顺序；可配合 Iterator 遍历
* **谁删除孩子**：通常 Composite 删除孩子时递归析构未共享的子树（语言 GC 则无此忧）

### Sample Code（Equipment，Java 摘编）

原书用一套"设备"层次示范：软驱、总线是叶（Leaf），机箱（Chassis）是容器（Composite），容器可以再套容器。先看公共基类——为所有图元声明统一接口，孩子管理操作也放在这里（透明性优先的折中，叶子调用会失败或空操作）：

```java
abstract class Equipment {
    private final String name;
    private final List<Equipment> parts = new ArrayList<>();

    protected Equipment(String name) { this.name = name; }
    String name() { return name; }

    long power() { return 0; }                     // Watt（瓦），原书自定义类型，此处以 long 代
    long netPrice() { return 0; }                  // Currency（货币），同上
    long discountPrice() { return 0; }

    void add(Equipment e) { parts.add(e); }
    void remove(Equipment e) { parts.remove(e); }
    Iterator<Equipment> iterator() { return parts.iterator(); }   // 原书为 CreateIterator
}
```

叶子和容器的差别只在这些操作的**实现**上。软驱只报自己的价：

```java
class FloppyDisk extends Equipment {
    FloppyDisk() { super("Floppy Disk"); }
    long power() { return 30; }                    // 30 瓦
    long netPrice() { return 70; }
    long discountPrice() { return 35; }            // 折后半价
}
class Bus extends Equipment {
    Bus() { super("Bus"); }
    long power() { return 20; }
    long netPrice() { return 10; }
}
```

容器的实现则是遍历孩子、逐个累加——请求沿树递归下传：

```java
class Chassis extends Equipment {                  // 容器可以嵌套容器
    Chassis() { super("Chassis"); }

    long power() {
        long total = 0;
        for (Iterator<Equipment> it = iterator(); it.hasNext(); ) {
            total += it.next().power();            // 转发给孩子，递归到叶为止
        }
        return total;
    }
    long netPrice() {                              // netPrice / discountPrice 同法累加
        long total = 0;
        for (Iterator<Equipment> it = iterator(); it.hasNext(); ) {
            total += it.next().netPrice();
        }
        return total;
    }
    long discountPrice() { /* 同法，略 */ return 0; }
}
```

客户对叶与容器一视同仁——定价时不需要知道里面装了什么、套了几层：

```java
Chassis pc = new Chassis();
pc.add(new FloppyDisk());
pc.add(new Bus());
Chassis inner = new Chassis();                     // 容器套容器
inner.add(new Bus());
pc.add(inner);

pc.netPrice();                                     // 70 + 10 + 10，客户端只见 Equipment
pc.power();                                        // 30 + 20 + 20
```

### 现代对应

`java.awt.Container/Component`、Swing `JComponent` 树、DOM/XML 节点树、文件系统目录树。

### Related Patterns

**Decorator** 常与 Composite 一起用（同为递归组合，但 Decorator 只包一个孩子且加职责）；叶节点可用 **Flyweight** 共享；遍历用 **Iterator**；对整棵树分发操作用 **Visitor**；父—子通知可用 **Observer**；父链请求转发即 **Chain of Responsibility**。

## Decorator（别名 Wrapper）

> 动态地给一个对象添加一些额外的职责。就增加功能来说，Decorator 模式相比生成子类更为灵活。
>
> Attach additional responsibilities to an object dynamically.

### Motivation

文本视图有时要加边框、有时要加滚动条、有时两者都要。为每种组合派生子类（BorderTextView、ScrollTextView、BorderScrollTextView……）会组合爆炸。解法：`MonoGlyph`（Decorator）实现 Glyph 接口并**内嵌一个 Glyph**——BorderDecorator 在转发 `draw()` 前画边框，ScrollDecorator 在转发时处理滚动，层层包装按需组合。

### Applicability

* 动态、透明地给单个对象添加职责（不影响其他对象），且职责可以撤销
* 用子类扩展不可行：组合爆炸，或类定义被隐藏/不能用于继承

### Structure

```mermaid
classDiagram
    class Component {
        <<interface>>
        +operation()
    }
    class ConcreteComponent {
        +operation()
    }
    class Decorator {
        <<abstract>>
        -component Component
        +operation()
    }
    class ConcreteDecoratorA {
        +operation()
        -addedState
    }
    class ConcreteDecoratorB {
        +operation()
        +addedBehavior()
    }
    Component <|.. ConcreteComponent
    Component <|.. Decorator
    Decorator <|-- ConcreteDecoratorA
    Decorator <|-- ConcreteDecoratorB
    Decorator o-- Component : 被装饰者（可再是 Decorator）
```

### Participants

* **Component**：声明接口，Decorator 与被装饰者共同实现它
* **ConcreteComponent**：被装饰的原始对象
* **Decorator**：维持对 Component 的引用，并实现 Component 接口（默认转发）
* **ConcreteDecorator**：向组件添加职责

### Collaborations

Decorator 在转发请求给内嵌组件**前后**附加自己的行为；多重 Decorator 层层嵌套。

### Consequences

* **比静态继承灵活**：职责在运行期叠加/拆除，任意组合
* **避免在层次上层堆满功能的类**（pay-as-you-go，用多少功能付多少开销），不给不需要它的对象付代价
* 代价一：**Decorator ≠ 被装饰对象**（身份不同），依赖对象同一性（identity）的代码会失效
* 代价二：**大量小对象**：装饰链上的对象都很小、外观相似，排查与学习成本升高

### Implementation

* **接口一致性**：Decorator 必须完全实现 Component 接口，否则前功尽弃
* **保持 Component 类轻量**：不要把数据存进 Component（每个装饰层都要包一遍）；Component 只定义接口，数据放 ConcreteComponent
* 装饰策略只有一层（如仅"画边框"）时 Decorator 也可只提供简化形式的子类

### Sample Code（VisualComponent，Java 摘编）

先看被装饰的组件层次。VisualComponent 是组件的公共接口，TextView 是最朴素的实现：

```java
abstract class VisualComponent {
    void draw() { }
    void resize() { }
}

class TextView extends VisualComponent {            // ConcreteComponent：被装饰的原件
    void draw() { System.out.print("text"); }
}
```

装饰器基类 VisualDecorator（原书类名就叫 Decorator，此处改名以免与模式名混淆）是关键一笔：它与组件实现**同一接口**，并持有一个组件——除转发外什么都不做：

```java
abstract class VisualDecorator extends VisualComponent {
    private final VisualComponent component;        // 被装饰者（可再是一个装饰器）

    protected VisualDecorator(VisualComponent c) { this.component = c; }
    @Override void draw() { component.draw(); }     // 默认行为：原样转发
    @Override void resize() { component.resize(); }
}
```

具体装饰器在转发前后附加职责。BorderDecorator 画边框，ScrollDecorator 附加滚动条（并拥有自己的滚动状态）：

```java
class BorderDecorator extends VisualDecorator {
    private final int width;
    BorderDecorator(VisualComponent c, int width) { super(c); this.width = width; }
    @Override void draw() {
        super.draw();                               // 转发给内层组件
        drawBorder(width);                          // 附加职责：画宽度为 width 的边框
    }
    private void drawBorder(int w) { System.out.print("[边框" + w + "]"); }
}

class ScrollDecorator extends VisualDecorator {
    private final int scrollableWidth;              // 装饰器自己的状态
    ScrollDecorator(VisualComponent c, int w) { super(c); this.scrollableWidth = w; }
    @Override void draw() {
        super.draw();
        drawScrollBar();                            // 附加职责：滚动条
    }
    void scrollTo(int position) { /* 滚动逻辑，独立于被装饰组件 */ }
    private void drawScrollBar() { System.out.print("(滚动条)"); }
}
```

客户按需层层包装——要"带滚动条再加边框"的文本视图，不必派生 BorderScrollTextView，包两层即可；窗口始终只认 VisualComponent：

```java
Window window = new Window();                       // 界面容器，示意
VisualComponent content = new TextView();
content = new ScrollDecorator(content);             // 先包滚动
content = new BorderDecorator(content, 1);          // 再包边框——包装顺序即职责层次
window.setContents(content);
```

装饰器自己也是组件，所以可以继续被包装；职责在运行期叠加或拆除，这是静态继承给不了的灵活性。

### Known Uses / 现代对应

* 书中：InterViews、ET++ 和 ObjectWorks\Smalltalk 类库都用装饰为窗口组件添加图形装饰。较特殊的应用有 InterViews 的 `DebuggingGlyph`（向组件转发布局请求的前后打印调试信息，用于分析复杂组合中的布局行为）和 ParcPlace Smalltalk 的 `PassivityWrapper`（允许/禁止用户与组件交互）；ET++ 的 streaming 类用 Decorator 做 I/O 流的压缩（行程编码、Lempel-Ziv）与 7 位 ASCII 转换——说明装饰不限于图形界面
* Java：`java.io` 流族——`BufferedInputStream`/`DataInputStream`（Decorator）包装 `InputStream`（Component），是教科书级实现

### Related Patterns

**Adapter** 结构相似但意图不同：Decorator 不改接口只加职责，Adapter 改接口；Decorator 是退化的 **Composite**（只有单孩子）；**Proxy** 结构也相似，但 Proxy 控制访问而非加职责；与 **Strategy** 的分工——**Decorator 改"外壳"（skin，对象外观上的职责），Strategy 改"内脏"（guts，对象内部的算法）**。

## Facade

> 为子系统中的一组接口提供一个一致的界面，Facade 模式定义了一个高层接口，这个接口使得这一子系统更加容易使用。
>
> Provide a unified interface to a set of interfaces in a subsystem.

### Motivation

编译器子系统包含 Scanner、Parser、ProgramNode、CodeGenerator 等众多类，彼此协作方式复杂。绝大多数客户只需要"编译一个源文件"。解法：定义 **Compiler** 门面类，提供 `compile(source, target)` 一个高层方法，内部编排子系统各对象——客户不必与子系统内部类打交道。

### Applicability

* 要为一个复杂子系统提供简单接口
* 客户程序与抽象类的实现部分之间存在着依赖关系，引入 Facade 将子系统与客户及其他子系统分离，可提高独立性与可移植性
* 需要分层构建子系统——每层一个 Facade 作为入口

### Structure

```mermaid
classDiagram
    class Facade {
        +request()
    }
    class SubsystemA {
        +methodOne()
        +methodTwo()
    }
    class SubsystemB {
        +operation()
    }
    class SubsystemC {
        +step()
    }
    class Client
    Client --> Facade : 只面对门面
    Facade --> SubsystemA : 编排
    Facade --> SubsystemB
    Facade --> SubsystemC
    SubsystemA --> SubsystemB : 子系统内部协作（对客户隐藏）
```

### Participants

* **Facade**：知道哪些子系统类负责处理请求；把客户的请求代理给适当的子系统对象
* **Subsystem classes**：实现子系统功能，处理 Facade 指派的任务；不知道 Facade 的存在

### Consequences

* **屏蔽了子系统组件**，客户要打交道的对象变少、使用方式变简单
* **实现子系统与客户解耦**（weak coupling）：子系统内部变化不影响客户；便于把子系统当整体替换/移植
* 代价：**并不阻止**客户绕过 Facade 直接使用子系统具体类——想强制就得配合接口隔离/包私有

### Implementation

* **降低客户—子系统耦合**：Facade 的方法对客户"够用即可"，必要时用参数传递细节
* **抽象 Facade 类**：需要多种子系统实现时，可把 Facade 做成抽象类 + 每种子系统一个具体 Facade 子类（另一种做法是直接换不同的 Facade 对象/配置，组合优先）
* **子系统私有化**：语言允许时（package/C++ namespace），把子系统类对 Facade 之外的世界隐藏

### Sample Code（编译器子系统，Java 摘编）

子系统是一组相互协作的类——Scanner 逐 token 扫描、Parser 配合 ProgramNodeBuilder 构建语法树、ProgramNode 遍历树驱动 CodeGenerator 生成代码。任何一步都依赖前一步的产物，客户若直接驱动它们，必须熟知整套协作次序：

```java
class Scanner {
    Scanner(InputStream source) { }
    Token scan() { return null; }
}
class Parser {
    private final ProgramNodeBuilder builder;
    Parser(ProgramNodeBuilder builder) { this.builder = builder; }
    void parse(Scanner scanner) { /* 逐 token 构建语法树 */ }
}
class ProgramNodeBuilder {
    ProgramNode getProgramNode() { return new ProgramNode(); }
}
class ProgramNode {
    void traverse(CodeGenerator g) { /* 遍历语法树，驱动代码生成 */ }
}
abstract class CodeGenerator { abstract void generate(); }
class RISCCodeGenerator extends CodeGenerator {
    RISCCodeGenerator(BytecodeStream target) { }
    void generate() { }
}
class BytecodeStream { }
```

Facade 把这套编排收进一个高层方法。客户只调 `compile()`，Scanner/Parser/Builder/Generator 的协作次序全部被封在门面内：

```java
class Compiler {
    void compile(InputStream source, BytecodeStream target) {
        Scanner scanner = new Scanner(source);
        ProgramNodeBuilder builder = new ProgramNodeBuilder();
        Parser parser = new Parser(builder);

        parser.parse(scanner);                        // 协作 1：解析建树

        RISCCodeGenerator generator = new RISCCodeGenerator(target);
        builder.getProgramNode().traverse(generator); // 协作 2：遍历生成代码
    }
}

new Compiler().compile(new FileInputStream("a.c"), new BytecodeStream());
```

客户要打交道的对象从"六个类一套协作次序"变成"一个类一个方法"；子系统内部的重构（换 parser、换生成器）不再波及客户。

### 现代对应

Spring 的 `JdbcTemplate`（把 JDBC 的连接/语句/异常处理收进一个入口）、`java.net.URL`（简化 socket/DNS/协议栈细节）。

### Related Patterns

与 **Mediator** 的对比——Facade 是**单向**抽象（客户→子系统，子系统不知 Facade），Mediator 是**多向**协调（同事对象知道 Mediator 并双向互动）；**Abstract Factory** 可与 Facade 搭配以配置子系统；Facade 常实现为 **Singleton**。

## Flyweight

> 运用共享技术有效地支持大量细粒度的对象。
>
> Use sharing to support large numbers of fine-grained objects efficiently.

### Motivation

文档编辑器为每个字符建一个 Glyph 对象，一篇文档动辄几十万个对象——不可行。观察：同一个字符（如"a"）反复出现，它的字形、度量是**不变/与位置无关**的；可共享。而位置、样式随出现而变，**不能**进共享对象。解法：把状态分成 **intrinsic state**（内蕴，可共享，存 Flyweight 内）与 **extrinsic state**（外蕴，不共享，由客户在调用时作为参数传入 context）。每种字符一个 Glyph 实例，画的时候再把坐标/样式传进去。

### Applicability

* 应用使用大量对象，存储开销巨大
* 对象的大多数状态可变为外蕴（extrinsic）
* 按外蕴状态分组后，多组对象可被较少的共享对象代替
* 应用不依赖对象同一性（identity）——共享后"概念上不同的对象"会共用同一实例

### Structure

```mermaid
classDiagram
    class Flyweight {
        <<interface>>
        +operation(extrinsicState)
    }
    class ConcreteFlyweight {
        -intrinsicState
        +operation(extrinsicState)
    }
    class UnsharedConcreteFlyweight {
        -allState
        +operation(extrinsicState)
    }
    class FlyweightFactory {
        -flyweights Map~String,Flyweight~
        +flyweight(key) Flyweight
    }
    class Client
    Flyweight <|.. ConcreteFlyweight
    Flyweight <|.. UnsharedConcreteFlyweight
    FlyweightFactory o-- ConcreteFlyweight : 按 key 缓存共享
    Client --> FlyweightFactory : 查询
    Client ..> Flyweight : 调用时传入 extrinsic state
```

### Participants

* **Flyweight**：声明接口，通过它 Flyweight 可接收外蕴状态
* **ConcreteFlyweight**：实现接口，存储内蕴状态；必须可共享
* **UnsharedConcreteFlyweight**：不被共享的 Flyweight（常作为共享叶节点的容器）
* **FlyweightFactory**：创建并管理 Flyweight，确保合理共享
* **Client**：持有/引用 Flyweight，计算/存储外蕴状态并传入调用

### Consequences

节省多少取决于：减少的实例数量、内蕴状态的多少、外蕴状态是计算出来还是仍要存储。外蕴状态**可以计算**时节省最大；**必须存储**则只是把开销转移给客户。总体是以时间换空间（调用时传递/计算外蕴状态的运行期成本）。依赖同一性的场合不可用。

### Implementation

* **移除外蕴状态**：模式成败的关键在于多少状态能外蕴化——设计时常把"坐标、样式、容器关系"外移
* **管理共享对象**：Factory 内维护 `key → flyweight` 表；享元不引用 Factory（避免循环）；不再使用的享元的回收（引用计数/GC，或干脆不回收——数量有限）
* 共享的范围：常按"字符/图元类别"共享，容器（行、列）不共享（UnsharedConcreteFlyweight），构成 Composite

### Sample Code（字符 Glyph 的共享，Java 摘编）

享元的关键先体现在接口的形状上：操作多带一个 **GlyphContext** 参数——外蕴状态（当前位置、当前字体）不存进享元，调用时从外部传入：

```java
abstract class Glyph {
    abstract void draw(Window w, GlyphContext ctx);
    void insert(Glyph g, GlyphContext ctx) { }
}
```

ConcreteFlyweight 只保存内蕴状态。字符 Glyph 除字符编码外什么都不存，因此同一个实例可以代表文档中任意位置的这个字符：

```java
class CharacterGlyph extends Glyph {
    private final char code;                        // intrinsic：与位置无关，可共享

    CharacterGlyph(char code) { this.code = code; }
    @Override void draw(Window w, GlyphContext ctx) {
        Font font = ctx.getFont();                  // extrinsic：画的时候向 ctx 要
        int x = ctx.getX(), y = ctx.getY();
        System.out.println("draw '" + code + "' @" + x + "," + y + " font=" + font);
    }
}
```

行、列不共享（UnsharedConcreteFlyweight）——它们是共享叶子的容器，draw 时负责推进 ctx 的游标，让下一个字符拿到正确的外蕴状态：

```java
class Row extends Glyph {
    private final List<Glyph> children = new ArrayList<>();
    @Override void insert(Glyph g, GlyphContext ctx) { children.add(g); }
    @Override void draw(Window w, GlyphContext ctx) {
        for (Glyph child : children) {
            child.draw(w, ctx);
            ctx.next(1);                            // 游标前移：外蕴状态由容器推进
        }
    }
}
```

GlyphFactory 负责共享：按字符缓存实例，同一字符永远只建一次：

```java
class GlyphFactory {
    private final CharacterGlyph[] cache = new CharacterGlyph[128];
    CharacterGlyph characterGlyph(char c) {
        if (cache[c] == null) cache[c] = new CharacterGlyph(c);
        return cache[c];                            // 命中即共享
    }
    Row row() { return new Row(); }                 // 不共享的类型每次新建
}
```

最后是客户侧的 GlyphContext——外蕴状态的持有者：

```java
class GlyphContext {
    private int x = 0, y = 0;
    private Font font = new Font("Serif");
    Font getFont() { return font; }
    int getX() { return x; }  int getY() { return y; }
    void next(int step) { x += step * 8; }
}

GlyphFactory factory = new GlyphFactory();
Row row = factory.row();
row.insert(factory.characterGlyph('g'), null);     // 两个 'o' 命中同一个实例：
row.insert(factory.characterGlyph('o'), null);     // 文档里每个 'o' 都是同一个
row.insert(factory.characterGlyph('o'), null);     // CharacterGlyph 对象
row.draw(new Window(), new GlyphContext());        // Window 为示意类型
```

### Known Uses / 现代对应

* 书中：字符 Glyph 共享（文档编辑器场景）、InterViews 的 glyph/Style
* Java：`Integer#valueOf` 的 `-128~127` 缓存、`String` 常量池、`Boolean` 等包装类——虽然不是类库层面显式的 FlyweightFactory，思想一致

### Related Patterns

Flyweight 的共享叶 + 不共享容器 = **Composite**；**State** 与 **Strategy** 的对象通常无内蕴状态、天然适合作为 Flyweight 共享。

## Proxy（别名 Surrogate）

> 为其他对象提供一种代理以控制对这个对象的访问。
>
> Provide a surrogate or placeholder for another object to control access to it.

### Motivation

文档里嵌入的图像，多数从不被查看，加载全部图像代价高昂。解法：先用 **ImageProxy** 占位（画个占位框），当图像真正需要绘制时，Proxy 才加载真实 Image 并把请求转给它——之后 Proxy 与 Image 行为一致。

书中列出四种代理：

* **Remote proxy（远程代理）**：为不同地址空间的对象提供本地代表（如 RPC stub）
* **Virtual proxy（虚拟代理）**：为创建开销大的对象按需创建（惰性加载）
* **Protection proxy（保护代理）**：控制对原始对象的访问（权限检查）
* **Smart reference（智能引用）**：取代裸指针，在访问时做附加工作（引用计数、首次加载持久对象、加锁等）

### Applicability

* Remote proxy：为不同地址空间的对象提供本地代表
* Virtual proxy：为创建开销大的对象做按需加载与延迟初始化
* Protection proxy：控制对原始对象的访问权限
* Smart reference：在访问对象时附加内务操作（引用计数、加载持久对象、加锁）

### Structure

```mermaid
classDiagram
    class Subject {
        <<interface>>
        +request()
    }
    class RealSubject {
        +request()
    }
    class Proxy {
        -realSubject RealSubject
        +request()
    }
    class Client
    Subject <|.. RealSubject
    Subject <|.. Proxy
    Proxy --> RealSubject : 控制创建与访问后转发
    Client --> Subject : 面向同一接口
```

### Participants

* **Proxy**：维持对 RealSubject 的引用以转发请求；实现与 Subject 相同的接口以便替代它；控制 RealSubject 的创建/删除与访问
* **Subject**：为 RealSubject 与 Proxy 的公共接口
* **RealSubject**：Proxy 所代表的真实对象

### Consequences

* Remote proxy 隐藏"对象在别处"这一事实
* Virtual proxy 完成**按需加载/拷贝优化**（copy-on-write：只在真正修改时才复制，可大幅节省）
* Protection proxy 与 smart reference 在访问前后统一做权限/计数/锁等内务
* 代价：请求多一跳间接；某些代理（protection）需要额外配置权限模型

### Implementation

* **Proxy 重载运算符**（C++ 的 `operator->`/`operator*`）让"透过代理访问"与直接访问写法一致；Java 无运算符重载，动态代理 `java.lang.reflect.Proxy` 在运行期生成实现类
* **Copy-on-write**：Proxy 先与原对象共享，写操作时才真正复制——用 Proxy 实现"惰性复制"，配合引用计数管理
* Proxy 与 RealSubject 的创建时机解耦：真实对象在代理首次需要时才创建

### Sample Code（ImageProxy：Virtual Proxy，Java 摘编）

先看 Subject 与 RealSubject。Graphic 是图形的公共接口，Image 构造即读入整幅图像：

```java
interface Graphic {
    void draw(Position pos);
    BoundingBox extent();
    void store();
}

class Image implements Graphic {                   // RealSubject：加载开销大
    private final String fileName;
    private byte[] pixels;                          // 体积大

    Image(String fileName) {
        this.fileName = fileName;
        this.pixels = readFromFile(fileName);       // 构造即加载——昂贵
    }
    public void draw(Position pos) { System.out.println("绘制图像 " + fileName); }
    public BoundingBox extent() { return readExtent(pixels); }
    public void store() { }
    private static byte[] readFromFile(String f) { return new byte[0]; }
    private static BoundingBox readExtent(byte[] p) { return new BoundingBox(); }
}
```

Proxy 与 Image 同接口，但三个操作各有心思：`extent` 不加载也能答（从旁侧信息取尺寸），`draw` 才触发加载，`store` 只在真图已存在时转发：

```java
class ImageProxy implements Graphic {
    private Graphic image;                          // 延迟到首次 draw 才创建
    private final String fileName;
    private BoundingBox extentCache;                // 代理自己的小状态

    ImageProxy(String fileName) { this.fileName = fileName; }

    public BoundingBox extent() {
        if (image != null) extentCache = image.extent();        // 已加载：直接转发
        else if (extentCache == null)
            extentCache = readExtentFromSidecar(fileName);      // 未加载：取旁侧尺寸，不动真图
        return extentCache;
    }

    public void draw(Position pos) {
        if (image == null) image = new Image(fileName);         // Virtual Proxy 的核心：按需加载
        image.draw(pos);                                        // 之后与真图行为一致
    }

    public void store() {
        if (image != null) image.store();          // 从未加载过的图，无需保存
    }

    private static BoundingBox readExtentFromSidecar(String f) { return new BoundingBox(); }
}
```

客户侧：文档里放的是 Proxy。多数图像从不被查看，就从不付出加载代价：

```java
Graphic image1 = new ImageProxy("cover.png");
Graphic image2 = new ImageProxy("figure-1.png");
image1.extent();                    // 查尺寸：不触发加载
image1.draw(new Position(0, 0));    // 真正要看了，此时才读文件
```

### 现代对应

`java.lang.reflect.Proxy`（动态代理）、RMI stub、Spring AOP 的代理 Bean、Android 的 `IBinder` 远端代理。

### Related Patterns

与 **Adapter**：Adapter 提供不同的接口，Proxy 提供相同的接口；与 **Decorator**：结构相同，但 Decorator 任意叠加职责、Proxy 侧重控制访问（创建、权限、远端化）；Virtual proxy 的实现常和 **Singleton** 式的惰性初始化同源。

## 结构型模式的讨论（原书 4.8）

结构型模式之间看起来很相似——尤其是参与者和协作，因为它们都依赖同一个很小的语言机制集合：class pattern 靠（多重）继承，object pattern 靠对象组合。但相似性掩盖了各自不同的意图。原书挑出三组最容易混淆的对比：

### Adapter 与 Bridge

共同点：都给另一对象提供了一层**间接性**，都涉及把请求从自身以外的接口转发给这个对象，都有利于系统的灵活性。

关键差别在**用途与使用时机**：

* **Adapter** 解决的是**两个已有接口之间不匹配**的问题——不关心接口怎样实现、未来如何演化，也不需要重新设计其中任何一个类就能让它们协同工作，目的通常是避免代码重复
* **Bridge** 是**事先**把抽象接口与它的（可能多个）实现部分分离——允许修改实现它的类，但始终给用户提供稳定的接口，并在系统演化时容纳新的实现

因此二者用于软件生命周期的不同阶段：**Adapter 在类已经设计好之后实施（事后），Bridge 在设计类之前实施（事前）**。Adapter 的使用者事先无法预见这种耦合；Bridge 的使用者必须预先知道"一个抽象将有多个实现、且二者独立演化"。这不意味着 Adapter 不如 Bridge——它们针对的是不同的问题。

顺带辨析：Facade 看起来像"另一组对象的适配器"，但 **Facade 定义一个新接口，Adapter 复用原有接口**——适配器让两个已有接口协同工作，而不是发明新接口。

### Composite、Decorator 与 Proxy

**Composite 与 Decorator** 的结构图几乎一样——都基于递归组合来组织数目可变的对象。但把 decorator 看成"退化的 composite"没有领会要点，相似仅止于递归组合：

* **Decorator** 的目的是**不生成子类就给对象添加职责**——避免为静态实现所有功能组合而导致子类急剧增加
* **Composite** 的目的是**构造类，使多个相关对象能以统一方式处理**——多个对象可当作一个对象；重点不在修饰，而在**表示**

目的不同却互补，所以二者常协同使用：无须定义新类，把对象插接在一起即可构建应用——同一个抽象类下既有 composite 子类又有 decorator 子类，共用一个接口。从 Decorator 的角度看 composite 是一个 ConcreteComponent；从 Composite 的角度看 decorator 则是一个 Leaf。

**Proxy 与 Decorator** 都为对象提供一定程度的间接引用——都保留指向另一个对象的引用并向它转发请求，都给用户提供一致的接口。差别在：

* **Proxy 不能动态地添加或分离性质，也不是为递归组合设计的**。它的目的是：当直接访问一个实体不方便或不符合需求时，为实体提供替代者（实体在远程设备上、访问受限制、实体是持久存储的）
* 职责的分工不同：**Proxy 中实体定义关键功能，Proxy 提供（或拒绝）对它的访问；Decorator 中组件只提供部分功能，一个或多个 decorator 负责完成其余功能**
* 开放性不同：Decorator 适用于编译期不能（至少不方便）确定对象全部功能的情况，这种开放性使递归组合成为 Decorator 必不可少的部分；Proxy 强调 Proxy 与实体之间**一种可以静态表达的关系**

这些差异不意味着模式不能混用——可以想象 proxy-decorator 给 proxy 添加功能，或 decorator-proxy 修饰远程对象，只是这类混合可以拆分成若干有用的模式。
