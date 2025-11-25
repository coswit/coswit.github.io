



```java
public class Fragment{
    private static final ArrayMap<String, Class<?>> sClassMap = new ArrayMap<String, Class<?>>();
     // The fragment manager we are associated with.  Set as soon as the fragment is used in a transaction; cleared after it has been removed from all transactions.
    FragmentManagerImpl mFragmentManager;

    // Activity this fragment is attached to.
    FragmentHostCallback mHost;

    FragmentManagerImpl mChildFragmentManager;
    
     public Fragment() {}
    
    
}
```



```java
public static Fragment instantiate(Context context, String fname) {
    return instantiate(context, fname, null);
}

 public static Fragment instantiate(Context context, String fname, @Nullable Bundle args) {
        try {
            Class<?> clazz = sClassMap.get(fname);
            if (clazz == null) {
                // Class not found in the cache, see if it's real, and try to add it
                clazz = context.getClassLoader().loadClass(fname);
                if (!Fragment.class.isAssignableFrom(clazz)) {
                    throw new InstantiationException("Trying to instantiate a class " + fname
                            + " that is not a Fragment", new ClassCastException());
                }
                sClassMap.put(fname, clazz);
            }
            Fragment f = (Fragment) clazz.getConstructor().newInstance();
            if (args != null) {
                args.setClassLoader(f.getClass().getClassLoader());
                f.setArguments(args);
            }
            return f;
        } catch (...){
        
     }
}
```

```java
 public Context getContext() {
        return mHost == null ? null : mHost.getContext();
 }
 
 
final public Activity getActivity() {
    return mHost == null ? null : mHost.getActivity();
}

@Nullable
final public Object getHost() {
    return mHost == null ? null : mHost.onGetHost();
}
 
 
final public boolean isResumed() {
    return mState >= RESUMED;
}
    
final public boolean isVisible() {
    return isAdded() && !isHidden() && mView != null
        && mView.getWindowToken() != null && mView.getVisibility() == View.VISIBLE;
}


final public boolean isHidden() {
    return mHidden;
}

```

```java
    final public FragmentManager getChildFragmentManager() {
        if (mChildFragmentManager == null) {
            instantiateChildFragmentManager();
            if (mState >= RESUMED) {
                mChildFragmentManager.dispatchResume();
            } else if (mState >= STARTED) {
                mChildFragmentManager.dispatchStart();
            } else if (mState >= ACTIVITY_CREATED) {
                mChildFragmentManager.dispatchActivityCreated();
            } else if (mState >= CREATED) {
                mChildFragmentManager.dispatchCreate();
            }
        }
        return mChildFragmentManager;
    }
```

```java
public void startActivityForResult(Intent intent, int requestCode, Bundle options) {
    if (mHost == null) {
        throw new IllegalStateException("Fragment " + this + " not attached to Activity");
    }
    mHost.onStartActivityFromFragment(this, intent, requestCode, options);
}
```

```java
    public LayoutInflater onGetLayoutInflater(Bundle savedInstanceState) {
        if (mHost == null) {
            throw new IllegalStateException("onGetLayoutInflater() cannot be executed until the "
                    + "Fragment is attached to the FragmentManager.");
        }
        final LayoutInflater result = mHost.onGetLayoutInflater();
        if (mHost.onUseFragmentManagerInflaterFactory()) {
            getChildFragmentManager(); // Init if needed; use raw implementation below.
            result.setPrivateFactory(mChildFragmentManager.getLayoutInflaterFactory());
        }
        return result;
    }
```

```java
    public final LayoutInflater getLayoutInflater() {
        if (mLayoutInflater == null) {
            return performGetLayoutInflater(null);
        }
        return mLayoutInflater;
    }
    
    
LayoutInflater performGetLayoutInflater(Bundle savedInstanceState) {
        LayoutInflater layoutInflater = onGetLayoutInflater(savedInstanceState);
        mLayoutInflater = layoutInflater;
        return mLayoutInflater;
    }
```

### onInflate
Called when a fragment is being created as part of a view layout inflation, typically from setting the content view of an activity. This may be called immediately after the fragment is created from a tag in a layout file. Note this is before the fragment's `onAttach(android.app.Activity)` has been called; all you should do here is parse the attributes and save them away.

This is called every time the fragment is inflated, even if it is being inflated into a new instance with saved state. It typically makes sense to re-parse the parameters each time, to allow them to change with different configurations.

Here is a typical implementation of a fragment that can take parameters both through attributes supplied here as well from `getArguments():`

