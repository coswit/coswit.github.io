



## 1. Notification

```java
Notification.Builder builder =  new Notification.Builder(context);
PendingIntent pendingIntent = PendingIntent.getService(context, REQUEST_CODE, new Intent(), PendingIntent.FLAG_NO_CREATE);

builder.setContentIntent(pendingIntent);

builder.setSmallIcon(R.mipmap.ic_launcher);
builder.setContentText("通知内容");
builder.setContentTitle("通知标题");

Notification notification = builder.build();


NotificationManager notificationManager = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);

notificationManager.notify(1,notification);
```

## 2.PopWindow

不能在activity中的oncreate方法中直接创建展示，要在生命周期完成后才能展示
```java
findViewById(R.id.main_page_layout).post(new Runnable() {
   public void run() {
     pw.showAtLocation(findViewById(R.id.main_page_layout), Gravity.CENTER, 0, 0);
   }
});

```

popwindow不能跟随软键盘位置移动，会覆盖，可以使用dialog替代
```java
setHeight(ViewGroup.LayoutParams.WRAP_CONTENT);
setWidth(ViewGroup.LayoutParams.WRAP_CONTENT);
showAtLocation(((Activity)context).getWindow().getDecorView(), Gravity.CENTER, 0, 0);
setFocusable(true);
// 设置不允许在外点击消失
setOutsideTouchable(true);
//软键盘不会挡着popupwindow
setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
setBackgroundDrawable(new BitmapDrawable());
update();
```
## 3.AlertDialog
```java
View dialogView = getLayoutInflater().inflate(R.layout.dialog_sign_out, null);
AlertDialog.Builder builder = new AlertDialog.Builder(this);
mAlertDialog = builder.setView(dialogView).create();
mAlertDialog.getWindow().setBackgroundDrawable(getResources().getDrawable(R.drawable.shape_dialog_signout));
WindowManager.LayoutParams params = mAlertDialog.getWindow().getAttributes();
params.height=(int) UiUtil.Dp2Pixel(130,mContext);
params.width =(int) UiUtil.Dp2Pixel(330,mContext);
```
```java
WindowManager.LayoutParams params = alertDialog.getWindow().getAttributes();
alertDialog.show();
WindowManager manager = ((Activity) context).getWindowManager();
Display display = manager.getDefaultDisplay();
params.height = ViewGroup.LayoutParams.WRAP_CONTENT;
params.width = (int) (display.getWidth()*0.8) ;
alertDialog.getWindow().setAttributes(params);
```
方法一：
setCanceledOnTouchOutside(false);调用这个方法时，按对话框以外的地方不起作用。按返回键还起作用
方法二：
setCancelable(false);调用这个方法时，按对话框以外的地方不起作用。按返回键也不起作用

> 设置参数要在show()方法调用后才有效
```java
 LayoutInflater inflater = (LayoutInflater) getApplicationContext().getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        View view = inflater.inflate(R.layout.dialog, null);
        AlertDialog alertDialog = new  AlertDialog.Builder(this).setView(view).create();
        alertDialog.setCanceledOnTouchOutside(false);
        WindowManager manager = getWindowManager();
        Display display = manager.getDefaultDisplay();
        WindowManager.LayoutParams params = alertDialog.getWindow().getAttributes();
        alertDialog.show();
        params.height = ViewGroup.LayoutParams.WRAP_CONTENT;
        params.width = (int) (display.getWidth()*0.8) ;
        alertDialog.getWindow().setAttributes(params);
```

