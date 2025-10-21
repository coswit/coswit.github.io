

## 崩溃监测

### Java崩溃

#### CheckedException 

编译时异常，在编译阶段就可以检测到异常

#### UnCheckedException

RuntimeException及其子类的异常，在程序运行阶段的异常，导致程序出现崩溃。

```bash
--------- beginning of crash
    AndroidRuntime: FATAL EXCEPTION: main
    Process: com.android.developer.crashsample, PID: 3686
    java.lang.NullPointerException: crash sample
    at com.android.developer.crashsample.MainActivity$1.onClick(MainActivity.java:27)
    at android.view.View.performClick(View.java:6134)
    at android.view.View$PerformClick.run(View.java:23965)
    at android.os.Handler.handleCallback(Handler.java:751)
    at android.os.Handler.dispatchMessage(Handler.java:95)
    at android.os.Looper.loop(Looper.java:156)
    at android.app.ActivityThread.main(ActivityThread.java:6440)
    at java.lang.reflect.Method.invoke(Native Method)
    at com.android.internal.os.Zygote$MethodAndArgsCaller.run(Zygote.java:240)
    at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:746)
    --------- beginning of system
```

堆栈轨迹包含两条重要的信息：

- 抛出的异常的类型。
- 抛出异常的代码段。

每行显示的调用点称为**堆栈帧**（a stack frame）



>java.lang.NullPointerException
>kotlin.UninitializedPropertyAccessException
>
>OutOfMemoryError：内存错误
>UnknownHostException：网络异常



#### 异常采集

```java
public class CrashHandler implements UncaughtExceptionHandler {
    private static final String TAG = "CrashHandler";
    private static final boolean DEBUG = true;

    private static final String PATH = Environment
            .getExternalStorageDirectory() + "/CrashDemo/log/";
    private static final String FILE_NAME = "crash";
    private static final String FILE_NAME_SUFFIX = ".trace";
    private static final String ABOLUTE_PATH = PATH + FILE_NAME + FILE_NAME_SUFFIX;
    private String deviceToken;

    private static CrashHandler sInstance = new CrashHandler();
    private UncaughtExceptionHandler mDefaultCrashHandler;
    private Context mContext;

    private CrashHandler() {
    }

    public static CrashHandler getInstance() {
        return sInstance;
    }

    public void init(Context context) {
        mDefaultCrashHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(this);
        mContext = context.getApplicationContext();
    }

    /**
     * 这个是最关键的函数，当程序中有未被捕获的异常，系统将会自动调用#uncaughtException方法
     * thread为出现未捕获异常的线程，ex为未捕获的异常，有了这个ex，我们就可以得到异常信息。
     */
    @Override
    public void uncaughtException(Thread thread, Throwable ex) {
        try {
            // 导出异常信息到SD卡中
            dumpExceptionToSDCard(ex);

        } catch (IOException e) {
            e.printStackTrace();
        }

        ex.printStackTrace();

        // 如果系统提供了默认的异常处理器，则交给系统去结束我们的程序，否则就由我们自己结束自己
        if (mDefaultCrashHandler != null) {
            mDefaultCrashHandler.uncaughtException(thread, ex);
        } else {
            Process.killProcess(Process.myPid());
        }

    }

    private File dumpExceptionToSDCard(Throwable ex) throws IOException {
        // 如果SD卡不存在或无法使用，则无法把异常信息写入SD卡
        if (!Environment.getExternalStorageState().equals(
                Environment.MEDIA_MOUNTED)) {
            if (DEBUG) {
                Log.w(TAG, "sdcard unmounted,skip dump exception");
                return null;
            }
        }

        File dir = new File(PATH);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        long current = System.currentTimeMillis();
        String time = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
                .format(new Date(current));
        // File file = new File(PATH + FILE_NAME + time + "_"+ deviceToken +
        // FILE_NAME_SUFFIX);
        File file = new File(PATH + FILE_NAME + FILE_NAME_SUFFIX);

        if (!file.exists()) {
            file.createNewFile();
        } else {
            try {
                // 追加内容
                PrintWriter pw = new PrintWriter(new BufferedWriter(
                        new FileWriter(file, true)));
                pw.println(time);
                dumpPhoneInfo(pw);
                pw.println();
                ex.printStackTrace(pw);
                pw.println("---------------------------------分割线----------------------------------");
                pw.println();
                pw.close();
            } catch (Exception e) {
                Log.e(TAG, "dump crash info failed");
            }

        }

        return file;
    }

    private void dumpPhoneInfo(PrintWriter pw) throws NameNotFoundException {
        PackageManager pm = mContext.getPackageManager();
        PackageInfo pi = pm.getPackageInfo(mContext.getPackageName(),
                PackageManager.GET_ACTIVITIES);
        pw.print("App Version: ");
        pw.print(pi.versionName);
        pw.print('_');
        pw.println(pi.versionCode);

        // android版本号
        pw.print("OS Version: ");
        pw.print(Build.VERSION.RELEASE);
        pw.print("_");
        pw.println(Build.VERSION.SDK_INT);

        // 手机制造商
        pw.print("Vendor: ");
        pw.println(Build.MANUFACTURER);

        // 手机型号
        pw.print("Model: ");
        pw.println(Build.MODEL);

        // cpu架构
        pw.print("CPU ABI: ");
        pw.println(Build.CPU_ABI);

    }

    /**
     * 提供方法上传异常信息到服务器
     * @param log
     */
    private void uploadExceptionToServer(File log) {
        // TODO Upload Exception Message To Your Web Server

    }
}
```



