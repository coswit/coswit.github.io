# 重构 API（Refactoring APIs，第 11 章）

函数与调用方之间的边界就是 API。本章处理接口形状的经典问题：查询与修改混在一起、相似函数参数化、标记参数、散装参数、参数与查询的取舍、构造方式、以及函数与命令（Command）的互换。

> 示例用 Java 改写（原书为 JavaScript）。

本章手法：

| 手法 | 一句话 |
| --- | --- |
| Separate Query from Modifier 将查询函数和修改函数分离 | 有副作用的函数拆成"问"和"改"两个 |
| Parameterize Function 函数参数化 | 只有字面值之差的多个函数合成一个带参函数 |
| Remove Flag Argument 移除标记参数 | 布尔开关参数拆成显式的两个函数 |
| Preserve Whole Object 保持对象完整 | 从一个对象里抽几个字段传，不如整个传 |
| Replace Parameter with Query 以查询取代参数 | 调用方能自己算出的参数删掉 |
| Replace Query with Parameter 以参数取代查询 | 函数内部够不着的依赖提为参数（互逆） |
| Remove Setting Method 移除设值函数 | 构造后就不再变的字段删掉 setter |
| Replace Constructor with Factory Function 以工厂函数取代构造函数 | 构造逻辑复杂/需返回子类时用工厂 |
| Replace Function with Command 以命令取代函数 | 行为装进对象，获得撤销/组合/排队 |
| Replace Command with Function 以函数取代命令 | 命令超编时改回普通函数（互逆） |

## Separate Query from Modifier（将查询函数和修改函数分离）

**意图**：一个既返回值又改状态的函数，拆成"只读的查询"和"只改的修改"两个函数。

### 动机

* 有返回值又有副作用的函数让调用方陷入两难：只想问一下，就得连修改一起吃下；排查 bug 时也无法自由地调用它观察结果；
> 有副作用的函数应该**改什么就返回 void**，查询应该**只回答问题**——两边都一目了然。
* 拆开后，值来自哪、状态改在哪，边界清晰可测；这也是"命令查询分离（CQS）"原则在函数粒度的落地；
* 原书提醒一个微妙点：拆分会产生时序耦合（先查后改期间状态可能被人动过）——并发要求极高的场景要谨慎评估，而不是教条地拆。

### 做法

1. 把现有的函数改名为修改函数（或新建），让它只做修改、不返回值（内部的计算用 **Extract Function** 圈出）；
2. 新建一个同语义的**查询函数**，返回原返回值；
3. 逐个修改调用点：先调查询拿值，再调修改；测试后删掉旧形态。

### 示例

```java
// before：一石二鸟——名字叫"找坏人"，顺手把警报也发了
String alertForMiscreant(List<Person> people) {
    for (Person p : people) {
        if (p.name.equals("Don") || p.name.equals("John")) {
            setOffAlarms();
            return p.name;
        }
    }
    return "";
}

// after：问与改各归各位
String findMiscreant(List<Person> people) {          // 查询：随便调，无副作用
    return people.stream().map(p -> p.name)
            .filter(n -> n.equals("Don") || n.equals("John"))
            .findFirst().orElse("");
}

void alertForMiscreant(List<Person> people) {        // 修改：改状态，不返回
    if (!findMiscreant(people).isEmpty()) {
        setOffAlarms();
    }
}
```

## Parameterize Function（函数参数化）

> 曾用名：Parameterize Method（第 1 版）

**意图**：几个函数只差个别字面值（系数、阈值、倍率）时，合并成一个以该值为参数的函数。

### 动机

* `fivePercentRaise` 与 `tenPercentRaise` 的差别只在 `0.05`/`0.10`——两份代码各自维护，改一处忘一处；
* 参数化后差异点被推到**签名**上：函数负责共性，参数承载差异；
* 前置判断：差异若不止字面值（逻辑结构都不同），先 Extract Function 看清结构再决定，别硬参数化成多参数开关（那会滑向 Remove Flag Argument 要修的味道）。

### 做法

1. 选一个函数做底版，把差异字面值换成参数（**Change Function Declaration**，先加参数、暂不删旧函数）；
2. 让旧函数转调新函数（把字面值传进去），调用点全部验证通过；
3. 以此为底版逐个吸收其他变体：每吸收一个，删除一个旧函数，测试。

### 示例

