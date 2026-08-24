## 1. CountDownTimer

倒计时抽象类,内部基于 Handler 实现,回调(onTick/onFinish)运行在**主线程**,可以直接更新 UI:

```java
public abstract class CountDownTimer {

    /**
     * Millis since epoch when alarm should stop.
     */
    private final long mMillisInFuture;

    /**
     * The interval in millis that the user receives callbacks
     */
    private final long mCountdownInterval;

    private long mStopTimeInFuture;

    /**
    * boolean representing if the timer was cancelled
    */
    private boolean mCancelled = false;


    public CountDownTimer(long millisInFuture, long countDownInterval) {
        mMillisInFuture = millisInFuture;
        mCountdownInterval = countDownInterval;
    }


    public synchronized final void cancel() {
        mCancelled = true;
        mHandler.removeMessages(MSG);
    }


    public synchronized final CountDownTimer start() {
        mCancelled = false;
        if (mMillisInFuture <= 0) {
            onFinish();
            return this;
        }
        mStopTimeInFuture = SystemClock.elapsedRealtime() + mMillisInFuture;
        mHandler.sendMessage(mHandler.obtainMessage(MSG));
        return this;
    }


    /**
     * Callback fired on regular interval.
     * @param millisUntilFinished The amount of time until finished.
     */
    public abstract void onTick(long millisUntilFinished);

    /**
     * Callback fired when the time is up.
     */
    public abstract void onFinish();


    private static final int MSG = 1;


    // handles counting down
    private Handler mHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {

            synchronized (CountDownTimer.this) {
                if (mCancelled) {
                    return;
                }

                final long millisLeft = mStopTimeInFuture - SystemClock.elapsedRealtime();

                if (millisLeft <= 0) {
                    onFinish();
                } else {
                    long lastTickStart = SystemClock.elapsedRealtime();
                    onTick(millisLeft);

                    // take into account user's onTick taking time to execute
                    long lastTickDuration = SystemClock.elapsedRealtime() - lastTickStart;
                    long delay;

                    if (millisLeft < mCountdownInterval) {
                        // just delay until done
                        delay = millisLeft - lastTickDuration;

                        // special case: user's onTick took more than interval to
                        // complete, trigger onFinish without delay
                        if (delay < 0) delay = 0;
                    } else {
                        delay = mCountdownInterval - lastTickDuration;

                        // special case: user's onTick took more than interval to
                        // complete, skip to next interval
                        while (delay < 0) delay += mCountdownInterval;
                    }

                    sendMessageDelayed(obtainMessage(MSG), delay);
                }
            }
        }
    };
}
```

源码要点:

- 时间基准是 **SystemClock.elapsedRealtime()**(开机以来的时间,含深度睡眠),不受用户改系统时间影响
- 下一次 onTick 的延迟会**扣除本次 onTick 的执行耗时**(lastTickDuration),避免累积误差
- onTick 耗时超过一个间隔时会跳到下一个间隔,保证 onFinish 按时触发

## 2. Timer

运行在**子线程**,回调中不可直接更新 UI:

```java
Timer timer = new Timer();
TimerTask timerTask = new TimerTask() {
    @Override
    public void run() {

    }
};

timer.schedule(timerTask, 100, 1000);
```

## 3. ScheduledExecutorService

Timer 的推荐替代品,基于线程池,单个任务抛异常不会终止整个调度线程:

```java
ScheduledExecutorService executorService = new ScheduledThreadPoolExecutor(1);
executorService.schedule(timerTask, 1000, TimeUnit.MILLISECONDS);
```

```java
public ScheduledThreadPoolExecutor(int corePoolSize,
                                       ThreadFactory threadFactory) {
                                       }
```

## 4. Handler.postDelayed 与选型对比

更简单的一次性/循环延时常用 Handler 实现:

```java
new Handler(Looper.getMainLooper()).postDelayed(() -> {
    // 主线程执行,可更新 UI
}, 1000);
```

Kotlin 项目中更推荐协程方式,structured concurrency 保证随作用域自动取消,不易泄漏:

```kotlin
val job = scope.launch {
    delay(1000)          // 一次性延时
    while (isActive) {   // 循环任务
        doWork()
        delay(1000)
    }
}
job.cancel() // 页面销毁时取消
```

几种方式的选型对比:

| 方式 | 回调线程 | 适用场景 | 注意点 |
| --- | --- | --- | --- |
| CountDownTimer | 主线程 | 倒计时场景(验证码、闪屏) | 内部持有 Handler,注意及时 cancel 防止内存泄漏 |
| Timer | 单一子线程 | 简单定时/周期任务 | 任务异常会终止整个 Timer;单线程串行,长任务会阻塞后续任务 |
| ScheduledExecutorService | 线程池子线程 | 并发、健壮的定时任务 | Timer 的现代替代品 |
| Handler.postDelayed | 主线程 | UI 相关的延时执行 | 循环任务需在回调里重新 post;退出时 removeCallbacks |
| Kotlin 协程 delay | 调度器指定线程 | 可取消的延时与循环任务 | 随作用域自动取消,配合 viewModelScope/lifecycleScope 使用 |
