##  Handler

官网说明：

> A Handler allows you to send and process `Message` and Runnable objects associated with a thread's `MessageQueue`. Each Handler instance is associated with a single thread and that thread's message queue. When you create a new Handler it is bound to a `Looper`. It will deliver messages and runnables to that Looper's message queue and execute them on that Looper's thread.
>
> There are two main uses for a Handler: (1) to schedule messages and runnables to be executed at some point in the future; and (2) to enqueue an action to be performed on a different thread than your own.
>
> When posting or sending to a Handler, you can either allow the item to be processed as soon as the message queue is ready to do so, or specify a delay before it gets processed or absolute time for it to be processed. The latter two allow you to implement timeouts, ticks, and other timing-based behavior.
>
> When a process is created for your application, its main thread is dedicated to running a message queue that takes care of managing the top-level application objects (activities, broadcast receivers, etc) and any windows they create. You can create your own threads, and communicate back with the main application thread through a Handler. This is done by calling the same *post* or *sendMessage* methods as before, but from your new thread. The given Runnable or Message will then be scheduled in the Handler's message queue and processed when appropriate.

Handler通过ThreadLocal实现线程封闭性，保证线程安全，将任务执行限制在关联线程执行。主要通过Hander创建时所在线程和Looper/MessageQueue强关联。

### 主线程中使用

Hander主要通过发送消息，用于延迟执行任务和切换到线程执行任务。

除了发送消息之外，可以通过post传入的Runnable对象的run()方法，在子线程中通过Handler的post()方法进行UI操作就可以这么写：

```java
public class MainActivity extends Activity {  
  
    private Handler handler;  
  
    @Override  
    protected void onCreate(Bundle savedInstanceState) {  
        super.onCreate(savedInstanceState);  
        setContentView(R.layout.activity_main);  
        handler = new Handler();  
        new Thread(new Runnable() {  
            @Override  
            public void run() {  
                handler.post(new Runnable() {  
                    @Override  
                    public void run() {  
                        // 在这里进行UI操作  
                    }  
                });  
            }  
        }).start();  
    }  
} 
```

Handler的post()方法：

```java
public final boolean post(Runnable r)  
{  
   return  sendMessageDelayed(getPostMessage(r), 0);  
}  

private final Message getPostMessage(Runnable r) {  
    Message m = Message.obtain();  
    m.callback = r;  
    return m;  
}
```
post的runnable赋值给Message中的callback字段，在Handler中的dispatchMessage()方法中进行检查，如果Message的callback等于null才会去调用handleMessage()方法，否则就调用handleCallback()方法，在handleCallback中则会通过Message中的callback直接执行run，不需要再覆写handleMessage方法：
```java
public void dispatchMessage(Message msg) {
    if (msg.callback != null) {
        handleCallback(msg);
    } else {
        if (mCallback != null) {
            if (mCallback.handleMessage(msg)) {
                return;
            }
        }
        handleMessage(msg);
    }
}

private final void handleCallback(Message message) {  
    message.callback.run();  
}  
```

View的post()方法，也是调用了Handler中的post()方法，直接找到UI线程的Handler执行当前Runnable：

```java
public boolean post(Runnable action) {  
    Handler handler;  
    if (mAttachInfo != null) {  
        handler = mAttachInfo.mHandler;  
    } else {  
        ViewRoot.getRunQueue().post(action);  
        return true;  
    }  
    return handler.post(action);  
}  
```
Activity的runOnUiThread()方法

```java
public final void runOnUiThread(Runnable action) {  
    if (Thread.currentThread() != mUiThread) {  
        mHandler.post(action);  
    } else {  
        action.run();  
    }  
} 
```

### 子线程中使用

主线程中可以直接创建Handler对象，而在子线程中需要先调用Looper.prepare()才能创建Handler对象。

