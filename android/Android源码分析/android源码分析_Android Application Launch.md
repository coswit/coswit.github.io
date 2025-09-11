---
title:  Android Application Launch
date:   2017/10/23
categories:
- Android
- Android源码分析
tags:
-  Android
---




### part1
Android Applications are different than standard mobile applications in two major ways.
1. Every Android application lives in its own world, meaning it runs in a separate process, has its own Dalvik VM instance and is assigned a unique user ID.
2. Android apps are composed of different components and they can invoke the components owned by other apps. Typically, they don't have a single entry point like main() method.

Application components include :
- Activities : Encapsulation of a particular operation, optionally associated with GUI, provide an execution context.
- Services : Background tasks that run in the context of application process.
- Broadcast Receivers : Broadcast Intent listeners
- Content providers : Data storage and sharing interface of an app.


Android process is same as Linux process. By default, every installed .apk runs in its own Linux process. Also by default, there exists 1 thread per process. The main thread has a Looper instance to handle the messages from the message queue and it calls Looper.loop() in its every iteration of run() method. It's the job of a looper to pop off the messages from message queue and invoke the corresponding methods to handle it.

When does a process get started? The short version is a process get started whenever it is required. Any time a user or some other system component request the component (could be a service, an activity or an intent receiver) belonging to your apk be executed, the system spins off a new process for your apk if it's not already running. General processes remain running until killed by the system. The point is, processes are created on demand.
For example, if you click on a hyper-link in your e-mail, the web page opens in a browser window. Your mail client and the browser are two separate apps and they run in their two separate processes. The click event causes Android platform to launch a new process so that it can instantiate the browser activity in the context of its own process. The same holds good for any other component in an application.

Let's step back for a moment and have a quick look on the start-up process. Like the most Linux based systems, at startup, the bootloader loads the kernel and starts the init process. The init then spawns the low level Linux processes called "daemons" e.g. android debug daemon, USB daemon etc. These daemons typically handle the low level hardware interfaces including radio interface.

<!--- more --->

Init process then starts a very interesting process called 'Zygote'. As the name implies it's the very beginning for the rest of the Android platform. This is the process which initializes the very first instance of Dalvik virtual machine and pre-loads all the common classed used by the application framework and the various apps. Then it starts listening on a socket interface for future requests to spawn off new vms for managing new app processes. On receiving a new request, it forks itself to create a new process which gets a pre-initialized vm instance.
After zygote, init starts the runtime process. The zygote then forks to start a well managed process called system server. It starts all core platform services e.g activity manager service and hardware services in its own context. At this point the full stack is ready to launch the first app process - Home app which displays the home screen.

So many things happen behind the scene when a user clicks on an icon and a new application gets launched. Here is the full picture :

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/Android%E7%BB%84%E4%BB%B6/08.jpg)


The click event gets translated into startActivity(intent) call which gets routed to startActivity(intent) call in ActivityManagerService through Binder IPC. The ActvityManagerService takes couple of actions -
- The first step is to collect information about the target of the intent object. This is done by using resolveIntent() method on PackageManager object. PackageManager.MATCH_DEFAULT_ONLY and PackageManager.GET_SHARED_LIBRARY_FILES flags are used by default.
- The target information is saved back into the intent object to avoid re-doing this step.
- Next important step is to check if user has enough privileges to invoke the target component of the intent. This is done by calling grantUriPermissionLocked() method.
- If user has enough permissions, ActivityManagerService checks if the target activity requires to be launched in a new task. The task creation depends on Intent flags such as FLAG_ACTIVITY_NEW_TASK and other flags such as FLAG_ACTIVITY_CLEAR_TOP.

- Now, it's the time to check if the ProcessRecord already exists for the process.

If the ProcessRecord is null, the ActivityManager has to create a new process to instantiate the target component.

### part2
#### Process Creation 

ActivityManagerService creates a new process by invoking startProcessLocked() method which sends arguments to Zygote process over the socket connection. Zygote forks itself and calls ZygoteInit.main() which then instantiates ActivityThread object and finally returns pid of newly created process.
ActivityThread then starts the message loop by calling Looper.prepareLoop() and Looper.loop() subsequently.

The following sequence captures the call sequence in detail -

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/Android%E7%BB%84%E4%BB%B6/09.JPG)


#### Application Binding 

The next step is to attach the process to the specific application. This is done by calling bindApplication on the thread object. This method sends BIND_APPLICATION message to the message queue. This message is retrieved by the handler object which then invokes handleMessage() method to trigger the message specific action - handleBindApplication(). This method invokes makeApplication() method which loads app specific classes into memory.

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/Android%E7%BB%84%E4%BB%B6/10.JPG)



#### Activity Launch 

After the previous step, the system contains the process responsible for the application with application classes loaded in process's private memory. The call sequence to launch an activity is common between a newly created process and an existing process. The actual process of launching starts in realStartActivity() method which calls sheduleLaunchActivity() on the application thread object. This method sends LAUNCH_ACTIVITY message to the message queue. The message is handled by handleLaunchActivity() method as shown below.

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/Android%E7%BB%84%E4%BB%B6/11.JPG)



