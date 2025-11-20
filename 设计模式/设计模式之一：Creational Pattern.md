
## Singleton
饿汉式，线程安全，一般用，eagerly initialized singleton

```java
public class Singleton {
	private static Singleton instance=new Singleton();
	private Singleton(){};
	public static Singleton getInstance(){
		return instance;
	}
}
```

内部类

```java
public class Singleton{
	private Singleton() {};
    
	private static class SingletonHolder{
		private static Singleton instance=new Singleton();
	} 
	
	public static Singleton getInstance(){
		return SingletonHolder.instance;
	}
}
```

懒汉式   需要考虑线程安全问题

```java
public class Singleton {
	private static Singleton instance=null;
	private Singleton() {};
	public static Singleton getInstance(){
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

## Abstract Factory（Kit）

Design Patterns中定义：

> Provide an interface for creating families of related or dependent objects  without specifying their concrete classes.



> The Abstract Factory pattern provides a way to encapsulate a group of individual factories that have a common theme without specifying their concrete classes. In normal usage, the client software creates a concrete implementation of the abstract factory and then uses the generic interface of the factory to create the concrete objects that are part
of the theme. The client does not know (or care) which concrete objects it gets from each of these internal factories, since it uses only the generic interfaces of their products. This pattern separates the details of implementation of a set of objects from their general usage and relies on object composition, as object creation is implemented in methods exposed in the factory interface.



```java
  public static void main(String[] args) {
        KingdomFactory factory = makeFactory(KingdomType.ELF);
        AbstractFactory obj = new AbstractFactory();
        obj.creatKingdow(factory);
        System.out.println(obj.getArmy().getDescription());
        System.out.println(obj.getKing().getDescription());

        factory = makeFactory(KingdomType.ORC);
        obj.creatKingdow(factory);
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

    public  void creatKingdow(KingdomFactory factory){
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
## Factory Method (Virtual Constructor)
> 定义一个创建对象的接口，让子类决定实例化哪个类。类的实例化延迟到子类。
>
> Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.

> The Factory Method is a creational design pattern which uses factory methods to deal with the problem of creating objects without specifying the exact class of object that will be created. This is done by creating objects via calling a factory method either specified in an interface
and implemented by child classes, or implemented in a base class and optionally overridden by derived classes—rather than by calling a constructor.


```java
  public static void main(String[] args) {
        FactoryMetchod obj = new FactoryMetchod(new OrcBlacksmith());
        obj.manufactureWeapons();
        obj = new FactoryMetchod(new ElfBlacksmith());
        obj.manufactureWeapons();
    }

```
```java
public class FactoryMetchod {
    private Blacksmith blacksmith;

    public FactoryMetchod(Blacksmith blacksmith) {
        this.blacksmith = blacksmith;
    }

    public void manufactureWeapons() {
        Weapon weapon;
        weapon = blacksmith.manufactureWeapons(WeaponType.SPEAR);
        System.out.println(weapon.toString());
        weapon = blacksmith.manufactureWeapons(WeaponType.AEX);
        System.out.println(weapon.toString());
    }
}
```
```java
enum WeaponType{
    SPEAR("spear"),AEX("aex");
    
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
兽人和精灵铁匠
```java
interface Blacksmith{
    Weapon manufactureWeapons(WeaponType weaponType);
}


class OrcBlacksmith implements Blacksmith{

    @Override
    public Weapon manufactureWeapons(WeaponType weaponType) {
        return new OrcWeapon(weaponType);
    }
}


class ElfBlacksmith implements Blacksmith{

    @Override
    public Weapon manufactureWeapons(WeaponType weaponType) {
        return new ElfWeapon(weaponType);
    }
}
```
```java
interface Weapon{
    WeaponType getWeaponType();
}


class OrcWeapon implements Weapon{

    private  WeaponType weaponType;

    public OrcWeapon(WeaponType weaponType) {
        this.weaponType = weaponType;
    }

    @Override
    public WeaponType getWeaponType() {
        return weaponType;
    }
    @Override
    public String toString() {
        return "Orcish "+weaponType;
    }
}



class ElfWeapon implements Weapon{
    private  WeaponType weaponType;

    public ElfWeapon(WeaponType weaponType) {
        this.weaponType = weaponType;
    }

    @Override
    public WeaponType getWeaponType() {
        return weaponType;
    }
    @Override
    public String toString() {
        return "Elven " +weaponType;
    }
}
```
## Builder
> Separate the construction of a complex object from its representation so that the same construction process can create different representations.

> The intention of the Builder pattern is to find a solution to the telescoping constructor anti-pattern. The telescoping constructor anti-pattern occurs when the increase of object constructor parameter combination leads to an exponential list of constructors. Instead of using numerous constructors, the builder pattern uses another object, a builder, that receives each initialization parameter step by step and then returns the resulting constructed object at once.



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
## Prototype

### Intent
Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype.

### Explanation
Real world example

> Remember Dolly? The sheep that was cloned! Lets not get into the details but the key point here is that it is all about cloning.

In plain words

> Create object based on an existing object through cloning.

Wikipedia says

> The prototype pattern is a creational design pattern in software development. It is used when the type of objects to create is determined by a prototypical instance, which is cloned to produce new objects.

In short, it allows you to create a copy of an existing object and modify it to your needs, instead of going through the trouble of creating an object from scratch and setting it up.

**Programmatic Example**

In Java, it can be easily done by implementing `Cloneable` and overriding `clone` from `Object`

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

Then it can be cloned like below

```java
Sheep original = new Sheep("Jolly");
System.out.println(original.getName()); // Jolly

// Clone and modify what is required
Sheep cloned = original.clone();
cloned.setName("Dolly");
System.out.println(cloned.getName()); // Dolly
```

### Applicability
Use the Prototype pattern when a system should be independent of how its products are created, composed and represented; and

* when the classes to instantiate are specified at run-time, for example, by dynamic loading
* to avoid building a class hierarchy of factories that parallels the class hierarchy of products
* when instances of a class can have one of only a few different combinations of state. It may be more convenient to install a corresponding number of prototypes and clone them rather than instantiating the class manually, each time with the appropriate state
* when object creation is expensive compared to cloning

### Real world examples

* [java.lang.Object#clone()](http://docs.oracle.com/javase/8/docs/api/java/lang/Object.html#clone%28%29)



