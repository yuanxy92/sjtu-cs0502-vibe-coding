# 项目三：同学快传 / PeerDrop

## 中文

### 目标

制作一个简化版的安全局域网文件传输系统。两位同学在同一可信 Wi-Fi 或局域网中，通过浏览器完成一次真实文件传输，并验证文件的保密性、认证和完整性。

本项目不提供完整提示词、接口或参考实现。请自行与 AI coding agent 协作，决定技术路线、拆分任务、测试和修复问题。

### 基础要求

1. **真实跨设备传输**：发送端和接收端必须是两台独立设备。手动输入接收端 IP 地址与端口即可，不要求自动发现。
2. **单文件发送与保存**：发送一个真实文件；接收端显示文件名和大小，并把最终解密文件保存到明确位置。
3. **混合加密**：使用成熟密码学库。发送端为本次传输生成随机文件密钥，用该密钥加密文件；再用接收端 RSA 公钥加密文件密钥。接收端用 RSA 私钥恢复文件密钥并解密文件。
4. **RSA 签名认证**：发送端对传输内容及必要元数据的 SHA-256 摘要进行 RSA 签名；接收端必须先用发送端公钥验证签名，验证失败时不得解密或保存文件。
5. **SHA-256 完整性校验**：发送端记录原始文件的 SHA-256；接收端解密后重新计算 SHA-256，比较并清楚显示校验结果。

### 范围与安全边界

- 仅需支持一次发送一个文件。
- 仅在自己控制的设备与可信局域网中测试；不要暴露到公网，也不要传输敏感文件。
- 不要求自动发现、断点续传、账户系统或公网部署。
- 必须使用成熟密码学库；不要自行实现 RSA、对称加密、SHA-256 或签名算法。
- RSA 适合保护短小的文件密钥，不应直接加密整个文件。
- 只有知道发送端公钥可信来源时，签名验证才可对应到现实身份；否则它只能证明持有对应私钥的一方签发了内容。

### 报告应解释的概念

- IP 地址与端口分别解决什么问题；
- 浏览器、发送端服务、接收端服务分别扮演什么角色；
- RSA 公钥与私钥分别做什么；
- 什么是一次性文件密钥，为什么用它来加密文件；
- SHA-256、RSA 签名分别做什么；
- 保密性、认证与完整性之间的区别；
- 文件如何从磁盘读取、经网络传输、解密并写入磁盘。

### 提交内容

1. 包含完整 HTML、Python 与其他源代码的可运行项目文件夹或 ZIP；
2. 60–120 秒演示视频：两台设备完成一次真实传输，展示签名验证、解密、SHA-256 校验和最终保存结果；
3. README：启动步骤、测试网络环境、依赖与已知限制；
4. 图文迭代报告：记录每轮与 AI agent 的对话结果、发现的问题、后续提示词、解决方案与截图；并解释上述系统和安全概念。

### 加分项

- 一次性配对码、接收端接受或拒绝；
- 等待、传输中、完成、失败或拒绝等状态；进度、已传输字节、速度或预计剩余时间；
- 错误处理，例如错误 IP/端口、签名失败、网络中断、接收方拒绝或文件过大；
- 自动发现可信局域网设备；
- 传输历史、多文件队列、文件类型或大小限制；
- 更完整的可信公钥管理、密钥指纹展示或 TLS。

---

## English

### Goal

Build a simplified secure local-network file-transfer system. Two students on the same trusted Wi-Fi or LAN use browsers to complete one real transfer and verify its confidentiality, authentication, and integrity.

This project provides no complete prompt, API, or reference implementation. Work with your AI coding agent to decide the technical route, task breakdown, testing, and fixes.

### Core requirements

1. **Real cross-device transfer**: the sender and receiver must be two independent devices. Manual entry of the receiver’s IP address and port is sufficient; discovery is not required.
2. **One-file sending and saving**: send one real file. The receiver displays its name and size, then saves the final decrypted file to a clear location.
3. **Hybrid encryption**: use mature cryptographic libraries. The sender generates a random file key for this transfer and encrypts the file with it; the receiver’s RSA public key encrypts the file key. The receiver restores the file key with its RSA private key and decrypts the file.
4. **RSA-signature authentication**: the sender creates an RSA signature for the SHA-256 digest of the transferred content and necessary metadata. The receiver must verify it with the sender’s public key before decrypting or saving the file.
5. **SHA-256 integrity check**: the sender records the original file’s SHA-256. After decryption, the receiver computes SHA-256 again, compares the values, and clearly reports the result.

### Scope and safety boundaries

- Support only one file per transfer.
- Test only on devices and trusted local networks you control. Never expose the app to the public internet or transfer sensitive files.
- Automatic discovery, resumable transfer, accounts, and public deployment are not required.
- Use mature cryptographic libraries; never implement RSA, symmetric encryption, SHA-256, or signing algorithms yourself.
- RSA protects the short file key; it should not encrypt a whole file directly.
- A signature maps to a real-world identity only when the sender’s public key comes from a trusted source. Otherwise, it proves only that the corresponding private-key holder signed the content.

### Concepts to explain in the report

- What IP addresses and ports each solve;
- The roles of browser, sender service, and receiver service;
- What RSA public and private keys do;
- What a one-time file key is and why it encrypts the file;
- What SHA-256 and RSA signatures do;
- The differences among confidentiality, authentication, and integrity;
- How a file is read from disk, transferred, decrypted, and written to disk.

### What to submit

1. A runnable complete project folder or ZIP containing all HTML, Python, and other source code;
2. A 60–120 second video showing a real two-device transfer, signature verification, decryption, SHA-256 verification, and the saved result;
3. A README with launch steps, test network, dependencies, and known limitations;
4. An illustrated iteration report recording each AI-agent round, issue found, follow-up prompt, resolution, and screenshots, while explaining the system and security concepts above.

### Bonus work

- One-time pairing code and receiver accept/reject;
- Waiting, transferring, complete, failed, and rejected states; progress, transferred bytes, speed, or ETA;
- Error handling such as invalid IP/port, signature failure, interrupted network, receiver rejection, or oversized files;
- Trusted-LAN device discovery;
- Transfer history, multi-file queues, file-type or size limits;
- Stronger trusted-public-key management, key fingerprints, or TLS.
