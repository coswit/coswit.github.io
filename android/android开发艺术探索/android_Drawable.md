---
title: Drawable
date: 2018/8/31
categories:
- 读书笔记
-  Android
tags:
-  Android开发艺术探索
---




### BitmapDrawable

```xml
<?xml version="1.0" encoding="utf-8"?>
    <bitmap xmlns:android="http://schemas.android.com/apk/res/android"
         android:src="@[package:]drawable/drawable_resource"
         android:antialias=["true" | "false"]
         android:dither=["true" | "false"]
         android:filter=["true" | "false"]
         android:gravity=["top" | "bottom"|"left"|"right" |"center_vertical" |"fill_vertical"|"center_horizontal" | "fill_horizontal" |"center" | "fill" | "clip_vertical" | "clip_horizontal"]
         
         android:mipMap=["true" | "false"]
         android:tileMode=["disabled" | "clamp" | "repeat" | "mirror"] />
```
- android:antialias:是否开启图片抗锯齿功能。开启后会让图片变得平滑，同时也会在一定程度上降低图片的清晰度，但是这个降低的幅度较低以至于可以忽略，因此抗锯齿选项应该开启。
- android:dither:是否开启抖动效果。当图片的像素配置和手机屏幕的像素配置不一致时，开启这个选项可以让高质量的图片在低质量的屏幕上还能保持较好的显示效果，比如图片的色彩模式为ARGB8888，但是设备屏幕所支持的色彩模式为RGB555，这个时候开启抖动选项可以让图片显示不会过于失真。在Android中创建的Bitmap一般会选用ARGB8888这个模式，即ARGB四个通道各占8位，在这种色彩模式下，一个像素所占的大小为4个字节，一个像素的位数总和越高，图像也就越逼真。根据分析，抖动效果也应该开启。
- android:filter : 是否开启过滤效果。当图片尺寸被拉伸或者压缩时，开启过滤效果可以保持较好的显示效果，因此此选项也应该开启。
- android:gravity :当图片小于容器的尺寸时，设置此选项可以对图片进行定位。
![image](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an3.png)
- android:mipMap : 一种图像相关的处理技术，也叫纹理映射
- android:tileMode : 其中disable表示关闭平铺模式，是默认值。repeat表示的是简单的水平和竖直方向上的平铺效果；mirror表示一种在水平和竖直方向上的镜面投影效果；而clamp表示的效果就更加奇特，图片四周的像素会扩展到周围区域。

![image](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an5.png)



<!--- more--->

### ShapeDrawable
其实体类实际上是GradientDrawable
```xml
  <?xml version="1.0" encoding="utf-8"?>
    <shape xmlns:android="http://schemas.android.com/apk/res/android"
         android:shape=["rectangle" | "oval" | "line" | "ring"] >
         <corners
             android:radius="integer"
             android:topLeftRadius="integer"
             android:topRightRadius="integer"
             android:bottomLeftRadius="integer"
             android:bottomRightRadius="integer" />
         <gradient
             android:angle="integer"
             android:centerX="integer"
             android:centerY="integer"
             android:centerColor="integer"
             android:endColor="color"
             android:gradientRadius="integer"
             android:startColor="color"
             android:type=["linear" | "radial" | "sweep"]
             android:useLevel=["true" | "false"] />
         <padding
             android:left="integer"
             android:top="integer"
             android:right="integer"
             android:bottom="integer" />
         <size
             android:width="integer"
             android:height="integer" />
         <solid
             android:color="color" />
         <stroke
             android:width="integer"
             android:color="color"
             android:dashWidth="integer"
             android:dashGap="integer" />
    </shape>             
```

- android:shape:图形的形状
- <corners> : shape的四个角的角度,适用于矩形shape
- <gradient> : 与<solid>标签是互相排斥的，其中solid表示纯色填充，而gradient则表示渐变效果
    > android:gradientRadius——渐变半径，仅当android:type= "radial"时有效；
    > android:useLevel——一般为false，当Drawable作为StateListDrawable使用时为true；
    > android:type——渐变的类别，linear（线性渐变）、radial（径向渐变）、sweep（扫描线渐变）三种，其中默认值为线性渐变.
    > ![image](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an6.png)