```java
public class MainActivity extends Activity {  
      
    private Handler handler1;  
      
    private Handler handler2;  
  
    @Override  
    protected void onCreate(Bundle savedInstanceState) {  
        super.onCreate(savedInstanceState);  
        setContentView(R.layout.activity_main);  
        handler1 = new Handler();  
        new Thread(new Runnable() {  
            @Override  
            public void run() {
            //添加此方法后则可以
           // Looper.prepare();    
                handler2 = new Handler();  
            }  
        }).start();  
    }  
  
} 
```
上述方法错误，Can't create handler inside thread that has not called Looper.prepare()，子线程没有调用Looper.prepare()方法，找不到Looper对象，具体见源码：

```java
public Handler() {  
    ....
    mLooper = Looper.myLooper();  
    if (mLooper == null) {  
        throw new RuntimeException(  
            "Can't create handler inside thread that has not called Looper.prepare()");  
    }  
    mQueue = mLooper.mQueue;  
    mCallback = null;  
}  
```
延迟执行：

```java
public final boolean sendMessageDelayed(Message msg, long delayMillis)
{
    if (delayMillis < 0) {
        delayMillis = 0;
    }
    return sendMessageAtTime(msg, SystemClock.uptimeMillis() + delayMillis);
}
```

uptimeMillis参数则表示发送消息的时间，它的值等于自系统开机到当前时间的毫秒数再加上延迟时间

```java
public boolean sendMessageAtTime(Message msg, long uptimeMillis) {
    MessageQueue queue = mQueue;
    if (queue == null) {
        RuntimeException e = new RuntimeException(
                this + " sendMessageAtTime() called with no mQueue");
        Log.w("Looper", e.getMessage(), e);
        return false;
    }
    return enqueueMessage(queue, msg, uptimeMillis);
}

private boolean enqueueMessage(MessageQueue queue, Message msg, long uptimeMillis) {
    msg.target = this;
    if (mAsynchronous) {
        msg.setAsynchronous(true);
    }
    return queue.enqueueMessage(msg, uptimeMillis);
} 
```

### 内存泄漏

#### 原因

1. Handler 隐式持有外部类引用
   - 若 Handler 声明为 **非静态内部类**（如匿名内部类或内部类），会默认持有外部类（如 Activity）的强引用。
   - 如果 Handler 的消息队列中存在未处理的延迟消息（如 `postDelayed()`），即使 Activity 已被销毁，**消息队列仍会保持 Handler 的引用**，从而阻止 Activity 被 GC 回收。

2. 生命周期不匹配
   - 后台线程（如通过 HandlerThread）持有 Handler 引用，若线程未及时终止，会导致 Handler 关联的 Activity 泄漏。

#### 解决方法

1. 根据生命周期，在 onDestroy() 中清理资源

   ```java
   @Override
   protected void onDestroy() {
       super.onDestroy();
       handler.removeCallbacksAndMessages(null); 
       if (handlerThread != null) {
           handlerThread.quit();
       }
   }
   ```

2. 使用静态内部类 + 弱引用

   ```java
   private static class SafeHandler extends Handler {
       private final WeakReference<Activity> mActivityRef;
   
       SafeHandler(Activity activity) {
           mActivityRef = new WeakReference<>(activity);
       }
   
       @Override
       public void handleMessage(@NonNull Message msg) {
           Activity activity = mActivityRef.get();
           if (activity == null || activity.isDestroyed()) return;
           // 处理消息
       }
   }
   ```

## Looper

Looper无法直接new对像，只能通过Looper.myLooper()方法获取Looper对象

```java
private Looper(boolean quitAllowed) {
    mQueue = new MessageQueue(quitAllowed);
    mRun = true;
    mThread = Thread.currentThread();
}

public static final Looper myLooper() {  
    return (Looper)sThreadLocal.get();  
}
```

Looper对象与当前线程强绑定，非UI线程要调用`Looper.prepare`，在当前线程的ThreadLocal的中set对应的Looper对像：

