



### LayoutManager



定义了控制adapter展示view的方式，RecyclerView要展示内容必须设置LayoutManager：

```java

public void setLayoutManager(@Nullable LayoutManager layout) {
    if (layout == mLayout) {
        return;
    }
    stopScroll();
    // TODO We should do this switch a dispatchLayout pass and animate children. There is a good
    // chance that LayoutManagers will re-use views.
    if (mLayout != null) {
        // end all running animations
        if (mItemAnimator != null) {
            mItemAnimator.endAnimations();
        }
      //移除并回收视图
        mLayout.removeAndRecycleAllViews(mRecycler);
      //回收废弃视图
        mLayout.removeAndRecycleScrapInt(mRecycler);
        mRecycler.clear();

        if (mIsAttached) {
            mLayout.dispatchDetachedFromWindow(this, mRecycler);
        }
        mLayout.setRecyclerView(null);
        mLayout = null;
    } else {
        mRecycler.clear();
    }
    // this is just a defensive measure for faulty item animators.
    mChildHelper.removeAllViewsUnfiltered();
    mLayout = layout;
    if (layout != null) {
        if (layout.mRecyclerView != null) {
            throw new IllegalArgumentException("LayoutManager " + layout
                    + " is already attached to a RecyclerView:"
                    + layout.mRecyclerView.exceptionLabel());
        }
        mLayout.setRecyclerView(this);
        if (mIsAttached) {
            mLayout.dispatchAttachedToWindow(this);
        }
    }
    mRecycler.updateViewCacheSize();
    requestLayout();
}
```

当之前设置过 LayoutManager 时，移除之前的视图，并缓存视图在 Recycler 中，将新的 mLayout 对象与 RecyclerView 绑定，更新缓存 View 的数量。最后去调用 requestLayout ，重新请求 measure、layout、draw



LayoutManager的主要作用是为RecyclerView放置子View，主要体现在 `onLayout` 和 `onMeasure`方法中



```java
@Override
protected void onMeasure(int widthSpec, int heightSpec) {
    if (mLayout == null) {
        defaultOnMeasure(widthSpec, heightSpec);
        return;
    }
    //通过mAutoMeasure字段标记是否使用RecyclerView的默认规则进行自动测量，
    //在LinearLayoutManager中值设为了true
    if (mLayout.isAutoMeasureEnabled()) {
        final int widthMode = MeasureSpec.getMode(widthSpec);
        final int heightMode = MeasureSpec.getMode(heightSpec);
    
        mLayout.onMeasure(mRecycler, mState, widthSpec, heightSpec);

        final boolean measureSpecModeIsExactly =
                widthMode == MeasureSpec.EXACTLY && heightMode == MeasureSpec.EXACTLY;
        if (measureSpecModeIsExactly || mAdapter == null) {
            return;
        }

        if (mState.mLayoutStep == State.STEP_START) {
            dispatchLayoutStep1();
        }
        // set dimensions in 2nd step. Pre-layout should happen with old dimensions for
        // consistency
        mLayout.setMeasureSpecs(widthSpec, heightSpec);
        mState.mIsMeasuring = true;
        dispatchLayoutStep2();

        // now we can get the width and height from the children.
        mLayout.setMeasuredDimensionFromChildren(widthSpec, heightSpec);

        // if RecyclerView has non-exact width and height and if there is at least one child
        // which also has non-exact width & height, we have to re-measure.
        if (mLayout.shouldMeasureTwice()) {
            mLayout.setMeasureSpecs(
                    MeasureSpec.makeMeasureSpec(getMeasuredWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getMeasuredHeight(), MeasureSpec.EXACTLY));
            mState.mIsMeasuring = true;
            dispatchLayoutStep2();
            // now we can get the width and height from the children.
            mLayout.setMeasuredDimensionFromChildren(widthSpec, heightSpec);
        }
    } else {//非自动测量
        ....
    }
}
```

当 RecyclerView 的 MeasureSpec 为 MeasureSpec.EXACTLY时，这个时候可以直接确定 RecyclerView 的宽高，所以 return 退出测量。

当 RecyclerView 的宽高为不为 EXACTLY 时，首先进行的测量步骤就是 `dispatchLayoutStep1`，`dispatchLayoutStep1` 的作用就是记录 layout 之前，view 的信息。

> `mState.mLayoutStep`有三个状态：STEP_START、STEP_LAYOUT、STEP_ANIMATIONS



`dispatchLayoutStep2`方法：

```java
private void dispatchLayoutStep2() {
    ...

    // Step 2: Run layout
    mState.mInPreLayout = false;
    mLayout.onLayoutChildren(mRecycler, mState);

    ....
    mState.mLayoutStep = State.STEP_ANIMATIONS;
    ....
}
```