- stroke :Shape的描边
- padding : 包含它的View的空白


 ### LayerDrawable

 ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <layer-list
         xmlns:android="http://schemas.android.com/apk/res/android">
         <item
             android:drawable="@[package:]drawable/drawable_resource"
             android:id="@[+][package:]id/resource_name"
             android:top="dimension"
             android:right="dimension"
             android:bottom="dimension"
             android:left="dimension" />
    </layer-list>
 ```

- android:top、android:bottom、android:left和android:right，它们分别表示Drawable相对于View的上下左右的偏移量，单位为像素


示例：

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an7.png)

```xml
    <?xml version="1.0" encoding="utf-8"?>
    <layer-list xmlns:android="http://schemas.android.com/apk/res/android" >
         <item>
             <shape android:shape="rectangle" >
                 <solid android:color="#0ac39e" />
             </shape>
         </item>
         <item android:bottom="6dp">
             <shape android:shape="rectangle" >
                 <solid android:color="#ffffff" />
             </shape>
         </item>
         <item
             android:bottom="1dp"
             android:left="1dp"
             android:right="1dp">
             <shape android:shape="rectangle" >
                 <solid android:color="#ffffff" />
             </shape>
         </item>
    </layer-list>
```

### StateListDrawable（selector)
表示Drawable集合
```xml
    <?xml version="1.0" encoding="utf-8"?>
    <selector xmlns:android="http://schemas.android.com/apk/res/android"
         android:constantSize=["true" | "false"]
         android:dither=["true" | "false"]
         android:variablePadding=["true" | "false"] >
         <item
             android:drawable="@[package:]drawable/drawable_resource"
             android:state_pressed=["true" | "false"]
             android:state_focused=["true" | "false"]
             android:state_hovered=["true" | "false"]
             android:state_selected=["true" | "false"]
             android:state_checkable=["true" | "false"]
             android:state_checked=["true" | "false"]
             android:state_enabled=["true" | "false"]
             android:state_activated=["true" | "false"]
             android:state_window_focused=["true" | "false"] />
    </selector>         
```

- android:constantSize : StateListDrawable的固有大小是否不随着其状态的改变而改变的，因为状态的改变会导致StateListDrawable切换到具体的Drawable，而不同的Drawable具有不同的固有大小。True表示StateListDrawable的固有大小保持不变，这时它的固有大小是内部所有Drawable的固有大小的最大值，false则会随着状态的改变而改变。此选项默认值为false。
- android:dither : 是否开启抖动效果
- android:variablePadding : StateListDrawable的padding表示是否随着其状态的改变而改变，true表示会随着状态的改变而改变，false表示StateListDrawable的padding是内部所有Drawable的padding的最大值。此选项默认值为false，并且不建议开启此选项。

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an9.png)

### LevelListDrawable
表示一个Drawable集合，集合中的每个Drawable都有一个等级（level）的概念。根据不同的等级，LevelListDrawable会切换为对应的Drawable,Drawable的等级是0～10000
```xml
    <?xml version="1.0" encoding="utf-8"?>
    <level-list
         xmlns:android="http://schemas.android.com/apk/res/android" >
         <item
             android:drawable="@drawable/drawable_resource"
             android:maxLevel="integer"
             android:minLevel="integer" />
    </level-list>
```
当它作为View的背景时，可以通过Drawable的setLevel方法来设置不同的等级从而切换具体的Drawable。如果它被用来作为ImageView的前景Drawable，那么还可以通过ImageView的setImageLevel方法来切换Drawable
```xml
    <?xml version="1.0" encoding="utf-8"?>
    <level-list xmlns:android="http://schemas.android.com/apk/res/android" >
         <item
             android:drawable="@drawable/status_off"
             android:maxLevel="0" />
         <item
             android:drawable="@drawable/status_on"
             android:maxLevel="1" />
    </level-list>
```

### TransitionDrawable

实现两个Drawable之间的淡入淡出效果,语法：

```xml
    <?xml version="1.0" encoding="utf-8"?>
    <transition
    xmlns:android="http://schemas.android.com/apk/res/android" >
         <item
             android:drawable="@[package:]drawable/drawable_resource"
             android:id="@[+][package:]id/resource_name"
             android:top="dimension"
             android:right="dimension"
             android:bottom="dimension"
             android:left="dimension" />
    </transition>
