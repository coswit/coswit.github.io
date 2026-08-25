本篇对应原书第 2 章。原书基于 Android 2.2/2.3 源码,以 MediaServer 进程为实例,从 Framework 的真实用法出发讲解 JNI(Java Native Interface)。文中示例代码按概念改写并注明,并在末尾对现代 Android 的演进做了比对展开。

## 1.1 JNI 在 Android Framework 中的地位

Android 的 Framework 是一个"双层世界":对上以 Java API 暴露能力,对下大量复用 C/C++ 实现与既有库(音频、图形、编解码、加密)。两个世界的一切往来都要经过 JNI。原书按"谁主动"把 Framework 中的 JNI 用法分成两类:

| 方向 | 典型场景 | 例子 |
|---|---|---|
| Java → Native | Java 层 API 调用 Native 实现 | `AudioTrack.native_setup`、`MessageQueue.nativeInit` |
| Native → Java | Native 层发生事件后回调 Java 对象 | MediaScanner 每提取到一个元数据字段就回调 Java 的 `handleStringTag` |

这两类在 Framework 里都极其高频,本章的分析对象 MediaScanner 恰好两条都占:Java 层的 `processFile` 是 native 方法,Native 层提取元数据后又反向回调 Java。

## 1.2 实例切入:MediaServer 进程

原书本章的分析入口是 `frameworks/base/media/mediaserver/main_mediaserver.cpp`:

```cpp
// main_mediaserver.cpp(概念化,保留原书结构)
int main(int argc, char** argv) {
    sp<ProcessState> proc(ProcessState::self());   // 打开 /dev/binder 并 mmap
    sp<IServiceManager> sm = defaultServiceManager();
    AudioFlinger::instantiate();        // 创建并注册 AudioFlinger 服务
    MediaPlayerService::instantiate();  // 创建并注册 MediaPlayerService 服务
    CameraService::instantiate();
    AudioPolicyService::instantiate();
    ProcessState::self()->startThreadPool();
    IPCThreadState::self()->joinThreadPool();  // 进入 Binder 循环,进程常驻
}
```

短短几行涉及了后续多个章节的主角:ProcessState/IPCThreadState 负责打开 Binder 驱动并收发协议,AudioFlinger 则是音频世界的引擎。本章只关注一点:**MediaServer 里的这些服务大量横跨 Java 与 Native,JNI 是它们的粘合剂**。理解了 JNI,才能顺着调用链在两层之间自由穿行。

## 1.3 System.loadLibrary 的加载流程

Java 层加载 so 的入口是 `Runtime.loadLibrary`,库未加载时经 JNI 调到 Native:

```java
static {
    System.loadLibrary("media_jni"); // 对应 /system/lib/libmedia_jni.so
}
```

调用链(概念化):

```mermaid
graph LR
    A[System.loadLibrary] --> B[Runtime.loadLibrary]
    B --> C[nativeLoad - JNI]
    C --> D[VM 的 so 加载器 dlopen]
    D --> E[so 的 JNI_OnLoad 被调用]
    E --> F[库内完成 RegisterNatives 等初始化]
```

两个关键点:

- **查找路径**:由 classloader 的 library search path 决定,系统服务走 `/system/lib`;找不到时抛 `UnsatisfiedLinkError`
- **JNI_OnLoad**:dlopen 成功后虚拟机立即调用库的 `JNI_OnLoad(JavaVM*, void*)`,它是 so 的"入口函数",Framework 的库几乎都在这里做动态注册

## 1.4 JNI 函数的两种注册方式

### 1. 静态注册:按命名约定

Java 侧声明 native 方法,Native 侧函数名必须严格符合 `Java_包名_类名_方法名`(下划线连接,重载还要追加参数签名):

```java
// Java
package com.example;
public class Hello {
    public native String sayHello(String name);
}
```

```c
/* Native:名字可由 javah 生成 */
JNIEXPORT jstring JNICALL
Java_com_example_Hello_sayHello(JNIEnv* env, jobject thiz, jstring name) {
    const char* cName = env->GetStringUTFChars(name, nullptr);
    env->ReleaseStringUTFChars(name, cName); // 用完立刻释放
    return env->NewStringUTF("hello");
}
```