```java
public static final void prepare() {  
    if (sThreadLocal.get() != null) {  
        throw new RuntimeException("Only one Looper may be created per thread");  
    }  
    sThreadLocal.set(new Looper());  
} 
```
主线程启动时，系统已经帮我们自动调用了Looper.prepare()方法。见ActivityThread中的main()方法：
```java
public static void main(String[] args) {  
    SamplingProfilerIntegration.start();  
    CloseGuard.setEnabled(false);  
    Environment.initForCurrentUser();  
    EventLogger.setReporter(new EventLoggingReporter());  
    Process.setArgV0("<pre-initialized>");  
    Looper.prepareMainLooper();  
    ActivityThread thread = new ActivityThread();  
    thread.attach(false);  
    if (sMainThreadHandler == null) {  
        sMainThreadHandler = thread.getHandler();  
    }  
    AsyncTask.init();  
    if (false) {  
        Looper.myLooper().setMessageLogging(new LogPrinter(Log.DEBUG, "ActivityThread"));  
    }  
    Looper.loop();  
    throw new RuntimeException("Main thread loop unexpectedly exited");  
}  
```

Looper的loop方法，从MessageQueue取出messsage，通过Handler的dispatchMessage去执行分发，使用完进行recycle。

> Android中为什么主线程不会因为Looper.loop()里的死循环卡死?
>
> Linux pipe/epoll机制，MessageQueue当消息队列为空时，便阻塞在loop的queue.next()中的`nativePollOnce()`（底层 JNI 调用），触发 `epoll_wait()` 使线程进入休眠，释放 CPU 资源，此时主线程会释放CPU资源进入休眠状态。
>
> 当新消息加入队列（如 `Handler.sendMessage()`）时，调用 `nativeWake()`，其底层通过向 `eventfd` 写入数据，触发 `epoll_wait()` 返回，结束线程阻塞
>
> - `eventfd`：一个轻量级通知机制文件描述符，用于跨线程/进程唤醒

```java
   public static void loop() {
        final Looper me = myLooper();
        if (me == null) {
            throw new RuntimeException("No Looper; Looper.prepare() wasn't called on this thread.");
        }
        final MessageQueue queue = me.mQueue;

        // Make sure the identity of this thread is that of the local process,
        // and keep track of what that identity token actually is.
        Binder.clearCallingIdentity();
        final long ident = Binder.clearCallingIdentity();

        for (;;) {
            Message msg = queue.next(); // might block
            if (msg == null) {
                // No message indicates that the message queue is quitting.
                return;
            }
            ...
            msg.target.dispatchMessage(msg);
            ....

            msg.recycle();
        }
    }
```

## Message相关

相关的一些参数：

```java
public final class Message implements Parcelable {
  	//User-defined message code so that the recipient can identify what this message is about.
   	public int what;
  
   	public int arg1;
   	public int arg2;
   	public Object obj;
    /*package*/ int flags;

    /*package*/ long when;

    /*package*/ Bundle data;

    /*package*/ Handler target;

    /*package*/ Runnable callback;

    // sometimes we store linked lists of these things
    /*package*/ Message next;  
  	
}
```

子线程向主线程发送消息
```java
new Thread(new Runnable() {  
    @Override  
    public void run() {  
        Message message = new Message();  
        message.arg1 = 1;  
        Bundle bundle = new Bundle();  
        bundle.putString("data", "data");  
        message.setData(bundle);  
        handler.sendMessage(message);  
    }  
}).start();  
```

## MessageQueue

MessageQueue使用队列来保存Message，用mMessages表示当前待处理的消息。入队是按照当前Message的uptimeMillis放入队列对应位置。入队时，如果当前没有message，则nativeWake将当前休眠状态唤醒。出队则通过next方法取出。

```java
final boolean enqueueMessage(Message msg, long when) {
	....
    boolean needWake;
    synchronized (this) {
  		....

        msg.when = when;
        Message p = mMessages;
        if (p == null || when == 0 || when < p.when) {
            // New head, wake up the event queue if blocked.
            msg.next = p;
            mMessages = msg;
            needWake = mBlocked;
        } else {
            // Inserted within the middle of the queue.  Usually we don't have to wake
            // up the event queue unless there is a barrier at the head of the queue
            // and the message is the earliest asynchronous message in the queue.
            needWake = mBlocked && p.target == null && msg.isAsynchronous();
            Message prev;
            for (;;) {
                prev = p;
                p = p.next;
                if (p == null || when < p.when) {
                    break;
                }
                if (needWake && p.isAsynchronous()) {
                    needWake = false;
                }
            }
            msg.next = p; // invariant: p == prev.next
            prev.next = msg;
        }
    }
    if (needWake) {
        nativeWake(mPtr);
    }
    return true;
}
```