onLayoutChildren 由 LayoutManager 实现，来规定放置子 view 的算法。 `mState.mLayoutStep`来标记 layout 这个过程进行到哪一步，在 dispatchLayoutStep1 中 mState.mLayoutStep 被置为 State.STEP_LAYOUT



在`onLayout` 方法

```java
@Override
protected void onLayout(boolean changed, int l, int t, int r, int b) {
    TraceCompat.beginSection(TRACE_ON_LAYOUT_TAG);
    dispatchLayout();
    TraceCompat.endSection();
    mFirstLayoutComplete = true;
}
```

跟进到`dispatchLayout()`方法， RecyclerView 的 MeasureSpec 不为 EXACTLY 时，这个情况下 RecyclerView 不能自己确定自身的宽高，只能在测量、布局了子 view 才能确定自己的宽高。所以在 onMeasure 的时候就调用了 dispatchLayoutStep1 、 dispatchLayoutStep2 ，在 onLayout 仅仅调用 dispatchLayoutStep3 方法就可以了。

当我们在 onMeasure 方法中已经调用过 dispatchLayoutStep1 、 dispatchLayoutStep2 时，在 onLayout 方法中只会调用 dispatchLayoutStep3

```java
void dispatchLayout() {
    if (mAdapter == null) {
        Log.e(TAG, "No adapter attached; skipping layout");
        // leave the state in START
        return;
    }
    if (mLayout == null) {
        Log.e(TAG, "No layout manager attached; skipping layout");
        // leave the state in START
        return;
    }
    mState.mIsMeasuring = false;
    if (mState.mLayoutStep == State.STEP_START) {
        dispatchLayoutStep1();
        mLayout.setExactMeasureSpecsFrom(this);
        dispatchLayoutStep2();
    } else if (mAdapterHelper.hasUpdates() || mLayout.getWidth() != getWidth()
            || mLayout.getHeight() != getHeight()) {
        // First 2 steps are done in onMeasure but looks like we have to run again due to
        // changed size.
        mLayout.setExactMeasureSpecsFrom(this);
        dispatchLayoutStep2();
    } else {
        // always make sure we sync them (to ensure mode is exact)
        mLayout.setExactMeasureSpecsFrom(this);
    }
    dispatchLayoutStep3();
}
```



### ItemAnimator

动画设置

```java
public void setItemAnimator(@Nullable ItemAnimator animator) {
    if (mItemAnimator != null) {
        mItemAnimator.endAnimations();
        mItemAnimator.setListener(null);
    }
    mItemAnimator = animator;
    if (mItemAnimator != null) {
        mItemAnimator.setListener(mItemAnimatorListener);
    }
}
```

**ItemAnimator**类

```java
public @NonNull ItemHolderInfo recordPreLayoutInformation(@NonNull State state,
        @NonNull ViewHolder viewHolder, @AdapterChanges int changeFlags,
        @NonNull List<Object> payloads) {
    return obtainHolderInfo().setFrom(viewHolder);
}

public @NonNull ItemHolderInfo recordPostLayoutInformation(@NonNull State state,
        @NonNull ViewHolder viewHolder) {
    return obtainHolderInfo().setFrom(viewHolder);
}
```

在RecyclerView布局前后，必要的一些 layout 信息保存在 ItemHolderInfo 中，ItemHolderInfo 这个类就是用来记录当前 ItemView 的位置信息。

`recordPreLayoutInformation` 来记录 layout 之前的状态信息，这个方法在 dispatchLayoutStep1 之中调用。

```java
private void dispatchLayoutStep1() {
    ....
    if (mState.mRunSimpleAnimations) {
        // Step 0: Find out where all non-removed items are, pre-layout
        int count = mChildHelper.getChildCount();
        for (int i = 0; i < count; ++i) {
            final ViewHolder holder = getChildViewHolderInt(mChildHelper.getChildAt(i));
            if (holder.shouldIgnore() || (holder.isInvalid() && !mAdapter.hasStableIds())) {
                continue;
            }
            //布局前ItemAnimator记录相关信息，recordPreLayoutInformation调用处
            final ItemHolderInfo animationInfo = mItemAnimator
                    .recordPreLayoutInformation(mState, holder,
                            ItemAnimator.buildAdapterChangeFlagsForAnimations(holder),
                            holder.getUnmodifiedPayloads());
            mViewInfoStore.addToPreLayout(holder, animationInfo);
              ....
            }
        }
    }
    if (mState.mRunPredictiveAnimations) {
        // Step 1: run prelayout: This will use the old positions of items. The layout manager
        // is expected to layout everything, even removed items (though not to add removed
        // items back to the container). This gives the pre-layout position of APPEARING views
        // which come into existence as part of the real layout.

        // Save old positions so that LayoutManager can run its mapping logic.
        saveOldPositions();
        ....

        for (int i = 0; i < mChildHelper.getChildCount(); ++i) {
            final View child = mChildHelper.getChildAt(i);
            final ViewHolder viewHolder = getChildViewHolderInt(child);
            if (viewHolder.shouldIgnore()) {
                continue;
            }
            if (!mViewInfoStore.isInPreLayout(viewHolder)) {
                ....
                //recordPreLayoutInformation调用处
                final ItemHolderInfo animationInfo = mItemAnimator.recordPreLayoutInformation(
                        mState, viewHolder, flags, viewHolder.getUnmodifiedPayloads());
              ....
                }
            }
        }
        // we don't process disappearing list because they may re-appear in post layout pass.
        clearOldPositions();
    } else {
        clearOldPositions();
    }
    onExitLayoutOrScroll();
    stopInterceptRequestLayout(false);
    mState.mLayoutStep = State.STEP_LAYOUT;
}
```