```java
public class MyApplication extends Application{
    @Override
    public void onCreate(){
        super.onCreate();
        
        CrashHandler crashHandler = CrashHandler.getInstance();
        crashHandler.init(this);
    }
}
```

#### native崩溃 Signal

崩溃时会输出到logcat

## ANR

### 概述

Android 应用的界面线程处于阻塞状态的时间过长，会触发“应用无响应”(ANR Application Not Responding) 错误。

#### 触发情况：

- Activity位于前台，应用在 5 秒钟内未响应输入事件（Input Event）
- Service,前台进程20s，后台进程200s
- Broadcast，前台10s，后台60s

####  诊断 ANR

诊断 ANR 时需要考虑以下几种常见模式：

1. 应用在主线程上非常缓慢地执行涉及 I/O 的操作。
2. 应用在主线程上进行长时间的计算。
3. 主线程在对另一个进程进行同步 binder 调用，而后者需要很长时间才能返回。
4. 主线程处于阻塞状态，为发生在另一个线程上的长操作等待同步的块。
5. 主线程在进程中或通过 binder 调用与另一个线程之间发生死锁。主线程不只是在等待长操作执行完毕，而且处于死锁状态。

#### TraceView

TraceView 是 Android SDK 中内置的一个工具，它可以加载 **trace** 文件，用图形的形式展示**代码的执行时间、次数及调用栈**，便于我们分析

生成 trace 文件有三种方法：

1. 使用代码生成：

   ```java
   Debug.startMethodTracing("intrace");//开始 trace，保存文件到"/sdcard/intrace.trace"// 
   Debug.stopMethodTracing();//结束
   ```

   

2. Android Studio 内置的 Android Monitor 可以很方便的生成 trace 文件到电脑

3. DDMS 即 Dalvik Debug Monitor Server  生成


