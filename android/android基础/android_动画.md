---
title:  Android动画基础使用
date:   2015/6/18
categories:
- Android基础
tags:
-   Android
---




####  Property Animation
>Introduced in Android 3.0 (API level 11), the property animation system lets you animate properties of any object, including ones that are not rendered to the screen. The system is extensible and lets you animate properties of custom types as well.


```java
ValueAnimator animation = ValueAnimator.ofFloat(0f, 1f);
animation.setDuration(1000);
animation.start();

ValueAnimator animation = ValueAnimator.ofObject(new MyTypeEvaluator(), startPropertyValue, endPropertyValue);
animation.setDuration(1000);
animation.start();
```

```java
ObjectAnimator anim = ObjectAnimator.ofFloat(foo, "alpha", 0f, 1f);
anim.setDuration(1000);
anim.start();
```


####  View Animation 
>View Animation is the older system and can only be used for Views. It is relatively easy to setup and offers enough capabilities to meet many application's needs.

<!-- more -->

##### 1.View Animation 各种动画集合
```java
RotateAnimation rotateAnimation = new RotateAnimation( 0, 360, Animation.RELATIVE_TO_SELF , 0.5f , Animation.RELATIVE_TO_SELF, 0.5f);
rotateAnimation.setDuration(2000 );
rotateAnimation.setFillAfter(true );//动画完成后保持状态

ScaleAnimation scaleAnimation = new ScaleAnimation(0 , 1 , 0 , 1 , Animation.RELATIVE_TO_SELF , 0.5f ,Animation.RELATIVE_TO_SELF ,0.5f);
scaleAnimation.setDuration(2000);

AlphaAnimation alphaAnimation = new AlphaAnimation(0 , 1 );
alphaAnimation.setDuration(2000);

AnimationSet set = new AnimationSet(true );
set.addAnimation(rotateAnimation);
set.addAnimation(scaleAnimation);

splashImg.setAnimation(set);
```
##### 2.动画监听
```java
set.setAnimationListener(listener);
private Animation.AnimationListener listener = new Animation.AnimationListener() {
    @Override
    public void onAnimationStart(Animation animation) {

    }

    @Override
    public void onAnimationEnd(Animation animation) {
         startActivity(new Intent(getApplicationContext(),GuidActivity. class));
    }

    @Override
    public void onAnimationRepeat(Animation animation) {

    }
```
##### 3.页面跳转动画切换

    overridePendingTransition(R.anim.enter_anim,R.anim.exit_anim);
  **enter_anim**
```xml
<?xml version="1.0" encoding="utf-8"?>
<set xmlns:android="http://schemas.android.com/apk/res/android"
     android:duration="300">
    <translate
        android:fromXDelta="100%"
        android:toXDelta="0"/>
</set>
```
  **exit_anim**
```xml
<?xml version="1.0" encoding="utf-8"?>
<set xmlns:android="http://schemas.android.com/apk/res/android"
     android:duration="300">
    <translate
        android:fromXDelta="0"
        android:toXDelta="-100%"/>
</set>
```
#### - Drawable Animation
>Drawable  animation involves displaying **Drawable** resources one after another, like a roll of film. This method of animation is useful if you want to animate things that are easier to represent with Drawable resources, such as a progression of bitmaps.

##### 动画插值器
>Interpolator 时间插值类，定义动画变换的速度。能够实现alpha/scale/translate/rotate动画的加速、减速和重复等。Interpolator类其实是一个空接口，继承自TimeInterpolator，TimeInterpolator时间插值器允许动画进行非线性运动变换，如加速和限速等


    AccelerateDecelerateInterpolator 在动画开始与介绍的地方速率改变比较慢，在中间的时候加速
    AccelerateInterpolator 在动画开始的地方速率改变比较慢，然后开始加速
    AnticipateInterpolator 开始的时候向后然后向前甩
    AnticipateOvershootInterpolator 开始的时候向后然后向前甩一定值后返回最后的值
    BounceInterpolator 动画结束的时候弹起
    CycleInterpolator 动画循环播放特定的次数，速率改变沿着正弦曲线
    DecelerateInterpolator 在动画开始的地方快然后慢
    LinearInterpolator 以常量速率改变
    OvershootInterpolator 向前甩一定值后再回到原来位置