布局的第一步：进行 adapter 布局的更新，决定执行哪个动画，保存当前 view 的信息，如果有必要，运行 predictive layout。

> The first step of a layout where we;
>
> - process adapter updates
> - decide which animation should run
> - save information about current views
> - If necessary, run predictive layout and save its information



`recordPostLayoutInformation`方法在step3中调用，记录记录 layout 过程完成时，ItemView 的信息。

step3:layout 的最后一个步骤，保存 view 动画的信息，执行动画，状态清理。

> The final step of the layout where we save the information about views for animations,trigger animations and do any necessary cleanup.

dispatchLayout 方法目的是 layout RecyclerView 的 childview，并且记录动画执行的过程、变更。



```java
private void dispatchLayoutStep3() {
    mState.assertLayoutStep(State.STEP_ANIMATIONS);
    startInterceptRequestLayout();
    onEnterLayoutOrScroll();
    mState.mLayoutStep = State.STEP_START;
    if (mState.mRunSimpleAnimations) {
        // Step 3: Find out where things are now, and process change animations.
        // traverse list in reverse because we may call animateChange in the loop which may
        // remove the target view holder.
        for (int i = mChildHelper.getChildCount() - 1; i >= 0; i--) {
            ViewHolder holder = getChildViewHolderInt(mChildHelper.getChildAt(i));
            if (holder.shouldIgnore()) {
                continue;
            }
            long key = getChangedHolderKey(holder);
            final ItemHolderInfo animationInfo = mItemAnimator
                    .recordPostLayoutInformation(mState, holder);
            ViewHolder oldChangeViewHolder = mViewInfoStore.getFromOldChangeHolders(key);
            if (oldChangeViewHolder != null && !oldChangeViewHolder.shouldIgnore()) {
                // run a change animation

                // If an Item is CHANGED but the updated version is disappearing, it creates
                // a conflicting case.
                // Since a view that is marked as disappearing is likely to be going out of
                // bounds, we run a change animation. Both views will be cleaned automatically
                // once their animations finish.
                // On the other hand, if it is the same view holder instance, we run a
                // disappearing animation instead because we are not going to rebind the updated
                // VH unless it is enforced by the layout manager.
                final boolean oldDisappearing = mViewInfoStore.isDisappearing(
                        oldChangeViewHolder);
                final boolean newDisappearing = mViewInfoStore.isDisappearing(holder);
                if (oldDisappearing && oldChangeViewHolder == holder) {
                    // run disappear animation instead of change
                    mViewInfoStore.addToPostLayout(holder, animationInfo);
                } else {
                    final ItemHolderInfo preInfo = mViewInfoStore.popFromPreLayout(
                            oldChangeViewHolder);
                    // we add and remove so that any post info is merged.
                    mViewInfoStore.addToPostLayout(holder, animationInfo);
                    ItemHolderInfo postInfo = mViewInfoStore.popFromPostLayout(holder);
                    if (preInfo == null) {
                        handleMissingPreInfoForChangeError(key, holder, oldChangeViewHolder);
                    } else {
                        animateChange(oldChangeViewHolder, holder, preInfo, postInfo,
                                oldDisappearing, newDisappearing);
                    }
                }
            } else {
                mViewInfoStore.addToPostLayout(holder, animationInfo);
            }
        }

        // Step 4: Process view info lists and trigger animations
        mViewInfoStore.process(mViewInfoProcessCallback);
    }

    mLayout.removeAndRecycleScrapInt(mRecycler);
    mState.mPreviousLayoutItemCount = mState.mItemCount;
    mDataSetHasChangedAfterLayout = false;
    mDispatchItemsChangedEvent = false;
    mState.mRunSimpleAnimations = false;

    mState.mRunPredictiveAnimations = false;
    mLayout.mRequestedSimpleAnimations = false;
    if (mRecycler.mChangedScrap != null) {
        mRecycler.mChangedScrap.clear();
    }
    if (mLayout.mPrefetchMaxObservedInInitialPrefetch) {
        // Initial prefetch has expanded cache, so reset until next prefetch.
        // This prevents initial prefetches from expanding the cache permanently.
        mLayout.mPrefetchMaxCountObserved = 0;
        mLayout.mPrefetchMaxObservedInInitialPrefetch = false;
        mRecycler.updateViewCacheSize();
    }

    mLayout.onLayoutCompleted(mState);
    onExitLayoutOrScroll();
    stopInterceptRequestLayout(false);
    mViewInfoStore.clear();
    if (didChildRangeChange(mMinMaxLayoutPositions[0], mMinMaxLayoutPositions[1])) {
        dispatchOnScrolled(0, 0);
    }
    recoverFocusFromState();
    resetFocusInfo();
}
```



