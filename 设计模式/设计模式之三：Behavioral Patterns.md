
### Command
#### Also known as
Action, Transaction

#### Intent
Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.


![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F/02.png)

#### Applicability
Use the Command pattern when you want to

* parameterize objects by an action to perform. You can express such parameterization in a procedural language with a callback function, that is, a function that's registered somewhere to be called at a later point. Commands are an object-oriented replacement for callbacks.
* specify, queue, and execute requests at different times. A Command object can have a lifetime independent of the original request. If the receiver of a request can be represented in an address space-independent way, then you can transfer a command object for the request to a different process and fulfill the request there
* support undo. The Command's execute operation can store state for reversing its effects in the command itself. The Command interface must have an added Unexecute operation that reverses the effects of a previous call to execute. Executed commands are stored in a history list. Unlimited-level undo and redo is achieved by traversing this list backwards and forwards calling unexecute and execute, respectively
* support logging changes so that they can be reapplied in case of a system crash. By augmenting the Command interface with load and store operations, you can keep a persistent log of changes. Recovering from a crash involves reloading logged commands from disk and re-executing them with the execute operation
* structure a system around high-level operations build on primitive operations. Such a structure is common in information systems that support transactions. A transaction encapsulates a set of changes to data. The Command pattern offers a way to model transactions. Commands have a common interface, letting you invoke all transactions the same way. The pattern also makes it easy to extend the system with new transactions

#### Typical Use Case

* to keep a history of requests
* implement callback functionality
* implement the undo functionality

#### Presentations

* [Command Pattern](etc/presentation.html) 

#### Real world examples

* [java.lang.Runnable](http://docs.oracle.com/javase/8/docs/api/java/lang/Runnable.html)
* [Netflix Hystrix](https://github.com/Netflix/Hystrix/wiki)
* [javax.swing.Action](http://docs.oracle.com/javase/8/docs/api/javax/swing/Action.html)

#### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)
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
### Interpreter
![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F/02.png)
#### Intent
Given a language, define a representation for its grammar along
with an interpreter that uses the representation to interpret sentences in the
language.

#### Applicability
Use the Interpreter pattern when there is a language to
interpret, and you can represent statements in the language as abstract syntax
trees. The Interpreter pattern works best when

* the grammar is simple. For complex grammars, the class hierarchy for the grammar becomes large and unmanageable. Tools such as parser generators are a better alternative in such cases. They can interpret expressions without building abstract syntax trees, which can save space and possibly time
* efficiency is not a critical concern. The most efficient interpreters are usually not implemented by interpreting parse trees directly but by first translating them into another form. For example, regular expressions are often transformed into state machines. But even then, the translator can be implemented by the Interpreter pattern, so the pattern is still applicable

#### Real world examples
* [java.util.Pattern](http://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html)
* [java.text.Normalizer](http://docs.oracle.com/javase/8/docs/api/java/text/Normalizer.html)
* All subclasses of [java.text.Format](http://docs.oracle.com/javase/8/docs/api/java/text/Format.html)
* [javax.el.ELResolver](http://docs.oracle.com/javaee/7/api/javax/el/ELResolver.html)


#### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)



### Iterator

#### Also known as
Cursor

#### Intent
Provide a way to access the elements of an aggregate object
sequentially without exposing its underlying representation.

![img](https://java-design-patterns.com/patterns/iterator/etc/iterator_1.png)

#### Applicability
Use the Iterator pattern

* to access an aggregate object's contents without exposing its internal representation
* to support multiple traversals of aggregate objects
* to provide a uniform interface for traversing different aggregate structures

#### Real world examples

* [java.util.Iterator](http://docs.oracle.com/javase/8/docs/api/java/util/Iterator.html)
* [java.util.Enumeration](http://docs.oracle.com/javase/8/docs/api/java/util/Enumeration.html)

#### Credits

* [Design Patterns: Elements of Reusable Object-Oriented Software](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)

### Mediator
> Define an object that encapsulates how a set of objects interact.Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently.

> The Mediator pattern defines an object that encapsulates how a set of objects interact. This pattern is considered to be a behavioral pattern due to the way it can alter the program's running behavior.
#### Memento
### State(Objects for States)
> **Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.**
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
        if(state.getClass().equals(PeacefulState.class)){
            changeStateTo(new AngryState());
        }else {
            changeStateTo(new PeacefulState());
        }
    }
    private void changeStateTo(State newState){
        this.state =newState;
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
        System.out.println(mammoth.toString()+" is calm and peaceful.");
    }

    @Override
    public void onEnterState(Mammoth mammoth) {
        System.out.println(mammoth.toString()+" calms down.");
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
        System.out.println(mammoth.toString()+" is furious!");
    }

    @Override
    public void onEnterState(Mammoth mammoth) {
        System.out.println(mammoth.toString()+" gets angry!");
    }

    @Override
    public String toString() {
        return getClass().getSimpleName();
    }
}
```
### Strategy(Policy)
> **Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.**
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

    public void changeStrategy(DragonSlayingStrategy strategy){
        this.strategy = strategy;
    }

    public void goToBattle() {
        strategy.excute();
    }
}
```
```java
interface DragonSlayingStrategy {
    void excute();
}
```
```java
//抛射
class ProjectileStrategy implements DragonSlayingStrategy {

    @Override
    public void excute() {}
    
}
```
```java
//乱斗
class MeleeStrategy implements DragonSlayingStrategy {
   
    @Override
    public void excute() {}
    
}
```
### Template Method
### Visitor 
> Represent an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.

> Visitor pattern defines mechanism to apply operations on nodes in hierarchy. New operations can be added without altering the node interface.
### Observer

### Chain of Responsibility 