## AudioTrack

```java
AudioTrack(int streamType, int sampleRateInHz, int channelConfig, int audioFormat,
            int bufferSizeInBytes, int mode)
```

### 参数

#### streamType：音频流类型

- `AudioManager.STREAM_MUSIC`: 用于音乐播放、播客、游戏音效等。这是最常用的类型。
- `AudioManager.STREAM_ALARM`: 用于闹钟。
- `AudioManager.STREAM_RING`: 用于电话铃声。
- `AudioManager.STREAM_NOTIFICATION`: 用于通知音。
- `AudioManager.STREAM_SYSTEM`: 用于系统声音（如锁屏音、低电量提示音）。
- `AudioManager.STREAM_VOICE_CALL`: 用于通话语音。

#### sampleRateInHz：采样率

定义每秒从连续信号中提取并组成离散信号的采样次数。单位为赫兹 (Hz)。采样率越高，音频的保真度（高频响应）越好，但数据量也越大。

常见值：

- `44100 Hz` (44.1 kHz): CD 音质标准，最通用的采样率，兼容性最好。
- `48000 Hz` (48 kHz): DVD、数字电视常用。
- `22050 Hz` (22.05 kHz) / `16000 Hz` (16 kHz): 常用于语音通话、低质量音频，数据量较小


#### channelConfig：声道配置

定义音频的通道数（单声道、立体声等）以及每个通道在音频缓冲区中的排列顺序。

常见值：

- `AudioFormat.CHANNEL_OUT_MONO`: 单声道。所有设备都保证支持。
- `AudioFormat.CHANNEL_OUT_STEREO`: 立体声（左、右双声道）。绝大多数设备都支持。
- `AudioFormat.CHANNEL_OUT_5POINT1`, `CHANNEL_OUT_7POINT1`: 用于环绕声，需要设备硬件支持。

#### audioFormat：音频格式/采样位数

定义每个采样点的数据精度（位数）和编码格式。位数越高，动态范围和信噪比越好。

常见值，无特殊需求，始终使用 `ENCODING_PCM_16BIT`：

- `AudioFormat.ENCODING_PCM_8BIT`: 每个采样点用 8 位（1字节）表示。音质较差，一般不推荐使用。
- `AudioFormat.ENCODING_PCM_16BIT`: 每个采样点用 16 位（2字节）表示。**这是最常用、质量最好且所有设备都保证支持的格式**。
- `AudioFormat.ENCODING_PCM_FLOAT`: 每个采样点用 32 位浮点数（4字节）表示。提供更高的处理精度和动态范围，适用于音频处理，但数据量更大。需要 API 21+，且并非所有设备都支持，使用前需检查。
- `AudioFormat.ENCODING_AC3`, `ENCODING_E_AC3`: 用于压缩格式（如杜比数字），非常用。

#### bufferSizeInBytes：缓冲区大小

指定 AudioTrack 内部用于缓存音频数据的缓冲区大小。这是最关键的参数之一，直接影响音频播放的延迟和稳定性。

```java
int minBufferSize = AudioTrack.getMinBufferSize(
    8000, // 采样率8000，每秒8000个点
    AudioFormat.CHANNEL_CONFIGURATION_STEREO, // 声道数：双声道
    AudioFormat.ENCODING_PCM_16BIT // 采样精度，一个采样点16比特，即2个字节
);
```

#### mode：模式

控制音频数据从 Java 层传输到 native 层的方式。可选值：

- `AudioTrack.MODE_STATIC` (静态模式):
  - **工作方式**：在 `play()` 之前，一次性将所有音频数据写入缓冲区。
  - **优点**：延迟极低，因为数据已经就绪。
  - **缺点**：音频数据必须全部在内存中，不适合播放很长的或实时生成的音频。只能用于短促的音效。
  - **用法**：`write()` 一次，然后 `play()`。
- `AudioTrack.MODE_STREAM` (流模式):
  - **工作方式**：需要在一个循环中，持续地、分块地向音频轨道写入数据，就像水流一样。
  - **优点**：内存效率高，适合播放长时间的音乐或实时生成的音频（如解码后的网络流、合成器产生的音调）。
  - **缺点**：延迟略高于 `MODE_STATIC`。
  - **用法**：启动一个线程，循环调用 `write()`，然后 `play()`。

## Frame

音频帧包含**所有声道**在**一个采样时间点**上的数据，大小：

```
帧大小（字节） = 声道数 × (采样位数 / 8)
```

## PCM

全称是 **Pulse-Code Modulation**（脉冲编码调制）。它是一种**用数字信号表示模拟音频信号**的最基本、最常用的方法，PCM 是数字音频的“原材料”，**没有经过任何压缩算法**。因此它的文件体积很大，是几乎所有音频设备和软件都能理解和处理的“通用语言”。

PCM 通过一个叫做 **“模拟-数字转换（ADC Analog-to-Digital Converter）”** 的过程来实现：

- **采样 (Sampling)**： 以固定的时间间隔（采样率），测量模拟声波的电平值；用离散的点来代表原本连续的波形。
- **量化 (Quantization)**：将每个采样点测得的连续的电平值，四舍五入到最接近的离散数值上。位深 (Bit Depth)，如 16 位。16 位可以表示 2¹⁶（65,536）个不同的量化等级。位深决定了音频的动态范围和信噪比。位数越高，能表示的细节越丰富，精度越高，量化误差（噪音）就越小。
- **编码 (Encoding)**：将这些离散的数值转换成二进制码（0 和 1 的序列），以便计算机存储和处理，最终得到的就是 **PCM 原始数据**——一长串按照时间顺序排列的二进制数字序列。

播放流程： MP3 文件 -> 解码器（Decoder） -> PCM 原始数据 -> AudioTrack -> 硬件 -> 出声

| 特性     | PCM                     | MP3/AAC                        |
| :------- | :---------------------- | :----------------------------- |
| **本质** | **原始音频数据**        | **压缩音频格式**               |
| **体积** | 非常大                  | 很小                           |
| **音质** | 无损，高保真            | 有损，音质有损失               |
| **处理** | 可直接被声卡播放        | 需要先解码成 PCM               |
| **API**  | **AudioTrack** 直接处理 | MediaPlayer 处理，或需自行解码 |
