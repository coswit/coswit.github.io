# Behavioral Patterns（行为型模式）

Behavioral Pattern 关注对象之间的职责分配与通信方式：算法如何封装、对象如何交互、各自承担什么职责。

GoF 定义了 11 种 Behavioral Patterns：Chain of Responsibility、Command、Interpreter、Iterator、Mediator、Memento、Observer、State、Strategy、Template Method、Visitor。

> 本文件以 Java 示例代码为主；按原书模板（Intent / Participants / Consequences / Implementation）整理的概念笔记见 [GoF/03-Behavioral-Patterns.md](GoF/03-Behavioral-Patterns.md)。

## Chain of Responsibility（责任链模式）

> 使多个对象都有机会处理请求，从而避免请求的发送者与接收者之间的耦合关系。把这些对象连成一条链，沿着链传递请求，直到有一个对象处理它为止。
>
> Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it.

典型应用：`javax.servlet.Filter` 过滤器链、`java.util.logging.Logger` 的日志逐级传播。

## Command（命令模式，别名 Action / Transaction）

> 将一个请求封装为一个对象，从而使你可以用不同的请求对客户端进行参数化，对请求排队或记录请求日志，以及支持可撤销（undoable）的操作。
>
> Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F/02.png)

### Applicability

以下情况使用 Command：

* 按要执行的动作给对象参数化。过程式语言可以用回调函数（callback）表达这种参数化——先注册、稍后调用；Command 就是回调的面向对象替代品
* 在不同时刻指定、排队并执行请求。Command 对象的生命周期可以独立于原始请求；如果请求的接收者能以与地址空间无关的方式表示，还可以把 command 对象传给另一个进程，在那里完成请求
* 支持 undo。execute 时把逆转其效果所需的状态存进 command 自身；接口增加一个 unexecute 操作即可逆转效果；已执行的命令存入 history list，前后遍历该列表并分别调用 unexecute/execute，即可实现无限级的撤销与重做
* 支持变更日志，系统崩溃后可重放。给 Command 接口加上 load/store 操作即可持久化变更日志；恢复时从磁盘重载日志中的命令并重新 execute
* 用建立在 primitive operations 之上的高层操作来构建系统。这在支持事务的信息系统中很常见：事务封装了一组数据变更，Command 提供了建模事务的方式——所有命令有统一接口，任何事务都以同一种方式调用，扩展新事务也很容易

### Typical Use Case

* 保留请求历史
* 实现 callback 功能
* 实现 undo 功能

### Programmatic Example

```java
public class App {

  /**
   * Program entry point
   *
   * @param args command line args
   */
  public static void main(String[] args) {
    Wizard wizard = new Wizard();
    Goblin goblin = new Goblin();

    goblin.printStatus();

    wizard.castSpell(new ShrinkSpell(), goblin);
    goblin.printStatus();

    wizard.castSpell(new InvisibilitySpell(), goblin);
    goblin.printStatus();

    wizard.undoLastSpell();
    goblin.printStatus();

    wizard.undoLastSpell();
    goblin.printStatus();

    wizard.redoLastSpell();
    goblin.printStatus();

    wizard.redoLastSpell();
    goblin.printStatus();
  }
}
```

```java
public abstract class Command {

  public abstract void execute(Target target);

  public abstract void undo();

  public abstract void redo();

  @Override
  public abstract String toString();

}
```

```java
public class InvisibilitySpell extends Command {

  private Target target;

  @Override
  public void execute(Target target) {
    target.setVisibility(Visibility.INVISIBLE);
    this.target = target;
  }

  @Override
  public void undo() {
    if (target != null) {
      target.setVisibility(Visibility.VISIBLE);
    }
  }

  @Override
  public void redo() {
    if (target != null) {
      target.setVisibility(Visibility.INVISIBLE);
    }
  }

  @Override
  public String toString() {
    return "Invisibility spell";
  }
}
```

```java
public class ShrinkSpell extends Command {

  private Size oldSize;
  private Target target;

  @Override
  public void execute(Target target) {
    oldSize = target.getSize();
    target.setSize(Size.SMALL);
    this.target = target;
  }

  @Override
  public void undo() {
    if (oldSize != null && target != null) {
      Size temp = target.getSize();
      target.setSize(oldSize);
      oldSize = temp;
    }
  }

  @Override
  public void redo() {
    undo();
  }

  @Override
  public String toString() {
    return "Shrink spell";
  }
}
```

