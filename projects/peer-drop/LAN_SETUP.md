# PeerDrop · 局域网连接教程 / LAN setup guide

## 中文

PeerDrop 只应在自己控制的设备与可信局域网中测试。两台设备只要连入同一个本地网络，就可以互相访问局域网 IP 地址；不需要公网 IP，也不要做端口映射。

### 方式一：使用普通路由器 Wi-Fi（推荐）

1. 让两台设备连接到同一个家庭、实验室或可信路由器的 Wi-Fi。
2. 不要使用“访客网络”；它常会隔离设备，导致两台设备无法互相访问。
3. 在接收端启动你的服务，记录它显示的局域网 IP 地址和端口。
4. 在发送端输入该 IP 地址与端口，完成传输测试。

### 方式二：使用手机热点

1. 在手机设置中开启个人热点，并设置强密码。
2. 将两台电脑或一台电脑和另一台手机连接到这个热点。
3. 在接收端启动服务，并使用热点网络对应的局域网 IP 地址；不要填写手机的蜂窝网络公网地址。
4. 测试完成后关闭热点。

官方说明：

- [Android：通过热点或网络共享分享移动连接](https://support.google.com/android/answer/9059108?hl=zh-Hans)
- [Apple：连接 iPhone 或 iPad 的个人热点](https://support.apple.com/en-us/111785)

### 方式三：使用 Windows 电脑热点

1. Windows 11：打开 **设置 → 网络和 Internet → 移动热点**。
2. 选择要共享的网络连接，设置 Wi-Fi 网络名称和强密码，然后开启移动热点。
3. 让另一台设备连接该热点；在接收端启动服务后，使用该电脑当前网络的局域网 IP 与端口测试。

官方说明：[Microsoft：将 Windows 设备用作移动热点](https://support.microsoft.com/es-ES/Windows/Experience/Connectivity-Networking/use-your-windows-device-as-a-mobile-hotspot)

### 排查清单

- 两台设备是否连接同一个 Wi-Fi/热点？
- IP 地址和端口是否来自接收端，而不是复制自示例？
- 系统防火墙是否允许你的测试程序在**专用网络**中接收连接？
- 路由器是否启用了客户端隔离或访客网络？
- 测试结束后，是否停止服务并关闭热点？

不要关闭防火墙、不要在路由器上配置端口转发、不要把服务暴露到公网。

---

## English

Test PeerDrop only on devices and trusted local networks you control. Once both devices join the same local network, they can reach each other by LAN IP address. You do not need a public IP address or port forwarding.

### Option 1: a normal router Wi-Fi network (recommended)

1. Connect both devices to the same trusted home, lab, or personal-router Wi-Fi.
2. Do not use a guest network: it often isolates devices from one another.
3. Start your receiver service and note the LAN IP address and port it displays.
4. Enter that IP address and port on the sender, then test the transfer.

### Option 2: a phone hotspot

1. Turn on Personal Hotspot / Wi-Fi hotspot in the phone settings and set a strong password.
2. Join that hotspot from both computers, or from one computer and another phone.
3. Start the receiver service and use the LAN IP address assigned on the hotspot network; do not enter the phone’s cellular public address.
4. Turn the hotspot off after testing.

Official guides:

- [Android: share a mobile connection by hotspot or tethering](https://support.google.com/android/answer/9059108?hl=en)
- [Apple: connect to the Personal Hotspot of an iPhone or iPad](https://support.apple.com/en-us/111785)

### Option 3: a Windows PC hotspot

1. In Windows 11, open **Settings → Network & internet → Mobile hotspot**.
2. Choose the connection to share, set a Wi-Fi name and strong password, then turn Mobile hotspot on.
3. Connect the other device. Start the receiver service and use the PC’s current LAN IP address and port for the test.

Official guide: [Microsoft: use your Windows device as a mobile hotspot](https://support.microsoft.com/es-ES/Windows/Experience/Connectivity-Networking/use-your-windows-device-as-a-mobile-hotspot)

### Troubleshooting checklist

- Are both devices on the same Wi-Fi or hotspot?
- Did the receiver provide the IP address and port, rather than an example value?
- Does the system firewall permit the test program to receive connections on a **private network**?
- Is the router using client isolation or a guest network?
- Did you stop the service and turn off the hotspot after testing?

Do not disable your firewall, set up router port forwarding, or expose the service to the public internet.
