## Android命令行工具

配置结构：

```bash
Android/SDK/
└── cmdline-tools/
    └── latest/
        ├── bin/
        ├── lib/
        └── ...
```

Linux下载最新的命令行工具：

```bash
mkdir -p ~/Android/SDK/cmdline-tools
cd ~/Android/SDK/cmdline-tools
# 下载
wget https://dl.google.com/android/repository/commandlinetools-linux-14742923_latest.zip
uzip commandlinetools-linux-*.zip
mv cmdline-tools latest
```

### Android环境变量

配置

```shell
export ANDROID_HOME=~/Android/SDK
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH

#或者
export ANDROID_HOME=/usr/lib/android-sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH
```
参考链接：[环境变量  | Android Studio  | Android Developers](https://developer.android.com/tools/variables?hl=zh-cn)

### sdkmangager命令

```shell
sdkmanager --no_https --proxy=http --proxy_host=proxy.*.com --proxy_port=8080 --list
sdkmanager --no_https --proxy=http --proxy_host=proxy.*.com --proxy_port=8080 --install  "ndk;25.2.9519653"
```

安装：

```bash
sdkmanager --install "build-tools;34.0.0"
sdkmanager --install "platforms;android-35"
```

### 旧版配置

在java11使用sdkmanager会报错：

```cmd
Error: LinkageError occurred while loading main class com.android.sdklib.tool.sdkmanager.SdkManagerCli        java.lang.UnsupportedClassVersionError: com/android/sdklib/tool/sdkmanager/SdkManagerCli has been compiled by a more recent version of the Java Runtime (class file version 61.0), this version of the Java Runtime only recognizes class file versions up to 55.0
```

解决方案1：改为下载旧版本：


```shell
$ wget https://dl.google.com/android/repository/commandlinetools-linux-8512546_latest.zip
```

解决方案2：切换高版本jdk

```shell
sudo update-alternatives --config java
```

要使用sdkmanager，需要将下载的文件夹移动到对应的目录：

```shell
$ cd cmdline-tools/
$ ls
     bin  lib  NOTICE.txt  source.properties
$ mkdir latest
$ mv bin/ lib/ NOTICE.txt source.properties latest/
```

## maven

maven下载：[Download Apache Maven – Maven](https://maven.apache.org/download.cgi)。

Windows下的配置：

```shell
# 系统环境变量配置
MAVEN_HOME  D:\maven
# PATH 中加入
%MAVEN_HOME%\apache-maven-3.9.11\bin

# 测试
mvn -v
```


### 本地maven配置

要使用本地Maven库时，可指定本地路径，方便项目中替换调试本地aar包。

默认位置在`~/.m2/repository`， 在全局配置`${user.home}/.m2/settings.xml`或用户配置`${maven.home}/conf/settings.xml`中增加配置：

```xml
<settings>
  <!-- 其他配置 -->
   <localRepository>D:\maven\repository</localRepository>
</settings>
```

在项目中的配置：

```groovy
mavenRepo=D\:\\workspaces\\maven\\local_repository
mavenLocal().mavenLocalRepoDir = file("$mavenRepo")

allprojects {
    repositories {
        mavenLocal()
        maven {url file("D\:\\workspaces\\maven\\local_repository"")}
        maven {url 'file://D:/workspaces/maven/local_repository'}
    }
} 	
```

复制到本地maven仓

```groovy
task cacheToMavenLocal(type: Copy) {
    from new File(gradle.gradleUserHomeDir, 'caches/modules-2/files-2.1')
    into repositories.mavenLocal().url
    eachFile {
        List<String> parts = it.path.split('/')
        it.path = (parts[0]+ '/' + parts[1]).replace('.','/') + '/' + parts[2] + '/' + parts[4]
    }
    includeEmptyDirs false
    duplicatesStrategy DuplicatesStrategy.EXCLUDE

}
```

## gradle

### 指定镜像

gradle配置镜像，[阿里云](https://developer.aliyun.com/mirror/)：

```shell
# gradle-wrapper.properties
distributionUrl=https\://mirrors.aliyun.com/gradle/distributions/v7.4.0/gradle-7.4-bin.zip

#腾讯云
distributionUrl=https://mirrors.cloud.tencent.com/gradle/gradle-8.7-bin.zip
```

### gradle本地配置

如果不配置gradle路径，默认会放置在`${user.home}/.gradle`，可以手动配置环境变量`GRADLE_USER_HOME`，如Windows下可将值设为`D:\gradle\gradle_user_home`，就会使用手动设置的路径。

修改全局设置：在`~/.gradle/init.gradle`文件中添加：

```groovy
allprojects {
    repositories {
        // 自定义本地仓库路径
        maven {
            url "file:///Users/yourname/Android/local-repo"
        }
        
        // 保留默认本地仓库
        mavenLocal() 
        
        // 其他仓库...
    }
}
```

### Java版本问题

如果需要更换当前项目中的Java版本，可以在`gradle.properties`中增加配置，不必更改系统中的Java版本：

```shell
#17版本
org.gradle.java.home=C\:\\Program Files\\Java\\jdk-17.0.11
#11版本
org.gradle.java.home=C\:\\Program Files\\Java\\corretto-11.0.21

#允许不安全协议
 allowInsecureProtocol = true
```

有时可能遇到的问题：PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target， 具体[解决](https://stackoverflow.com/questions/60720241/gradle-build-fails-due-to-sun-security-validator-validatorexception-despite-inst)如下：

```shell
# ~/.gradle/gradle.properties (MAC)

systemProp.javax.net.ssl.trustStore=/dev/null
systemProp.javax.net.ssl.trustStoreType=KeychainStore
systemProp.java.security.KeyStore=KeychainStore

# (Windows)

systemProp.javax.net.ssl.trustStore=NUL
systemProp.javax.net.ssl.trustStoreType=Windows-ROOT
```