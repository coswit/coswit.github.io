## 1. 注解(@StringDef/@IntDef)

用常量 + @StringDef 约束取值范围,编译期检查,替代 Java 枚举的开销:

```java
@StringDef({LinkType.HICAR, LinkType.CARLINK, LinkType.HONOR, LinkType.WUTONG, LinkType.UNKNOWN})
@Retention(RetentionPolicy.SOURCE)
public @interface LinkType {
    String HICAR = "hicar";
    String CARLINK = "carlink";
    String HONOR = "hihonor";
    String WUTONG = "wutong";
    String UNKNOWN = "unknown";
}
```

## 2. 字符串占位符

strings.xml 中使用格式化占位符,`getString(R.string.xxx, args)` 或 `String.format()` 填充:

| 占位符 | 类型 |
| --- | --- |
| %1$d | int |
| %s | string |
| %f | double/float |

## 3. TextView 常用属性

```xml
android:textScaleX="0.9f"  <!-- 字间距 -->
android:ellipsize="end"    <!-- 末尾省略号 -->
android:ellipsize="marquee" <!-- 跑马灯 -->
android:lineSpacingExtra="3dp"      <!-- 设置行间距 -->
android:lineSpacingMultiplier="1.2" <!-- 设置行间距的倍数 -->
```

## 4. 字符转义

```text
&#160;   不间断空格(non-breaking space)
&#12288; 全角空格
```

## 5. 自定义字体

```java
TextView shopname = (TextView) view.findViewById(R.id.tv_set_myPackets_coupou_shopname);
Typeface fromAsset = Typeface.createFromAsset(getAssets(), "fonts/hwjt.TTF");
shopname.setTypeface(fromAsset);
```

## 6. 返回桌面

```java
Intent intent = new Intent();
intent.setAction("android.intent.action.MAIN");
intent.addCategory("android.intent.category.HOME");
startActivity(intent);
```

## 7. 读取 assets 下的文件

```java
InputStream inputStream = null;
try {
    inputStream = getAssets().open("test.txt");
    int size = inputStream.available();
    int len = -1;
    byte[] bytes = new byte[size];
    inputStream.read(bytes);
    inputStream.close();
    String string = new String(bytes);
    Log.d("aa", string);
} catch (IOException e) {
    e.printStackTrace();
}
```

## 8. ViewGroup 的绘制(setWillNotDraw)

ViewGroup 默认设置了 WILL_NOT_DRAW 标志位,其 onDraw 方法不会被执行。自定义 ViewGroup 需要重写 onDraw 绘制内容时,必须显式开启:

```java
setWillNotDraw(false);
```

## 9. 阴影绘制

```java
mPaint = new Paint();
setLayerType(LAYER_TYPE_SOFTWARE, null); // setShadowLayer 需要关闭硬件加速
// 设定阴影(柔边, X 轴位移, Y 轴位移, 阴影颜色)
mPaint.setShadowLayer(20, 5, 10, 0xFF666666);
mPaint.setColor(Color.WHITE);
canvas.drawRect(50, 50, getWidth() - 50, getHeight() - 50, mPaint);
```

## 10. 状态栏隐藏与全屏

```java
private void hideStatusBar() {
    if (Build.VERSION.SDK_INT < 16) {
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
    } else {
        View decorView = getWindow().getDecorView();
        // Hide the status bar.
        int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
        // Remember that you should never show the action bar if the
        // status bar is hidden, so hide that too if necessary.
        ActionBar actionBar = getActionBar();
        if (actionBar != null) {
            actionBar.hide();
        }
    }
}
```

```java
requestWindowFeature(Window.FEATURE_NO_TITLE);
getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
        WindowManager.LayoutParams.FLAG_FULLSCREEN);
```

> 注:`setSystemUiVisibility`/`SYSTEM_UI_FLAG_FULLSCREEN` 自 API 30 起已废弃,新代码应使用 `WindowInsetsController`:

```java
getWindow().setDecorFitsSystemWindows(false);
getWindow().getInsetsController().hide(WindowInsets.Type.statusBars());
```

## 11. dp 与 px 互转(补写)

代码中设置尺寸的参数单位是 px,而设计稿通常标注 dp,需要互转:

```java
public static int dp2px(Context context, float dp) {
    float density = context.getResources().getDisplayMetrics().density;
    return (int) (dp * density + 0.5f);
}

public static int px2dp(Context context, float px) {
    float density = context.getResources().getDisplayMetrics().density;
    return (int) (px / density + 0.5f);
}
```

## 12. 获取屏幕宽高(补写)

```java
WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
Point point = new Point();
wm.getDefaultDisplay().getRealSize(point); // getRealSize 含系统栏,getSize 不含
int width = point.x;
int height = point.y;
```

> 注:`getDefaultDisplay()` 自 API 30 起废弃,新代码使用 WindowMetrics:

```java
WindowMetrics metrics = context.getWindowManager().getCurrentWindowMetrics();
int width = metrics.getBounds().width();
int height = metrics.getBounds().height();
```
