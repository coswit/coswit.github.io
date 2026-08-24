## 1. SharedPreferences

以 key-value 形式存储轻量数据(XML 文件,位于 `/data/data/<package>/shared_prefs/`):

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

> commit 是同步提交并返回 boolean 结果,apply 是异步提交且无返回值,主线程中建议使用 apply 避免阻塞。

## 2. 文件存储

### 2.1 内部存储(Internal storage)

- 总是可用的
- 这里的文件默认只能被我们的 app 所访问
- 当用户卸载 app 的时候,系统会把 internal 内该 app 相关的文件都清除干净
- Internal 是我们在想确保不被用户与其他 app 所访问的最佳存储区域

**getFilesDir()**:返回一个 File,代表了我们 app 的 internal 目录。
**getCacheDir()**:返回一个 File,代表了我们 app 的 internal 缓存目录。请确保这个目录下的文件能够在一旦不再需要的时候马上被删除,并对其大小进行合理限制,例如 1MB。系统的内部存储空间不够时,会自行选择删除缓存文件。

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
    } catch (IOException e) {
        // Error while creating file
        file = null;
    }
    return file;
}
```

### 2.2 外部存储(External storage)

- 并不总是可用的,因为用户有时会通过 USB 存储模式挂载外部存储器,当取下挂载的这部分后,就无法对其进行访问了。
- 是大家都可以访问的,因此保存在这里的文件可能被其他程序访问。
- 当用户卸载我们的 app 时,系统仅仅会删除 external 根目录(getExternalFilesDir())下的相关文件。
- External 是在不需要严格的访问权限并且希望这些文件能够被其他 app 所共享或者是允许用户通过电脑访问时的最佳存储区域。

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

- Public files:这些文件对于用户与其他 app 来说是 public 的,当用户卸载我们的 app 时,这些文件应该保留。例如,那些被我们的 app 拍摄的图片或者下载的文件。
- Private files:这些文件完全被我们的 app 所私有,它们应该在 app 被卸载时删除。尽管由于存储在 external storage,那些文件从技术上而言可以被用户与其他 app 所访问,但实际上那些文件对于其他 app 没有任何意义。因此,当用户卸载我们的 app 时,系统会删除其下的 private 目录。例如,那些被我们的 app 下载的缓存文件。

使用 getExternalStoragePublicDirectory() 方法来获取一个 File 对象,该对象表示存储在 external storage 的目录:

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

想要将文件以 private 形式保存在 external storage 中,可以通过执行 getExternalFilesDir() 来获取相应的目录,并且传递一个指示文件类型的参数。每一个以这种方式创建的目录都会被添加到 external storage 封装我们 app 目录下的参数文件夹下(如下则是 albumName)。这下面的文件会在用户卸载我们的 app 时被系统删除:

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

> 注:Android 10(API 29)引入 **Scoped Storage(分区存储)**,应用访问外部存储被限制在自己的专属目录(getExternalFilesDir 等)内;`getExternalStoragePublicDirectory()` 在 API 30 已废弃,访问公共媒体文件应改用 MediaStore API,访问任意文件应使用 SAF(Storage Access Framework)或走 `MANAGE_EXTERNAL_STORAGE` 权限。`android:requestLegacyExternalStorage="true"` 可临时兼容旧行为,但 targetSdkVersion 30+ 起不再生效。

### 2.3 查询剩余空间

如果事先知道想要保存的文件大小,可以通过执行 getFreeSpace() 或 getTotalSpace() 来判断是否有足够的空间来保存文件,从而避免发生 IOException。这些方法提供了当前可用的空间还有存储系统的总容量。

### 2.4 删除文件

```java
myFile.delete();
myContext.deleteFile(fileName);
```

> 当用户卸载我们的 app 时,Android 系统会删除以下文件:所有保存到 internal storage 的文件;所有使用 getExternalFilesDir() 方式保存在 external storage 的文件。然而,通常来说,我们应该手动删除所有通过 getCacheDir() 方式创建的缓存文件,以及那些不会再用到的文件。

## 3. SQLite 数据库存储

Android 内置 SQLite 数据库,适合存储结构化数据。常规用法是继承 **SQLiteOpenHelper**,在 onCreate 中建表、onUpgrade 中处理版本迁移,通过 getWritableDatabase()/getReadableDatabase() 获得可读写的 SQLiteDatabase,再执行 insert/query/update/delete 与 rawQuery:

```java
public class DBHelper extends SQLiteOpenHelper {
    public DBHelper(Context context) {
        super(context, "app.db", null, 1);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE user (id INTEGER PRIMARY KEY, name TEXT)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // 版本升级时的表结构迁移
    }
}
```

## 4. ContentProvider 存储

**ContentProvider 是 Android 跨进程共享数据的标准接口**,把数据以类似数据库表的形式暴露给其他应用(如通讯录、相册),底层存储可以是 SQLite、文件或内存。外部通过 ContentResolver 的 insert/query/update/delete 方法,以 URI(如 `content://contacts/people`)定位并操作数据;四大组件中的 provider 需在 AndroidManifest.xml 中注册。

