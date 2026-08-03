# CS0502 · Foundations of Artificial Intelligence / 人工智能基础

## 中文

这是个人项目。每位同学从项目 A、B、C 中选择一个独立完成；不设自选题。项目应使用 AI coding agent 完成，但你需要自行设计提示词、技术方案、测试和迭代过程。本资料不提供完整提示词或参考实现。

### 项目 A：零售客户分群与洞察

使用教师提供的 Online Retail 交易数据，完成 Python + HTML 小应用。按客户构建 RFM 特征（最近购买时间、购买频率、消费金额），使用 K-Means 分群，并在网页中展示群体规模、RFM 特征与客户/群体分布。

基础要求：

1. 清洗交易数据，按客户构建 RFM 特征，完成 K-Means 客户分群；
2. 为每个群体写出基于数据的简短画像和一条业务建议；
3. 比较一种不同设置，例如不同 K 值、是否标准化或不同清洗规则，并解释结果差异。

加分：比较多个 K 值并说明选择依据；加入筛选、详情面板、图表导出、自动洞察或合理聚类对照分析。

### 项目 B：手机活动识别——MLP 与一维 CNN 的比较

使用教师提供的 UCI HAR 数据，完成 Python + HTML 活动识别器。必须同时实现：以 561 维整理特征为输入的 MLP，以及以 `128 × 9` 原始传感器时间序列为输入的一维 CNN。网页展示测试样本曲线、真实活动、两个模型的预测与置信度。

基础要求：

1. 用教师给定的训练集和测试集分别训练 MLP 与一维 CNN；
2. 在相同测试集上比较准确率、混淆矩阵和一组容易混淆的活动；
3. 分析一组容易混淆的活动，解释两种模型方法各自的优缺点。

加分：比较两种以上网络配置，分析参数量、训练时间、准确率或混淆变化；增加错误样本可视化、类别筛选、错误样本库或导出结果。

### 项目 C：MiniMind 实践——部署、多模态与新闻 LoRA

使用教师提供的 MiniMind 学生任务材料包，在下列三个独立任务中任选 **两个** 完成。每项均须满足“运行成功、提交证据、简短分析”；仅展示安装过程、未展示模型实际输出不计为完成。

1. **基础 MiniMind-3 部署**：运行不含课程新闻 LoRA 的官方 MiniMind-3；完成至少三类输入，其中包括一条“只能输出一个词／类别”的格式约束题，并保留原始输出。
2. **MiniMind-O 多模态部署**：启动本地 WebUI，完成至少两种输入模态的交互（推荐文本＋图片）；提交网页截图、所用输入文件和每种模态的原始输出。
3. **LoRA 新闻主题微调**：基于 MiniMind-3 完成“财经／体育／游戏”新闻主题分类 LoRA；完成数据检查，提交训练配置、最佳验证 checkpoint、锁定后的最终测试报告和至少十条预测案例。最终测试集不得用于反复调参。

共同提交：每个完成的任务建立独立文件夹，包含 `README.md`（环境与复现）、`evidence/`（可见原始输出的截图）、`outputs/`（输出、指标或日志）和按模板填写的 `report.md`。任务 3 不得将完整 TNEWS 原始数据公开上传；报告应说明严格准确率和归一化准确率的统计口径。

加分：完成全部三个任务，或给出更扎实的实验分析。可以改进界面、提示词或推理参数，但须在报告中说明改动。

### 共同提交内容

1. 包含完整 HTML、Python 与其他源代码的完整项目文件夹或 ZIP，以及 README；
2. 可执行 App；
3. 项目录屏，展示程序实际运行与主要结果；
4. 图文项目报告：说明数据、方法、结果、AI agent 迭代过程、问题、局限性或失败案例。

## English

This is an individual project. Choose exactly one independent project—A, B, or C; there is no open topic. Use an AI coding agent, but design your own prompts, technical approach, testing, and iteration process. This material provides no complete prompt or reference implementation.

### Project A: Retail Customer Segmentation and Insights

Use the instructor-provided Online Retail transaction data to build a Python + HTML app. Construct customer RFM features (recency, frequency, monetary value), cluster customers with K-Means, and show segment size, RFM comparison, and customer/segment distributions.

Core: clean transactions and construct RFM features; perform K-Means clustering; write a data-grounded profile plus one business suggestion per segment; compare one changed setting such as K, standardization, or cleaning rules.

Bonus: compare several K values with a justified choice; add filtering, detail panels, chart export, automatic insight summaries, or another sensible clustering comparison.

### Project B: Smartphone Activity Recognition — MLP vs. 1D CNN

Use the instructor-provided UCI HAR data to build a Python + HTML activity recognizer. Implement both an MLP using the prepared 561-dimensional features and a 1D CNN using raw `128 × 9` sensor time series. The page should show test-sample curves, ground truth, both predictions, and confidence.

Core: train both models on the provided train/test split; compare accuracy, confusion matrices, and one easily confused activity pair; explain the strengths and limits of the two model approaches.

Bonus: compare two or more network configurations and analyze parameters, training time, accuracy, or confusion; add error-sample visualization, class filtering, an error library, or result export.

### Project C: MiniMind Practice — Deployment, Multimodality, and News LoRA

Use the instructor-provided MiniMind student task package. Complete **any two** of the following three independent tasks. Every task requires a successful run, evidence, and a short analysis; installation screenshots without actual model output do not count.

1. **Base MiniMind-3 deployment:** run the official MiniMind-3 without the course news LoRA; complete at least three input types, including one one-word/category-only constrained prompt, and retain the raw outputs.
2. **MiniMind-O multimodal deployment:** start the local WebUI and complete interactions in at least two input modalities (text + image recommended); submit a WebUI screenshot, the input files used, and raw output for every modality.
3. **LoRA news-topic fine-tuning:** build a finance/sports/gaming news classifier LoRA on MiniMind-3; pass the data check and submit the training configuration, best validation checkpoint, final locked-test report, and at least ten predictions. Do not tune repeatedly on the final test set.

For every completed task, submit a separate folder with `README.md` (environment and reproduction), `evidence/` (screenshots showing raw outputs), `outputs/` (outputs, metrics, or logs), and a templated `report.md`. For task 3, never publish the full TNEWS raw data; state whether strict and normalized accuracy are both reported and define each metric.

Bonus: complete all three tasks or provide especially rigorous experimental analysis. You may improve the interface, prompts, or inference settings, but document all changes in the report.

### Common submission requirements

1. A complete project folder or ZIP with all HTML, Python, and other source code, plus a README;
2. A runnable app;
3. A project recording showing the app running and its main results;
4. An illustrated report explaining data, method, results, AI-agent iteration, problems, and a limitation or failure case.