```java
/**
 *
 * Base class for spell targets.
 *
 */
public abstract class Target {

  private static final Logger LOGGER = LoggerFactory.getLogger(Target.class);

  private Size size;

  private Visibility visibility;

  public Size getSize() {
    return size;
  }

  public void setSize(Size size) {
    this.size = size;
  }

  public Visibility getVisibility() {
    return visibility;
  }

  public void setVisibility(Visibility visibility) {
    this.visibility = visibility;
  }

  @Override
  public abstract String toString();

  /**
   * Print status
   */
  public void printStatus() {
    LOGGER.info("{}, [size={}] [visibility={}]", this, getSize(), getVisibility());
  }
}
```

```java
public class Goblin extends Target {

  public Goblin() {
    setSize(Size.NORMAL);
    setVisibility(Visibility.VISIBLE);
  }

  @Override
  public String toString() {
    return "Goblin";
  }

}
```

```java
/**
 *
 * Wizard is the invoker of the commands
 *
 */
public class Wizard {

  private static final Logger LOGGER = LoggerFactory.getLogger(Wizard.class);

  private Deque<Command> undoStack = new LinkedList<>();
  private Deque<Command> redoStack = new LinkedList<>();

  public Wizard() {
    // comment to ignore sonar issue: LEVEL critical
  }

  /**
   * Cast spell
   */
  public void castSpell(Command command, Target target) {
    LOGGER.info("{} casts {} at {}", this, command, target);
    command.execute(target);
    undoStack.offerLast(command);
  }

  /**
   * Undo last spell
   */
  public void undoLastSpell() {
    if (!undoStack.isEmpty()) {
      Command previousSpell = undoStack.pollLast();
      redoStack.offerLast(previousSpell);
      LOGGER.info("{} undoes {}", this, previousSpell);
      previousSpell.undo();
    }
  }

  /**
   * Redo last spell
   */
  public void redoLastSpell() {
    if (!redoStack.isEmpty()) {
      Command previousSpell = redoStack.pollLast();
      undoStack.offerLast(previousSpell);
      LOGGER.info("{} redoes {}", this, previousSpell);
      previousSpell.redo();
    }
  }

  @Override
  public String toString() {
    return "Wizard";
  }
}
```

### Real world examples

