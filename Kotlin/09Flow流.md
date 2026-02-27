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