**ItemAnimator**动画相关的其他API：

- `animateDisappearance`
  当 ViewHolder 从 RecyclerView 的 layout 中移除时，调用

- `animateAppearance`
  当 ViewHolder 添加进 RecyclerView 时，调用

- animatePersistence
  当 ViewHolder 已经添加进 layout 还未移除时，调用

- `animateChange`
  当 ViewHolder 已经添加进 layout 还未移除，并且调用了 notifyDataSetChanged 时，调用。


调用时是通过来完成的`ProcessCallback`监听完成的：

```java
private final ViewInfoStore.ProcessCallback mViewInfoProcessCallback =
        new ViewInfoStore.ProcessCallback() {
            @Override
            public void processDisappeared(ViewHolder viewHolder, @NonNull ItemHolderInfo info,
                    @Nullable ItemHolderInfo postInfo) {
                mRecycler.unscrapView(viewHolder);
                animateDisappearance(viewHolder, info, postInfo);
            }
            @Override
            public void processAppeared(ViewHolder viewHolder,
                    ItemHolderInfo preInfo, ItemHolderInfo info) {
                animateAppearance(viewHolder, preInfo, info);
            }

            @Override
            public void processPersistent(ViewHolder viewHolder,
                    @NonNull ItemHolderInfo preInfo, @NonNull ItemHolderInfo postInfo) {
                viewHolder.setIsRecyclable(false);
                if (mDataSetHasChangedAfterLayout) {
                    // since it was rebound, use change instead as we'll be mapping them from
                    // stable ids. If stable ids were false, we would not be running any
                    // animations
                    if (mItemAnimator.animateChange(viewHolder, viewHolder, preInfo,
                            postInfo)) {
                        postAnimationRunner();
                    }
                } else if (mItemAnimator.animatePersistence(viewHolder, preInfo, postInfo)) {
                    postAnimationRunner();
                }
            }
            @Override
            public void unused(ViewHolder viewHolder) {
                mLayout.removeAndRecycleView(viewHolder.itemView, mRecycler);
            }
        };
```

而mViewInfoProcessCallback的监听添加是在step3中的step4进行的。

### ItemDecoration

为 RecyclerView 添加分割线

```java
public void addItemDecoration(@NonNull ItemDecoration decor, int index) {
    if (mLayout != null) {
        mLayout.assertNotInLayoutOrScroll("Cannot add item decoration during a scroll  or"
                + " layout");
    }
    if (mItemDecorations.isEmpty()) {
        setWillNotDraw(false);
    }
    if (index < 0) {
        mItemDecorations.add(decor);
    } else {
        //指定索引添加分割线
        mItemDecorations.add(index, decor);
    }
    markItemDecorInsetsDirty();
  	//重新测量、布局、绘制
    requestLayout();
}
```

mItemDecorations 是一个 ArrayList，我们将 ItemDecoration 也就是分割线对象，添加到其中。接着调用`markItemDecorInsetsDirty()`方法：

```java
void markItemDecorInsetsDirty() {
    final int childCount = mChildHelper.getUnfilteredChildCount();
    for (int i = 0; i < childCount; i++) {
        final View child = mChildHelper.getUnfilteredChildAt(i);
        ((LayoutParams) child.getLayoutParams()).mInsetsDirty = true;
    }
    mRecycler.markItemDecorInsetsDirty();
}
```

这个方法首先遍历了 RecyclerView 和 LayoutManager 的所有子 View，将其子 View 的 LayoutParams 中的 mInsetsDirty 属性置为 true。接着调用了 `mRecycler.markItemDecorInsetsDirty()`。Recycler 是 RecyclerView 的一个内部类，就是它管理着 RecyclerView 的复用逻辑。

```java
void markItemDecorInsetsDirty() {
    final int cachedCount = mCachedViews.size();
    for (int i = 0; i < cachedCount; i++) {
        final ViewHolder holder = mCachedViews.get(i);
        LayoutParams layoutParams = (LayoutParams) holder.itemView.getLayoutParams();
        if (layoutParams != null) {
            layoutParams.mInsetsDirty = true;
        }
    }
}
```

