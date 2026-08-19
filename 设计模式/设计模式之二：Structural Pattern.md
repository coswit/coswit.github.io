# Structural Patterns（结构型模式）

Structural Pattern 关注类与对象的组合：如何把类或对象组合成更大的结构，同时保持结构的灵活与高效。

GoF 定义了 7 种 Structural Patterns：Adapter、Bridge、Composite、Decorator、Facade、Flyweight、Proxy。

> 本文件以 Java 示例代码为主；按原书模板（Intent / Participants / Consequences / Implementation）整理的概念笔记见 [GoF/02-Structural-Patterns.md](GoF/02-Structural-Patterns.md)。

## Adapter（适配器模式，别名 Wrapper）

> 将一个类的接口转换成客户端期望的另一种接口，使原本由于接口不兼容而无法一起工作的类可以协同工作。
>
> Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.

### Explanation

现实类比

> 内存卡里的照片要传到电脑，需要一个与电脑端口兼容的适配器——读卡器就是 adapter；三脚插头插不进两孔插座，需要电源适配器；翻译官把一个人说的话转述给听不懂的另一个人。

通俗地说

> 把一个不兼容的对象包进 adapter，让它能与另一个类协同工作。

### Programmatic Example

考虑一位只会使用 rowing boat（划艇）的船长（Captain），他完全不会航行。

首先定义 `RowingBoat` 与 `FishingBoat`：

```java
public interface RowingBoat {
  void row();
}

public class FishingBoat {
  private static final Logger LOGGER = LoggerFactory.getLogger(FishingBoat.class);
  public void sail() {
    LOGGER.info("The fishing boat is sailing");
  }
}
```

Captain 只依赖 `RowingBoat` 接口即可移动：

```java
public class Captain implements RowingBoat {

  private RowingBoat rowingBoat;

  public Captain(RowingBoat rowingBoat) {
    this.rowingBoat = rowingBoat;
  }

  @Override
  public void row() {
    rowingBoat.row();
  }
}
```

现在海盗来了，船长需要逃跑，但手边只有 fishing boat。我们创建一个 adapter，让船长用他的划船技能操纵 fishing boat：

```java
public class FishingBoatAdapter implements RowingBoat {

  private static final Logger LOGGER = LoggerFactory.getLogger(FishingBoatAdapter.class);

  private FishingBoat boat;

  public FishingBoatAdapter() {
    boat = new FishingBoat();
  }

  @Override
  public void row() {
    boat.sail();
  }
}
```

这样 `Captain` 就能借助 `FishingBoat` 逃离海盗了：

```java
Captain captain = new Captain(new FishingBoatAdapter());
captain.row();
```

### Applicability

以下情况使用 Adapter：

* 想使用一个现有的类，但它的接口不符合你的需要
* 想创建一个可复用的类，能与无关的、事先无法预见的类（即接口不一定兼容的类）协作
* 想同时使用多个现有的子类，但为每一个子类派生子类去适配接口并不现实。object adapter 可以直接适配其父类的接口
* 大量使用第三方库的应用，会用 adapter 作为应用与第三方库之间的中间层来解耦。这样换库时只需为新库写一个 adapter，无需改动应用代码

### Consequences

class adapter 与 object adapter 的取舍不同。

类适配器（class adapter）：

* 通过绑定到一个具体的 Adaptee 类来把 Adaptee 适配成 Target。因此当要适配一个类及其所有子类时，类适配器行不通
* 由于 Adapter 是 Adaptee 的子类，可以让 Adapter 覆盖 Adaptee 的部分行为
* 只引入一个对象，访问被适配对象不需要额外的指针间接

对象适配器（object adapter）：

* 允许一个 Adapter 与多个 Adaptee 协作——即 Adaptee 本身及其所有子类（如果有的话），还可以一次性为所有 Adaptee 添加功能
* 更难覆盖 Adaptee 的行为：需要为 Adaptee 派生子类，并让 Adapter 引用该子类而不是 Adaptee 本身

> 术语：Adaptee（被适配者）是已有的、接口不兼容的类；Target 是客户端期望的接口。

### Real world examples

JDK 中的例子：