```java
// before：两份只差系数的代码
void tenPercentRaise(double salary)   { salary *= 1.10; }
void fivePercentRaise(double salary)  { salary *= 1.05; }

// after
void raise(double salary, double factor) { salary *= factor; }

raise(salary, 1.10);
raise(salary, 1.05);
```

## Remove Flag Argument（移除标记参数）

**意图**：调用方用布尔/枚举开关选择函数行为的参数，改为按行为拆分出的显式函数。

### 动机

* `deliveryDate(order, true)` —— 调用点读到 `true` 完全不知道是什么意思，得跳进函数体看 if 分支；开关参数让**一个签名承载两个行为**；
* 拆成 `rushDeliveryDate(order)` 与 `regularDeliveryDate(order)` 后，签名自释；
* 与 Parameterize Function 的边界：参数化承接的是**数量/程度**之差（倍率、阈值），开关参数承载的是**行为**之差——后者该拆，前者该合；
* 保留开关参数的例外：内部实现层的分发（如 `send(to, isUrgent)` 在一个排序函数里选策略）确实简单时，两函数共享实现即可（见做法 3）。

### 做法

1. 为每种取值创建显式函数（如 isRush=true/false → rush/regular 两个）；旧函数体内部先按开关分发转调它们；
2. 调用点逐个改用新函数；
3. 若旧函数仍被多处使用：将其降级为内部私有或删除；两个新函数间共享的实现用一个私有函数承载。

### 示例

```java
// before：true 是什么意思？读调用点完全不明
LocalDate deliveryDate(Order order, boolean isRush) {
    int deliveryTime = isRush ? 1 : 2;
    return order.placedOn().plusDays(deliveryTime + businessDays(order));
}
LocalDate d = deliveryDate(anOrder, true);

// after：两种交付各自有名，实现共享不分家
LocalDate rushDeliveryDate(Order order) {
    return order.placedOn().plusDays(1 + businessDays(order));
}
LocalDate regularDeliveryDate(Order order) {
    return order.placedOn().plusDays(2 + businessDays(order));
}
LocalDate d = rushDeliveryDate(anOrder);
```

## Preserve Whole Object（保持对象完整）

**意图**：从一个对象里抽出几个字段当参数传，改为直接传整个对象。

### 动机

* `plan.withinRange(low, high)` 里的 low/high 其实来自同一个 `tempRange` 对象——抽字段传递是"拆了整件再递零件"；
* 传整对象的好处：签名更短、参数列表不再增长（明天要加个字段不用改签名）、参数间的一致性由对象保证；
* **代价（原书特别强调）**：调用方与被调方之间**多了一条对象耦合**——被调方从此看得见（乃至够得着）整个对象。若二者本不该相识（跨层 API），宁可忍受传值列表；
* 与 Introduce Parameter Object 的配合：散字段先成对象，再整传。

### 做法

1. 在被调函数上新增一个"整对象"参数（Change Function Declaration 迁移式），函数体改用对象的访问器；
2. 调用点改为传对象，逐步删除旧参数，测试。

### 示例

```java
// before：从 room 里抽出 low/high 递零件
boolean withinRange(HeatingPlan plan, int low, int high) { ... }

Room room = ...;
boolean isWithin = withinRange(plan, room.lowestTemp(), room.highestTemp());

// after：整件递过去
boolean withinRange(HeatingPlan plan, TempRange range) {
    return range.high() >= plan.lowest() && range.low() <= plan.highest();
}

boolean isWithin = withinRange(plan, room.tempRange());
```

## Replace Parameter with Query（以查询取代参数）

**意图**：参数值能由函数自己（从其他参数或自身状态）算出时，删掉这个参数。

### 动机

* 参数越少接口越干净：可传错的槽位少一个，调用方少操心一份；
* "函数已持有算出它所需的全部信息，却还要调用方代劳"是常见的接口噪音（`discountedPrice(basePrice)` 里 basePrice 本就是 order 的属性）；
* **不该用的情形**：为算这个值，函数需要去抓新的依赖（如读全局状态、加一个重量级依赖）——那是 Replace Query with Parameter 的地盘；同理，参数值"逻辑上由调用方决定"（两个调用方传不同值是**语义差异**而非噪音）时保留参数。

### 做法

1. 若计算有副作用或成本高：先处理（提炼查询、评估性能）；
2. 在函数体内就地计算该值，替换参数引用；
3. 用 **Change Function Declaration** 从签名中删除参数，逐调用点迁移，测试。

