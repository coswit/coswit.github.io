# Creational Patterns（创建型模式）

创建型模式关注对象的创建过程：把"创建什么、谁来创建、何时创建、如何创建"的细节封装起来，让客户端与具体类的实例化过程解耦。

GoF 定义了 5 种 Creational Patterns：Abstract Factory、Builder、Factory Method、Prototype、Singleton。

> 本文件以 Java 示例代码为主；按原书模板（Intent / Participants / Consequences / Implementation）整理的概念笔记见 [GoF/01-Creational-Patterns.md](GoF/01-Creational-Patterns.md)。

## Abstract Factory（抽象工厂模式，别名 Kit）

> 提供一个创建一系列相关或相互依赖对象的接口，而无需指定它们具体的类。
>
> Provide an interface for creating families of related or dependent objects without specifying their concrete classes.

Abstract Factory 把一组具有共同主题的 individual factory 封装起来，而不用指定它们的具体类。通常的用法是：客户端软件创建 abstract factory 的一个具体实现，然后通过 factory 的通用接口创建属于该主题的具体对象。客户端并不需要知道（也不关心）从这些内部 factory 得到的是哪个具体对象，因为它只依赖产品的通用接口。

该模式将一组对象的实现细节与它们的一般用法分离，并且依赖 object composition——对象的创建在 factory interface 暴露的方法中实现。

```java
  public static void main(String[] args) {
        KingdomFactory factory = makeFactory(KingdomType.ELF);
        AbstractFactory obj = new AbstractFactory();
        obj.createKingdom(factory);
        System.out.println(obj.getArmy().getDescription());
        System.out.println(obj.getKing().getDescription());

        factory = makeFactory(KingdomType.ORC);
        obj = new AbstractFactory();
        obj.createKingdom(factory);
        System.out.println(obj.getArmy().getDescription());
        System.out.println(obj.getKing().getDescription());

    }
```

```java
public class AbstractFactory {

    private King king;
    private Army army;

    public King getKing() {
        return king;
    }

    public void setKing(King king) {
        this.king = king;
    }

    public Army getArmy() {
        return army;
    }

    public void setArmy(Army army) {
        this.army = army;
    }

    enum KingdomType {ELF, ORC}

    public static KingdomFactory makeFactory(KingdomType type) {
        switch (type) {
            case ELF:
                return new ElfKingdomFactory();
            case ORC:
                return new OrcKingdomFactory();
            default:
                throw new IllegalArgumentException("KingdomType not supported.");

        }
    }

    public void createKingdom(KingdomFactory factory) {
        setArmy(factory.createArmy());
        setKing(factory.createKing());
    }

}
```

```java
interface KingdomFactory {
    King createKing();
    Army createArmy();
}


class OrcKingdomFactory implements KingdomFactory {

    @Override
    public King createKing() {
        return new OrcKing();
    }

    @Override
    public Army createArmy() {
        return new OrcArmy();
    }
}


class ElfKingdomFactory implements KingdomFactory {

    @Override
    public King createKing() {
        return new ElfKing();
    }

    @Override
    public Army createArmy() {
        return new ElfArmy();
    }
}
```

```java
interface King {
    String getDescription();
}

class OrcKing implements King {

    @Override
    public String getDescription() {
        return "This is the Orc king!";
    }
}

class ElfKing implements King {

    @Override
    public String getDescription() {
        return "This is the Elven king!";
    }
}
```

```java
interface Army {
    String getDescription();
}


class OrcArmy implements Army {

    @Override
    public String getDescription() {
        return "This is the orc army!";
    }
}


class ElfArmy implements Army {

    @Override
    public String getDescription() {
        return "This is the Elven army!";
    }
}
```

## Builder（建造者模式）

> 将一个复杂对象的构建与它的表示分离，使同样的构建过程可以创建不同的表示。
>
> Separate the construction of a complex object from its representation so that the same construction process can create different representations.

Builder 模式用于解决 telescoping constructor anti-pattern：当构造函数参数组合不断增多时，构造函数的数量会呈指数级增长。Builder 模式不使用大量构造函数，而是引入另一个对象 builder，逐步接收每个初始化参数，最后一次性返回构建完成的对象。

```java
    public static void main(String[] args) {
        NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8).calories(100).sodium(35).carbohydrate(27).build();
    }
```

```java
public class NutritionFacts {
    private final int servingSize;
    private final int servings;
    private final int calories;
    private final int fat;
    private final int sodium;
    private final int carbohydrate;

    public static class Builder {
        // Required parameters
        private final int servingSize;
        private final int servings;

        // Optional parameters - initialized to default values
        private int calories = 0;
        private int fat = 0;
        private int sodium = 0;
        private int carbohydrate = 0;

        public Builder(int servingSize, int servings) {
            this.servingSize = servingSize;
            this.servings = servings;
        }

        public Builder calories(int val) {
            calories = val;
            return this;
        }

        public Builder fat(int val) {
            fat = val;
            return this;
        }

        public Builder sodium(int val) {
            sodium = val;
            return this;
        }

        public Builder carbohydrate(int val) {
            carbohydrate = val;
            return this;
        }

        public NutritionFacts build() {
            return new NutritionFacts(this);
        }
    }

    private NutritionFacts(Builder builder) {
        servingSize = builder.servingSize;
        servings = builder.servings;
        calories = builder.calories;
        fat = builder.fat;
        sodium = builder.sodium;
        carbohydrate = builder.carbohydrate;
    }
}
```

## Factory Method（工厂方法模式，别名 Virtual Constructor）

> 定义一个创建对象的接口，让子类决定实例化哪一个类。Factory Method 使一个类的实例化延迟到其子类。
>
> Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.