缺点:函数名冗长;首次调用时虚拟机按名字查找符号,有运行期开销;名字拼错要到运行时才暴露。

### 2. 动态注册:RegisterNatives

Native 库在 `JNI_OnLoad` 中把"Java 方法名 + 签名 + C 函数指针"的三元组表交给虚拟机:

```c
static JNINativeMethod gMethods[] = {
    // Java方法名   方法签名(见 1.9)           Native实现函数指针
    {"processFile", "(Ljava/lang/String;Ljava/lang/String;)V",
                     (void*)android_media_MediaScanner_processFile},
    {"native_init", "()V",  (void*)android_media_MediaScanner_native_init},
};

jint JNI_OnLoad(JavaVM* vm, void* /*reserved*/) {
    JNIEnv* env = nullptr;
    if (vm->GetEnv((void**)&env, JNI_VERSION_1_4) != JNI_OK)
        return -1;
    // AndroidRuntime 的辅助封装:内部就是 RegisterNatives,
    // 失败时直接 fatal,让问题在加载阶段暴露
    return AndroidRuntime::registerNativeMethods(
            env, "android/media/MediaScanner", gMethods, NELEM(gMethods));
}
```

**Framework 几乎全部采用动态注册**,收益:

- 函数名自由(可以带模块前缀,便于排查崩溃栈)
- 签名错误在库加载阶段就 fatal,而不是等到某个方法首次被调用
- 虚拟机按表直接分发,没有符号查找开销

## 1.5 JNIEnv 与 JavaVM

| 对象 | 级别 | 数量 | 作用 |
|---|---|---|---|
| JavaVM | 进程 | 1 | 代表整个虚拟机;`AttachCurrentThread` 把 Native 线程挂进来;`GetEnv` 取当前线程的 JNIEnv |
| JNIEnv | 线程 | 每线程一份 | 全部 JNI 能力的入口:FindClass/CallXxxMethod/GetFieldID/NewStringUTF…… |

**JNIEnv 不能跨线程保存使用**。在 Native 自建线程(如 AudioFlinger 的工作线程)中回调 Java,必须先 Attach、用完 Detach:

```c
// 在 Native 自建线程中调用 Java 的标准姿势
static JavaVM* gVm;         // 在 JNI_OnLoad 里保存
static jobject gObj;        // 全局引用,见 1.7

void* threadFunc(void* /*arg*/) {
    JNIEnv* env = nullptr;
    JavaVMAttachArgs args = {JNI_VERSION_1_4, "my-thread", nullptr};
    gVm->AttachCurrentThread(&env, &args);      // 挂接:得到本线程的 JNIEnv
    jclass clazz = env->GetObjectClass(gObj);
    jmethodID mid = env->GetMethodID(clazz, "onEvent", "(I)V");
    env->CallVoidMethod(gObj, mid, 100);        // 回调 Java
    gVm->DetachCurrentThread();                 // 必须配套
    return nullptr;
}
```

线程不 Detach 就退出,在 Dalvik 时代会导致线程资源泄漏甚至退出挂死——这是原书特别提醒的坑。

## 1.6 三个关键数据结构

- **jobject/jclass**:Java 对象与类在 Native 侧的不透明句柄,只能通过 JNIEnv 提供的方法操作
- **jmethodID/jfieldID**:方法与字段的"偏移量式"标识,**与具体类绑定,可安全缓存**。Framework 的标准做法是在注册/初始化阶段把 ID 存进结构体成员,后续调用直接用:

```c
struct fields_t {
    jmethodID midScanString;  // 缓存的回调方法 ID
};
static fields_t gFields;
// 注册阶段一次性取出并缓存:
gFields.midScanString = env->GetMethodID(
        env->FindClass("android/media/MediaScannerClient"),
        "scanString", "(Ljava/lang/String;)V");
```

- **jstring/jarray**:Java 引用类型的句柄,访问内容必须走 `GetStringUTFChars` 这类"取指针 + 用完释放"的配对接口

## 1.7 引用类型与垃圾回收

JNI 引用分三种,与 Native 持有 Java 对象的生命周期直接相关:

