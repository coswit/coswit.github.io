## Curl

`curl`（CommandLine URL）主要用于传输数据，支持FTP、FTPS、HTTP、HTTPS、SCP、SFTP、TLS 等数十种协议。基本结构：

```bash
curl [选项] URL
```

选项参数：

| **参数**          | **长参数**      | **作用说明**                                       |
| ----------------- | --------------- | -------------------------------------------------- |
| **`-o <file>`**   | `--output`      | 将输出写入指定文件                                 |
| **`-O`**          | `--remote-name` | 使用远程文件的默认名保存本地                       |
| **`-X <METHOD>`** | `--request`     | 指定 HTTP 请求方法（GET, POST, PUT 等）            |
| **`-d <data>`**   | `--data`        | HTTP POST 传送的数据                               |
| **`-H <header>`** | `--header`      | 设置自定义请求头                                   |
| **`-I`**          | `--head`        | 仅显示响应头信息                                   |
| **`-L`**          | `--location`    | 跟随页面重定向                                     |
| **`-k`**          | `--insecure`    | 允许连接到不安全的 SSL 站点                        |
| **`-v`**          | `--verbose`     | 打印极为详细的调试信息（包括握手、请求头、响应头） |

用法：

```bash
# 等价于 curl -X GET https://api.github.com
curl https://api.github.com

# 只查看响应头
curl -I https://example.com

# 查看完整的请求过程
curl -v https://www.google.com

# 将结果保存为文件
curl -o index.html www.google.com
# 使用默认文件名保存到本地
curl -O https://www.example.com/assets/image.png

# 断点续传
curl -C - -O https://www.example.com/largefile.zip

# 默认Get请求
curl "https://api.example.com/users?id=123&status=active"

# post请求， -d或--data，默认格式，发送表单+
curl -X POST -d "username=admin&password=123" https://api.example.com/login
```

代理：

```bash
# http代理
curl -x http://127.0.0.1:7890 https://google.com
#socks5代理
curl --socks5 127.0.0.1:7891 https://google.com

# 查看出口IP
curl ipinfo.io
# 配合代理
curl -x http://127.0.0.1:7890 ipinfo.io
```

测速与排查：

```bash
# 查看状态码
curl -o /dev/null -s -w "%{http_code}\n" https://google.com

# 测速
curl -o /dev/null -s -w 'DNS: %{time_namelookup} TCP: %{time_connect} TLS: %{time_appconnect} TTFB:{time_starttransfer} TOTAL: %{time_total}' https://google.com
```

其他：

```bash
# 指定网卡
curl --interface eth0 https://example.com

# 指定Ipv4或Ipv6
curl -4 https://google.com
```