mCachedViews 是 RecyclerView 缓存的集合，RecyclerView 的缓存单位是 ViewHolder。我们在 ViewHolder 中取出 itemView，然后获得 LayoutParams，将其 mInsetsDirty 字段一样置为 true。

mInsetsDirty 字段的作用其实是一种优化性能的缓存策略，添加分割线对象时，无论是 RecyclerView 的子 view，还是缓存的 view，都将其置为 true，接着就调用了 requestLayout 方法。

> requestLayout 方法用一种责任链的方式，层层向上传递，最后传递到 ViewRootImpl，然后重新调用 view 的 measure、layout、draw 方法来展示布局。



接着查找mItemDecorations，看在什么时候进行操作的，在RecyclerView的`onDraw`中：

```java
@Override
public void onDraw(Canvas c) {
    super.onDraw(c);

    final int count = mItemDecorations.size();
    for (int i = 0; i < count; i++) {
        mItemDecorations.get(i).onDraw(c, this, mState);
    }
}
```



```java
@Override
public void draw(Canvas c) {
    super.draw(c);

    final int count = mItemDecorations.size();
    for (int i = 0; i < count; i++) {
        mItemDecorations.get(i).onDrawOver(c, this, mState);
    }
    ....
}
```

在`onDraw`和`draw`分别调用了 `ItemDecoration` 对象的 `onDraw` `onDrawOver` 方法。

`ItemDecoration`的这两个方法，`onDraw`是在itemView绘制之前进行， `onDrawOver` 是在itemView绘制之后进行，都是空实现，需要自定义去实现。



接着看下LayoutParams中的`mInsetsDirty`属性的作用，`getItemDecorInsetsForChild` 方法是在 `RecyclerView` 进行 `measureChild` 时调用的。目的就是为了取出 RecyclerView 的 ChildView 中的分割线属性：在 `LayoutParams` 中缓存的 `mDecorInsets` 。而 `mDecorInsets` 就是 `Rect` 对象， 其保存记录的是所有添加分割线需要的空间累加的总和，由分割线的 `getItemOffsets` 方法影响。然后在 `measureChild` 方法里，将分割线 `ItemDecoration` 的尺寸加入到 `itemView` 的 padding 中。

缓存并不是总是可用的，`mInsetsDirty` 这个 `boolean` 字段来记录它的时效性，当 mInsetsDirty 为 false 时，说明缓存可用，直接取出可以，当 `mInsetsDirty` 为 true 时，说明缓存的分割线属性就需要重新计算。

```java
    Rect getItemDecorInsetsForChild(View child) {
        final LayoutParams lp = (LayoutParams) child.getLayoutParams();
        if (!lp.mInsetsDirty) {
          //当mInsetsDirty为false时，说明mDecorInsets缓存可用
            return lp.mDecorInsets;
        }

        if (mState.isPreLayout() && (lp.isItemChanged() || lp.isViewInvalid())) {
            // changed/invalid items should not be updated until they are rebound.
            return lp.mDecorInsets;
        }
        final Rect insets = lp.mDecorInsets;
        insets.set(0, 0, 0, 0);
        final int decorCount = mItemDecorations.size();
        for (int i = 0; i < decorCount; i++) {
            mTempRect.set(0, 0, 0, 0);
            mItemDecorations.get(i).getItemOffsets(mTempRect, child, this, mState);
            insets.left += mTempRect.left;
            insets.top += mTempRect.top;
            insets.right += mTempRect.right;
            insets.bottom += mTempRect.bottom;
        }
        lp.mInsetsDirty = false;
        return insets;
    }
```



### Recycler

Recycler 就是控制 RecyclerView 缓存的核心类。LayoutManager 其实就是 Recycler 的控制者，由 LayoutManager 来决定调用 Recycler 关键方法的时机。

入口：RecyclerView 的`dispatchLayoutStep2`中的`onLayoutChildren`。

LinearLayoutManger中在`onLayoutChildren`中的fill方法调用开始填充layout：