| 引用类型 | 创建/销毁 | 特点 |
|---|---|---|
| local reference(局部引用) | 每次 JNI 调用自动产生;函数返回后失效 | 数量有上限,循环里大量创建要 `DeleteLocalRef` |
| global reference(全局引用) | `NewGlobalRef` / `DeleteGlobalRef` 手动管理 | 跨线程、跨调用持有 Java 对象的唯一合法方式 |
| weak global reference(弱全局引用) | `NewWeakGlobalRef` / `DeleteWeakGlobalRef` | 不阻止 GC 回收,使用前须提升为局部引用并判空 |

原书的 MyMediaScannerClient 正是"Native 对象通过 global reference 长期持有 Java 回调对象"的范例:回调对象在 setup 阶段被 NewGlobalRef 保存,析构时 DeleteGlobalRef 释放——持有关系必须严格成对,否则要么内存泄漏,要么野引用崩溃。

## 1.8 Native 主动回调 Java:MediaScanner 实例

这是本章的精华流程。Java 层 `MediaScanner.processFile(path, mimeType, client)` 进入 Native 后,Native 的 `MyMediaScannerClient` 每提取到一个元数据键值对(如 title、artist),就回调一次 Java:

```c
// android_media_MediaScanner.cpp(概念化,保留原书骨架)
class MyMediaScannerClient : public MediaScannerClient {
public:
    MyMediaScannerClient(JNIEnv *env, jobject client)
        : mEnv(env), mClient(client) {
        // 缓存回调方法的 jmethodID
        jclass clazz = env->FindClass("android/media/MediaScannerClient");
        mScanStringMethod = env->GetMethodID(
                clazz, "scanString", "(Ljava/lang/String;)V");
    }
    // Native 每提取到一个字段就走到这里
    virtual void handleString(const char* name, const char* value) {
        jstring jName  = mEnv->NewStringUTF(name);
        jstring jValue = mEnv->NewStringUTF(value);
        mEnv->CallVoidMethod(mClient, mScanStringMethod, jName, jValue);
        mEnv->DeleteLocalRef(jName);    // 循环回调场景必须及时清理局部引用
        mEnv->DeleteLocalRef(jValue);
    }
private:
    JNIEnv* mEnv;
    jobject mClient;          // 对 Java client 的引用
    jmethodID mScanStringMethod;
};

static void android_media_MediaScanner_processFile(
        JNIEnv* env, jobject thiz, jstring path,
        jstring mimeType, jobject client) {
    // 1. 解包参数:jstring → const char*
    const char *cPath = env->GetStringUTFChars(path, nullptr);
    const char *cMime = env->GetStringUTFChars(mimeType, nullptr);
    if (cPath == nullptr) return;   // OOM 时 GetStringUTFChars 返回 null
    // 2. 取出 Java 对象背后持有的 Native MediaScanner 指针
    MediaScanner* mp = getNativeScanner_l(env, thiz);
    // 3. 构造回调 client,进入 Native 提取流程
    MyMediaScannerClient myClient(env, client);
    mp->processFile(cPath, cMime, myClient);
    // 4. 释放
    env->ReleaseStringUTFChars(path, cPath);
    env->ReleaseStringUTFChars(mimeType, cMime);
}
```

值得学习的工程细节:

- **Java 对象持有 Native 指针**:MediaScanner 用一个 `int`/`long` 型成员(`mNativeContext`)保存 Native 对象地址,`finalize` 时调 native 方法释放——这是没有 `NativeAllocationRegistry` 时代的标准做法
- **逐字段回调而非整包返回**:元数据条目数量不定,一条一条 `CallVoidMethod` 回传,避免在 Native 侧拼大结构;代价是 JNI 调用次数多
- **local ref 的 DeleteLocalRef**:扫描上千个文件、每文件十几个字段,不清理会撑爆 local reference 表

## 1.9 类型签名速查

动态注册必须写对签名,JNI 用紧凑字符描述类型:

