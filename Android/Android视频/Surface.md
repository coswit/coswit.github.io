### 作用

Surface是在Android系统中，用来管理的图形缓存区(**Graphic Buffer**)的地方，在Native层的匿名共享内存(Anonymous Shared Memory, -**Ashmem**)中，支持跨进程共享(应用进程绘制、SurfaceFlinger 进程合成)， 无需内存拷贝，效率高，是应用层图像绘制和显示系统(**SurfaceFlinger**)之间的桥梁。

**生产者/消费者模型（Producer/Consumer Model）**：Surface 是图像数据的**生产者**。当生产者（应用/线程）完成一帧图像的绘制，并将 Surface 标记为准备好后，它就会把这个缓冲区交给**消费者**（如 **SurfaceFlinger**）。Surface可以在非UI线程中进行绘制。

### 过程

- 应用通过**SurfaceHolder** 或 **SurfaceView** 等获得一个Surface，然后使用图形API，`Canvas/OpenGL ES/MediaCodec`等将图形数据写入Surface对应的**Graphic Buffer**中，进行渲染绘制。
- **Buffer Swap**：当一帧绘制完成后，应用调用`eglSwapBuffers` 或 `lockCanvas/unlockCanvasAndPost`，将正在绘制的缓存区与系统正在使用的缓冲区时行交换。
- **BufferQueue**：Surface的核心机制，管理一组**Graphic Buffer**，实现生产者和消费者之间的数据传输。
- **SurfaceFlinger (Consumer)**：从 `Surface` 中BufferQueue取出最新的Graphic Buffer。
- **Composition**：SurfaceFlinger 将这些不同的缓冲区（层）按照 Z 轴顺序（即谁在上面，谁在下面）进行混合、缩放、裁剪等操作，最终合成一张完整的图像，显示出来。

### 关联组件

| 组件                    | 与 Surface 的关系                                            |
| ----------------------- | ------------------------------------------------------------ |
| SurfaceHolder           | 管理 `Surface` 的生命周期（创建、销毁、锁定、解锁），是操作 `Surface` 的 “管家”（比如 `SurfaceView` 就是通过 `SurfaceHolder` 暴露 `Surface`）。 |
| SurfaceFlinger          | `Surface` 的最终消费者，负责合成所有 `Surface` 的缓冲区并输出到屏幕。 |
| Canvas                  | 绘制工具，需绑定到 `Surface` 才能工作（`Canvas` 是 “画笔”，`Surface` 是 “画布”）。 |
| SurfaceView/TextureView | 持有 `Surface` 的 UI 组件：- SurfaceView：直接持有独立 `Surface`，绘制不占用 UI 线程；- TextureView：封装 `SurfaceTexture` 间接关联 `Surface`，支持 View 变换。 |
| Window                  | 每个 Activity/Dialog 的底层都对应一个 `Window`，而 `Window` 内部持有一个 `Surface`（这是普通 View 绘制的最终目标）。 |