---
title: View的事件体系
date: 2018/11/9
categories:
- 读书笔记
-  Android
tags:
-  Android开发艺术探索
---




### 基础

#### 位置参数
![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an1.png)
高度、宽度计算
```
width = right - left
height = bottom - top
```
那么如何得到View的这四个参数呢？也很简单，在View的源码中它们对应于mLeft、mRight、mTop和mBottom这四个成员变量，获取方式如下所示。
```
Left=getLeft()；
Right=getRight()；
Top=getTop；
Bottom=getBottom()
```
从Android3.0开始，View增加了额外的几个参数：x、y、translationX和translationY:
- x和y是View左上角的坐标
- translationX和translationY是View左上角相对于父容器的偏移量

这几个参数也是相对于父容器的坐标，并且translationX和translationY的默认值是0，和View的四个基本的位置参数一样，View也为它们提供了get/set方法，这几个参数的换算关系如下所示。
```
x=left+translationX
y=top+translationY
```
需要注意的是，View在平移的过程中，top和left表示的是原始左上角的位置信息，其值并不会发生改变，此时发生改变的是x、y、translationX和translationY这四个参数。

<!-- more -->

#### MotionEvent和TouchSlop

#####  MotionEvent
通过MotionEvent对象我们可以得到点击事件发生的x和y坐标。

- getX/getY ：返回的是相对于当前View左上角的x和y坐标
- getRawX/getRawY：返回的是相对于手机屏幕左上角的x和y坐标。

#####  TouchSlop

TouchSlop是系统所能识别出的被认为是滑动的最小距离，获取:
```java
ViewConfiguration. get(getContext()).getScaledTouchSlop()
```
源码中这个常量定义在frameworks/base/core/res/res/values/config.xml中：

```xml
<!--Base "touch slop" value used by ViewConfiguration as a movement threshold where scrolling should begin. -->
    <dimen name="config_viewConfigurationTouchSlop">8dp</dimen>
```

#### VelocityTracker、GestureDetector和Scroller

##### VelocityTracker
追踪手指在滑动过程中的速度，包括水平和竖直方向的速度.

- 首先，在View的onTouchEvent方法中追踪当前单击事件的速度：

  
```java
VelocityTracker velocityTracker = VelocityTracker.obtain();
velocityTracker.addMovement(event);
```
- 当我们先知道当前的滑动速度时，这个时候可以采用如下方式来获得当前的速度:

  

```java
velocityTracker.computeCurrentVelocity(1000);
int xVelocity = (int) velocityTracker.getXVelocity();
int yVelocity = (int) velocityTracker.getYVelocity();
```
获取速度之前必须调用computeCurrentVelocity先计算速度,比如将时间间隔设为1000ms时，在1s内，手指在水平方向从左向右滑过100像素，那么水平速度就是100。当手指从右往左滑动时，水平方向速度即为负值。
computeCurrentVelocity这个方法的参数表示的是一个时间单元或者说时间间隔，它的单位是毫秒（ms），计算速度时得到的速度就是在这个时间间隔内手指在水平或竖直方向上所滑动的像素数
```
速度=（终点位置-起点位置）/时间段
```
- 当不需要使用它的时候，需要调用clear方法来重置并回收内存：

  
```
    velocityTracker.clear();
    velocityTracker.recycle();
```

#### GestureDetector
手势检测，用于辅助检测用户的单击、滑动、长按、双击等行为.

```java
GestureDetector detector = new GestureDetector(new  GestureDetector.OnGestureListener() {
            @Override
            public boolean onDown(MotionEvent e) {
                return false;
            }

            @Override
            public void onShowPress(MotionEvent e) {

            }

            @Override
            public boolean onSingleTapUp(MotionEvent e) {
                return false;
            }

            @Override
            public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
                return false;
            }

            @Override
            public void onLongPress(MotionEvent e) {

            }

            @Override
            public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
                return false;
            }
        });
        
        
  //解决长按屏幕后无法拖动的现象
    mGestureDetector.setIsLongpressEnabled(false);       
```

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an2.png)



### View的滑动

#### 使用scrollTo/scrollBy

view下源码