* [java.util.Arrays#asList()](http://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html#asList%28T...%29)
* [java.util.Collections#list()](https://docs.oracle.com/javase/8/docs/api/java/util/Collections.html#list-java.util.Enumeration-)
* [java.util.Collections#enumeration()](https://docs.oracle.com/javase/8/docs/api/java/util/Collections.html#enumeration-java.util.Collection-)
* [javax.xml.bind.annotation.adapters.XMLAdapter](http://docs.oracle.com/javase/8/docs/api/javax/xml/bind/annotation/adapters/XmlAdapter.html#marshal-BoundType-)

### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software]
* [J2EE Design Patterns](http://www.amazon.com/J2EE-Design-Patterns-William-Crawford/dp/0596004273/ref=sr_1_2)

## Bridge（桥接模式）

> 将抽象部分与它的实现部分分离，使它们都可以独立地变化。
>
> Decouple an abstraction from its implementation so that the two can vary independently.

Composition over inheritance。Bridge 可以看作两层抽象（two layers of abstraction）：Weapon（Abstraction）与 Enchantment（Implementor）两个变化维度通过组合关联、各自独立扩展——新增武器或新增附魔互不影响。

```java
public class BridgePattern {
    public static void main(String[] args) {
        Sword sword = new Sword(new SoulEatingEnchantment());
        sword.wield();
        sword.swing();
        sword.unwield();

        Hammer hammer = new Hammer(new FlyingEnchantment());
        hammer.wield();
        hammer.swing();
        hammer.unwield();
    }
}
```

```java
interface Weapon {
    void wield();
    void swing();
    void unwield();
    Enchantment getEnchantment();
}
```

```java
class Sword implements Weapon {
    private Enchantment enchantment;
    public Sword(Enchantment enchantment) {
        this.enchantment = enchantment;
    }

    @Override
    public void wield() {
        System.out.println("The sword is wielded.");
        enchantment.onActivate();
    }

    @Override
    public void swing() {
        System.out.println("The sword is swinged.");
        enchantment.apply();
    }

    @Override
    public void unwield() {
        System.out.println("The sword is unwielded");
        enchantment.onDeactivate();
    }

    @Override
    public Enchantment getEnchantment() {
        return enchantment;
    }
}
```

```java
class Hammer implements Weapon {
    private Enchantment enchantment;
    public Hammer(Enchantment enchantment) {
        this.enchantment = enchantment;
    }

    @Override
    public void wield() {
        System.out.println("The hammer is wielded.");
        enchantment.onActivate();
    }

    @Override
    public void swing() {
        System.out.println("The hammer is swinged.");
        enchantment.apply();
    }

    @Override
    public void unwield() {
        System.out.println("The hammer is unwielded.");
        enchantment.onDeactivate();
    }

    @Override
    public Enchantment getEnchantment() {
        return enchantment;
    }
}
```

```java
interface Enchantment {
    void onActivate();
    void apply();
    void onDeactivate();
}
```

```java
class FlyingEnchantment implements Enchantment {

    @Override
    public void onActivate() {
        System.out.println("The item begins to glow faintly.");
    }

    @Override
    public void apply() {
        System.out.println("The item flies and strikes the enemies finally returning to owner's hand.");
    }

    @Override
    public void onDeactivate() {
        System.out.println("The item's glow fades.");
    }
}
```

```java
class SoulEatingEnchantment implements Enchantment {

    @Override
    public void onActivate() {
        System.out.println("The item spreads bloodlust.");
    }

    @Override
    public void apply() {
        System.out.println("The item eats the soul of enemies.");
    }

    @Override
    public void onDeactivate() {
        System.out.println("Bloodlust slowly disappears.");
    }
}
```

## Composite（组合模式）

> 将对象组合成树形结构以表示「部分—整体」的层次结构，使客户端对单个对象（Leaf）和组合对象（Composite）的使用具有一致性。
>
> Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly.

典型应用：文件系统中的文件与目录、GUI 中的容器（Container）与叶子控件。

## Decorator（装饰模式）

> 动态地给一个对象添加额外的职责。就增加功能而言，Decorator 比生成子类更为灵活。
>
> Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

Decorator 是继承（subclassing）更灵活的替代方案：Decorator 类实现与目标相同的接口，并通过组合（aggregation）把对目标对象的调用"装饰"起来，从而可以在运行时改变类的行为。

```java
public class Decorator {
    public static void main(String[] args) {
        SimpleTroll simpleTroll = new SimpleTroll();
        simpleTroll.attack();
        simpleTroll.fleeBattle();
        System.out.println(simpleTroll.getAttackPower());

        ClubbedTroll clubbedTroll = new ClubbedTroll(simpleTroll);
        clubbedTroll.attack();
        clubbedTroll.fleeBattle();
        System.out.println(clubbedTroll.getAttackPower());
    }
}
```

```java
interface Troll {
    void attack();

    int getAttackPower();

    void fleeBattle();
}
```

```java
class SimpleTroll implements Troll {

    @Override
    public void attack() {
        System.out.println("The troll tries to grab you!");
    }

    @Override
    public int getAttackPower() {
        return 10;
    }

    @Override
    public void fleeBattle() {
        System.out.println("The troll shrieks in horror and runs away!");
    }
}
```

```java
class ClubbedTroll implements Troll {

    private Troll decorated;

    public ClubbedTroll(Troll decorated) {
        this.decorated = decorated;
    }

    @Override
    public void attack() {
        decorated.attack();
        System.out.println("The troll swings at you with a club!");
    }

    @Override
    public int getAttackPower() {
        return decorated.getAttackPower() + 10;
    }

    @Override
    public void fleeBattle() {
        decorated.fleeBattle();
    }
}
```

## Facade（外观模式）

> 为子系统中的一组接口提供一个一致的界面，定义一个高层接口使这一子系统更加容易使用。
>
> Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.

Facade 常用于系统非常复杂或难以理解的场景：系统包含大量相互依赖的类，或者源代码不可用。它隐藏大系统的复杂性，向客户端提供更简单的接口——通常是一个 wrapper class，包含客户端所需的一组成员，由这些成员代表客户端访问子系统并隐藏实现细节。

```java
public class Facade {
    public static void main(String[] args) {
        DwarvenGoldmineFacade facade = new DwarvenGoldmineFacade();
        facade.startNewDay();
        facade.digoutGold();
        facade.endDay();
    }
}
```

```java
class DwarvenGoldmineFacade {
    private final List<DwarvenMineWorker> workers;

    public DwarvenGoldmineFacade() {
        workers = new ArrayList<>();
        workers.add(new DwarvenCartOperator());
        workers.add(new DwarvenTunnelDigger());

    }

    public void startNewDay() {
        makeActions(workers, DwarvenMineWorker.Action.WAKE_UP, DwarvenMineWorker.Action.GO_TO_MINE);
    }

    public void digoutGold() {
        makeActions(workers, DwarvenMineWorker.Action.WORK);
    }

    public void endDay() {
        makeActions(workers, DwarvenMineWorker.Action.GO_HOME, DwarvenMineWorker.Action.GO_TO_SLEEP);
    }

    private void makeActions(List<DwarvenMineWorker> workers, DwarvenMineWorker.Action... actions) {
        for (DwarvenMineWorker worker : workers) {
            worker.action(actions);
        }
    }
}
```

```java
abstract class DwarvenMineWorker {

    public void wakeUp() {
        System.out.println(name() + " wakes up.");
    }

    public void goToMine() {
        System.out.println(name() + " goes to the mine.");
    }

    public void goHome() {
        System.out.println(name() + " goes home.");
    }

    public void gotoSleep() {
        System.out.println(name() + " goes to sleep.");
    }

   public void action(Action... actions){
        for (Action action:actions){
            action(action);
        }
   }

    private void action(Action action) {
        switch (action) {
            case WAKE_UP:
                wakeUp();
                break;
            case GO_TO_MINE:
                goToMine();
                break;
            case WORK:
                work();
                break;
            case GO_HOME:
                goHome();
                break;
            case GO_TO_SLEEP:
                gotoSleep();
                break;
        }
    }

    public abstract String name();

    public abstract void work();

    static enum Action {WAKE_UP, GO_TO_MINE, WORK, GO_HOME, GO_TO_SLEEP}
}
```

```java
class DwarvenCartOperator extends DwarvenMineWorker {

    @Override
    public String name() {
        return "Dwarf cart operator";
    }

    @Override
    public void work() {
        System.out.println(name() + " moves gold chunks out of the mine.");
    }
}
```

```java
class DwarvenTunnelDigger extends DwarvenMineWorker {
    @Override
    public String name() {
        return "Dwarven tunnel digger";
    }

    @Override
    public void work() {
        System.out.println(name() +" creates another promising tunnel.");
    }
}
```

## Flyweight（享元模式）

> 运用共享技术有效地支持大量细粒度的对象。
>
> Use sharing to support large numbers of fine-grained objects efficiently.

### Explanation

现实类比

> 炼金术士的店里摆满了魔法药水，很多药水是相同的，没必要为每一瓶都创建新对象——一个对象实例可以代表货架上的多件商品，内存占用保持很小。

通俗地说

> 通过与相似对象尽可能多地共享，来最小化内存使用或计算开销。

### Programmatic Example

把上面的炼金术士店铺例子写成代码。首先定义不同的药水类型：

```java
public interface Potion {
  void drink();
}

public class HealingPotion implements Potion {
  private static final Logger LOGGER = LoggerFactory.getLogger(HealingPotion.class);
  @Override
  public void drink() {
    LOGGER.info("You feel healed. (Potion={})", System.identityHashCode(this));
  }
}

public class HolyWaterPotion implements Potion {
  private static final Logger LOGGER = LoggerFactory.getLogger(HolyWaterPotion.class);
  @Override
  public void drink() {
    LOGGER.info("You feel blessed. (Potion={})", System.identityHashCode(this));
  }
}

public class InvisibilityPotion implements Potion {
  private static final Logger LOGGER = LoggerFactory.getLogger(InvisibilityPotion.class);
  @Override
  public void drink() {
    LOGGER.info("You become invisible. (Potion={})", System.identityHashCode(this));
  }
}
```

真正的 Flyweight 对象是生产药水的 factory（按类型缓存、共享实例）：

```java
public class PotionFactory {

  private final Map<PotionType, Potion> potions;

  public PotionFactory() {
    potions = new EnumMap<>(PotionType.class);
  }

  Potion createPotion(PotionType type) {
    Potion potion = potions.get(type);
    if (potion == null) {
      switch (type) {
        case HEALING:
          potion = new HealingPotion();
          potions.put(type, potion);
          break;
        case HOLY_WATER:
          potion = new HolyWaterPotion();
          potions.put(type, potion);
          break;
        case INVISIBILITY:
          potion = new InvisibilityPotion();
          potions.put(type, potion);
          break;
        default:
          break;
      }
    }
    return potion;
  }
}
```

使用方式如下：

```java
PotionFactory factory = new PotionFactory();
factory.createPotion(PotionType.INVISIBILITY).drink(); // You become invisible. (Potion=6566818)
factory.createPotion(PotionType.HEALING).drink(); // You feel healed. (Potion=648129364)
factory.createPotion(PotionType.INVISIBILITY).drink(); // You become invisible. (Potion=6566818)
factory.createPotion(PotionType.HOLY_WATER).drink(); // You feel blessed. (Potion=1104106489)
factory.createPotion(PotionType.HOLY_WATER).drink(); // You feel blessed. (Potion=1104106489)
factory.createPotion(PotionType.HEALING).drink(); // You feel healed. (Potion=648129364)
```

同一个 `PotionType` 两次 `createPotion` 返回的是同一实例（`identityHashCode` 相同），这就是享元的共享。

### Applicability

Flyweight 的效果高度依赖使用的方式与场合。以下条件全部成立时才适用：

* 应用使用大量的对象
* 对象数量巨大导致存储开销高
* 对象的大部分状态可以外部化（extrinsic）
* 移除外部状态后，许多组对象可以用较少的共享对象代替
* 应用不依赖对象同一性（identity）。由于 flyweight 对象会被共享，对概念上不同的对象做同一性测试也会返回 true

### Real world examples

* [java.lang.Integer#valueOf(int)](http://docs.oracle.com/javase/8/docs/api/java/lang/Integer.html#valueOf%28int%29)，Byte、Character 等包装类型同理

### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)

## Proxy（代理模式）

> 为其他对象提供一个代理（surrogate/placeholder），以控制对这个对象的访问。
>
> Provide a surrogate or placeholder for another object to control access to it.

广义上，proxy 就是一个"作为其他东西的接口"的类：它可以代理网络连接、内存中的大对象、文件，或其他复制代价高昂、甚至无法复制的资源。简言之，proxy 是客户端调用的一个 wrapper/agent 对象，由它去访问幕后真正提供服务的对象（real subject）。

Proxy 通过创建 wrapper class 代理目标对象，可以在不改动目标对象代码的前提下附加额外功能（如访问控制、延迟初始化、缓存、日志）。

常见代理类型：Remote Proxy（远程对象的本地代表）、Virtual Proxy（延迟创建开销大的对象）、Protection Proxy（控制访问权限）。