Factory Method 通过 factory method 创建对象，而不指定将要创建的对象的确切类：factory method 定义在接口中由子类实现，或定义在基类中由派生类按需 override，客户端调用 factory method 而不是构造函数。

```java
  public static void main(String[] args) {
        FactoryMethod obj = new FactoryMethod(new OrcBlacksmith());
        obj.manufactureWeapons();
        obj = new FactoryMethod(new ElfBlacksmith());
        obj.manufactureWeapons();
    }
```

```java
public class FactoryMethod {
    private Blacksmith blacksmith;

    public FactoryMethod(Blacksmith blacksmith) {
        this.blacksmith = blacksmith;
    }

    public void manufactureWeapons() {
        Weapon weapon;
        weapon = blacksmith.manufactureWeapons(WeaponType.SPEAR);
        System.out.println(weapon.toString());
        weapon = blacksmith.manufactureWeapons(WeaponType.AXE);
        System.out.println(weapon.toString());
    }
}
```

```java
enum WeaponType {
    SPEAR("spear"), AXE("axe");

    private String title;

    WeaponType(String title) {
        this.title = title;
    }

    @Override
    public String toString() {
        return super.toString();
    }
}
```

兽人（Orc）与精灵（Elf）铁匠（Blacksmith）：

```java
interface Blacksmith {
    Weapon manufactureWeapons(WeaponType weaponType);
}


class OrcBlacksmith implements Blacksmith {

    @Override
    public Weapon manufactureWeapons(WeaponType weaponType) {
        return new OrcWeapon(weaponType);
    }
}


class ElfBlacksmith implements Blacksmith {

    @Override
    public Weapon manufactureWeapons(WeaponType weaponType) {
        return new ElfWeapon(weaponType);
    }
}
```

```java
interface Weapon {
    WeaponType getWeaponType();
}


class OrcWeapon implements Weapon {

    private WeaponType weaponType;

    public OrcWeapon(WeaponType weaponType) {
        this.weaponType = weaponType;
    }

    @Override
    public WeaponType getWeaponType() {
        return weaponType;
    }

    @Override
    public String toString() {
        return "Orcish " + weaponType;
    }
}


class ElfWeapon implements Weapon {
    private WeaponType weaponType;

    public ElfWeapon(WeaponType weaponType) {
        this.weaponType = weaponType;
    }

    @Override
    public WeaponType getWeaponType() {
        return weaponType;
    }

    @Override
    public String toString() {
        return "Elven " + weaponType;
    }
}
```

## Prototype（原型模式）

> 用原型实例指定创建对象的种类，并通过克隆（clone）这个原型来创建新对象。
>
> Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype.

### Explanation

现实类比

> 还记得 Dolly 吗？那只被克隆出来的羊！细节不必深究，关键在于：这一切都是关于克隆。

通俗地说

> 基于一个已有的对象，通过克隆来创建新对象。

一句话总结：Prototype 允许你复制一个现有对象并按需修改，免去从头创建对象、逐项初始化的麻烦。

### Programmatic Example

在 Java 中，实现 `Cloneable` 并重写 `Object` 的 `clone` 即可轻松做到：

```java
class Sheep implements Cloneable {
  private String name;
  public Sheep(String name) { this.name = name; }
  public void setName(String name) { this.name = name; }
  public String getName() { return name; }
  @Override
  public Sheep clone() throws CloneNotSupportedException {
    return new Sheep(name);
  }
}
```

克隆之后按需修改：

```java
Sheep original = new Sheep("Jolly");
System.out.println(original.getName()); // Jolly

// Clone and modify what is required
Sheep cloned = original.clone();
cloned.setName("Dolly");
System.out.println(cloned.getName()); // Dolly
```

### Applicability

当一个系统不依赖于其产品的创建、组合与表示方式时，可以使用 Prototype；此外：

* 待实例化的类在运行期才能确定，例如通过动态加载（dynamic loading）
* 避免构建一个与产品类层次平行的工厂类层次
* 一个类的实例只有少数几种状态组合。这时维护对应数量的原型并克隆它们，可能比每次手动以相应状态实例化更方便
* 与克隆相比，对象创建的开销很大

### Real world examples

* [java.lang.Object#clone()](http://docs.oracle.com/javase/8/docs/api/java/lang/Object.html#clone%28%29)

## Singleton（单例模式）

确保一个类只有一个实例，并提供一个全局访问点。

### 饿汉式（eagerly initialized singleton）

类加载时即创建实例，天然线程安全，一般用这种。

```java
public class Singleton {
	private static Singleton instance = new Singleton();
	private Singleton() {};
	public static Singleton getInstance() {
		return instance;
	}
}
```

### 静态内部类（initialization-on-demand holder）

利用 classloader 机制保证线程安全，同时实现延迟加载（lazy initialization）。

```java
public class Singleton {
	private Singleton() {};

	private static class SingletonHolder {
		private static Singleton instance = new Singleton();
	}

	public static Singleton getInstance() {
		return SingletonHolder.instance;
	}
}
```

### 懒汉式（lazily initialized singleton）

实例在第一次使用时才创建，需要考虑线程安全问题。下面是 double-checked locking 写法，注意 `instance` 必须声明为 `volatile`，防止指令重排导致其他线程引用到未完全初始化的对象：

```java
public class Singleton {
	private static volatile Singleton instance = null;
	private Singleton() {};
	public static Singleton getInstance() {
		if (instance == null) {
			synchronized (Singleton.class) {
				if (instance == null) {
					instance = new Singleton();
				}
			}
		}
		return instance;
	}
}
```

此外，《Effective Java》还推荐用单元素的 enum 实现 Singleton：写法最简洁，天然线程安全，且能防止反射和序列化破坏单例。
