### 802.11组件

#### 物理组件

- **WM**（Wireless Medium，无线媒介）：送无线MAC帧数据的物理层。规范最早定义了射频和红外两种物理层，但目前使用最多的是射频物理层。
- **STA**（Station）："A logical entity that is a singly addressable instanceof a MAC and PHY interface to the WM"。STA是指携带无线网络接口卡（即无线网卡）的设备，例如笔记本、智能手机等。另外，无线网卡和有线网卡的MAC地址均分配自同一个地址池以确保其唯一性。
- **AP**（Access Point，接入点）："An entity that contains one STA and provides access to the distribution services，via the WM for associated STAs"。AP本身也是一个STA，只不过它还能为那些已经关联的（associated）STA提供分布式服务（DistributionService，DS）。
- **DS**（Distribution System，分布式系统）："A system used to interconnect a set of **basic service sets（BSSs）**and integrated local area networks（LANs）to create an **extended service set（ESS）**"。DS的定义涉及BSS、ESS等无线网络架构

#### 无线网络的构建

基本服务集（Basic Service Set，**BSS**）是整个无线网络的基本构建组件（Basic Building Block）。

- **独立型BSS**（Independent BSS  **IBSS**）：这种类型的BSS不需要AP参与。各STA之间可直接交互。这种网络也叫ad-hoc BSS（一般译为自组网络或对等网络）

- **基础结构型BSS**（Infrastructure BSS）：所有STA之间的交互必须经过AP。AP是基础结构型BSS的中控台。这也是家庭或工作中最常见的网络架构。在这种网络中，一个STA必须完成诸如关联、授权等步骤后才能加入某个BSS。注意，一个STA一次只能属于一个BSS。

**ESS** ："A set of one or one interconnected BSSs that appears as asingle BSS to the LLC layer at any STA associated with one of those BSSs"。一个ESS包含一或多个BSS。ESS中的BSS拥有相同的**SSID（Service Set Identification）**，并且彼此之间协同工作。一般情况下，ESS的SSID就是其网络名（networkname）。

- **BSSID（BSS Identification）**：每一个BSS都有自己的唯一编号。在基础结构型网络中，BSSID就是AP的MAC地址，该MAC地址是真实的地址。IBSS中，其BSSID也是一个MAC地址，不过这个MAC地址是随机生成的。

- **SSID（Service Set Identification）**：一般而言，BSSID会和一个SSID关联。BSSID是MAC地址，而**SSID就是网络名**。网络名往往是一个可读字符串，因为网络名比MAC地址更方便人们记忆。

### 802.11 Service

- **SS**（Station Service）：它是STA应该具有的功能。
- **DSS**（Distribution System Service）：它指明DS应具有的功能。

#### 数据传输服务

- **Distribution Service**（**DS**，分布式服务）与**Integration Service**（**IS**，整合服务）：STA进行数据传输和整合

- **association**(关联)、**reassociation(**重新关联)、**disassociation**(取消关联)服务 ： **Transition Type**对STA在无线网络中移动的类型分为：
  
  - **No-Transition**：即没有移动。它包括固定不动的情况以及在某个AP无线覆盖范围内移动。
  
  - **BSS-Transition**：即从ESS中的一个BSS切换到另一个BSS。我们希望这种移动不影响网络的使用。
  
  - **ESS-Transition**：从一个ESS中的BSS切换到位于另外一个ESS的BSS。这种情况极有可能导致网络切换，影响用户使用。

   当DS传输数据时，DSS需要知道和哪个AP建立联系。所以，规范要求STA在传输数据前，必须要和一个AP建立关联关系，这就需要使用association服务。关联服务的目的在于为AP和STA建立一种映射关系。
  
   当STA进行transition的时候（如BSS Transition），它就需要使用reassociation服务了。因为之前它和BSS1建立了关联关系，此后它需要和BSS2建立关联关系。这时就可以使用reassociation服务来完成该功能。reassociation服务只能由STA发起。
  
   当STA不需要使用DSS，或者AP不再为某个STA服务时，就需要调用disassociation服务。
  
- 访问控制和数据机密性（Access Control and Data Confidentiality）服务：包括三个服务，主要解决无线网络中安全防护相关的工作。
  
  - **Authentication**和**Deauthentication**：这两个服务用于Access Control，身份验证以及解除身份验证。
  - **Confidentiality**：私密性（privacy）服务，后来对这部分内容实施了加强。目前规范中提到的数据加密方法有WEP、TKIP、CCMP。
  
- 频谱管理服务：包括TPC（Transmit Power Control，传输功率控制）服务和DFS（DynamicFrequency Selection，动态频率选择）服务。

- QoS和时间同步服务

- 无线电测量（Radio Measurement）服务

### 802.11 MAC帧与服务

<img src="../../../source/images/802.11_mac.png"  style="zoom:100%;" />