设置背景透明
```java
alertDialog.getWindow().setBackgroundDrawable(new ColorDrawable(ContextCompat.getColor(context,R.color.dialog_translate)));
```
### dialogFrament中使用时：
```java
 @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        getDialog().setCanceledOnTouchOutside(false);
        getDialog().requestWindowFeature(Window.FEATURE_NO_TITLE);
        View rootView = inflater.inflate(R.layout.dialog_progress_bar, container, false);
        Window window = getDialog().getWindow();
        window.setBackgroundDrawableResource(R.color.transparent);
        window.getDecorView().setPadding(0, 0, 0, 0);

        WindowManager.LayoutParams wlp = window.getAttributes();
        wlp.gravity = Gravity.CENTER;
        wlp.height = WindowManager.LayoutParams.WRAP_CONTENT;
		//设置宽度
		 Point point = new Point();
        window.getWindowManager().getDefaultDisplay().getSize(point);
        wlp.width = (int) (point.x *0.9);
        
        window.setAttributes(wlp);
        return rootView;
    }
```
- 全屏不显示statusBar
添加style
```xml
<style name="FullScreenDialogStyle" parent="Theme.AppCompat.Dialog">
        <item name="android:windowNoTitle">true</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorPrimary">@color/colorPrimary</item>

        <!-- Set this to true if you want Full Screen without status bar -->
        <item name="android:windowFullscreen">true</item>

        <item name="android:windowIsFloating">false</item>

        <!-- This is important! Don't forget to set window background -->
        <item name="android:windowBackground">@color/white</item>

        <!-- Additionally if you want animations when dialog opening -->
        <item name="android:windowEnterAnimation">@anim/slide_up</item>
        <item name="android:windowExitAnimation">@anim/slide_down</item>
    </style>
```
设置style
```java
public static RecommendDialog newInstance(){
        RecommendDialog dialog = new RecommendDialog();
        dialog.setStyle(STYLE_NORMAL, R.style.FullScreenDialogStyle);
        return dialog;
    }
```
```java
Window window = dialog.getWindow();
int width = ViewGroup.LayoutParams.MATCH_PARENT;
int height = ViewGroup.LayoutParams.MATCH_PARENT;
window.setLayout(width,height);
```
- 全屏显示statusBar
```java
 Window window = dialog.getWindow();
 View decorView = window.getDecorView();
 decorView.setPadding(0, 0, 0, 0);
 decorView.setBackgroundColor(ContextCompat.getColor(getContext(),R.color.white));
 WindowManager.LayoutParams wlp = window.getAttributes();
 Point point = new Point();
 window.getWindowManager().getDefaultDisplay().getSize(point);
 wlp.width =  (point.x );
 wlp.height =  (point.y);
 window.setAttributes(wlp);
//去掉遮罩层
 window.setDimAmount(0f);
```
## 4.EditText
### 焦点获取
一般控件中的获取焦点，自动弹出软键盘，默认就是，或者添加：
```xml
android:focusable="true"
android:focusableInTouchMode="true"
```
取消默认，不获取：
在父控件中添加

```xml
android:fitsSystemWindows="true"
android:focusableInTouchMode="true"
android:focusable="true"
```
```xml
<EditText...>
    <requestFocus />
</EditText>
```
在dialog 中，弹出软键盘
```java
alertDialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
```
弹出软键盘的设置：
```java
EditText yourEditText= (EditText) findViewById(R.id.yourEditText);
InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
imm.showSoftInput(yourEditText, InputMethodManager.SHOW_IMPLICIT);
```
在activity中弹出软键盘，在AndroidManifest中的相应activity下添加：
```xml
android:windowSoftInputMode="adjustResize"

//强制弹出
android:windowSoftInputMode="stateAlwaysVisible"
```
隐藏软键盘：
```java
InputMethodManager imm = (InputMethodManager) activity.getSystemService(Activity.INPUT_METHOD_SERVICE);
    //Find the currently focused view, so we can grab the correct window token from it.
    View view = activity.getCurrentFocus();
    //If no view currently has focus, create a new one, just so we can grab a window token from it
    if (view == null) {
        view = new View(activity);
    }
imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
```
### 设置输入字符长度
```java
EditText editText = new EditText(context);
editText.setBackground(context.getDrawable(R.drawable.verification_edit_bg_focus));
InputFilter[] array = new InputFilter[1];
array[0] = new InputFilter.LengthFilter(1);
editText.setFilters(array);
```
### 背景修改
去下划线：
```xml
 android:background="@null" 再加自己的drawableBottom
```
禁止换行输入
```xml
android:inputType="text"
android:maxLines="1"
```
## 5. window
获取windowManager
```java
WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
```
获取window，通过获取activity相关的context获取：
```java
 Activity activity = (Activity) getContext();
Window window = activity.getWindow();
```
## 6.webview
```java
/*总共有三种类型：
NORMAL：正常显示，没有渲染变化。
SINGLE_COLUMN：把所有内容放到WebView组件等宽的一列中。   //这个是强制的，把网页都挤变形了
NARROW_COLUMNS：可能的话，使所有列的宽度不超过屏幕宽度。默认的
*/
webSettings.setLayoutAlgorithm(LayoutAlgorithm.SINGLE_COLUMN);  

setting.setDomStorageEnabled(true);//设置DOM Storage缓存
setJavaScriptEnabled(true) ;//支持js脚本
setPluginsEnabled(true) ;//支持插件
setUserWideViewPort(false) ;//将图片调整到适合webview的大小
setSupportZoom(true) ;//支持缩放
setLayoutAlgorithm(LayoutAlgrithm.SINGLE_COLUMN) ;//支持内容从新布局
supportMultipleWindows() ;//多窗口
setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK) ;//关闭webview中缓存
setAllowFileAccess(true) ;//设置可以访问文件
setNeedInitialFocus(true) ;//当webview调用requestFocus时为webview设置节点
setjavaScriptCanOpenWindowsAutomatically(true) ;//支持通过JS打开新窗口
setLoadsImagesAutomatically(true) ;//支持自动加载图片
setBuiltInZoomControls(true);//支持缩放
webView.setInitialScale(35);//设置缩放比例
webView.setScrollBarStyle(View.SCROLLBARS_OUTSIDE_OVERLAY);//设置滚动条隐藏
webView.getSettings().setGeolocationEnabled(true);//启用地理定位
webView.getSettings().setRenderPriority(RenderPriority.HIGH);//设置渲染优先级
```
