## 1.SharedPreference
```java
 private static SharedPreferences sp;
    private static void init(Context context) {
        if (sp == null) {
            sp = PreferenceManager.getDefaultSharedPreferences(BaseApplication.getAppContext());
        }
    }
    public static void setSharedIntData(Context context, String key, int value) {
        if (sp == null) {
            init(context);
        }
        sp.edit().putInt(key, value).commit();
    }
    public static int getSharedIntData(Context context, String key) {
        if (sp == null) {
            init(context);
        }
        return sp.getInt(key, 0);
    }
 
```
>- 强引用
>- 软引用（SoftReference）：垃圾回收器就不会回收它，如果内存空间不足了，就会回收这些对象的内存
>- 弱引用（WeakReference）：一旦发现了只具有弱引用的对象，不管当前内存空间足够与否，都会回收它的内存
>- 虚引用（PhantomReference） 虚引用主要用来跟踪对象被垃圾回收的活动。虚引用与软引用和弱引用的一个区别在于：虚引用必须和引用队列（ ReferenceQueue）联合使用。当垃圾回收器准备回收一个对象时，如果发现它还有虚引用，就会在回收对象的内存之前，把这个虚引用加入到与之关联的引用队列中。程序可以通过判断引用队列中是否已经加入了虚引用，来了解被引用的对象是否将要被垃圾回收。

## 2. 文件存储

### 2.1内部存储Internal storage:
>- 总是可用的
>- 这里的文件默认只能被我们的app所访问。
>- 当用户卸载app的时候，系统会把internal内该app相关的文件都清除干净。
>- Internal是我们在想确保不被用户与其他app所访问的最佳存储区域。

**getFilesDir()**: 返回一个File，代表了我们app的internal目录。
**getCacheDir()**: 返回一个File，代表了我们app的internal缓存目录。请确保这个目录下的文件能够在一旦不再需要的时候马上被删除，并对其大小进行合理限制，例如1MB 。系统的内部存储空间不够时，会自行选择删除缓存文件。


```java
File file = new File(context.getFilesDir(), filename);
```
```java
String filename = "myfile";
String string = "Hello world!";
FileOutputStream outputStream;

try {
  outputStream = openFileOutput(filename, Context.MODE_PRIVATE);
  outputStream.write(string.getBytes());
  outputStream.close();
} catch (Exception e) {
  e.printStackTrace();
}
```
```java
public File getTempFile(Context context, String url) {
    File file;
    try {
        String fileName = Uri.parse(url).getLastPathSegment();
        file = File.createTempFile(fileName, null, context.getCacheDir());
    catch (IOException e) {
        // Error while creating file
    }
    return file;
}
```
### 2.2外部存储external storage
>- 并不总是可用的，因为用户有时会通过USB存储模式挂载外部存储器，当取下挂载的这部分后，就无法对其进行访问了。
>- 是大家都可以访问的，因此保存在这里的文件可能被其他程序访问。
>- 当用户卸载我们的app时，系统仅仅会删除external根目录（getExternalFilesDir()）下的相关文件。
>- External是在不需要严格的访问权限并且希望这些文件能够被其他app所共享或者是允许用户通过电脑访问时的最佳存储区域。


```java
 /* Checks if external storage is available for read and write */
public boolean isExternalStorageWritable() {
    String state = Environment.getExternalStorageState();
    if (Environment.MEDIA_MOUNTED.equals(state)) {
        return true;
    }
    return false;
}

/* Checks if external storage is available to at least read */
public boolean isExternalStorageReadable() {
    String state = Environment.getExternalStorageState();
    if (Environment.MEDIA_MOUNTED.equals(state) ||
        Environment.MEDIA_MOUNTED_READ_ONLY.equals(state)) {
        return true;
    }
    return false;
}
```


- Public files :这些文件对与用户与其他app来说是public的，当用户卸载我们的app时，这些文件应该保留。例如，那些被我们的app拍摄的图片或者下载的文件。
- Private files: 这些文件完全被我们的app所私有，它们应该在app被卸载时删除。尽管由于存储在external storage，那些文件从技术上而言可以被用户与其他app所访问，但实际上那些文件对于其他app没有任何意义。因此，当用户卸载我们的app时，系统会删除其下的private目录。例如，那些被我们的app下载的缓存文件。

使用getExternalStoragePublicDirectory()方法来获取一个 File 对象，该对象表示存储在external storage的目录。


```java
public File getAlbumStorageDir(String albumName) {
    // Get the directory for the user's public pictures directory.
    File file = new File(Environment.getExternalStoragePublicDirectory(
            Environment.DIRECTORY_PICTURES), albumName);
    if (!file.mkdirs()) {
        Log.e(LOG_TAG, "Directory not created");
    }
    return file;
}
```
想要将文件以private形式保存在external storage中，可以通过执行getExternalFilesDir() 来获取相应的目录，并且传递一个指示文件类型的参数。每一个以这种方式创建的目录都会被添加到external storage封装我们app目录下的参数文件夹下（如下则是albumName）。这下面的文件会在用户卸载我们的app时被系统删除。
```java
public File getAlbumStorageDir(Context context, String albumName) {
    // Get the directory for the app's private pictures directory.
    File file = new File(context.getExternalFilesDir(
            Environment.DIRECTORY_PICTURES), albumName);
    if (!file.mkdirs()) {
        Log.e(LOG_TAG, "Directory not created");
    }
    return file;
}
```
### 2.3 查询剩余空间
果事先知道想要保存的文件大小，可以通过执行getFreeSpace() or getTotalSpace() 来判断是否有足够的空间来保存文件，从而避免发生IOException。那些方法提供了当前可用的空间还有存储系统的总容量。
### 2.4 删除文件
```
myFile.delete();
myContext.deleteFile(fileName);
```
>当用户卸载我们的app时，android系统会删除以下文件：
所有保存到internal storage的文件。
所有使用getExternalFilesDir()方式保存在external storage的文件。
然而，通常来说，我们应该手动删除所有通过 getCacheDir() 方式创建的缓存文件，以及那些不会再用到的文件。

## 3. SQLite数据库存储
## 4.网络存储
## 5.ContentProvider存储