### 示例

```java
// before：basePrice 由调用方算好递进来——它本来就是 order 的属性
double finalPrice(Order order) {
    int basePrice = order.basePrice();
    return order.discountedPrice(basePrice);
}

// after
double finalPrice(Order order) {
    return order.discountedPrice();     // 折扣价自己查 basePrice
}
```

## Replace Query with Parameter（以参数取代查询）

**意图**：与上一手法相反——函数内部够不着（或不应直接依赖）的查询，提升为参数交给调用方。

### 动机

* 反向场景同样常见：函数为了拿一个值，不得不伸手抓全局状态、宿主对象或环境依赖——**依赖被藏进了函数体**，调用方看签名以为无牵无挂；
* 把查询提为参数后，依赖在签名上**显式可见**：测试时好替身、调用方掌握供给、函数本身变得纯粹；
* 代价：每个调用方都要多传一个参数，复杂度外移——所以这对手法（↔ Replace Parameter with Query）是**拨盘**：把依赖藏进函数（方便调用）还是推给调用方（依赖显式），按耦合方向权衡。原书的经验：**被迫引入的依赖（跨模块抓取）优先参数化；自家数据能算的优先查询化**。

### 做法

1. 找出函数体内"够不着才去抓"的依赖查询；
2. 为该值添加参数（Change Function Declaration 迁移式），函数体改用参数；
3. 调用点在调用处求值传入；迁完后删除函数内对旧依赖的引用，测试。

### 示例

```java
// before：目标温度函数偷偷依赖全局选中的温控器——签名看不出来
class HeatingPlan {
    double targetTemperature() {
        TempRange selected = globalThermostat.selectedRange();   // ← 藏着的全局依赖
        return 6 + selected.mid();
    }
}

// after：谁有恒温器谁传入；HeatingPlan 不再认识 globalThermostat
class HeatingPlan {
    double targetTemperature(TempRange selectedRange) {
        return 6 + selectedRange.mid();
    }
}

// 调用方（恰好持有温控器）
if (plan.targetTemperature(thermostat.selectedRange()) > currentTemp()) { ... }
```

## Remove Setting Method（移除设值函数）

**意图**：字段只在构造时赋值，删除 setter。

### 动机

* 类上存在 setter，就是在向读者宣布"这个值以后可以改"；实际不可改的值留着 setter，读者要翻遍代码才敢确信"没人调它"；
* 删除 setter（配 final 字段）让**不可变性写在类型上**，可变性嫌疑即刻消除；
* 是 Encapsulate Variable / Encapsulate Record 家族的收尾动作之一。

### 做法

1. 确认所有写路径都发生在构造期间；
2. 构造函数直接对字段赋值（绕过 setter），调用点若在构造后 set → 把值挪进构造参数；
3. 删除 setter、字段标 final，测试。

### 示例

```java
// before
class Person {
    private String name;
    Person(String name) { this.name = name; }
    void setName(String name) { this.name = name; }   // 从没人调用
}

// after
class Person {
    private final String name;
    Person(String name) { this.name = name; }
}
```

## Replace Constructor with Factory Function（以工厂函数取代构造函数）

> 曾用名：Replace Constructor with Factory Method（第 1 版）

**意图**：构造逻辑需要"按条件返回不同子类/缓存实例/具名表达"时，用工厂函数包住构造。

### 动机

* 构造函数的三个先天限制：名字只能是类名（说不清意图）、必须返回本类的新实例（不能返回子类/缓存）、不能起多个同签名的不同语义名字；
* 工厂函数全部解锁：`createEmployee(type)` 按类型造子类、`Currency.of("USD")` 从缓存取、`localDate(...)`/`epochDay(...)` 两个名字两个入口；
* 它也是 **Replace Type Code with Subclasses** 的固定搭档：类型码换子类后，创建点必须按类型分发——工厂正是那个分发点（GoF Factory Method 的镜像场景，见 [../GoF/01-Creational-Patterns.md](../GoF/01-Creational-Patterns.md)）；
* 简单直白的构造不需要工厂——别为仪式感包一层。

### 做法

1. 创建工厂函数（以创建意图命名），内部转调构造函数；
2. 逐个把 `new` 调用点改为工厂调用（迁移式），测试；
3. 全部迁完，构造函数按需收为 private。