```java
    //The offset, in pixels, by which the content of this view is scrolled horizontally.
    protected int mScrollX;
    protected int mScrollX;

    public void scrollTo(int x, int y) {
        if (mScrollX != x || mScrollY != y) {
            int oldX = mScrollX;
            int oldY = mScrollY;
            mScrollX = x;
            mScrollY = y;
            invalidateParentCaches();
            onScrollChanged(mScrollX, mScrollY, oldX, oldY);
            if (!awakenScrollBars()) {
                postInvalidateOnAnimation();
            }
        }
    }
    
    public void scrollBy(int x, int y) {
        scrollTo(mScrollX + x, mScrollY + y);
    }
    
```

mScrollX和mScrollY，可以通过getScrollX和getScrollY方法分别得到，在滑动过程中，mScrollX的值总是等于View左边缘和View内容左边缘在水平方向的距离，而mScrollY的值总是等于View上边缘和View内容上边缘在竖直方向的距离。

![](http://blog-open.oss-cn-beijing.aliyuncs.com/image/android/an3.png)


使用scrollTo和scrollBy来实现View的滑动，只能将View的内容进行移动，并不能将View本身进行移动

#### overScrollBy
```java
    protected boolean overScrollBy(int deltaX, int deltaY, int scrollX, int scrollY,int scrollRangeX, int scrollRangeY,int maxOverScrollX, int maxOverScrollY,boolean isTouchEvent) {
            
        final int overScrollMode = mOverScrollMode;
        final boolean canScrollHorizontal =
                computeHorizontalScrollRange() > computeHorizontalScrollExtent();
        final boolean canScrollVertical =
                computeVerticalScrollRange() > computeVerticalScrollExtent();
        final boolean overScrollHorizontal = overScrollMode == OVER_SCROLL_ALWAYS ||
                (overScrollMode == OVER_SCROLL_IF_CONTENT_SCROLLS && canScrollHorizontal);
        final boolean overScrollVertical = overScrollMode == OVER_SCROLL_ALWAYS ||
                (overScrollMode == OVER_SCROLL_IF_CONTENT_SCROLLS && canScrollVertical);

        int newScrollX = scrollX + deltaX;
        if (!overScrollHorizontal) {
            maxOverScrollX = 0;
        }

        int newScrollY = scrollY + deltaY;
        if (!overScrollVertical) {
            maxOverScrollY = 0;
        }

        // Clamp values if at the limits and record
        final int left = -maxOverScrollX;
        final int right = maxOverScrollX + scrollRangeX;
        final int top = -maxOverScrollY;
        final int bottom = maxOverScrollY + scrollRangeY;

        boolean clampedX = false;
        if (newScrollX > right) {
            newScrollX = right;
            clampedX = true;
        } else if (newScrollX < left) {
            newScrollX = left;
            clampedX = true;
        }

        boolean clampedY = false;
        if (newScrollY > bottom) {
            newScrollY = bottom;
            clampedY = true;
        } else if (newScrollY < top) {
            newScrollY = top;
            clampedY = true;
        }

        onOverScrolled(newScrollX, newScrollY, clampedX, clampedY);

        return clampedX || clampedY;
    }
```

> Scroll the view with standard behavior for scrolling beyond the normal content boundaries. Views that call this method should override `onOverScrolled(int, int, boolean, boolean)` to respond to the results of an over-scroll operation. Views can use this method to handle any touch or fling-based scrolling.




|Parameters| |
| :---: | --- |
|deltaX	int:| Change in X in pixels |
|scrollX int:| Current X scroll value in pixels before applying deltaX |
|scrollRangeX int| Maximum content scroll range along the X axis |
|maxOverScrollX	int:| Number of pixels to overscroll by in either direction along the X axis.允许超过滚动范围的最大值，x方向的滚动范围就是0~maxOverScrollX |
|isTouchEvent boolean:| true if this scroll operation is the result of a touch event. 是否在onTouchEvent中调用的这个函数。所以，当你在computeScroll中调用这个函数时，就可以传入false。|

#### onOverScrolled
```java
protected void onOverScrolled (int scrollX, 
                int scrollY, 
                boolean clampedX, 
                boolean clampedY){
                }
```
> Called by `overScrollBy(int, int, int, int, int, int, int, int, boolean)` to respond to the results of an over-scroll operation.

|Parameters | |
| :---: | ---|
|scrollX |int: New X scroll value in pixels |
|clampedX | boolean: True if scrollX was clamped to an over-scroll boundary , 表示是否到达超出滚动范围的最大值。如果为true，就需要调用OverScroll的springBack函数来让视图回复原来位置。|


#### 使用动画
```java
ObjectAnimator.ofFloat(targetView,"translationX",0,100).setDuration
     (100).start();
```
#### 改变布局参数

```java
 MarginLayoutParams params = (MarginLayoutParams)mButton1.getLayoutParams();
    params.width += 100;
    params.leftMargin += 100;
    mButton1.requestLayout();
    //或者mButton1.setLayoutParams(params);
```

### 弹性滑Scroller
弹性滑动对象，用于实现View的弹性滑动

```java
    Scroller mScroller = new Scroller(context);

    @Override
    public void computeScroll() {
        if (mScroller.computeScrollOffset()) {
            scrollTo(mScroller.getCurrX(),mScroller.getCurrY());
            postInvalidate();
        }
    }

    // 缓慢滚动到指定位置
    private void smoothScrollTo(int destX,int destY) {
        int scrollX = getScrollX();
        int delta = destX -scrollX;
        // 1000ms内滑向destX，效果就是慢慢滑动
        mScroller.startScroll(scrollX,0,delta,0,1000);
        invalidate();
    }
```
当我们构造一个Scroller对象并且调用它的startScroll方法时，Scroller内部其实什么也没做，它只是保存了我们传递的几个参数

```java
public class Scroller  {
    private int mMode;

    private int mStartX;
    private int mStartY;
    private int mFinalX;
    private int mFinalY;
    
    private int mMinX;
    private int mMaxX;
    private int mMinY;
    private int mMaxY;

    private int mCurrX;
    private int mCurrY;
    private long mStartTime;
    private int mDuration;
    private float mDurationReciprocal;
    private float mDeltaX;
    private float mDeltaY;
    private boolean mFinished;
    private boolean mFlywheel;

    private float mVelocity;
    private float mCurrVelocity;
    private int mDistance;

}
```

```java
public class Scroller  {

    public void startScroll(int startX, int startY, int dx, int dy, int duration) {
        mMode = SCROLL_MODE;
        mFinished = false;
        mDuration = duration;
        mStartTime = AnimationUtils.currentAnimationTimeMillis();
        mStartX = startX;
        mStartY = startY;
        mFinalX = startX + dx;
        mFinalY = startY + dy;
        mDeltaX = dx;
        mDeltaY = dy;
        mDurationReciprocal = 1.0f / (float) mDuration;
    }

}
```
滑动主要通过invalidate，invalidate方法会导致View重绘，在View的draw方法中又会去调用computeScroll方法。
当View重绘后会在draw方法中调用computeScroll，而computeScroll又会去向Scroller获取当前的scrollX和scrollY；然后通过scrollTo方法实现滑动；接着又调用postInvalidate方法来进行第二次重绘，这一次重绘的过程和第一次重绘一样，还是会导致computeScroll方法被调用；然后继续向Scroller获取当前的scrollX和scrollY，并通过scrollTo方法滑动到新的位置，如此反复，直到整个滑动过程结束。

```java  
    //Call this when you want to know the new location. If it returns true, the animation is not yet finished.
    public boolean computeScrollOffset() {
        if (mFinished) {
            return false;
        }

        int timePassed = (int)(AnimationUtils.currentAnimationTimeMillis() - mStartTime);
    
        if (timePassed < mDuration) {
            switch (mMode) {
            case SCROLL_MODE:
                final float x = mInterpolator.getInterpolation(timePassed * mDurationReciprocal);
                mCurrX = mStartX + Math.round(x * mDeltaX);
                mCurrY = mStartY + Math.round(x * mDeltaY);
                break;
            case FLING_MODE:
                final float t = (float) timePassed / mDuration;
                final int index = (int) (NB_SAMPLES * t);
                float distanceCoef = 1.f;
                float velocityCoef = 0.f;
                if (index < NB_SAMPLES) {
                    final float t_inf = (float) index / NB_SAMPLES;
                    final float t_sup = (float) (index + 1) / NB_SAMPLES;
                    final float d_inf = SPLINE_POSITION[index];
                    final float d_sup = SPLINE_POSITION[index + 1];
                    velocityCoef = (d_sup - d_inf) / (t_sup - t_inf);
                    distanceCoef = d_inf + (t - t_inf) * velocityCoef;
                }

                mCurrVelocity = velocityCoef * mDistance / mDuration * 1000.0f;
                
                mCurrX = mStartX + Math.round(distanceCoef * (mFinalX - mStartX));
                // Pin to mMinX <= mCurrX <= mMaxX
                mCurrX = Math.min(mCurrX, mMaxX);
                mCurrX = Math.max(mCurrX, mMinX);
                
                mCurrY = mStartY + Math.round(distanceCoef * (mFinalY - mStartY));
                // Pin to mMinY <= mCurrY <= mMaxY
                mCurrY = Math.min(mCurrY, mMaxY);
                mCurrY = Math.max(mCurrY, mMinY);

                if (mCurrX == mFinalX && mCurrY == mFinalY) {
                    mFinished = true;
                }

                break;
            }
        }
        else {
            mCurrX = mFinalX;
            mCurrY = mFinalY;
            mFinished = true;
        }
        return true;
    }
```
这个方法会根据时间的流逝来计算出当前的scrollX和scrollY的值,根据时间流逝的百分比来算出scrollX和scrollY改变的百分比并计算出当前的值.

弹性滑动的实现，还可以通过动画或延时策略。如：
```java
private static final int MESSAGE_SCROLL_TO = 1;
    private static final int FRAME_COUNT = 30;
    private static final int DELAYED_TIME = 33;
    private int mCount = 0;
    @SuppressLint("HandlerLeak")
    private Handler mHandler = new Handler() {
        public void handleMessage(Message msg) {
                switch (msg.what) {
                case MESSAGE_SCROLL_TO: {
                        mCount++;
                        if (mCount <= FRAME_COUNT) {
                                float fraction = mCount / (float) FRAME_COUNT;
                               int scrollX = (int) (fraction * 100);
                                mButton1.scrollTo(scrollX,0);
                                mHandler.sendEmptyMessageDelayed(MESSAGE_SCROLL_TO,
                                DELAYED_TIME);
                        }
                        break;
                }
                default:
                        break;
                }
        };
    };                                
```

### 事件分发

activity事件分发

Activity
```java
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev.getAction() == MotionEvent.ACTION_DOWN) {
            onUserInteraction();
        }
        if (getWindow().superDispatchTouchEvent(ev)) {
            return true;
        }
        return onTouchEvent(ev);
    }
```

PhoneWindow中的分发,最终会到ViewGroup中

```java
    @Override
    public boolean superDispatchTouchEvent(MotionEvent event) {
        return mDecor.superDispatchTouchEvent(event);
    }

```

### 滑动冲突

#### 外部拦截法
重写父容器的onInterceptTouchEvent方法，在内部做相应的拦截
```java
    public boolean onInterceptTouchEvent(MotionEvent event) {
        boolean intercepted = false;
        int x = (int) event.getX();
        int y = (int) event.getY();
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN: {
                    intercepted = false;
                    break;
            }
            case MotionEvent.ACTION_MOVE: {
                    if (父容器需要当前点击事件) {
                            intercepted = true;
                    } else {
                            intercepted = false;
                    }
                    break;
            }
            case MotionEvent.ACTION_UP: {
                    intercepted = false;
                    break;
            }
            default:
                    break;
            }
        
            mLastXIntercept = x;
            mLastYIntercept = y;
        return intercepted;
    }
```

#### 内部拦截法

```java
    public boolean dispatchTouchEvent(MotionEvent event) {
        int x = (int) event.getX();
        int y = (int) event.getY();
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN: {
                parent.requestDisallowInterceptTouchEvent(true);
                break;
            }
            case MotionEvent.ACTION_MOVE: {
                int deltaX = x - mLastX;
                int deltaY = y - mLastY;
                if (父容器需要此类点击事件)){
                    parent.requestDisallowInterceptTouchEvent(false);
                }
                break;
            }
            case MotionEvent.ACTION_UP: {
                break;
            }
            default:
                break;
        }
        mLastX = x;
        mLastY = y;
        return super.dispatchTouchEvent(event);
    }
```