MessageQueue的next方法就是消息队列的出队方法，如果当前MessageQueue中存在mMessages(即待处理消息)，就将这个消息出队，然后让下一条消息成为mMessages，否则就进入一个阻塞状态，一直等到有新的消息入队。
在Looper中的loop方法中一个消息出队，就将它传递到msg.target的dispatchMessage()方法中，这里msg.target就是Handler。

```java
    final Message next() {
        int pendingIdleHandlerCount = -1; // -1 only during first iteration
        int nextPollTimeoutMillis = 0;

        for (;;) {
            if (nextPollTimeoutMillis != 0) {
                Binder.flushPendingCommands();
            }
            nativePollOnce(mPtr, nextPollTimeoutMillis);

            synchronized (this) {
                if (mQuiting) {
                    return null;
                }

                // Try to retrieve the next message.  Return if found.
                final long now = SystemClock.uptimeMillis();
                Message prevMsg = null;
                Message msg = mMessages;
                if (msg != null && msg.target == null) {
                    // Stalled by a barrier.  Find the next asynchronous message in the queue.
                    do {
                        prevMsg = msg;
                        msg = msg.next;
                    } while (msg != null && !msg.isAsynchronous());
                }
                if (msg != null) {
                    if (now < msg.when) {
                        // Next message is not ready.  Set a timeout to wake up when it is ready.
                        nextPollTimeoutMillis = (int) Math.min(msg.when - now, Integer.MAX_VALUE);
                    } else {
                        // Got a message.
                        mBlocked = false;
                        if (prevMsg != null) {
                            prevMsg.next = msg.next;
                        } else {
                            mMessages = msg.next;
                        }
                        msg.next = null;
                        if (false) Log.v("MessageQueue", "Returning message: " + msg);
                        msg.markInUse();
                        return msg;
                    }
                } else {
                    // No more messages.
                    nextPollTimeoutMillis = -1;
                }

                // If first time idle, then get the number of idlers to run.
                // Idle handles only run if the queue is empty or if the first message
                // in the queue (possibly a barrier) is due to be handled in the future.
                if (pendingIdleHandlerCount < 0
                        && (mMessages == null || now < mMessages.when)) {
                    pendingIdleHandlerCount = mIdleHandlers.size();
                }
                if (pendingIdleHandlerCount <= 0) {
                    // No idle handlers to run.  Loop and wait some more.
                    mBlocked = true;
                    continue;
                }

                if (mPendingIdleHandlers == null) {
                    mPendingIdleHandlers = new IdleHandler[Math.max(pendingIdleHandlerCount, 4)];
                }
                mPendingIdleHandlers = mIdleHandlers.toArray(mPendingIdleHandlers);
            }

            // Run the idle handlers.
            // We only ever reach this code block during the first iteration.
            for (int i = 0; i < pendingIdleHandlerCount; i++) {
                final IdleHandler idler = mPendingIdleHandlers[i];
                mPendingIdleHandlers[i] = null; // release the reference to the handler

                boolean keep = false;
                try {
                    keep = idler.queueIdle();
                } catch (Throwable t) {
                    Log.wtf("MessageQueue", "IdleHandler threw exception", t);
                }

                if (!keep) {
                    synchronized (this) {
                        mIdleHandlers.remove(idler);
                    }
                }
            }

            // Reset the idle handler count to 0 so we do not run them again.
            pendingIdleHandlerCount = 0;

            // While calling an idle handler, a new message could have been delivered
            // so go back and look again for a pending message without waiting.
            nextPollTimeoutMillis = 0;
        }
    }
```