### 示例

```java
// before：调用方按类型码分发构造——子类知识泄漏到每个调用点
Employee e = type.equals("engineer") ? new Engineer(name)
          : type.equals("salesman")  ? new Salesman(name)
          : new Manager(name);

// after：分发收进工厂，调用方只说"给我一个员工"
static Employee createEmployee(String name, String type) {
    return switch (type) {
        case "engineer" -> new Engineer(name);
        case "salesman" -> new Salesman(name);
        case "manager"  -> new Manager(name);
        default -> throw new IllegalArgumentException("unknown type: " + type);
    };
}

Employee e = Employee.createEmployee(name, type);
```

## Replace Function with Command（以命令取代函数）

**意图**：把独立的行为封装成对象（命令），函数逻辑搬入其 `execute()`。

### 动机

* 普通函数调用即执行，无法**延迟、排队、撤销、组合、记录**；命令对象是一个"行为包"：可以带着参数躺在队列里、可以提供 `undo()`、可以被组合与序列化（GoF Command 模式的全部动机，见 [../GoF/03-Behavioral-Patterns.md](../GoF/03-Behavioral-Patterns.md)）；
* 另一动机：复杂过程"多函数共享一堆中间变量"时，命令对象给这些变量一个家（Combine Functions into Class 的特例）；
> Fowler 的忠告：**别默认上命令**。命令带来类、间接层与一套生命周期，99% 的场景普通函数就够；只在真需要撤销/排队/组合这些能力时引入。

### 做法

1. 为函数创建同名概念的命令类，函数参数转为构造参数（存字段）；
2. 把函数体搬进 `execute()`（Move Function）；
3. 调用点改为 `new XxxCommand(args).execute()`；需要的能力（undo、入队、组合）随后在命令类上生长。

### 示例

```java
// before：函数直接执行，无法撤销/排队
void charge(Customer customer, double amount) {
    double baseAmount = amount * customer.rate();
    applyTax(baseAmount);
    deduct(customer, baseAmount + tax(baseAmount));
}

// after：行为被打包成对象——可排队、可撤销、可审计
class ChargeCommand {
    private final Customer customer;
    private final double amount;
    private double executedAmount;

    ChargeCommand(Customer customer, double amount) {
        this.customer = customer; this.amount = amount;
    }

    void execute() {
        executedAmount = amount * customer.rate();
        deduct(customer, executedAmount + tax(executedAmount));
    }

    void undo() {                                   // 命令才有资格谈撤销
        refund(customer, executedAmount + tax(executedAmount));
    }
}

// 调用方
queue.offer(new ChargeCommand(customer, 100.0));    // 排队、批量、日志都成为可能
```

## Replace Command with Function（以函数取代命令）

**意图**：与上一手法互逆——命令没有兑现它的复杂度（无人需要撤销/排队/组合）时，退回普通函数。

### 动机

* 命令是**为能力付费**的结构：类、间接层、状态管理。当初"以防万一"上的命令，到头来只有一处 `execute()` 调用——它成了 Lazy Element；
* 语义上仍是一次性的过程调用，退回函数，删掉仪式。

### 做法

1. 把 `execute()` 的逻辑提炼/搬移为顶层函数（参数来自命令的字段）；
2. 调用点改为函数调用，删除命令类，测试。

### 示例

```java
// before：仪式感十足的命令，其实只有一个调用点
class ChargeCommand {
    void execute() { deduct(customer, amount * customer.rate()); }
}
new ChargeCommand(customer, 100.0).execute();

// after
void charge(Customer customer, double amount) {
    deduct(customer, amount * customer.rate());
}
charge(customer, 100.0);
```

---

## 小结：参数设计的拨盘

本章最核心的一对张力在 Replace Parameter with Query ↔ Replace Query with Parameter 之间：

* **依赖该藏还是该露**：函数能自算的 → 查询（调用方省心）；函数够不着的 → 参数（依赖显式、可测试）；
* 其余手法都在给接口"塑形"：副作用分离（Query/Modifier）、共性与差异分离（Parameterize / Remove Flag）、传零件还是传整机（Preserve Whole Object）、创建点收编（Factory）、行为打包或解包（Command ↔ Function）。

接口形状定了，最后一章处理面向对象最重的结构——**继承** → [08-处理继承关系.md](08-处理继承关系.md)。