```

示例：
1. 首先定义TransitionDrawable
```xml
    // res/drawable/transition_drawable.xml
    <?xml version="1.0" encoding="utf-8"?>
    <transition xmlns:android="http://schemas.android.com/apk/res/android">
         <item android:drawable="@drawable/drawable1" />
         <item android:drawable="@drawable/drawable2" />
    </transition>
```
2. 接着TransitionDrawable设置为View的背景,或者在ImageView中直接作为Drawable来使用

```xml
    <TextView
         android:id="@+id/button"
         android:layout_height="wrap_content"
         android:layout_width="wrap_content"
         android:background="@drawable/transition_drawable" />
```

3.通过它的startTransition和reverseTransition方法来实现淡入淡出的效果以及它的逆过程

```java
  TextView textView = (TextView) findViewById(R.id.test_transition);
  TransitionDrawable drawable = (TransitionDrawable) textView.getBackground();
 drawable.startTransition(1000);
```

### InsetDrawable
将其他Drawable内嵌到自己当中，并可以在四周留出一定的间距。当一个View希望自己的背景比自己的实际区域小的时候，可以采用InsetDrawable来实现，同时我们知道，通过LayerDrawable也可以实现这种效果。
```xml
  <?xml version="1.0" encoding="utf-8"?>
    <inset xmlns:android="http://schemas.android.com/apk/res/android"
         android:drawable="@drawable/drawable_resource"
         android:insetTop="dimension"
         android:insetRight="dimension"
         android:insetBottom="dimension"
         android:insetLeft="dimension" />
```
android:insetTop、android:insetBottom、android:insetLeft和android:insetRight分别表示顶部、底部、左边和右边内凹的大小。在下面的例子中，inset中的shape距离View的边界为15dp。
```xml
    <?xml version="1.0" encoding="utf-8"?>
    <inset xmlns:android="http://schemas.android.com/apk/res/android"
         android:insetBottom="15dp"
         android:insetLeft="15dp"
         android:insetRight="15dp"
         android:insetTop="15dp" >
        <shape android:shape="rectangle" >
             <solid android:color="#ff0000" />
         </shape>
    </inset>
```

### ScaleDrawable

```xml
    <?xml version="1.0" encoding="utf-8"?>
    <scale
         xmlns:android="http://schemas.android.com/apk/res/android"
         android:drawable="@drawable/drawable_resource"
         android:scaleGravity=["top" | "bottom" | "left" | "right" | "center_vertical" |"fill_vertical" | "center_horizontal" | "fill_horizontal" | "center" | "fill" | "clip_vertical" |"clip_horizontal"]
         android:scaleHeight="percentage"
         android:scaleWidth="percentage" />
```

示例：近似地将一张图片缩小为原大小的30％
```xml
    // res/drawable/scale_drawable.xml
    <?xml version="1.0" encoding="utf-8"?>
    <scale xmlns:android="http://schemas.android.com/apk/res/android"
         android:drawable="@drawable/image1"
         android:scaleHeight="70%"
         android:scaleWidth="70%"
         android:scaleGravity="center" />
```
直接使用上面的drawable资源是不行的，还必须设置ScaleDrawable的等级为大于0且小于等于10000的值

```java
   View testScale = findViewById(R.id.test_scale);
    ScaleDrawable testScaleDrawable = (ScaleDrawable) testScale.getBackground();
    testScaleDrawable.setLevel(1);
```
如果少了设置等级这一步，由于Drawable的默认等级为0，那么ScaleDrawable将无法显示出来。我们可以武断地将Drawable的等级设置为大于10000的值，比如20000，虽然也能正常工作，但是不推荐这么做，这是因为系统内部约定Drawable等级的范围为0到10000

源码,ScaleDrawable的draw方法:
```java
  public void draw(Canvas canvas) {
        if (mScaleState.mDrawable.getLevel() != 0)
                mScaleState.mDrawable.draw(canvas);
  }              
