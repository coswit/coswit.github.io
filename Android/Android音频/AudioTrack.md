## AudioTrack

```java
AudioTrack(int streamType, int sampleRateInHz, int channelConfig, int audioFormat,
            int bufferSizeInBytes, int mode)
```

新方法

```java
AudioAttributes attr = new AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .setUsage(AudioAttributes.USAGE_MEDIA).build();
AudioFormat audioFormat = new AudioFormat.Builder()
        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
        .setSampleRate(48000) // 默认采样率
        .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
        .build();

int bufferSize = AudioTrack.getMinBufferSize(48000,
        AudioFormat.CHANNEL_IN_STEREO, AudioFormat.ENCODING_PCM_16BIT);

AudioTrack audioTrack = new AudioTrack.Builder().setAudioAttributes(attr)
        .setAudioFormat(audioFormat)
        .setTransferMode(AudioTrack.MODE_STREAM)
        .setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
        .setBufferSizeInBytes(bufferSize)
        .build();
```

### 参数

#### streamType：音频流类型

能过不同的音频类型来控制音量，API 26之前使用，之后Google引入了`AudioAttributes`来替代streamType，

|       AudioManager       | 值   | AudioAttributes                        | 值   | 作用                                                         |
| :----------------------: | ---- | -------------------------------------- | ---- | ------------------------------------------------------------ |
|   `STREAM_VOICE_CALL`    | 0    | `USAGE_VOICE_COMMUNICATION`            | 2    | 用于通话语音                                                 |
|     `STREAM_SYSTEM`      | 1    | `USAGE_ASSISTANCE_SONIFICATION`        | 13   | 系统提示音（非通知类），触摸反馈音、锁屏声、低电量警告、按键音 |
|      `STREAM_RING`       | 2    | `USAGE_NOTIFICATION_RINGTONE`          | 6    | 电话铃声                                                     |
|      `STREAM_MUSIC`      | 3    | `USAGE_MEDIA`                          | 1    | 音乐媒体、播客、游戏音效                                     |
|      `STREAM_MUSIC`      | 3    | `USAGE_ASSISTANCE_NAVIGATION_GUIDANCE` | 12   | 导航                                                         |
|      `STREAM_ALARM`      | 4    | `USAGE_ALARM`                          | 4    | 用于闹钟                                                     |
|  `STREAM_NOTIFICATION`   | 5    | `USAGE_NOTIFICATION`                   | 5    | 通知音                                                       |
|  `STREAM_BLUETOOTH_SCO`  | 6    | `USAGE_VOICE_COMMUNICATION`            | 2    | 蓝牙通话                                                     |
| `STREAM_SYSTEM_ENFORCED` | 7    | `USAGE_ASSISTANCE_SONIFICATION`        | 13   | 系统强制型提示音，低电量强制警告、系统安全错误提示、锁屏强制提示导航语音、翻译 APP 朗读、电子书语音播报、 accessibility 朗读 |
|      `STREAM_DTMF`       | 8    | `USAGE_VOICE_COMMUNICATION_SIGNALLING` | 3    | 电话拨号音                                                   |
|       `STREAM_TTS`       | 9    | `USAGE_UNKNOWN`                        | -1   | 文本转语音（TTS）专用音频流                                  |
|  `STREAM_ACCESSIBILITY`  | 10   | `USAGE_ASSISTANCE_ACCESSIBILITY`       | 11   | 辅助功能音频，无障碍屏幕阅读                                 |
|    `STREAM_ASSISTANT`    | 11   | `USAGE_ASSISTANT`                      | 16   | 智能助手类音频Google Assistant 回应、小爱同学语音、语音助手指令反馈 |


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