```java
int fill(RecyclerView.Recycler recycler, LayoutState layoutState,
        RecyclerView.State state, boolean stopOnFocusable) {
    // max offset we should set is mFastScroll + available
    final int start = layoutState.mAvailable;
    ....
    int remainingSpace = layoutState.mAvailable + layoutState.mExtraFillSpace;
    LayoutChunkResult layoutChunkResult = mLayoutChunkResult;
    while ((layoutState.mInfinite || remainingSpace > 0) && layoutState.hasMore(state)) {
        layoutChunkResult.resetInternal();
        ...
        layoutChunk(recycler, state, layoutState, layoutChunkResult);
        ...
        if (layoutChunkResult.mFinished) {
            break;
        }
        layoutState.mOffset += layoutChunkResult.mConsumed * layoutState.mLayoutDirection;
        /**
         * Consume the available space if:
         * * layoutChunk did not request to be ignored
         * * OR we are laying out scrap children
         * * OR we are not doing pre-layout
         */
        if (!layoutChunkResult.mIgnoreConsumed || layoutState.mScrapList != null
                || !state.isPreLayout()) {
            layoutState.mAvailable -= layoutChunkResult.mConsumed;
            // we keep a separate remaining space because mAvailable is important for recycling
            remainingSpace -= layoutChunkResult.mConsumed;
        }

        if (layoutState.mScrollingOffset != LayoutState.SCROLLING_OFFSET_NaN) {
            layoutState.mScrollingOffset += layoutChunkResult.mConsumed;
            if (layoutState.mAvailable < 0) {
                layoutState.mScrollingOffset += layoutState.mAvailable;
            }
            recycleByLayoutState(recycler, layoutState);
        }
        if (stopOnFocusable && layoutChunkResult.mFocusable) {
            break;
        }
    }
   
    return start - layoutState.mAvailable;
}
```

while 循环中，通过判断 LaytouState 中保存的状态来不断的通过 LayoutChunk 方法填充 view

```java
   void layoutChunk(RecyclerView.Recycler recycler, RecyclerView.State state,
            LayoutState layoutState, LayoutChunkResult result) {
        View view = layoutState.next(recycler);
        if (view == null) {
            // if we are laying out views in scrap, this may return null which means there is
            // no more items to layout.
            result.mFinished = true;
            return;
        }
        RecyclerView.LayoutParams params = (RecyclerView.LayoutParams) view.getLayoutParams();
        if (layoutState.mScrapList == null) {
            if (mShouldReverseLayout == (layoutState.mLayoutDirection
                    == LayoutState.LAYOUT_START)) {
                addView(view);
            } else {
                addView(view, 0);
            }
        } else {
            if (mShouldReverseLayout == (layoutState.mLayoutDirection
                    == LayoutState.LAYOUT_START)) {
                addDisappearingView(view);
            } else {
                addDisappearingView(view, 0);
            }
        }
        measureChildWithMargins(view, 0, 0);
        result.mConsumed = mOrientationHelper.getDecoratedMeasurement(view);
        int left, top, right, bottom;
        if (mOrientation == VERTICAL) {
            if (isLayoutRTL()) {
                right = getWidth() - getPaddingRight();
                left = right - mOrientationHelper.getDecoratedMeasurementInOther(view);
            } else {
                left = getPaddingLeft();
                right = left + mOrientationHelper.getDecoratedMeasurementInOther(view);
            }
            if (layoutState.mLayoutDirection == LayoutState.LAYOUT_START) {
                bottom = layoutState.mOffset;
                top = layoutState.mOffset - result.mConsumed;
            } else {
                top = layoutState.mOffset;
                bottom = layoutState.mOffset + result.mConsumed;
            }
        } else {
            top = getPaddingTop();
            bottom = top + mOrientationHelper.getDecoratedMeasurementInOther(view);

            if (layoutState.mLayoutDirection == LayoutState.LAYOUT_START) {
                right = layoutState.mOffset;
                left = layoutState.mOffset - result.mConsumed;
            } else {
                left = layoutState.mOffset;
                right = layoutState.mOffset + result.mConsumed;
            }
        }
        // We calculate everything with View's bounding box (which includes decor and margins)
        // To calculate correct layout position, we subtract margins.
        layoutDecoratedWithMargins(view, left, top, right, bottom);
       
        // Consume the available space if the view is not removed OR changed
        if (params.isItemRemoved() || params.isItemChanged()) {
            result.mIgnoreConsumed = true;
        }
        result.mFocusable = view.hasFocusable();
    }
```

通过 next 方法取出来 view ，并且通过 addView 添加到 RecyclerView 里面去

```java
View next(RecyclerView.Recycler recycler) {
    if (mScrapList != null) {
        return nextViewFromScrapList();
    }
    final View view = recycler.getViewForPosition(mCurrentPosition);
    mCurrentPosition += mItemDirection;
    return view;
}
```

Recycler的结构，四级缓存：mAttachedScrap 、mCachedViews 、mViewCacheExtension、mRecyclerPool 这四个对象就是作为每一级缓存的结构的

```java
    public final class Recycler {
        final ArrayList<ViewHolder> mAttachedScrap = new ArrayList<>();
        ArrayList<ViewHolder> mChangedScrap = null;

        final ArrayList<ViewHolder> mCachedViews = new ArrayList<ViewHolder>();

        private final List<ViewHolder>
                mUnmodifiableAttachedScrap = Collections.unmodifiableList(mAttachedScrap);
      
        private ViewCacheExtension mViewCacheExtension;
     
        RecycledViewPool mRecyclerPool;
   }
```



