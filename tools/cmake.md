## 基本语法

```cmake
# 最低 CMake 版本
cmake_minimum_required(VERSION 3.4.1)
# 设置工程名
project(hello_cmake)

# 创建一个变量，名字叫 SOURCE，它包含了所有的 cpp 文件
set(SOURCES
    src/Hello.cpp
    src/main.cpp
)

# 用所有的源文件生成一个可执行文件，因为这里定义了 SOURCE 变量，不需要再罗列 cpp 文件
add_executable(hello_headers ${SOURCES})

# 设置这个可执行文件 hello_headers 需要包含的库的路径，PROJECT_SOURCE_DIR 是 cmake 文件所在目录
target_include_directories(hello_headers
    PRIVATE
        ${PROJECT_SOURCE_DIR}/include
)
```

### 固定变量

| 固定变量                 | 对应值                                                     |
| :----------------------- | :--------------------------------------------------------- |
| CMAKE_SOURCE_DIR         | 源代码目录，工程顶层目录。可认为就是 PROJECT_SOURCE_DIR    |
| CMAKE_CURRENT_SOURCE_DIR | 当前处理的 CMakeLists.txt 所在的路径                       |
| PROJECT_SOURCE_DIR       | 工程顶层目录                                               |
| CMAKE_BINARY_DIR         | 运行 cmake 的目录。外部构建时就是 build 目录               |
| CMAKE_CURRENT_BINARY_DIR | The build directory you are currently in. 当前所在 build 目录 |
| PROJECT_BINARY_DIR       | 可认为就是 CMAKE_BINARY_DIR                                |

### target_include_directories

编译此目标时，使用 `-I` 标志将这些目录添加到编译器中，例如 `-I /目录/路径`。

- **PRIVATE** - 目录被添加到目标（库）的包含路径中。
- **INTERFACE** - 目录没有被添加到目标（库）的包含路径中，而是添加到链接了这个库的其他目标（库或者可执行程序）的包含路径中
- **PUBLIC** - 目录既被添加到目标（库）的包含路径中，同时添加到了链接了这个库的其他目标（库或者可执行程序）的包含路径中

```cmake
target_include_directories(target
    PRIVATE
        ${PROJECT_SOURCE_DIR}/include
)
```

### add_library

用于从某些源文件创建一个库，默认生成在构建文件夹：

```cmake
add_library(hello_library STATIC
    src/Hello.cpp
)
```

### set_target_properties

用于设置目标（如库或可执行文件）属性的命令。通过这个命令，可以为特定的目标配置各种属性，例如编译选项、链接选项、输出名称：

```cmake
add_library(libanc_posture SHARED IMPORTED)
set_target_properties(libanc_posture PROPERTIES
        IMPORTED_LOCATION ${LINK_DIR}/libanc_posture.so)
```

### 日志打印

```cmake
message("")
# 常用等级
message(STATUS "普通提示信息")
message(WARNING "警告，不会中断配置")
message(FATAL_ERROR "致命错误，中断配置过程")
```

### target_link_libraries

链接库，与 `target_include_directories` 一样支持 PRIVATE/PUBLIC/INTERFACE 三种作用域：

- **PRIVATE** - 库只被本目标链接，不传递给依赖本目标的目标
- **INTERFACE** - 库不被本目标链接（本目标通常是头文件库），只传递给依赖本目标的目标
- **PUBLIC** - 库既被本目标链接，也传递给依赖本目标的目标

```cmake
target_link_libraries(posture_jni
    PRIVATE
        ${log-lib}
)
```

### include_directories 与 target_include_directories

| 命令 | 作用范围 | 建议 |
| :--- | :--- | :--- |
| include_directories | 对之后定义的所有目标生效（全局） | 老写法，新代码不推荐 |
| target_include_directories | 只对指定目标生效，可控制传递性 | **推荐**，作用域清晰 |

### find_package

查找并加载外部库，成功后导入 `XXX_INCLUDE_DIRS` 与 `XXX_LIBRARIES`（或现代目标的 `XXX::XXX`）：

```cmake
find_package(OpenCV REQUIRED)
target_link_libraries(app PRIVATE ${OpenCV_LIBS})

# 现代 CMake（3.x+）推荐直接链接导入目标，头文件路径自动带上
find_package(Threads REQUIRED)
target_link_libraries(app PRIVATE Threads::Threads)
```

### 源文件收集

```cmake
# 递归收集 src 下所有 cpp 文件
file(GLOB SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp)
file(GLOB_RECURSE SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp)

add_executable(app ${SOURCES})
```

注意：GLOB 在新增/删除文件时不会自动触发重新配置，需要手动重新运行 cmake 或删除 build 目录；源文件变动频繁的项目建议显式罗列。

### 条件与选项

```cmake
# 定义选项，可通过命令行 -DXXX=ON 覆盖
option(USE_XXX "是否启用 XXX" ON)

if(USE_XXX)
    add_definitions(-DUSE_XXX)
else()
    message(STATUS "XXX disabled")
endif()

# 平台判断
if(CMAKE_SYSTEM_NAME STREQUAL "Android")
    # Android 专属配置
endif()

# 比较字符串/数值
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_compile_options(-g -O0)
endif()
```

### 常用变量

```cmake
# 构建类型：Debug / Release / RelWithDebInfo / MinSizeRel
set(CMAKE_BUILD_TYPE Release)
# C++ 标准
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
# 输出目录（多配置生成器如 Visual Studio 用 $<CONFIG> 子路径）
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
# 编译器选项
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall")
```

## 编译

编译选项配置：

```cmake
# 增加日志（在 Makefile 中对应 make VERBOSE=1）
set(CMAKE_VERBOSE_MAKEFILE on)
# 告警报错
add_compile_options(-Wall -Wno-unused-parameter)
```

```bash
# make 构建时打印详细命令
make VERBOSE=1
```

cmake 构建：

```bash
mkdir build
cd build/
cmake ..
make VERBOSE=1
```

新式命令行构建（CMake 3.13+，不用手动 cd）：

```bash
# -B 指定构建目录，同时传配置
cmake -B build -DCMAKE_BUILD_TYPE=Release
# --build 跨生成器统一构建（Makefile 用 make，Ninja 用 ninja）
cmake --build build
# 指定构建类型（多配置生成器如 Visual Studio）
cmake --build build --config Release
# 并行构建
cmake --build build -j 8
```

## Android 中的 CMake

添加日志支持库：

```cmake
find_library( # Defines the name of the path variable that stores the
              # location of the NDK library.
              log-lib

              # Specifies the name of the NDK library that
              # CMake needs to locate.
              log )
# 在原生库 native-lib 中使用
target_link_libraries( # Specifies the target library.
                       native-lib

                       # Links the log library to the target library.
                       ${log-lib} )
```

## 示例

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

## 参考

- [cmake 实践](https://www.cnblogs.com/52php/p/5681745.html)
- [通过例子学习 CMake](https://sfumecjf.github.io/cmake-examples-Chinese/)
- [配置 CMake | Android Studio | Android Developers](https://developer.android.com/studio/projects/configure-cmake?hl=zh-cn)
