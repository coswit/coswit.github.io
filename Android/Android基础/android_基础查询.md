### 注解

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

### 占位符

```bash
%1$d 

%s 
int类 d
string s
double f
```

### TextView：textView中的属性

```xml
android:textScaleX="0.9f"  字间距
android:ellipsize="end" 末尾省略号
android:ellipsize="marquee"  跑马灯
android:lineSpacingExtra   设置行间距，如”3dp”
android:lineSpacingMultiplier   设置行间距的倍数，如”1.2″
```
### 字符转义

```
 `&#160`;表示全角空格
```
### 字体格式：

```java
TextView shopname = (TextView) view.findViewById(R.id.tv_set_myPackets_coupou_shopname);
Typeface fromAsset = Typeface.createFromAsset(getAssets(),"fonts/hwjt.TTF");
shopname.setTypeface(fromAsset);
```
### 返回桌面

```java
Intent intent = new Intent();
intent.setAction( "android.intent.action.MAIN");
intent.addCategory("android.intent.category.HOME" );
startActivity(intent);
```
### 读取assets下的文件

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
### shape 代码设置

```java
int strokeWidth = 5; // 5px not dp
int roundRadius = 15; // 15px not dp
int strokeColor = Color.parseColor("#2E3135");
int fillColor = Color.parseColor("#DFDFE0");

GradientDrawable gd = new GradientDrawable();
gd.setColor(fillColor);
gd.setCornerRadius(roundRadius);
gd.setStroke(strokeWidth, strokeColor);
```

### divider

```xml
<?xml version="1.0" encoding="UTF-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:insetLeft="50dp"
    android:insetRight="50dp" >

 <shape>
    <solid android:color="@color/orange" />
    <corners android:radius="2.0dip" />
</shape>

</inset>
```
使用
```xml
 <LinearLayout          
            android:layout_width="match_parent"
            android:layout_height="match_parent"         android:divider="@drawable/divider"
            android:showDividers="middle">
```

### editText背景

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">

    <item  >
        <shape >
            <solid android:color="@color/gray_hint_ec"/>

        </shape>
    </item>

    <item  android:bottom="1dp">
        <shape>
            <solid android:color="@color/white" />
        </shape>
    </item>
</layer-list>
```

### 状态栏隐藏

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

### ViewGroup类绘制调用

```
setWillNotDraw(false);
```

### 阴影绘制

```java
mPaint = new Paint();
setLayerType(LAYER_TYPE_SOFTWARE,null);
//设定阴影(柔边, X 轴位移, Y 轴位移, 阴影颜色)
 mPaint.setShadowLayer(20,5,10,0xFF666666);
 mPaint.setColor(Color.WHITE);
 canvas.drawRect(50,50,getWidth()-50,getHeight()-50,mPaint);
```

### 全屏

```java
requestWindowFeature(Window.FEATURE_NO_TITLE);
getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN);
```