```java 
public View getViewForPosition(int position) {
    return getViewForPosition(position, false);
}

View getViewForPosition(int position, boolean dryRun) {
    return tryGetViewHolderForPositionByDeadline(position, dryRun, FOREVER_NS).itemView;
}
```





```java
ViewHolder tryGetViewHolderForPositionByDeadline(int position,
        boolean dryRun, long deadlineNs) {
    ...
    boolean fromScrapOrHiddenOrCache = false;
    ViewHolder holder = null;
    // 0) If there is a changed scrap, try to find from there
    if (mState.isPreLayout()) {
        holder = getChangedScrapViewForPosition(position);
        fromScrapOrHiddenOrCache = holder != null;
    }
    // 1) Find by position from scrap/hidden list/cache
    if (holder == null) {
        holder = getScrapOrHiddenOrCachedHolderForPosition(position, dryRun);
        if (holder != null) {
            if (!validateViewHolderForOffsetPosition(holder)) {
                // recycle holder (and unscrap if relevant) since it can't be used
                if (!dryRun) {
                    // we would like to recycle this but need to make sure it is not used by
                    // animation logic etc.
                    holder.addFlags(ViewHolder.FLAG_INVALID);
                    if (holder.isScrap()) {
                        removeDetachedView(holder.itemView, false);
                        holder.unScrap();
                    } else if (holder.wasReturnedFromScrap()) {
                        holder.clearReturnedFromScrapFlag();
                    }
                    recycleViewHolderInternal(holder);
                }
                holder = null;
            } else {
                fromScrapOrHiddenOrCache = true;
            }
        }
    }
    if (holder == null) {
        final int offsetPosition = mAdapterHelper.findPositionOffset(position);
        ...

        final int type = mAdapter.getItemViewType(offsetPosition);
        // 2) Find from scrap/cache via stable ids, if exists
        if (mAdapter.hasStableIds()) {
            holder = getScrapOrCachedViewForId(mAdapter.getItemId(offsetPosition),
                    type, dryRun);
            if (holder != null) {
                // update position
                holder.mPosition = offsetPosition;
                fromScrapOrHiddenOrCache = true;
            }
        }
        if (holder == null && mViewCacheExtension != null) {
            // We are NOT sending the offsetPosition because LayoutManager does not
            // know it.
            final View view = mViewCacheExtension
                    .getViewForPositionAndType(this, position, type);
            if (view != null) {
                holder = getChildViewHolder(view);
                ....
            }
        }
        if (holder == null) { // fallback to pool 从 RecycledViewPool 中取根据 type 取 ViewHolder
            
            holder = getRecycledViewPool().getRecycledView(type);
            if (holder != null) {
                holder.resetInternal();
                if (FORCE_INVALIDATE_DISPLAY_LIST) {
                    invalidateDisplayListInt(holder);
                }
            }
        }
        if (holder == null) {
            long start = getNanoTime();
            if (deadlineNs != FOREVER_NS
                    && !mRecyclerPool.willCreateInTime(type, start, deadlineNs)) {
                // abort - we have a deadline we can't meet
                return null;
            }
            holder = mAdapter.createViewHolder(RecyclerView.this, type);
            if (ALLOW_THREAD_GAP_WORK) {
                // only bother finding nested RV if prefetching
                RecyclerView innerView = findNestedRecyclerView(holder.itemView);
                if (innerView != null) {
                    holder.mNestedRecyclerView = new WeakReference<>(innerView);
                }
            }

            long end = getNanoTime();
            mRecyclerPool.factorInCreateTime(type, end - start);

            }
        }
    }

    // This is very ugly but the only place we can grab this information
    // before the View is rebound and returned to the LayoutManager for post layout ops.
    // We don't need this in pre-layout since the VH is not updated by the LM.
    if (fromScrapOrHiddenOrCache && !mState.isPreLayout() && holder
            .hasAnyOfTheFlags(ViewHolder.FLAG_BOUNCED_FROM_HIDDEN_LIST)) {
        holder.setFlags(0, ViewHolder.FLAG_BOUNCED_FROM_HIDDEN_LIST);
        if (mState.mRunSimpleAnimations) {
            int changeFlags = ItemAnimator
                    .buildAdapterChangeFlagsForAnimations(holder);
            changeFlags |= ItemAnimator.FLAG_APPEARED_IN_PRE_LAYOUT;
            final ItemHolderInfo info = mItemAnimator.recordPreLayoutInformation(mState,
                    holder, changeFlags, holder.getUnmodifiedPayloads());
            recordAnimationInfoIfBouncedHiddenView(holder, info);
        }
    }

    boolean bound = false;
    if (mState.isPreLayout() && holder.isBound()) {
        // do not update unless we absolutely have to.
        holder.mPreLayoutPosition = position;
    } else if (!holder.isBound() || holder.needsUpdate() || holder.isInvalid()) {
        
        final int offsetPosition = mAdapterHelper.findPositionOffset(position);
        bound = tryBindViewHolderByDeadline(holder, offsetPosition, position, deadlineNs);
    }

    final ViewGroup.LayoutParams lp = holder.itemView.getLayoutParams();
    final LayoutParams rvLayoutParams;
    if (lp == null) {
        rvLayoutParams = (LayoutParams) generateDefaultLayoutParams();
        holder.itemView.setLayoutParams(rvLayoutParams);
    } else if (!checkLayoutParams(lp)) {
        rvLayoutParams = (LayoutParams) generateLayoutParams(lp);
        holder.itemView.setLayoutParams(rvLayoutParams);
    } else {
        rvLayoutParams = (LayoutParams) lp;
    }
    rvLayoutParams.mViewHolder = holder;
    rvLayoutParams.mPendingInvalidate = fromScrapOrHiddenOrCache && bound;
    return holder;
}
```

