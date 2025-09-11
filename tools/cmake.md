

### 基本语法

```cmake
#最低CMake版本
cmake_minimum_required(VERSION 3.4.1)
#设置工程名
project (hello_cmake)

#创建一个变量，名字叫SOURCE。它包含了所有的cpp文件。
set(SOURCES
    src/Hello.cpp
    src/main.cpp
)

##用所有的源文件生成一个可执行文件，因为这里定义了SOURCE变量，不需要再罗列cpp文件
add_executable(hello_headers ${SOURCES})

#设置这个可执行文件hello_headers需要包含的库的路径，PROJECT_SOURCE_DIR是cmake文件所在目录
target_include_directories(hello_headers
    PRIVATE 
        ${PROJECT_SOURCE_DIR}/include
)
```

| 固定变量                 | 对应值                                                     |
| :----------------------- | :--------------------------------------------------------- |
| CMAKE_SOURCE_DIR         | 源代码目录，工程顶层目录。暂认为就是PROJECT_SOURCE_DIR     |
| CMAKE_CURRENT_SOURCE_DIR | 当前处理的 CMakeLists.txt 所在的路径                       |
| PROJECT_SOURCE_DIR       | 工程顶层目录                                               |
| CMAKE_BINARY_DIR         | 运行cmake的目录。外部构建时就是build目录                   |
| CMAKE_CURRENT_BINARY_DIR | The build directory you are currently in.当前所在build目录 |
| PROJECT_BINARY_DIR       | 暂认为就是CMAKE_BINARY_DIR                                 |

#### 具体使用

target_include_directories： 编译此目标时，这将使用-I标志将这些目录添加到编译器中，例如 -I /目录/路径

- PRIVATE - 目录被添加到目标（库）的包含路径中。
- INTERFACE - 目录没有被添加到目标（库）的包含路径中，而是链接了这个库的其他目标（库或者可执行程序）包含路径中
- PUBLIC - 目录既被添加到目标（库）的包含路径中，同时添加到了链接了这个库的其他目标（库或者可执行程序）的包含路径中

```cmake
target_include_directories(target
    PRIVATE
        ${PROJECT_SOURCE_DIR}/include
)
```

add_library用于从某些源文件创建一个库，默认生成在构建文件夹

```cmake
add_library(hello_library STATIC
    src/Hello.cpp
)
```
`set_target_properties` 是一个用于设置目标（如库或可执行文件）属性的命令。通过这个命令，你可以为特定的目标配置各种属性，例如编译选项、链接选项、输出名称

```cmake
add_library(libanc_posture SHARED IMPORTED)
set_target_properties(libanc_posture PROPERTIES
        IMPORTED_LOCATION ${LINK_DIR}/libanc_posture.so)
```

日志打印

```cmake
message("")
```

#### 编译

编译选项配置

```cmake
 #增加日志
 make VERBOSE=1
 #对应cmake文件中
 set(CMAKE_VERBOSE_MAKEFILE on)
 #告警报错
 add_compile_options(-Wall -Wno-unused-parameter)
```

camke构建

```cmake
mkdir build
cd build/
cmake ..
make VERBOSE=1
```

### Android中的CMake

添加日志支持库

```cmake
find_library( # Defines the name of the path variable that stores the
              # location of the NDK library.
              log-lib

              # Specifies the name of the NDK library that
              # CMake needs to locate.
              log )
#在原生库native-lib中使用        
target_link_libraries( # Specifies the target library.
                       native-lib

                       # Links the log library to the target library.
                       ${log-lib}               
```

### 示例
```cmake
cmake_minimum_required(VERSION 3.4.1)
find_library( # Sets the name of the path variable.
        log-lib

        # Specifies the name of the NDK library that
        # you want CMake to locate.
        log)
include_directories(${CMAKE_SOURCE_DIR}/../plugin-common/src/main/cpp/include)

set(JNI_DIR ${CMAKE_SOURCE_DIR}/src/main/cpp)
set(LINK_DIR ${CMAKE_SOURCE_DIR}/src/main/cpu/jniLibs/arm64-v8a)

add_library(libanc_posture SHARED IMPORTED)
set_target_properties(libanc_posture PROPERTIES
        IMPORTED_LOCATION ${LINK_DIR}/libanc_posture.so)

add_library(lib_label_c_secshared SHARED IMPORTED)
set_target_properties(lib_label_c_secshared PROPERTIES
        IMPORTED_LOCATION "${CMAKE_SOURCE_DIR}/../../vision-base/vision-base/src/main/libs/${ANDROID_ABI}/libc_secshared.so")

add_library(posture_jni SHARED  ${JNI_DIR}/posture_jni.cpp)

target_link_libraries(
        posture_jni
        ${log-lib}
        android
        lib_label_c_secshared
        libanc_posture
)
```

### 参考

[cmake实践](https://www.cnblogs.com/52php/p/5681745.html)

[通过例子学习CMake](https://sfumecjf.github.io/cmake-examples-Chinese/)

[配置 CMake  | Android Studio  | Android Developers](https://developer.android.com/studio/projects/configure-cmake?hl=zh-cn)

