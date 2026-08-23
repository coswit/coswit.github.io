## 1. Property Animation(属性动画)

> Introduced in Android 3.0 (API level 11), the property animation system lets you animate properties of any object, including ones that are not rendered to the screen. The system is extensible and lets you animate properties of custom types as well.

属性动画在 Android 3.0(API level 11)引入,可以对**任意对象的任意属性**做动画,并且**真正改变对象属性的值**,这是与 View Animation 最大的区别。

ValueAnimator 本身不作用于任何对象,它只是按时间推移计算 0→1 的动画进度,需要在 AnimatorUpdateListener 中拿到当前值并自己应用:

```java
ValueAnimator animation = ValueAnimator.ofFloat(0f, 1f);
animation.setDuration(1000);
animation.start();

ValueAnimator animation = ValueAnimator.ofObject(new MyTypeEvaluator(), startPropertyValue, endPropertyValue);
animation.setDuration(1000);
animation.start();
```

ObjectAnimator 是 ValueAnimator 的子类,直接对目标对象的指定属性做动画(内部通过反射调用属性的 setter/getter,因此目标对象必须提供该属性的 get/set 方法):

```java
ObjectAnimator anim = ObjectAnimator.ofFloat(foo, "alpha", 0f, 1f);
anim.setDuration(1000);
anim.start();
```

### AnimatorSet 组合动画(补写)

多个动画需要按顺序或同时播放时,用 AnimatorSet 编排,playTogether 同时执行、playSequentially 顺序执行,也可以用 play().with()/before()/after() 精细控制先后关系:

```java
ObjectAnimator translationAnim = ObjectAnimator.ofFloat(view, "translationX", 0f, 300f);
ObjectAnimator alphaAnim = ObjectAnimator.ofFloat(view, "alpha", 1f, 0f);
AnimatorSet animatorSet = new AnimatorSet();
animatorSet.play(translationAnim).with(alphaAnim);
animatorSet.setDuration(1000);
animatorSet.start();
```

### XML 定义动画资源(补写)

动画 XML 所在的资源目录有区别:**View Animation 与帧动画放在 res/anim/ 目录**(根标签为 alpha/scale/translate/rotate/set 或 animation-list),**Property Animation 放在 res/animator/ 目录**(根标签为 set/objectAnimator/valueAnimator):

```xml
<!-- res/animator/alpha_animator.xml -->
<objectAnimator xmlns:android="http://schemas.android.com/apk/res/android"
    android:propertyName="alpha"
    android:valueFrom="1"
    android:valueTo="0"
    android:duration="1000" />
```

```java
Animator animator = AnimatorInflater.loadAnimator(context, R.animator.alpha_animator);
animator.setTarget(view);
animator.start();
```

## 2. View Animation(视图动画)

> View Animation is the older system and can only be used for Views. It is relatively easy to setup and offers enough capabilities to meet many application's needs.

View Animation 是较老的动画系统,**只能用于 View,且只是改变 View 的视觉效果,并不改变 View 的真实属性(如位置、大小)**,动画结束后 View 仍停留在布局中的原位置。新代码建议优先使用 Property Animation。

### 2.1 各种动画集合

```java
RotateAnimation rotateAnimation = new RotateAnimation(0, 360, Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);
rotateAnimation.setDuration(2000);
rotateAnimation.setFillAfter(true); // 动画完成后保持状态

ScaleAnimation scaleAnimation = new ScaleAnimation(0, 1, 0, 1, Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);
scaleAnimation.setDuration(2000);

AlphaAnimation alphaAnimation = new AlphaAnimation(0, 1);
alphaAnimation.setDuration(2000);

AnimationSet set = new AnimationSet(true);
set.addAnimation(rotateAnimation);
set.addAnimation(scaleAnimation);

splashImg.setAnimation(set);
```

### 2.2 动画监听

```java
set.setAnimationListener(listener);
private Animation.AnimationListener listener = new Animation.AnimationListener() {
    @Override
    public void onAnimationStart(Animation animation) {

    }

    @Override
    public void onAnimationEnd(Animation animation) {
        startActivity(new Intent(getApplicationContext(), GuidActivity.class));
    }

    @Override
    public void onAnimationRepeat(Animation animation) {

    }
```

### 2.3 页面跳转动画切换

```java
overridePendingTransition(R.anim.enter_anim, R.anim.exit_anim);
```

> 注:overridePendingTransition 自 API 34 起已废弃,新代码应使用 `overrideActivityTransition(int transitType, int enterAnim, int exitAnim)` 替代。

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

## 3. Drawable Animation(帧动画)

> Drawable animation involves displaying **Drawable** resources one after another, like a roll of film. This method of animation is useful if you want to animate things that are easier to represent with Drawable resources, such as a progression of bitmaps.

帧动画像放胶卷一样按顺序逐帧播放一系列 Drawable 资源,对应类为 AnimationDrawable,适合用图片序列表达的动画(如加载 loading)。

## 4. Interpolator 与 Evaluator

### 4.1 Interpolator(插值器)

**Interpolator(时间插值器)定义动画变换的速度**,能够实现 alpha/scale/translate/rotate 动画的加速、减速和重复等。Interpolator 类其实是一个空接口,继承自 TimeInterpolator;TimeInterpolator 时间插值器允许动画进行非线性运动变换,如加速和减速等。

| Interpolator | 效果 |
| --- | --- |
| AccelerateDecelerateInterpolator | 在动画开始与结束的地方速率改变比较慢,在中间的时候加速 |
| AccelerateInterpolator | 在动画开始的地方速率改变比较慢,然后开始加速 |
| AnticipateInterpolator | 开始的时候向后然后向前甩 |
| AnticipateOvershootInterpolator | 开始的时候向后然后向前甩一定值后返回最后的值 |
| BounceInterpolator | 动画结束的时候弹起 |
| CycleInterpolator | 动画循环播放特定的次数,速率改变沿着正弦曲线 |
| DecelerateInterpolator | 在动画开始的地方快然后慢 |
| LinearInterpolator | 以常量速率改变 |
| OvershootInterpolator | 向前甩一定值后再回到原来位置 |

### 4.2 Interpolator 与 Evaluator 的关系(补写)

属性动画的每次取值分两步:**Interpolator 决定"时间流逝的百分比"如何映射为"动画完成的百分比"(速度曲线),TypeEvaluator(类型估值器)再决定"动画完成的百分比"如何映射为"具体的属性值"**:

```text
时间流逝百分比 t → Interpolator.getInterpolation(t) → 完成百分比 fraction → TypeEvaluator.evaluate(fraction, start, end) → 当前属性值
```

系统内置的估值器有 IntEvaluator、FloatEvaluator、ArgbEvaluator(颜色插值)。自定义属性类型时,可实现 TypeEvaluator 并配合 ValueAnimator.ofObject 使用,这正是上面 Property Animation 示例中 `new MyTypeEvaluator()` 的作用。