[官网参考](https://developer.android.com/studio/profile/traceview?hl=zh-cn)

### 监测方案

####  [BlockCanary](https://github.com/markzhai/AndroidPerformanceMonitor)

[相关原理](http://blog.zhaiyifan.cn/2016/01/16/BlockCanaryTransparentPerformanceMonitor/)

主要原理是利用`Loop.loop()`中的log打印

```java
public static void loop() {
    ...

    for (;;) {
       Message msg = queue.next(); // might block
        ...

        // This must be in a local variable, in case a UI event sets the logger
        Printer logging = me.mLogging;
        if (logging != null) {
            logging.println(">>>>> Dispatching to " + msg.target + " " +
                    msg.callback + ": " + msg.what);
        }

        msg.target.dispatchMessage(msg);

        if (logging != null) {
            logging.println("<<<<< Finished to " + msg.target + " " + msg.callback);
        }

        ...
    }
}
```

log 打印逻辑正是在 Message 消息分发前后，大部分的性能卡顿问题都是在这里发生的，监控这两个逻辑之间的时间差就可以得到当前主线程的卡顿状态，如果超时则获取 trace 信息并上报。

主要是通过添加自己的Printer来实现的：

```java
Looper.getMainLooper().setMessageLogging(mainLooperPrinter);
```



- 优点
  灵活配置，可监控常见 APP 应用性能，且可以准确定位 ANR 和耗时调用栈。

- 缺点

  1、 代码中已标注 `This must be in a local variable, in case a UI event sets the logger` 这个 looger 对象是可以被更改的，已经有开发者遇到在使用 WebView 时 logger 被 set 为 Null 导致 BlockCanary 失效，只能让 BlockCanary 在 WebView 初始化之后调用 start。
  2、 如果 dispatchMessage 执行的非常久是无法触发 BlockCanary 的逻辑。
  3、 `queue.next()`出还有个标注`might block`，如果input事件导致ANR时，框架无法适用。

  4、 无法监控 CPU 资源紧张造成系统卡顿，无法响应的 ANR



####  ANR-WatchDog

ANR-WatchDog 是参考 Android WatchDog 机制（com.android.server.WatchDog.java）起个单独线程向主线程发送一个变量 +1 操作，自我休眠自定义 ANR 的阈值，休眠过后判断变量是否 +1 完成，如果未完成则告警。

- 优点
  1、 兼容性好，各个机型版本通用
  2、 无需修改 APP 逻辑代码，非侵入式
  3、 逻辑简单，性能影响不大
- 缺点
  无法保证能捕捉所有 ANR，对阈值的设置直接影响捕获概率

如果对线程的堵塞大于 10s 则设置监控阈值 5s 能捕获所有 ANR，堵塞时间在 5s~10s，则可能出现无法捕获场景。

#### SafeLooper

## 内存泄漏

### 常见的内存泄漏

#### 单例造成

```java
private static ScrollHelper mInstance;    
 private ScrollHelper() {
 }    
 public static ScrollHelper getInstance() {        
     if (mInstance == null) {           
        synchronized (ScrollHelper.class) {                
             if (mInstance == null) {
                 mInstance = new ScrollHelper();
             }
         }
     }        

     return mInstance;
 }    
 /**
  * 被点击的view
  */
 private View mScrolledView = null;    
 public void setScrolledView(View scrolledView) {
     mScrolledView = scrolledView;
 }
```

解决方案：

```java
private static ScrollHelper mInstance;    
 private ScrollHelper() {
 }    
 public static ScrollHelper getInstance() {        
     if (mInstance == null) {            
         synchronized (ScrollHelper.class) {                
             if (mInstance == null) {
                 mInstance = new ScrollHelper();
             }
         }
     }        

     return mInstance;
 }    
 /**
  * 被点击的view
  */
 private WeakReference<View> mScrolledViewWeakRef = null;    
 public void setScrolledView(View scrolledView) {
     mScrolledViewWeakRef = new WeakReference<View>(scrolledView);
 }
```

#### 匿名内部类

在Java中，非静态内部类 和 匿名类 都会潜在的引用它们所属的外部类，但是，静态内部类却不会。如果这个非静态内部类实例做了一些耗时的操作，就会造成外围对象不会被回收，从而导致内存泄漏。

```java
public class LeakAct extends Activity {  
     @Override
     protected void onCreate(Bundle savedInstanceState) {    
         super.onCreate(savedInstanceState);
         setContentView(R.layout.aty_leak);
         test();
     } 
     //这儿发生泄漏    
     public void test() {    
         new Thread(new Runnable() {      
             @Override
             public void run() {        
                 while (true) {          
                     try {
                         Thread.sleep(1000);
                     } catch (InterruptedException e) {
                         e.printStackTrace();
                     }
                 }
             }
         }).start();
     }
 }
```

解决方法：

- 将内部类变成静态内部类;

- 如果有强引用Activity中的属性，则将该属性的引用方式改为弱引用;

- 在业务允许的情况下，当Activity执行onDestory时，结束这些耗时任务;

```java
public class LeakAct extends Activity {  
     @Override
     protected void onCreate(Bundle savedInstanceState) {    
         super.onCreate(savedInstanceState);
         setContentView(R.layout.aty_leak);
         test();
     }  
     //加上static，变成静态匿名内部类
     public static void test() {    
         new Thread(new Runnable() {     
             @Override
             public void run() {        
                 while (true) {          
                     try {
                         Thread.sleep(1000);
                     } catch (InterruptedException e) {
                         e.printStackTrace();
                     }
                 }
             }
         }).start();
     }
 }
```

#### Activity Context 的不正确使用

```java
 private static Drawable sBackground;
 @Override
 protected void onCreate(Bundle state) {  
     super.onCreate(state);
     TextView label = new TextView(this);
     label.setText("Leaks are bad");  
     if (sBackground == null) {
         sBackground = getDrawable(R.drawable.large_bitmap);
     }
     label.setBackgroundDrawable(sBackground);
     setContentView(label);
 }
```

解决方法：

- 使用ApplicationContext代替ActivityContext
- 对Context的引用不要超过它本身的生命周期，慎重的对Context使用“static”关键字
- Context里如果有线程，一定要在onDestroy()里及时停掉

```java
private static Drawable sBackground;
 @Override
 protected void onCreate(Bundle state) {  
     super.onCreate(state);
     TextView label = new TextView(this);
     label.setText("Leaks are bad");  
     if (sBackground == null) {
         sBackground = getApplicationContext().getDrawable(R.drawable.large_bitmap);
     }
     label.setBackgroundDrawable(sBackground);
     setContentView(label);
 }

```

#### Handler引起的内存泄漏

当Handler中有延迟的的任务或是等待执行的任务队列过长，由于消息持有对Handler的引用，而Handler又持有对其外部类的潜在引用，这条引用关系会一直保持到消息得到处理，而导致了Activity无法被垃圾回收器回收，而导致了内存泄露。

解决方法：

- 把Handler类放在单独的类文件中，或者使用静态内部类便可以避免泄露
- 想在Handler内部去调用所在的Activity,那么可以在handler内部使用弱引用的方式去指向所在Activity.使用Static + WeakReference的方式来达到断开Handler与Activity之间存在引用关系

```java
@Override
 protected void doOnDestroy() {        
     super.doOnDestroy();        
     if (mHandler != null) {
         mHandler.removeCallbacksAndMessages(null);
     }
     mHandler = null;
     mRenderCallback = null;
 }
```



#### 注册监听器的泄漏

系统服务可以通过Context.getSystemService 获取，它们负责执行某些后台任务，或者为硬件访问提供接口。如果Context 对象想要在服务内部的事件发生时被通知，那就需要把自己注册到服务的监听器中。然而，这会让服务持有Activity 的引用，如果在Activity onDestory时没有释放掉引用就会内存泄漏。

```java
mSensorManager = (SensorManager) this.getSystemService(Context.SENSOR_SERVICE);
```

```java
InputMethodManager imm = (InputMethodManager) context.getApplicationContext().getSystemService(Context.INPUT_METHOD_SERVICE);
```

解决方法：

- 使用ApplicationContext代替ActivityContext
- 在Activity执行onDestory时，调用反注册;

```java
mSensorManager = (SensorManager) getApplicationContext().getSystemService(Context.SENSOR_SERVICE);
```

```java
protected void onDetachedFromWindow() {        
     if (this.mActionShell != null) {
         this.mActionShell.setOnClickListener((OnAreaClickListener)null);
     }        
     if (this.mButtonShell != null) { 
         this.mButtonShell.setOnClickListener((OnAreaClickListener)null);
     }        
     if (this.mCountShell != this.mCountShell) {
         this.mCountShell.setOnClickListener((OnAreaClickListener)null);
     }        
     super.onDetachedFromWindow();
 }
```

#### Cursor，Stream没有close，View没有recyle

资源性对象比如(Cursor，File文件等)往往都用了一些缓冲，我们在不使用的时候，应该及时关闭它们，以便它们的缓冲及时回收内存。它们的缓冲不仅存在于 java虚拟机内，还存在于java虚拟机外。如果我们仅仅是把它的引用设置为null,而不关闭它们，往往会造成内存泄漏。因为有些资源性对象，比如SQLiteCursor(在析构函数finalize(),如果我们没有关闭它，它自己会调close()关闭)，如果我们没有关闭它，系统在回收它时也会关闭它，但是这样的效率太低了。因此对于资源性对象在不使用的时候，应该调用它的close()函数，将其关闭掉，然后才置为null. 在我们的程序退出时一定要确保我们的资源性对象已经关闭。

解决方法：调用onRecycled()

```java
@Override
 public void onRecycled() {
     reset();
     mSinglePicArea.onRecycled();
 }
```

在View中调用reset()

```java
public void reset() {
     if (mHasRecyled) {            
         return;
     }
 ...
     SubAreaShell.recycle(mActionBtnShell);
     mActionBtnShell = null;
 ...
     mIsDoingAvatartRedPocketAnim = false;        
     if (mAvatarArea != null) {
             mAvatarArea.reset();
     }        
     if (mNickNameArea != null) {
         mNickNameArea.reset();
     }
 }
```



#### WebView造成的泄露

当我们不要使用WebView对象时，应该调用它的destory()函数来销毁它，并释放其占用的内存，否则其占用的内存长期也不能被回收，从而造成内存泄露。

为webView开启另外一个进程，通过AIDL与主线程进行通信，WebView所在的进程可以根据业务的需要选择合适的时机进行销毁，从而达到内存的完整释放。

### 内存泄漏检测

##### LeakCanary 

Activity finish 后是否被回收， LeakCanary 是通过记录所有的 Activity，在 Application 中注册 LeakCanary 时，通过 registerActivityLifecycleCallbacks 监听 Activity 的生命周期，然后在 Activity 执行 onDestroy 时看 Activity 是否被回收，如果没有没回收，触发 gc, 再看有没有被回收，如果还没有被回收，那么就是有内存泄漏了，就收集内存泄漏相关日志信息。

```java
public void watch(Object watchedReference, String referenceName) {
    ...
    if(!this.debuggerControl.isDebuggerAttached()) {
        final long watchStartNanoTime = System.nanoTime();
        String key = UUID.randomUUID().toString();
        this.retainedKeys.add(key);
        // watchedReference 执行过onDrstroy的Activity的引用，
        // key为随机数，queue 是一个ReferenceQueue对象，在引用中用于记录回收的对象
        final KeyedWeakReference reference = new KeyedWeakReference(watchedReference, key, referenceName, this.queue);
        this.watchExecutor.execute(new Runnable() {
            public void run() {
                // 方法最后执行到这里
                RefWatcher.this.ensureGone(reference, watchStartNanoTime);
            }
        });
    }
}
```



```java
// reference 这是一个弱引用
void ensureGone(KeyedWeakReference reference, long watchStartNanoTime) {
    long gcStartNanoTime = System.nanoTime();
    long watchDurationMs = TimeUnit.NANOSECONDS.toMillis(gcStartNanoTime - watchStartNanoTime);
    // 这个方法做的操作是 有被回收的，从集合中移除 reference.key
    // 这个方法里就利用的 Reference.queue, 从 queue 里面取出来说明是被回收的
    this.removeWeaklyReachableReferences();
    if(!this.gone(reference) && !this.debuggerControl.isDebuggerAttached()) {
        // 进到 if 里面说明还没有被回收
        // 触发 gc, 这里触发 gc 的方式是调用 Runtime.getRuntime().gc();
        this.gcTrigger.runGc();
        // 重新把已回收的 key 从集合中 remove 掉
        this.removeWeaklyReachableReferences();
        if(!this.gone(reference)) {
            // 进到 if 里，说明还没有被回收，gc后还没有被回收，说明这是回收不了的了，也就是发生了内存泄漏了
            long startDumpHeap = System.nanoTime();
            long gcDurationMs = TimeUnit.NANOSECONDS.toMillis(startDumpHeap - gcStartNanoTime);
            // 收集 hprof 文件
            File heapDumpFile = this.heapDumper.dumpHeap();
            if(heapDumpFile == HeapDumper.NO_DUMP) {
                return;
            }

            long heapDumpDurationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startDumpHeap);
            // 解析泄漏日志，通知有泄漏，并保存到本地
            this.heapdumpListener.analyze(new HeapDump(heapDumpFile, reference.key, reference.name, this.excludedRefs, watchDurationMs, gcDurationMs, heapDumpDurationMs));
        }

    }
}
```

参考：

[Android ANR 监测方案解析](https://testerhome.com/articles/17101)

[Android 内存泄漏分析心得](https://zhuanlan.zhihu.com/p/25213586)