### 4.1 自定义 ContentProvider 共享数据

继承 ContentProvider 实现六个抽象方法,配合 UriMatcher 区分 URI 访问的是单条记录还是整个表:

```java
public class UserProvider extends ContentProvider {
    public static final String AUTHORITY = "com.example.app.provider";
    public static final Uri CONTENT_URI = Uri.parse("content://" + AUTHORITY + "/user");

    private static final int USER_DIR = 0;   // 访问整表 content://.../user
    private static final int USER_ITEM = 1;  // 访问单条 content://.../user/1

    private static UriMatcher sMatcher = new UriMatcher(UriMatcher.NO_MATCH);
    static {
        sMatcher.addURI(AUTHORITY, "user", USER_DIR);
        sMatcher.addURI(AUTHORITY, "user/#", USER_ITEM);
    }

    private DBHelper mDbHelper;

    @Override
    public boolean onCreate() {
        mDbHelper = new DBHelper(getContext());
        return true;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection,
                        String[] selectionArgs, String sortOrder) {
        SQLiteDatabase db = mDbHelper.getReadableDatabase();
        switch (sMatcher.match(uri)) {
            case USER_DIR:
                return db.query("user", projection, selection, selectionArgs, null, null, sortOrder);
            case USER_ITEM:
                // 从 URI 中解析出 id,固定按 id 查询
                String id = uri.getPathSegments().get(1);
                return db.query("user", projection, "id = ?", new String[]{id}, null, null, null);
            default:
                throw new IllegalArgumentException("Unknown URI: " + uri);
        }
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        SQLiteDatabase db = mDbHelper.getWritableDatabase();
        long id = db.insert("user", null, values);
        // 通知注册了该 URI 的 ContentObserver 数据已变化
        getContext().getContentResolver().notifyChange(ContentUris.withAppendedId(CONTENT_URI, id), null);
        return ContentUris.withAppendedId(CONTENT_URI, id);
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return mDbHelper.getWritableDatabase()
                .update("user", values, selection, selectionArgs);
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return mDbHelper.getWritableDatabase()
                .delete("user", selection, selectionArgs);
    }

    @Override
    public String getType(Uri uri) {
        switch (sMatcher.match(uri)) {
            case USER_DIR:
                return "vnd.android.cursor.dir/vnd." + AUTHORITY + ".user";
            case USER_ITEM:
                return "vnd.android.cursor.item/vnd." + AUTHORITY + ".user";
            default:
                throw new IllegalArgumentException("Unknown URI: " + uri);
        }
    }
}
```

在 AndroidManifest.xml 中注册,authorities 是该 provider 的全局唯一标识:

```xml
<provider
    android:name=".UserProvider"
    android:authorities="com.example.app.provider"
    android:exported="true" />
```

### 4.2 只共享给指定应用

`android:exported="true"` 意味着所有应用都能访问,要**只共享给指定应用**,靠权限控制,常用三种方式:

**方式一:自定义权限 + signature 保护级别(推荐,适合同一开发者/公司的应用)**

数据方在 manifest 中声明自定义权限,保护级别设为 signature——**只有与数据方使用相同签名签名的应用才能获得该权限**,第三方应用即使声明了也拿不到:

```xml
<!-- 数据提供方的 AndroidManifest.xml -->
<permission
    android:name="com.example.app.permission.READ_USER"
    android:protectionLevel="signature" />

<provider
    android:name=".UserProvider"
    android:authorities="com.example.app.provider"
    android:exported="true"
    android:readPermission="com.example.app.permission.READ_USER" />
```