* [java.lang.Runnable](http://docs.oracle.com/javase/8/docs/api/java/lang/Runnable.html)
* [Netflix Hystrix](https://github.com/Netflix/Hystrix/wiki)
* [javax.swing.Action](http://docs.oracle.com/javase/8/docs/api/javax/swing/Action.html)

### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)

## Interpreter（解释器模式）

> 给定一个语言，定义它的文法的一种表示，并定义一个解释器，该解释器使用该表示来解释语言中的句子。
>
> Given a language, define a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language.

### Applicability

当有一门语言需要解释，且能把该语言的语句表示为抽象语法树（AST）时，可以使用 Interpreter。它在以下情况效果最佳：

* 文法简单。文法复杂时，对应的类层次会变得庞大而难以管理，此时 parser generator 这类工具是更好的选择——它们无需构建抽象语法树就能解释表达式，可以节省空间甚至时间
* 效率不是关键问题。最高效的解释器通常不直接解释 parse tree，而是先把它转换成另一种形式（例如正则表达式常被转换为状态机）。即便如此，这个转换器本身仍可以用 Interpreter 模式实现，该模式依然适用

### Real world examples

* [java.util.Pattern](http://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html)
* [java.text.Normalizer](http://docs.oracle.com/javase/8/docs/api/java/text/Normalizer.html)
* [java.text.Format](http://docs.oracle.com/javase/8/docs/api/java/text/Format.html) 的所有子类
* [javax.el.ELResolver](http://docs.oracle.com/javaee/7/api/javax/el/ELResolver.html)

### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)

## Iterator（迭代器模式，别名 Cursor）

> 提供一种方法顺序访问一个聚合对象中的各个元素，而又不暴露该对象的内部表示。
>
> Provide a way to access the elements of an aggregate object sequentially without exposing its underlying representation.

![img](https://java-design-patterns.com/patterns/iterator/etc/iterator_1.png)

### Applicability

以下情况使用 Iterator：

* 访问一个聚合对象的内容而不暴露其内部表示
* 支持对聚合对象的多种遍历方式
* 为遍历不同的聚合结构提供统一的接口

### Real world examples

* [java.util.Iterator](http://docs.oracle.com/javase/8/docs/api/java/util/Iterator.html)
* [java.util.Enumeration](http://docs.oracle.com/javase/8/docs/api/java/util/Enumeration.html)

### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)

## Mediator（中介者模式）

> 用一个中介对象封装一系列的对象交互。Mediator 使各对象不需要显式地相互引用，从而使其耦合松散，而且可以独立地改变它们之间的交互。
>
> Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently.

各同事（Colleague）对象之间不直接引用，统一通过 Mediator 协调交互，并由此改变程序的运行时行为。典型场景：机场调度塔台协调多架飞机、聊天室转发消息、MVC 中 Controller 协调 View 与 Model。

## Memento（备忘录模式）

> 在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态，以便以后将对象恢复到原先保存的状态。
>
> Without violating encapsulation, capture and externalize an object's internal state so that the object can be restored to this state later.

典型应用：文本编辑器的 undo/redo（命令历史）、游戏存档。

## Observer（观察者模式）

> 定义对象间的一对多依赖，当一个对象（Subject）的状态发生改变时，所有依赖于它的对象（Observer）都得到通知并被自动更新。
>
> Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

典型应用：GUI 事件监听（Listener/EventListener）、发布/订阅（Publish/Subscribe）模型、RxJava 的 `Observable`/`Observer`。

## State（状态模式，别名 Objects for States）

> 允许一个对象在其内部状态改变时改变它的行为，对象看起来似乎修改了它的类。
>
> Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.

```java
public class StatePatterns {
    public static void main(String[] args) {
        Mammoth mammoth = new Mammoth();
        mammoth.observe();
        mammoth.timePass();
        mammoth.observe();
        mammoth.timePass();
        mammoth.observe();
    }
}
```

```java
class Mammoth {
    private State state;

    public Mammoth() {
        this.state = new PeacefulState();
    }

    public void observe() {
        this.state.observe(this);
    }

    public void timePass() {
        if (state.getClass().equals(PeacefulState.class)) {
            changeStateTo(new AngryState());
        } else {
            changeStateTo(new PeacefulState());
        }
    }

    private void changeStateTo(State newState) {
        this.state = newState;
        this.state.onEnterState(this);
    }
}
```

```java
interface State {
    void observe(Mammoth mammoth);
    void onEnterState(Mammoth mammoth);
}
```

```java
class PeacefulState implements State {

    @Override
    public void observe(Mammoth mammoth) {
        System.out.println(mammoth.toString() + " is calm and peaceful.");
    }

    @Override
    public void onEnterState(Mammoth mammoth) {
        System.out.println(mammoth.toString() + " calms down.");
    }

    @Override
    public String toString() {
        return getClass().getSimpleName();
    }
}
```

```java
class AngryState implements State {
    @Override
    public void observe(Mammoth mammoth) {
        System.out.println(mammoth.toString() + " is furious!");
    }

    @Override
    public void onEnterState(Mammoth mammoth) {
        System.out.println(mammoth.toString() + " gets angry!");
    }

    @Override
    public String toString() {
        return getClass().getSimpleName();
    }
}
```

## Strategy（策略模式，别名 Policy）

> 定义一系列的算法，把它们一个个封装起来，并且使它们可相互替换。此模式使得算法可以独立于使用它的客户端而变化。
>
> Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.

```java
public class StrategyPattern {

    public static void main(String[] args) {
        DragonSlayer slayer = new DragonSlayer(new MeleeStrategy());
        slayer.goToBattle();
        slayer.changeStrategy(new ProjectileStrategy());
        slayer.goToBattle();

    }
}
```

```java
class DragonSlayer {
    private DragonSlayingStrategy strategy;

    public DragonSlayer(DragonSlayingStrategy strategy) {
        this.strategy = strategy;
    }

    public void changeStrategy(DragonSlayingStrategy strategy) {
        this.strategy = strategy;
    }

    public void goToBattle() {
        strategy.execute();
    }
}
```

```java
interface DragonSlayingStrategy {
    void execute();
}
```

```java
// 投掷武器远程攻击
class ProjectileStrategy implements DragonSlayingStrategy {

    @Override
    public void execute() {
        System.out.println("You shoot the dragon with the magical crossbow and it falls dead on the ground!");
    }
}
```

```java
// 近身肉搏
class MeleeStrategy implements DragonSlayingStrategy {

    @Override
    public void execute() {
        System.out.println("With your Excalibur you sever the dragon's head!");
    }
}
```

## Template Method（模板方法模式）

> 定义一个操作中的算法骨架，而将一些步骤延迟到子类中。Template Method 使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤。
>
> Define the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's structure.

典型应用：`HttpServlet` 的 `service()` 将请求分发给 `doGet()`/`doPost()`；`InputStream` 的 `read(byte[], int, int)` 依赖抽象的 `read()`。

## Visitor（访问者模式）

> 表示一个作用于某对象结构中的各元素的操作。Visitor 使你可以在不改变各元素的类的前提下，定义作用于这些元素的新操作。
>
> Represent an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.

适用于对象结构稳定、但作用于其上的操作经常变化的场景：新操作可以随时添加，而无需改动节点（node）的接口。