| 签名 | Java 类型 | 签名 | Java 类型 |
|---|---|---|---|
| `V` | void | `Z` | boolean |
| `I` / `J` | int / long | `D` / `F` | double / float |
| `[B` | byte[] | `Ljava/lang/String;` | String(L 开头、分号结尾) |
| `(Ljava/lang/String;Ljava/lang/String;)V` | 两个 String 参数、返回 void 的方法 | | |

签名可以用 `javap -s` 反查;写错时 RegisterNatives 阶段就会 fatal——这正是动态注册的价值。

## 1.10 新技术更新(比对展开)

原书成书时(2011,Android 2.2/2.3, Dalvik)与现在(ART 时代)的 JNI 生态对比如下:

| 维度 | 原书时代(Dalvik / 2.3) | 现在(ART / Android 15+) |
|---|---|---|
| 虚拟机 | Dalvik, JIT 为主 | ART: AOT + JIT 混合编译, boot image 跨进程共享 |
| 注册方式 | 静态/动态,Framework 用 RegisterNatives | 不变;系统服务几乎仍全部动态注册 |
| 调用开销 | 每次 JNI 进入 Dalvik 有固定开销 | ART 下仍非零;新增 @FastNative/@CriticalNative 快路径 |
| 检查 | 无系统级检查 | debug 构建启用 CheckJNI,自动校验签名与引用误用 |
| Native 库加载 | 任意路径可加载、可偷链系统私有库 | Android 7.0 起 classloader namespace 限定链接范围 |
| 对象生命周期 | 手写 finalize + native 释放 | NativeAllocationRegistry 关联 GC 自动释放 |
| 跨语言方案 | 手写 JNI | AIDL Stable 生成多语言绑定、Rust 直接写系统服务 |

分项展开:

### 1.10.1 @FastNative 与 @CriticalNative

ART 为热路径 native 方法提供了两个注解:`@FastNative`(Android 8)跳过部分 JNI 状态切换;`@CriticalNative`(Android 9)更激进,要求方法**只有基本类型参数、不使用 JNIEnv 和 jobject**,开销接近直接 C 调用。libcore 与系统内部热点(如数组拷贝、`Math` 底层)都在用;应用自己写 JNI 时,符合约束的高频小函数值得加。

### 1.10.2 CheckJNI 与调试

打开 CheckJNI(debug 构建或 `android:debuggable`)后,ART 会校验签名匹配、local ref 泄漏、跨线程使用 JNIEnv 等,大量原书时代"靠人眼盯"的坑变成启动即崩的显式错误;Android Studio 还能对 debuggable 应用做 JNI 引用与 Native 内存的联合调试。

### 1.10.3 NativeAllocationRegistry 取代 finalize 模式

原书"Java 对象存 Native 指针 + finalize 释放"的模式有典型缺陷:finalize 时机不确定、对象复活问题。现代替代是 `libnativehelper` 的 NativeAllocationRegistry:把 Native 内存地址与析构函数注册到与 Java 对象绑定的回收器上,GC 回收 Java 对象时异步释放 Native 内存。Framework 的 `Bitmap`、`Parcel` 等早已迁移,新代码不应再写 finalize。

### 1.10.4 加载与链接的收紧

- **Namespace(Android 7.0)**:应用 so 只能链接 NDK 公共库与自身 APK 内的库,系统库私有符号不可见,"偷链"系统私有库在 7.0 上直接失败
- **16 KB 页大小(Android 15)**:设备可启用 16KB 内存页,要求 so 的 `LOAD` 段按 16KB 对齐,否则加载失败——影响所有 JNI 库的链接器脚本与 NDK 工具链(NDK r27+ 默认支持)

### 1.10.5 手写 JNI 的机会在变少

- **AIDL Stable(Android 10+/11+)**:跨进程接口从 AIDL 一键生成 Java/C++/NDK/Rust 绑定,系统服务不再手写 Binder + JNI 双层胶水
- **Rust 进系统**:Android 12+ 的系统组件(Keystore2、Binder 服务等)可用 Rust 实现,经 binder crate 直接进出 Binder,无 JNI
- 应用层的音视频、加密、游戏引擎仍离不开 JNI(ffmpeg、Oboe 等仍是"Java 壳 + Native 芯"),本章的回调、引用管理、Attach/Detach 规则依然是日常