```java
   @CallSuper
    public void onInflate(Context context, AttributeSet attrs, Bundle savedInstanceState) {
        onInflate(attrs, savedInstanceState);
        mCalled = true;

        TypedArray a = context.obtainStyledAttributes(attrs,
                com.android.internal.R.styleable.Fragment);
        setEnterTransition(loadTransition(context, a, getEnterTransition(), null,
                com.android.internal.R.styleable.Fragment_fragmentEnterTransition));
        setReturnTransition(loadTransition(context, a, getReturnTransition(),
                USE_DEFAULT_TRANSITION,
                com.android.internal.R.styleable.Fragment_fragmentReturnTransition));
        setExitTransition(loadTransition(context, a, getExitTransition(), null,
                com.android.internal.R.styleable.Fragment_fragmentExitTransition));

        setReenterTransition(loadTransition(context, a, getReenterTransition(),
                USE_DEFAULT_TRANSITION,
                com.android.internal.R.styleable.Fragment_fragmentReenterTransition));
        setSharedElementEnterTransition(loadTransition(context, a,
                getSharedElementEnterTransition(), null,
                com.android.internal.R.styleable.Fragment_fragmentSharedElementEnterTransition));
        setSharedElementReturnTransition(loadTransition(context, a,
                getSharedElementReturnTransition(), USE_DEFAULT_TRANSITION,
                com.android.internal.R.styleable.Fragment_fragmentSharedElementReturnTransition));
        boolean isEnterSet;
        boolean isReturnSet;
        if (mAnimationInfo == null) {
            isEnterSet = false;
            isReturnSet = false;
        } else {
            isEnterSet = mAnimationInfo.mAllowEnterTransitionOverlap != null;
            isReturnSet = mAnimationInfo.mAllowReturnTransitionOverlap != null;
        }
        if (!isEnterSet) {
            setAllowEnterTransitionOverlap(a.getBoolean(
                    com.android.internal.R.styleable.Fragment_fragmentAllowEnterTransitionOverlap,
                    true));
        }
        if (!isReturnSet) {
            setAllowReturnTransitionOverlap(a.getBoolean(
                    com.android.internal.R.styleable.Fragment_fragmentAllowReturnTransitionOverlap,
                    true));
        }
        a.recycle();

        final Activity hostActivity = mHost == null ? null : mHost.getActivity();
        if (hostActivity != null) {
            mCalled = false;
            onInflate(hostActivity, attrs, savedInstanceState);
        }
    }
```

```java
   @Deprecated
    @CallSuper
    public void onInflate(AttributeSet attrs, Bundle savedInstanceState) {
        mCalled = true;
    }
    
        @Deprecated
    @CallSuper
    public void onInflate(Activity activity, AttributeSet attrs, Bundle savedInstanceState) {
        mCalled = true;
    }
```

#### 使用

```java
public static class MyFragment extends Fragment {
    CharSequence mLabel;

    /**
     * Create a new instance of MyFragment that will be initialized
     * with the given arguments.
     */
    static MyFragment newInstance(CharSequence label) {
        MyFragment f = new MyFragment();
        Bundle b = new Bundle();
        b.putCharSequence("label", label);
        f.setArguments(b);
        return f;
    }

    /**
     * Parse attributes during inflation from a view hierarchy into the
     * arguments we handle.
     */
    @Override public void onInflate(Activity activity, AttributeSet attrs, Bundle savedInstanceState) {
        super.onInflate(activity, attrs, savedInstanceState);

        TypedArray a = activity.obtainStyledAttributes(attrs, R.styleable.FragmentArguments);
        mLabel = a.getText(R.styleable.FragmentArguments_android_label);
        a.recycle();
    }

    /**
     * During creation, if arguments have been supplied to the fragment
     * then parse those out.
     */
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bundle args = getArguments();
        if (args != null) {
            mLabel = args.getCharSequence("label", mLabel);
        }
    }

    /**
     * Create the view for this fragment, using the arguments given to it.
     */
    @Override public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View v = inflater.inflate(R.layout.hello_world, container, false);
        View tv = v.findViewById(R.id.text);
        ((TextView)tv).setText(mLabel != null ? mLabel : "(no label)");
        tv.setBackgroundDrawable(getResources().getDrawable(android.R.drawable.gallery_thumb));
        return v;
    }
}
```
Note that parsing the XML attributes uses a "styleable" resource. The declaration for the styleable used here is:

```xml
<declare-styleable name="FragmentArguments">
    <attr name="android:label" />
</declare-styleable>
```
The fragment can then be declared within its activity's content layout through a tag like this:

```xml
<fragment class="com.example.android.apis.app.FragmentArguments$MyFragment"
        android:id="@+id/embedded"
        android:layout_width="0px" android:layout_height="wrap_content"
        android:layout_weight="1"
        android:label="@string/fragment_arguments_embedded" />
```
This fragment can also be created dynamically from arguments given at runtime in the arguments Bundle; here is an example of doing so at creation of the containing activity:

```java
@Override protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.fragment_arguments);

    if (savedInstanceState == null) {
        // First-time init; create fragment to embed in activity.
        FragmentTransaction ft = getFragmentManager().beginTransaction();
        Fragment newFragment = MyFragment.newInstance("From Arguments");
        ft.add(R.id.created, newFragment);
        ft.commit();
    }
}
```