# Transformer Explainer（本地部署版）

本目录是 [poloclub/transformer-explainer](https://github.com/poloclub/transformer-explainer)
的**构建产物**，部署在课程主页下作为课程材料。

- 上游项目：**Transformer Explainer: LLM Transformer Model Visually Explained**
  — Alex Chelbling, Michael S. Rybkin, Andrej Karpathy, Karthik Narasimhan
  （Georgia Tech / Stanford / Facebook AI）
- 论文：[*Transformer Explainer: LLM Transformer Model Visually Explained*,
  arXiv 2212.09748](https://arxiv.org/abs/2212.09748)
- 许可：**MIT**（上游 LICENSE 全文见 `LICENSE`）
- 上游地址：https://poloclub.github.io/transformer-explainer/

## 我们改了什么

1. **模型地址指向上游 CDN**：模型是完整 GPT-2 导出的 ONNX，共 63 个 10MB 分片
   （约 630MB），不放进本仓库，改为从上游 GitHub Pages 拉取
   （`https://poloclub.github.io/transformer-explainer/model-v2/gpt2.onnx.partN`）。
   分片下载后写入浏览器 Cache API，之后再打开直接命中缓存。
2. **取分片改成限流 + 重试**：上游一次并发 63 个请求，首波几个会被丢弃
   （实测 part0/1/2 丢失），导致模型永远拼不齐、页面一直停在空白。
   改为 6 路并发，每个分片最多重试 4 次、失败后递增退避。
3. **换成我们自己的页头**：藏掉上游的黑色 logo 与右上角 arXiv / YouTube / GitHub
   图标，改用与「神经网络游乐场」「数据可视化实验室」同一套的浅色课程横幅
   （中文标题 + 一行说明 + 返回课程主页）。
4. **只保留可交互的部分**：整块隐藏上游的文章区（`.article`）——讲解标题层级
   （What is a Transformer? / Transformer Architecture / Embedding / Step 1…）、
   段落、配图与内嵌的 YouTube 视频全部不要；可交互的图形都在上方的主画布里
   （顶部的输入框 + Generate + Temperature/Sampling 滑块，以及架构图里的
   注意力矩阵、Q/K/V、残差连接等 206 个 SVG / Canvas 图形）。
   同时藏掉上游默认弹在架构图上的英文说明卡（`.floating-container`）。
5. **居中**：`.article` 限宽 1180px 水平居中。
6. **把 Query 词表和注意力矩阵的行对齐**（`align-head.js`）：
   上游把 6 个查询词按约 10.6px 的行距排成一列，而注意力矩阵的行距是 19px
   （矩阵尺寸随句子里的词数变化），于是「第 i 个查询词」和「矩阵第 i 行」在视觉上
   对不上，看起来像整体偏了。我们的脚本量出矩阵每一行的实际高度，把 Query 的每一格
   移到对应行的圆心上（用 transform，不影响面板其余排布），再调用上游的连线绘制函数
   重画一次，让连线也跟着对上。词数变化时自动重新对齐。
   为了能重画连线，我们在 bundle 里把上游的 `x()` 暴露成了 `window.__drawLinks`。
7. **加中文署名条**：页面底部固定一条中文说明，写明改编自 Transformer Explainer、
   原作者姓名、论文链接与「返回课程主页」入口（MIT 许可要求保留版权声明）。
8. **未翻译**：交互界面与提示仍是英文。

## 文件构成

```
index.html              页面外壳（含我们的横幅、署名条与隐藏讲解文字的 CSS）
align-head.js           把 Query 词表对齐到注意力矩阵的每一行，并让连线重画
_app/immutable/         上游 SvelteKit 构建产物
  nodes/2.*.js          主包（内含 onnxruntime-web 与分片下载逻辑，我们改过）
  chunks/ *.js          组件与依赖
  assets/               字体、图片
consent-form.pdf        上游原样保留
robots.txt / favicon.png
```

未收录：`model-v2/`（630MB 模型，改为运行时从上游拉取）、
`ort-wasm-*.wasm`（约 23MB，运行时从 jsdelivr 取 onnxruntime-web@1.23.0）。

## 已知限制

- **首次打开要下约 630MB**。课堂大屏或机房网络下可能明显慢，甚至失败；
  失败时刷新页面即可（已下载的分片在缓存里，不会重下）。
- 打开后能做什么：顶部输入框写一句话 → Generate → 逐词看生成过程；
  正文各节点开可看注意力权重、Q/K/V 数值、位置编码等。