```xml
<!-- 被授权方的 AndroidManifest.xml,与提供方同签名才能安装成功 -->
<uses-permission android:name="com.example.app.permission.READ_USER" />
```

**方式二:normal/dangerous 级别自定义权限(需用户授权)**

protectionLevel 设为 dangerous 时,被授权方声明权限后还需用户在安装或运行时授予;适合共享给外部指定合作方应用。可进一步用 `android:readPermission`/`android:writePermission` 拆分读写权限。

**方式三:grantUriPermissions 临时授权(一次性授权,常用于文件分享)**

provider 保持 `exported="false"`,通过 Intent 携带 `FLAG_GRANT_READ_URI_PERMISSION` 临时授权给目标应用,授权只在目标应用存活期间有效。FileProvider 分享文件就是这一机制:

```java
Intent intent = new Intent(Intent.ACTION_SEND);
intent.setData(fileUri);
intent.setClassName("com.other.app", "com.other.app.MainActivity"); // 指定接收方
intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); // 临时授予读权限
startActivity(intent);
```

```xml
<provider
    android:name=".UserProvider"
    android:authorities="com.example.app.provider"
    android:exported="false"
    android:grantUriPermissions="true" />
```

> 注:Android 12(API 31)起,所有声明了 intent-filter 的组件必须显式指定 `android:exported`,否则安装失败;无 intent-filter 的 provider 默认 exported="false",仅供本应用或同签名应用访问。

### 4.3 访问方读取数据

任何拿到授权的应用都通过 ContentResolver 访问,与 provider 的进程无关:

```java
ContentResolver resolver = getContentResolver();
Cursor cursor = resolver.query(
        Uri.parse("content://com.example.app.provider/user"),
        null, null, null, null);
if (cursor != null) {
    while (cursor.moveToNext()) {
        String name = cursor.getString(cursor.getColumnIndex("name"));
    }
    cursor.close();
}
```

也可以通过 `acquireContentProviderClient(Uri)` 拿到 ContentProviderClient 进行批量操作;数据变化通知用 `ContentResolver.registerContentObserver(Uri, ...)` 监听,对应 provider 侧的 notifyChange 调用。

## 5. 网络存储

通过网络将数据保存到服务端,App 端通过 HTTP 接口读写(原生 HttpURLConnection 或 OkHttp/Retrofit 等库),适合需要多端同步的数据;注意配合本地缓存策略使用。

## 6. Room

Jetpack 官方的 SQLite ORM(Object-Relational Mapping, 对象关系映射),以注解声明实体与 DAO(Data Access Object, 数据访问对象),编译期校验 SQL,用来替代手写 SQLiteOpenHelper 的样板代码:

```java
@Entity(tableName = "user")
public class User {
    @PrimaryKey(autoGenerate = true)
    public long id;
    public String name;
}

@Dao
public interface UserDao {
    @Insert
    void insert(User user);

    @Query("SELECT * FROM user WHERE id = :id")
    User getById(long id);
}

@Database(entities = {User.class}, version = 1)
public abstract class AppDatabase extends RoomDatabase {
    public abstract UserDao userDao();
}

// 使用,数据库操作必须在子线程执行
AppDatabase db = Room.databaseBuilder(context, AppDatabase.class, "app.db").build();
db.userDao().getById(1);
```

## 7. DataStore

Jetpack 提供的现代 key-value 存储,基于协程与 Flow 实现,官方定位为 SharedPreferences 的替代品。分为 Preferences DataStore(与 SP 类似的 key-value)与 Proto DataStore(基于 Protocol Buffers 的类型化存储)两种:

```kotlin
val Context.dataStore by preferencesDataStore(name = "settings")
val KEY_NAME = stringPreferencesKey("name")

suspend fun saveName(context: Context, name: String) {
    context.dataStore.edit { it[KEY_NAME] = name }
}

fun readName(context: Context): Flow<String> =
    context.dataStore.data.map { it[KEY_NAME] ?: "" }
```

与 SharedPreferences 相比的优势:读写全程异步不阻塞主线程、edit 提供事务保证、通过 Flow 感知数据变化、Proto 方案类型安全。