上述代码中，第一步，从 mChangedScrap 中尝试取出缓存的 ViewHolder，如果没有，则去 mAttachedScrap 中取，mAttachedScrap仍没有，接着去 mHiddenViews 里面去找，如果还没有，继续从 mCachedViews 中取缓存的 ViewHolder 。



在 getScrapOrCachedViewForId 方法中，根据 id 依次在 mAttachedScrap 、mCachedViews 集合中寻找缓存的 ViewHolder，如果都不存在，则在 ViewCacheExtension 对象中寻找缓存，ViewCacheExtension 这个类需要使用者通过 setViewCacheExtension 方法传入，RecyclerView 自身并不会实现它


关于`RecycledViewPool`，是一个 SparseArray 保存 ScrapData 对象的结构。根据 type 缓存 ViewHolder，每个 type，默认最多保存5个 ViewHolder。上面提到的 mCachedViews 这个集合默认最大值是 2，RecycledViewPool 可以由多个 ReyclerView 共用

```java
public static class RecycledViewPool {
    private static final int DEFAULT_MAX_SCRAP = 5;

 
    static class ScrapData {
        final ArrayList<ViewHolder> mScrapHeap = new ArrayList<>();
        int mMaxScrap = DEFAULT_MAX_SCRAP;
        long mCreateRunningAverageNs = 0;
        long mBindRunningAverageNs = 0;
    }
    SparseArray<ScrapData> mScrap = new SparseArray<>();
  
}
```

如果 RecycledViewPool 中依然没有缓存的 ViewHolder ，则会调用 mAdapter.createViewHolder(RecyclerView.this, type)，来创建一个 ViewHolder 。





```shell
java.lang.IllegalArgumentException: view is not a child, cannot hide android.widget.LinearLayout{5ec2029 V.E...... .......D 0,-1164-1080,-1014}
    at android.support.v7.widget.ChildHelper.unhide(ChildHelper.java:352)
    at android.support.v7.widget.RecyclerView$Recycler.getScrapOrHiddenOrCachedHolderForPosition(RecyclerView.java:5972)
    at android.support.v7.widget.RecyclerView$Recycler.tryGetViewHolderForPositionByDeadline(RecyclerView.java:5485)
    at android.support.v7.widget.RecyclerView$Recycler.getViewForPosition(RecyclerView.java:5448)
    at android.support.v7.widget.RecyclerView$Recycler.getViewForPosition(RecyclerView.java:5444)
    at android.support.v7.widget.LinearLayoutManager$LayoutState.next(LinearLayoutManager.java:2224)
    at android.support.v7.widget.LinearLayoutManager.layoutChunk(LinearLayoutManager.java:1551)
    at android.support.v7.widget.LinearLayoutManager.fill(LinearLayoutManager.java:1511)
    at android.support.v7.widget.LinearLayoutManager.scrollBy(LinearLayoutManager.java:1325)
    at android.support.v7.widget.LinearLayoutManager.scrollVerticallyBy(LinearLayoutManager.java:1061)
    at android.support.v7.widget.RecyclerView$ViewFlinger.run(RecyclerView.java:4734)
    at android.view.Choreographer$CallbackRecord.run(Choreographer.java:915)
    at android.view.Choreographer.doCallbacks(Choreographer.java:727)
    at android.view.Choreographer.doFrame(Choreographer.java:659)
    at android.view.Choreographer$FrameDisplayEventReceiver.run(Choreographer.java:901)
    at android.os.Handler.handleCallback(Handler.java:790)
    at android.os.Handler.dispatchMessage(Handler.java:99)
    at android.os.Looper.loop(Looper.java:197)
    at android.app.ActivityThread.main(ActivityThread.java:7022)
    at java.lang.reflect.Method.invoke(Native Method)
    at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:515)
    at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:837)
```



[参考:RecyclerView 源码分析](https://blog.csdn.net/c10WTiybQ1Ye3/article/details/78098465)