```
ScaleDrawable的onBoundsChange方法:
```java
    protected void onBoundsChange(Rect bounds) {
        final Rect r = mTmpRect;
        final boolean min = mScaleState.mUseIntrinsicSizeAsMin;
        int level = getLevel();
        int w = bounds.width();
        if (mScaleState.mScaleWidth > 0) {
                final int iw = min ? mScaleState.mDrawable.getIntrinsicWidth() : 0;
                w -= (int) ((w -iw) * (10000 -level) * mScaleState.mScaleWidth / 10000);
        }
        int h = bounds.height();
        if (mScaleState.mScaleHeight > 0) {
                final int ih = min ? mScaleState.mDrawable.getIntrinsicHeight() : 0;
                h -= (int) ((h -ih) * (10000 -level) * mScaleState.mScaleHeight / 10000);
        }
        final int layoutDirection = getLayoutDirection();
        Gravity.apply(mScaleState.mGravity,w,h,bounds,r,layoutDirection);
        if (w > 0 && h > 0) {
                mScaleState.mDrawable.setBounds(r.left,r.top,r.right,r.bottom);
        }
    }
```

### ClipDrawable

```xml
    <?xml version="1.0" encoding="utf-8"?>
    <clip
         xmlns:android="http://schemas.android.com/apk/res/android"
         android:drawable="@drawable/drawable_resource"
         android:clipOrientation=["horizontal" | "vertical"]
         android:gravity=["top" | "bottom"|"left" | "right"|"center_vertical"|"fill_vertical"|"center_horizontal"|"fill_horizontal" |"center" |"fill"|"clip_vertical"|"clip_horizontal"] />
         
```
- clipOrientation表示裁剪方向

| 选项 | 含义|
| -- | -- |
| top | 将内部的Drawable放在容器的顶部，不改变其大小。当 clipOrientation 是”vertical”，裁剪从底部开始     |
|bottom  | 将这个对象放在容器的底部，不改变其大小。当clipOrientation 是 “vertical”，裁剪从顶部（top）开始      |
|left  |将这个对象放在容器的左部，不改变其大小。当clipOrientation 是 “horizontal”，裁剪从drawable的右边（right）开始，默认值     |
| right  |  将这个对象放在容器的右部，不改变其大小。当clipOrientation 是 “horizontal”，裁剪从drawable的左边（left）开始     |
|center_vertical | 将对象放在垂直中间，不改变其大小，如果clipOrientation 是 “vertical”，那么从上下同时开始裁剪     |
|fill_vertical   | 垂直方向上不发生裁剪。（除非drawable的level是 0，才会不可见，表示全部裁剪完）     |
|center_horizontal  |  将对象放在水平中间，不改变其大小，clipOrientation 是 “horizontal”，那么从左右两边开始裁剪     |
|fill_horizontal | 水平方向上不发生裁剪。（除非drawable的level是 0，才会不可见，表示全部裁剪完）     |
|center  | 将这个对象放在水平垂直坐标的中间，不改变其大小。当clipOrientation 是 “horizontal”裁剪发生在左右。当clipOrientation是”vertical”,裁剪发生在上下。     |
|fill | 填充整个容器，不会发生裁剪。(除非drawable的level是 0，才会不可见，表示全部裁剪完)。     |
| clip_vertical  |  附加选项，表示竖直方向的裁剪，很少使用     |
| clip_horizontal | 附加选项，表示水平方向的裁剪，很少使用     |

示例：实现将一张图片从上往下进行裁剪的效果
1. 定义clip_drawable.xml
```xml
    <?xml version="1.0" encoding="utf-8"?>
    <clip xmlns:android="http://schemas.android.com/apk/res/android"
         android:clipOrientation="vertical"
         android:drawable="@drawable/image1"
         android:gravity="bottom" />

```
2. 将它设置给ImageView
```xml
 <ImageView
        android:id="@+id/test_clip"
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:src="@drawable/clip_drawable"
        android:gravity="center" />
```
3. 在代码中设置ClipDrawable的等级
```java
    ImageView testClip = (ImageView) findViewById(R.id.test_clip);
    ClipDrawable testClipDrawable = (ClipDrawable) testClip.getDrawable();
    testClipDrawable.setLevel(5000);
```
Drawable的等级（level）是有范围的，即0～10000，最小等级是0，最大等级是10000，对于ClipDrawable来说，等级0表示完全裁剪，即整个Drawable都不可见了，而等级10000表示不裁剪。在上面的代码中将等级设置为8000表示裁剪了2000，即在顶部裁剪掉20％的区域，被裁剪的区域就相当于不存在了

![image](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an8.png)



![image](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an10.png)