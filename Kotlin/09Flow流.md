## 接口定义

```kotlin
public interface Flow<out T> {
    public suspend fun collect(collector: FlowCollector<T>)
}

public fun interface FlowCollector<in T> {
    public suspend fun emit(value: T)
}
```

`flow{..}`的过程：

```kotlin
public fun <T> flow(block: suspend FlowCollector<T>.() -> Unit): Flow<T> = 
    SafeFlow(block)

private class SafeFlow<T>(private val block: suspend FlowCollector<T>.() -> Unit) : AbstractFlow<T>() {
    override suspend fun collectSafely(collector: FlowCollector<T>) {
        collector.block() // 关键点：直接运行你传入的代码块
    }
}
```

1. 当写`flow { emit(1) }`时，传入lambda代码块只是被保存在了`block`变量中，没有任何代码运行。
2. 当进行`collect`调用时，并不是去取数据，只是把“处理逻辑”注入到“生产逻辑”中。
3. `flow.collect { value -> println(value) }`的过程：
   1) 实现了一个匿名函数`FlowCollector`，其方法是`emit(1)`
   2) 触发`collect`时，运行自定义的生产逻辑。
   3) 当自定义的生产逻辑运行到`emit`方法时，运行传入`emit(1)`实现方法。

### 使用

Flow是基于协程的响应式流，用于处理处理异步数据流，类似于RXJava的Observable。

```kotlin
fun createValues(): Flow<Int> {
    return flow {
        emit(1)
        delay(1000.milliseconds)
        emit(2)
        delay(1000.milliseconds)
        emit(3)
        delay(1000.milliseconds)
    }
}

fun main() = runBlocking {
    val myFlowOfValues = createValues()
    myFlowOfValues.collect { log(it) } //每隔1000ns输出一次
}
```

## Cold Flow

冷流，本身不会被执行，只有当被调用时(collect)才会开始执行，且每次collect都会重新执行：

```kotlin
val letters = flow {
    log("Emitting A!")
    emit("A")
    delay(200.milliseconds)
    log("Emitting B!")
    emit("B")
}

fun main() = runBlocking {
    letters.collect {
        log("Collecting $it")
        delay(500.milliseconds)
    }
}
/*
0 [main] Emitting A!
5 [main] Collecting A
727 [main] Emitting B!
727 [main] Collecting B
*/
```

同一flow多次请求collect时：

```kotlin
fun main() = runBlocking {
    letters.collect {
        log("(1) Collecting $it")
        delay(500.milliseconds)
    }
    letters.collect {
        log("(2) Collecting $it")
        delay(500.milliseconds)
    }
}
/*
0 [main] Emitting A!
8 [main] (1) Collecting A
739 [main] Emitting B!
739 [main] (1) Collecting B
1266 [main] Emitting A!
1266 [main] (2) Collecting A
1990 [main] Emitting B!
1990 [main] (2) Collecting B
*/
```

### flow的取消

```kotlin
val counterFlow = flow {
    var x = 0
    while (true) {
        emit(x++)
        delay(200.milliseconds)
    }
}

fun main() = runBlocking {
    val collector = launch {
        counterFlow.collect {
            println(it)
        }
    }
    delay(1000.milliseconds)
    collector.cancel()
}
// 0 1 2 3 4
```

### channel  flow

`channelFlow`主要解决在普通flow中，不允许在其内部使用`withContext`切换协程去进行`emit`操作。此外在普通flow中，emit是串行操作的，`channelFlow`可以并发地执行。

```kotlin
suspend fun getRandomNumber(): Int {
    delay(500.milliseconds)
    return Random.nextInt()
}

val randomNumbers = channelFlow {
    repeat(10) {
        launch {
            send(getRandomNumber()) //在不同协程中执行
        }
    }
}

fun main() = runBlocking {
    randomNumbers.collect {
        log(it)
    }
}
```

从源码角度看，`channelFlow`不是在`FlowCollector`上操作，是在`ProducerScope`上操作，`ProducerScope`继承自`CoroutineScope`，意味着可以直接开启子协程：

```kotlin
public fun <T> channelFlow(@BuilderInference block: suspend ProducerScope<T>.() -> Unit): Flow<T> =  ChannelFlowBuilder(block)
```

从源码角度，简化后`channelFlow`的核心逻辑：

```kotlin
override suspend fun collect(collector: FlowCollector<T>) {
    coroutineScope {
        // 1. 创建一个 Channel
        val channel = produceImpl(this) 
        // 2. 将 Channel 的数据导流到 Collector 中
        channel.consumeEach { value ->
            collector.emit(value)
        }
    }
}
```

## Hot Flow

Cold Flow本质上是一个待执行的闭包，只有当调用collect时执行，且每个Collector独享数据源。而Hot Flow会主动发射数据，本质上是 一个状态机+订阅者列表，数据源是共享的，所有订阅者共享同一个生产者的输出，数据产生与是否定阅无关，如果没有订阅者接收数据，则可能会被丢弃。

### Shared  Flow

```kotlin
class RadioStation {
    private val _messageFlow = MutableSharedFlow<Int>()
    val messageFlow = _messageFlow.asSharedFlow() // 转为只读的

    fun beginBroadcasting(scope: CoroutineScope) {
        scope.launch {
            while (true) {
                delay(500.milliseconds)
                val number = Random.nextInt(0..10)
                log("Emitting $number!")
                _messageFlow.emit(number) // 在每个协程中emit
            }
        }
    }
}

fun main(): Unit = runBlocking {
    val radioStation = RadioStation()
    radioStation.beginBroadcasting(this)
    delay(600.milliseconds)
    radioStation.messageFlow.collect {
        log("A collecting $it!")
    }
}
/*
0 [main] Emitting 4!
505 [main] Emitting 3!
506 [main] A collecting 3!
1017 [main] Emitting 3!
1019 [main] A collecting 3!
1519 [main] Emitting 0!
1519 [main] A collecting 0!
2024 [main] Emitting 0!
...
*/
```

如果想收到开始订阅前的数据，可以使用replay参数来实现：

```kotlin
private val _messageFlow = MutableSharedFlow<Int>((replay = 5)
```

